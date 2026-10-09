from fastapi import APIRouter, Depends, HTTPException, Query, Response
from typing import Optional, List
from ..models import (
    TransactionCreate,
    TransactionUpdate,
    TransactionResponse,
    TransactionListResponse,
    BulkDeleteRequest,
    SummaryResponse,
)
from ..auth import get_current_user
from ..services import transactions as tx_service

router = APIRouter(prefix="/api", tags=["Transactions"])

@router.get("/summary", response_model=SummaryResponse)
async def get_summary(user: dict = Depends(get_current_user)):
    return tx_service.get_summary(user["id"])

@router.get("/transactions", response_model=TransactionListResponse)
async def list_transactions(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    transaction_type: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    payment_mode: Optional[str] = Query(None),
    location: Optional[str] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    sort_by: str = Query("date"),
    sort_order: str = Query("desc"),
    user: dict = Depends(get_current_user),
):
    total, rows = tx_service.get_transactions(
        user_id=user["id"],
        page=page,
        page_size=page_size,
        transaction_type=transaction_type,
        category=category,
        payment_mode=payment_mode,
        location=location,
        start_date=start_date,
        end_date=end_date,
        search=search,
        sort_by=sort_by,
        sort_order=sort_order,
    )
    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "transactions": rows,
    }

@router.post("/transactions", response_model=TransactionResponse)
async def create_transaction(
    data: TransactionCreate,
    user: dict = Depends(get_current_user),
):
    return tx_service.create_transaction(user["id"], data)

@router.put("/transactions/{transaction_id}", response_model=TransactionResponse)
async def update_transaction(
    transaction_id: str,
    data: TransactionUpdate,
    user: dict = Depends(get_current_user),
):
    res = tx_service.update_transaction(user["id"], transaction_id, data)
    if not res:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return res

@router.delete("/transactions/{transaction_id}")
async def delete_transaction(
    transaction_id: str,
    user: dict = Depends(get_current_user),
):
    deleted = tx_service.delete_transaction(user["id"], transaction_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return {"success": True, "message": "Transaction deleted"}

@router.post("/transactions/bulk-delete")
async def bulk_delete_transactions(
    payload: BulkDeleteRequest,
    user: dict = Depends(get_current_user),
):
    count = tx_service.bulk_delete_transactions(user["id"], payload.transaction_ids)
    return {"success": True, "deleted_count": count}

@router.post("/transactions/seed-sample")
async def seed_sample_data(user: dict = Depends(get_current_user)):
    count = tx_service.seed_sample_data(user["id"])
    return {
        "success": True,
        "message": f"Successfully ingested {count} benchmark records",
        "count": count,
    }

@router.get("/transactions/export-csv")
async def export_csv(user: dict = Depends(get_current_user)):
    csv_data = tx_service.export_transactions_csv(user["id"])
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=finflow_transactions.csv"},
    )
