from fastapi import APIRouter, Body, Depends, HTTPException, Query, Request, Response, status

from ..auth import get_current_user
from ..models import (
    BulkDeleteRequest,
    DuplicateCheckRequest,
    DuplicateCheckResponse,
    SeedSampleRequest,
    SummaryResponse,
    TransactionCreate,
    TransactionListResponse,
    TransactionResponse,
    TransactionUpdate,
)
from ..services import transactions as tx_service

router = APIRouter(prefix="/api", tags=["Transactions"])


@router.get("/summary", response_model=SummaryResponse)
async def get_summary(user: dict = Depends(get_current_user)):
    """Computes real-time totals for income, expense, net savings, and savings rate."""
    return tx_service.get_summary(user["id"])


@router.get("/transactions", response_model=TransactionListResponse)
async def list_transactions(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    transaction_type: str | None = Query(None),
    category: str | None = Query(None),
    payment_mode: str | None = Query(None),
    location: str | None = Query(None),
    tag: str | None = Query(None),
    has_attachment: bool | None = Query(None),
    start_date: str | None = Query(None),
    end_date: str | None = Query(None),
    search: str | None = Query(None),
    sort_by: str = Query("date"),
    sort_order: str = Query("desc"),
    user: dict = Depends(get_current_user),
):
    """Retrieves filtered, paginated transaction records strictly isolated to the authenticated user."""
    total, rows = tx_service.get_transactions(
        user_id=user["id"],
        page=page,
        page_size=page_size,
        transaction_type=transaction_type,
        category=category,
        payment_mode=payment_mode,
        location=location,
        tag=tag,
        has_attachment=has_attachment,
        start_date=start_date,
        end_date=end_date,
        search=search,
        sort_by=sort_by,
        sort_order=sort_order,
    )
    total_pages = max(1, (total + page_size - 1) // page_size) if total > 0 else 1
    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
        "has_next": page < total_pages,
        "has_previous": page > 1,
        "transactions": rows,
    }


@router.post("/transactions", response_model=TransactionResponse)
async def create_transaction(
    data: TransactionCreate,
    user: dict = Depends(get_current_user),
):
    """Creates a new financial transaction with auto-categorization and input validation."""
    return tx_service.create_transaction(user["id"], data)


@router.post("/transactions/check-duplicate", response_model=DuplicateCheckResponse)
async def check_duplicate(
    data: DuplicateCheckRequest,
    user: dict = Depends(get_current_user),
):
    """Inspects nearby transactions (+/- 1 day) for potential duplicate amounts, payment modes, and categories."""
    return tx_service.check_potential_duplicate(
        user_id=user["id"],
        date_str=data.date,
        amount=data.amount,
        category=data.category,
        payment_mode=data.payment_mode,
        notes=data.notes,
    )


@router.put("/transactions/{transaction_id}", response_model=TransactionResponse)
async def update_transaction(
    transaction_id: str,
    data: TransactionUpdate,
    user: dict = Depends(get_current_user),
):
    """Updates an existing transaction owned by the user."""
    res = tx_service.update_transaction(user["id"], transaction_id, data)
    if not res:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found.")
    return res


@router.delete("/transactions/{transaction_id}")
async def delete_transaction(
    transaction_id: str,
    user: dict = Depends(get_current_user),
):
    """Deletes a single transaction owned by the authenticated user."""
    deleted = tx_service.delete_transaction(user["id"], transaction_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found.")
    return {"success": True, "message": "Transaction deleted."}


@router.post("/transactions/bulk-delete")
async def bulk_delete_transactions(
    payload: BulkDeleteRequest,
    user: dict = Depends(get_current_user),
):
    """Deletes an array of transactions in a single atomic database operation."""
    count = tx_service.bulk_delete_transactions(user["id"], payload.transaction_ids)
    return {"success": True, "deleted_count": count}


@router.post("/transactions/seed-sample")
async def seed_sample_data(
    payload: SeedSampleRequest | None = Body(default=None),
    user: dict = Depends(get_current_user),
):
    """
    Seeds the benchmark dataset into user account. Non-destructive by default.
    Requires explicit replace_existing=True and confirm=True before replacing existing records.
    """
    res = tx_service.seed_sample_data(user["id"], payload)
    if not res["success"] and res.get("requires_confirmation"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=res["message"],
        )
    return res


@router.get("/transactions/export-csv")
@router.get("/export/transactions/csv")
async def export_csv(
    filtered: bool = Query(False),
    start_date: str | None = Query(None),
    end_date: str | None = Query(None),
    transaction_type: str | None = Query(None),
    category: str | None = Query(None),
    user: dict = Depends(get_current_user),
):
    """Exports user transactions in RFC 4180 CSV format with optional filtering."""
    csv_data = tx_service.export_transactions_csv(
        user["id"],
        filtered=filtered,
        start_date=start_date,
        end_date=end_date,
        transaction_type=transaction_type,
        category=category,
    )
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=finflow_transactions.csv"},
    )


@router.get("/transactions/template-csv")
@router.get("/export/template/transactions-csv")
async def get_csv_template():
    """Returns downloadable sample CSV template for transactions import."""
    template_data = tx_service.get_transactions_csv_template()
    return Response(
        content=template_data,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=finflow_template.csv"},
    )


@router.post("/transactions/import-csv")
@router.post("/import/transactions/csv")
async def import_csv(
    request: Request,
    user: dict = Depends(get_current_user),
):
    """Imports transactions from CSV text or raw body with validation, duplicate detection, and category rules."""
    content_type = request.headers.get("content-type", "")
    content = ""
    if "application/json" in content_type:
        body = await request.json()
        content = body.get("csv_text", "")
    elif "multipart/form-data" in content_type:
        form = await request.form()
        file_obj = form.get("file")
        if file_obj and hasattr(file_obj, "read"):
            bytes_content = await file_obj.read()
            content = bytes_content.decode("utf-8", errors="ignore")
        else:
            content = str(form.get("csv_text", ""))
    else:
        raw_body = await request.body()
        content = raw_body.decode("utf-8", errors="ignore")

    if not content.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="CSV content required.",
        )

    result = tx_service.import_transactions_csv(user["id"], content)
    return result
