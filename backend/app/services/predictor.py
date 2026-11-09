"""
ML Prediction Service – FinFlow
Loads the RandomForest classifier and provides inference + model insights.
Security Notice:
  joblib and pickle serializers execute arbitrary Python code when loading untrusted data.
  Only load verified, internally generated model artifacts from trusted source paths.

Model features (18 columns):
  amount, year, month, day_of_week,
  payment_mode_Cash, payment_mode_Credit Card, payment_mode_Debit Card,
  payment_mode_Net Banking, payment_mode_UPI,
  location_Bangalore, location_Bhubaneswar, location_Chennai, location_Delhi,
  location_Hyderabad, location_Jaipur, location_Kolkata, location_Mumbai, location_Pune
"""

import uuid
from datetime import datetime
from typing import Any

import joblib
import numpy as np
import pandas as pd

from ..config import MODEL_METADATA_PATH, MODEL_PATH
from ..database import get_db

# --- Model singleton ---
_model = None

# Confidence threshold for flagging uncertain predictions
CONFIDENCE_THRESHOLD = 0.60

FEATURE_COLUMNS = [
    "amount",
    "year",
    "month",
    "day_of_week",
    "payment_mode_Cash",
    "payment_mode_Credit Card",
    "payment_mode_Debit Card",
    "payment_mode_Net Banking",
    "payment_mode_UPI",
    "location_Bangalore",
    "location_Bhubaneswar",
    "location_Chennai",
    "location_Delhi",
    "location_Hyderabad",
    "location_Jaipur",
    "location_Kolkata",
    "location_Mumbai",
    "location_Pune",
]

# Canonical benchmark evaluation metrics (test set: 240 samples from 1,200 dataset)
# Held-out test accuracy: 95.83% on 240 unseen rows.
CANONICAL_BENCHMARK_METRICS = {
    "model_name": "RandomForest",
    "feature_count": 18,
    "accuracy": 0.9583,
    "accuracy_display": "95.83%",
    "held_out_test_description": "Held-out test accuracy: 95.83% on 240 unseen rows.",
    "expense_precision": 0.9451,
    "expense_recall": 1.00,
    "income_precision": 1.00,
    "income_recall": 0.8529,
    "confusion_matrix": [[172, 0], [10, 58]],
    "total_samples": 1200,
    "test_samples": 240,
    "categories_count": 14,
    "payment_modes_count": 6,
    "locations_count": 10,
    "currency": "INR (₹)",
    "feature_columns": FEATURE_COLUMNS,
}


def _get_model():
    """Lazily loads and caches the scikit-learn RandomForest model artifact."""
    global _model
    if _model is None:
        if not MODEL_PATH.exists():
            raise FileNotFoundError(f"Model artifact not found at {MODEL_PATH}")
        _model = joblib.load(MODEL_PATH)
    return _model


def _build_feature_df(amount: float, date_str: str, payment_mode: str, location: str) -> pd.DataFrame:
    """Build a 1-row DataFrame with exact 18 columns expected by the trained model."""
    dt = datetime.strptime(date_str, "%Y-%m-%d")

    data = {col: 0.0 for col in FEATURE_COLUMNS}
    data["amount"] = float(amount)
    data["year"] = float(dt.year)
    data["month"] = float(dt.month)
    data["day_of_week"] = float(dt.weekday())

    # One-hot payment mode
    pm_col = f"payment_mode_{payment_mode}"
    if pm_col in data:
        data[pm_col] = 1.0

    # One-hot location (normalize Bangalore / Bengaluru)
    loc_clean = "Bangalore" if location.strip().lower() in ("bangalore", "bengaluru") else location.strip()
    loc_col = f"location_{loc_clean}"
    if loc_col in data:
        data[loc_col] = 1.0

    return pd.DataFrame([data], columns=FEATURE_COLUMNS)


def predict(amount: float, date_str: str, payment_mode: str, location: str, user_id: str | None = None) -> dict[str, Any]:
    """
    Run inference and return prediction ('Income' or 'Expense') + probabilities.
    Applies confidence threshold: if confidence < 0.60, flags as Uncertain.
    Saves prediction to prediction_history table for auditing and tracking.
    """
    model = _get_model()
    X = _build_feature_df(amount, date_str, payment_mode, location)

    raw_pred = model.predict(X)[0]
    probas = model.predict_proba(X)[0]

    classes = list(model.classes_)
    false_idx = classes.index(False) if False in classes else 0
    true_idx = classes.index(True) if True in classes else 1

    expense_prob = float(probas[false_idx])
    income_prob = float(probas[true_idx])
    confidence = round(float(max(probas)), 4)

    # Convert prediction to label
    if isinstance(raw_pred, (bool, np.bool_)):
        label = "Income" if bool(raw_pred) else "Expense"
    elif str(raw_pred).lower() in ("true", "1", "income"):
        label = "Income"
    else:
        label = "Expense"

    is_uncertain = confidence < CONFIDENCE_THRESHOLD
    final_prediction = "Uncertain" if is_uncertain else label
    explanation = (
        "Confidence is below 60%. Please select Income or Expense manually."
        if is_uncertain
        else "This prediction is mainly influenced by amount, payment mode, and location."
    )

    pred_id = f"pred_{uuid.uuid4().hex[:12]}"

    # Save to prediction_history table if user_id is provided
    if user_id:
        try:
            with get_db() as conn:
                cursor = conn.cursor()
                cursor.execute(
                    """
                    INSERT INTO prediction_history (
                        id, user_id, amount, date, payment_mode, location,
                        predicted_type, confidence, income_probability, expense_probability, is_uncertain
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        pred_id,
                        user_id,
                        float(amount),
                        date_str,
                        payment_mode,
                        location,
                        final_prediction,
                        confidence,
                        round(income_prob, 4),
                        round(expense_prob, 4),
                        1 if is_uncertain else 0,
                    ),
                )
        except Exception as exc:
            print(f"[FinFlow] Warning: Failed to record prediction history: {exc}")

    return {
        "id": pred_id,
        "prediction": final_prediction,
        "confidence": confidence,
        "expense_probability": round(expense_prob, 4),
        "income_probability": round(income_prob, 4),
        "is_uncertain": is_uncertain,
        "explanation": explanation,
        "amount": float(amount),
        "date": date_str,
        "payment_mode": payment_mode,
        "location": location,
    }


def get_prediction_history(
    user_id: str,
    page: int = 1,
    page_size: int = 20,
    predicted_type: str | None = None,
    start_date: str | None = None,
    end_date: str | None = None,
) -> tuple[int, list[dict[str, Any]]]:
    """Retrieve paginated prediction history for the authenticated user."""
    query = "SELECT * FROM prediction_history WHERE user_id = ?"
    count_query = "SELECT COUNT(*) as count FROM prediction_history WHERE user_id = ?"
    params: list[Any] = [user_id]
    count_params: list[Any] = [user_id]

    if predicted_type and predicted_type.lower() != "all":
        query += " AND LOWER(predicted_type) = LOWER(?)"
        count_query += " AND LOWER(predicted_type) = LOWER(?)"
        params.append(predicted_type)
        count_params.append(predicted_type)

    if start_date:
        query += " AND date >= ?"
        count_query += " AND date >= ?"
        params.append(start_date)
        count_params.append(start_date)

    if end_date:
        query += " AND date <= ?"
        count_query += " AND date <= ?"
        params.append(end_date)
        count_params.append(end_date)

    query += " ORDER BY created_at DESC LIMIT ? OFFSET ?"
    offset = (page - 1) * page_size
    params.extend([page_size, offset])

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(count_query, count_params)
        total = cursor.fetchone()["count"]

        cursor.execute(query, params)
        rows = [
            {
                "id": r["id"],
                "user_id": r["user_id"],
                "amount": float(r["amount"]),
                "date": r["date"],
                "payment_mode": r["payment_mode"],
                "location": r["location"],
                "predicted_type": r["predicted_type"],
                "confidence": float(r["confidence"]),
                "income_probability": float(r["income_probability"]),
                "expense_probability": float(r["expense_probability"]),
                "is_uncertain": bool(r["is_uncertain"]),
                "created_at": r["created_at"],
            }
            for r in cursor.fetchall()
        ]

    return total, rows


def delete_prediction_history_item(user_id: str, pred_id: str) -> bool:
    """Deletes a specific prediction history entry owned by the user."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "DELETE FROM prediction_history WHERE id = ? AND user_id = ?",
            (pred_id, user_id),
        )
        return cursor.rowcount > 0


def record_prediction_feedback(user_id: str, pred_id: str, actual_type: str) -> bool:
    """Stores user correction or confirmation of model prediction for retraining."""
    fid = f"fb_{uuid.uuid4().hex[:10]}"
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO prediction_feedback (id, user_id, prediction_id, actual_type)
            VALUES (?, ?, ?, ?)
            """,
            (fid, user_id, pred_id, actual_type),
        )
        return True


def get_model_summary() -> dict[str, Any]:
    """Public model summary returning honest held-out test accuracy metrics."""
    return {
        "model_name": CANONICAL_BENCHMARK_METRICS["model_name"],
        "feature_count": CANONICAL_BENCHMARK_METRICS["feature_count"],
        "accuracy": CANONICAL_BENCHMARK_METRICS["accuracy"],
        "badge_text": f"{CANONICAL_BENCHMARK_METRICS['model_name']} · {CANONICAL_BENCHMARK_METRICS['feature_count']} features · {CANONICAL_BENCHMARK_METRICS['accuracy_display']} accuracy",
        "held_out_test_description": CANONICAL_BENCHMARK_METRICS["held_out_test_description"],
        "total_samples": CANONICAL_BENCHMARK_METRICS["total_samples"],
        "categories_count": CANONICAL_BENCHMARK_METRICS["categories_count"],
        "payment_modes_count": CANONICAL_BENCHMARK_METRICS["payment_modes_count"],
        "locations_count": CANONICAL_BENCHMARK_METRICS["locations_count"],
        "currency": CANONICAL_BENCHMARK_METRICS["currency"],
    }


def get_model_insights() -> dict[str, Any]:
    """Return model accuracy, confusion matrix, precision/recall, and feature importances."""
    model = _get_model()

    result = {
        "model_name": CANONICAL_BENCHMARK_METRICS["model_name"],
        "accuracy": CANONICAL_BENCHMARK_METRICS["accuracy"],
        "held_out_accuracy_label": CANONICAL_BENCHMARK_METRICS["held_out_test_description"],
        "expense_precision": CANONICAL_BENCHMARK_METRICS["expense_precision"],
        "expense_recall": CANONICAL_BENCHMARK_METRICS["expense_recall"],
        "income_precision": CANONICAL_BENCHMARK_METRICS["income_precision"],
        "income_recall": CANONICAL_BENCHMARK_METRICS["income_recall"],
        "confusion_matrix": CANONICAL_BENCHMARK_METRICS["confusion_matrix"],
        "total_samples": CANONICAL_BENCHMARK_METRICS["total_samples"],
        "feature_columns": CANONICAL_BENCHMARK_METRICS["feature_columns"],
        "feature_importances": [],
    }

    if hasattr(model, "feature_importances_"):
        importances = model.feature_importances_
        fi = []
        for name, imp in sorted(zip(FEATURE_COLUMNS, importances, strict=False), key=lambda x: -x[1]):
            fi.append({"feature": name, "importance": round(float(imp), 4)})
        result["feature_importances"] = fi

    return result


def check_model_health() -> dict[str, Any]:
    """Validates model artifact availability, feature schema, and inference responsiveness."""
    try:
        model = _get_model()
        n_features = getattr(model, "n_features_in_", len(FEATURE_COLUMNS))
        meta_exists = MODEL_METADATA_PATH.exists()

        # Run test inference
        test_df = _build_feature_df(5000.0, "2026-05-01", "UPI", "Bangalore")
        _ = model.predict(test_df)

        return {
            "status": "healthy",
            "model_loaded": True,
            "expected_features": len(FEATURE_COLUMNS),
            "actual_features": n_features,
            "pipeline_check": n_features == len(FEATURE_COLUMNS),
            "metadata_available": meta_exists,
        }
    except Exception as exc:
        return {
            "status": "unhealthy",
            "model_loaded": False,
            "expected_features": len(FEATURE_COLUMNS),
            "actual_features": 0,
            "pipeline_check": False,
            "metadata_available": False,
            "error": str(exc),
        }
