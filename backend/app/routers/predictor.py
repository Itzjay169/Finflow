from fastapi import APIRouter, Depends, HTTPException, Query, status

from ..auth import get_current_user
from ..models import (
    ModelHealthResponse,
    ModelInsightsResponse,
    ModelSummaryResponse,
    PredictionFeedbackRequest,
    PredictionHistoryListResponse,
    PredictRequest,
    PredictResponse,
)
from ..services import predictor as ml_service

router = APIRouter(prefix="/api", tags=["ML Predictor"])


@router.get("/model/summary", response_model=ModelSummaryResponse)
async def get_model_summary():
    """
    Public model-level summary metrics (RandomForest, 18 features, Held-out test accuracy: 95.83% on 240 unseen rows).
    No authentication required.
    """
    return ml_service.get_model_summary()


@router.get("/model/health", response_model=ModelHealthResponse)
async def get_model_health():
    """Validates model artifact integrity, feature dimensions, and test inference pipeline."""
    return ml_service.check_model_health()


@router.post("/predict", response_model=PredictResponse)
async def predict_transaction_type(
    data: PredictRequest,
    user: dict = Depends(get_current_user),
):
    """
    Classify a transaction as Income or Expense using the trained
    RandomForest model (18-feature pipeline, held-out test accuracy: 95.83%).
    Saves prediction to prediction_history table and flags uncertain classifications (<0.60 confidence).
    """
    result = ml_service.predict(
        amount=data.amount,
        date_str=data.date,
        payment_mode=data.payment_mode,
        location=data.location,
        user_id=user["id"],
    )
    return result


@router.get("/model/insights", response_model=ModelInsightsResponse)
async def get_model_insights(
    user: dict = Depends(get_current_user),
):
    """
    Return model accuracy, confusion matrix, feature importances,
    and per-class precision/recall metrics from the held-out test evaluation.
    """
    return ml_service.get_model_insights()


@router.get("/predictions/history", response_model=PredictionHistoryListResponse)
async def get_predictions_history(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    predicted_type: str | None = Query(None),
    start_date: str | None = Query(None),
    end_date: str | None = Query(None),
    user: dict = Depends(get_current_user),
):
    """Retrieve historical model predictions made by the authenticated user with pagination and filters."""
    total, rows = ml_service.get_prediction_history(
        user_id=user["id"],
        page=page,
        page_size=page_size,
        predicted_type=predicted_type,
        start_date=start_date,
        end_date=end_date,
    )
    total_pages = max(1, (total + page_size - 1) // page_size) if total > 0 else 1
    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
        "has_next": page < total_pages,
        "has_previous": page > 1,
        "predictions": rows,
    }


@router.delete("/predictions/history/{prediction_id}")
async def delete_prediction_history_entry(
    prediction_id: str,
    user: dict = Depends(get_current_user),
):
    """Delete an individual prediction history entry owned by the user."""
    deleted = ml_service.delete_prediction_history_item(user["id"], prediction_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prediction history record not found.",
        )
    return {"success": True, "message": "Prediction history record deleted."}


@router.post("/predictions/{prediction_id}/feedback")
async def record_feedback(
    prediction_id: str,
    payload: PredictionFeedbackRequest,
    user: dict = Depends(get_current_user),
):
    """Record user ground-truth feedback (Income / Expense) for an existing prediction."""
    ml_service.record_prediction_feedback(user["id"], prediction_id, payload.actual_type)
    return {
        "success": True,
        "message": f"Thank you! Feedback recorded as '{payload.actual_type}'.",
    }
