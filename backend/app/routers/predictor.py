from fastapi import APIRouter, Depends
from ..models import PredictRequest, PredictResponse, ModelInsightsResponse, ModelSummaryResponse
from ..auth import get_current_user
from ..services import predictor as ml_service

router = APIRouter(prefix="/api", tags=["ML Predictor"])


@router.get("/model/summary", response_model=ModelSummaryResponse)
async def get_model_summary():
    """
    Public model-level summary metrics (RandomForest, 18 features, 95.8% accuracy).
    No authentication required.
    """
    return ml_service.get_model_summary()


@router.post("/predict", response_model=PredictResponse)
async def predict_transaction_type(
    data: PredictRequest,
    user: dict = Depends(get_current_user),
):
    """
    Classify a transaction as Income or Expense using the trained
    RandomForest model (18-feature pipeline, 95.8% accuracy).
    """
    result = ml_service.predict(
        amount=data.amount,
        date_str=data.date,
        payment_mode=data.payment_mode,
        location=data.location,
    )
    return result


@router.get("/model/insights", response_model=ModelInsightsResponse)
async def get_model_insights(
    user: dict = Depends(get_current_user),
):
    """
    Return model accuracy, confusion matrix, feature importances,
    and per-class precision/recall metrics.
    """
    return ml_service.get_model_insights()

