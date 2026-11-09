from fastapi import APIRouter, Depends, Query

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
async def get_monthly_analytics(
    months: int = Query(12, ge=1, le=60),
    user: dict = Depends(get_current_user),
):
    """Monthly historical breakdown of income, expenses, and net cashflow."""
    return analytics_service.get_monthly_analytics(user["id"], months=months)


@router.get("/category", response_model=list[CategoryAnalyticsItem])
async def get_category_analytics(user: dict = Depends(get_current_user)):
    """Category-level distribution of all outgoing expenses."""
    return analytics_service.get_category_analytics(user["id"])


@router.get("/payment-mode", response_model=list[PaymentModeAnalyticsItem])
async def get_payment_mode_analytics(user: dict = Depends(get_current_user)):
    """Volume and transaction count by payment instrument."""
    return analytics_service.get_payment_mode_analytics(user["id"])


@router.get("/location", response_model=list[LocationAnalyticsItem])
async def get_location_analytics(user: dict = Depends(get_current_user)):
    """Geographic breakdown across regional financial hubs."""
    return analytics_service.get_location_analytics(user["id"])


@router.get("/tags")
async def get_tag_analytics(user: dict = Depends(get_current_user)):
    """Volume and distribution of expenses categorized by user tags."""
    return analytics_service.get_tag_analytics(user["id"])


@router.get("/trends", response_model=TrendsResponse)
async def get_trends(user: dict = Depends(get_current_user)):
    """Period-over-period trend analysis, spending velocity, and high-watermark statistics."""
    return analytics_service.get_trends(user["id"])
