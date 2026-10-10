
from fastapi import APIRouter, Depends

from ..auth import get_current_user
from ..models import (
    CategoryAnalyticsItem,
    LocationAnalyticsItem,
    MonthlyAnalyticsItem,
    PaymentModeAnalyticsItem,
    TrendsResponse,
)
from ..services import analytics as analytics_service

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])

@router.get("/monthly", response_model=list[MonthlyAnalyticsItem])
async def get_monthly_analytics(user: dict = Depends(get_current_user)):
    return analytics_service.get_monthly_analytics(user["id"])

@router.get("/category", response_model=list[CategoryAnalyticsItem])
async def get_category_analytics(user: dict = Depends(get_current_user)):
    return analytics_service.get_category_analytics(user["id"])

@router.get("/payment-mode", response_model=list[PaymentModeAnalyticsItem])
async def get_payment_mode_analytics(user: dict = Depends(get_current_user)):
    return analytics_service.get_payment_mode_analytics(user["id"])

@router.get("/location", response_model=list[LocationAnalyticsItem])
async def get_location_analytics(user: dict = Depends(get_current_user)):
    return analytics_service.get_location_analytics(user["id"])

@router.get("/trends", response_model=TrendsResponse)
async def get_trends(user: dict = Depends(get_current_user)):
    return analytics_service.get_trends(user["id"])
