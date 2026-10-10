"""
ML Prediction Service – FinFlow
Loads the RandomForest classifier and provides inference + model insights.
Model features (18 columns):
  amount, year, month, day_of_week,
  payment_mode_Cash, payment_mode_Credit Card, payment_mode_Debit Card,
  payment_mode_Net Banking, payment_mode_UPI,
  location_Bangalore, location_Bhubaneswar, location_Chennai, location_Delhi,
  location_Hyderabad, location_Jaipur, location_Kolkata, location_Mumbai, location_Pune
"""

import joblib
import pandas as pd
import numpy as np
from datetime import datetime
from pathlib import Path
from ..config import MODEL_PATH, DATASET_PATH

# --- Model singleton ---
_model = None

def _get_model():
    global _model
    if _model is None:
        if not MODEL_PATH.exists():
            raise FileNotFoundError(f"Model file not found at {MODEL_PATH}")
        _model = joblib.load(MODEL_PATH)
    return _model


# The 18 feature columns expected by the trained RandomForest model
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


def _build_feature_df(amount: float, date_str: str, payment_mode: str, location: str) -> pd.DataFrame:
    """Build a 1-row DataFrame with exact columns expected by the model."""
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


def predict(amount: float, date_str: str, payment_mode: str, location: str) -> dict:
    """
    Run inference and return prediction ('Income' or 'Expense') + probabilities.
    The underlying classifier uses False (Expense) and True (Income).
    """
    model = _get_model()
    X = _build_feature_df(amount, date_str, payment_mode, location)

    raw_pred = model.predict(X)[0]
    probas = model.predict_proba(X)[0]

    # Model classes are boolean: False = Expense, True = Income
    classes = list(model.classes_)
    false_idx = classes.index(False) if False in classes else 0
    true_idx = classes.index(True) if True in classes else 1

    expense_prob = float(probas[false_idx])
    income_prob = float(probas[true_idx])

    # Convert prediction to label
    if isinstance(raw_pred, (bool, np.bool_)):
        label = "Income" if bool(raw_pred) else "Expense"
    elif str(raw_pred).lower() in ("true", "1", "income"):
        label = "Income"
    else:
        label = "Expense"

    return {
        "prediction": label,
        "confidence": round(float(max(probas)), 4),
        "expense_probability": round(expense_prob, 4),
        "income_probability": round(income_prob, 4),
        "amount": float(amount),
        "date": date_str,
        "payment_mode": payment_mode,
        "location": location,
    }


# Canonical benchmark evaluation metrics (test set: 240 samples from 1,200 dataset)
# Matches: accuracy 95.8%, Expense precision 0.95 & recall 1.00, Income precision 1.00 & recall 0.85, CM [[172, 0], [10, 58]]
CANONICAL_BENCHMARK_METRICS = {
    "model_name": "RandomForest",
    "feature_count": 18,
    "accuracy": 0.958,
    "accuracy_display": "95.8%",
    "expense_precision": 0.95,
    "expense_recall": 1.00,
    "income_precision": 1.00,
    "income_recall": 0.85,
    "confusion_matrix": [[172, 0], [10, 58]],
    "total_samples": 1200,
    "test_samples": 240,
    "categories_count": 14,
    "payment_modes_count": 6,
    "locations_count": 10,
    "currency": "INR (₹)",
    "feature_columns": FEATURE_COLUMNS,
}


def get_model_summary() -> dict:
    """
    Public model summary returning only model-level benchmark statistics (no user data).
    Used by the footer and telemetry badges.
    """
    return {
        "model_name": CANONICAL_BENCHMARK_METRICS["model_name"],
        "feature_count": CANONICAL_BENCHMARK_METRICS["feature_count"],
        "accuracy": CANONICAL_BENCHMARK_METRICS["accuracy"],
        "badge_text": f"{CANONICAL_BENCHMARK_METRICS['model_name']} · {CANONICAL_BENCHMARK_METRICS['feature_count']} features · {CANONICAL_BENCHMARK_METRICS['accuracy_display']} accuracy",
        "total_samples": CANONICAL_BENCHMARK_METRICS["total_samples"],
        "categories_count": CANONICAL_BENCHMARK_METRICS["categories_count"],
        "payment_modes_count": CANONICAL_BENCHMARK_METRICS["payment_modes_count"],
        "locations_count": CANONICAL_BENCHMARK_METRICS["locations_count"],
        "currency": CANONICAL_BENCHMARK_METRICS["currency"],
    }


def get_model_insights() -> dict:
    """Return model accuracy, confusion matrix, precision/recall, and feature importances from canonical source."""
    model = _get_model()

    result = {
        "accuracy": CANONICAL_BENCHMARK_METRICS["accuracy"],
        "expense_precision": CANONICAL_BENCHMARK_METRICS["expense_precision"],
        "expense_recall": CANONICAL_BENCHMARK_METRICS["expense_recall"],
        "income_precision": CANONICAL_BENCHMARK_METRICS["income_precision"],
        "income_recall": CANONICAL_BENCHMARK_METRICS["income_recall"],
        "confusion_matrix": CANONICAL_BENCHMARK_METRICS["confusion_matrix"],
        "total_samples": CANONICAL_BENCHMARK_METRICS["total_samples"],
        "feature_columns": CANONICAL_BENCHMARK_METRICS["feature_columns"],
        "feature_importances": [],
    }

    # Feature importances dynamically read from the trained model
    if hasattr(model, "feature_importances_"):
        importances = model.feature_importances_
        fi = []
        for name, imp in sorted(zip(FEATURE_COLUMNS, importances), key=lambda x: -x[1]):
            fi.append({"feature": name, "importance": round(float(imp), 4)})
        result["feature_importances"] = fi

    return result

