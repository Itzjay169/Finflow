import uuid
import csv
import io
import pandas as pd
from typing import List, Optional, Dict, Any, Tuple
from ..database import get_db
from ..config import DATASET_PATH
from ..models import TransactionCreate, TransactionUpdate

def seed_sample_data(user_id: str) -> int:
    """
    Seeds the 1,200 benchmark records from CSV into user account.
    Clears existing user transactions to ensure exact 1,200 baseline.
    """
    if not DATASET_PATH.exists():
        raise FileNotFoundError(f"Dataset not found at {DATASET_PATH}")

    df = pd.read_csv(DATASET_PATH)
    rows_to_insert = []
    for _, row in df.iterrows():
        tx_id = str(uuid.uuid4())
        rows_to_insert.append((
            tx_id,
            user_id,
            str(row["date"]),
            str(row["transaction_type"]),
            str(row["category"]),
            float(row["amount"]),
            str(row["payment_mode"]),
            str(row["location"]),
            str(row["notes"]) if pd.notna(row["notes"]) else None,
        ))

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM transactions WHERE user_id = ?", (user_id,))
        cursor.executemany("""
            INSERT INTO transactions (id, user_id, date, transaction_type, category, amount, payment_mode, location, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, rows_to_insert)

    return len(rows_to_insert)

def get_summary(user_id: str) -> Dict[str, Any]:
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT 
                COALESCE(SUM(CASE WHEN transaction_type = 'Income' THEN amount ELSE 0 END), 0) AS total_income,
                COALESCE(SUM(CASE WHEN transaction_type = 'Expense' THEN amount ELSE 0 END), 0) AS total_expense,
                COUNT(*) as transaction_count
            FROM transactions
            WHERE user_id = ?
        """, (user_id,))
        row = cursor.fetchone()

        income = float(row["total_income"])
        expense = float(row["total_expense"])
        count = int(row["transaction_count"])
        net = income - expense
        savings_rate = round((net / income * 100), 2) if income > 0 else 0.0

        return {
            "total_income": income,
            "total_expense": expense,
            "net_savings": net,
            "savings_rate": max(0.0, savings_rate),
            "transaction_count": count,
        }

def get_transactions(
    user_id: str,
    page: int = 1,
    page_size: int = 20,
    transaction_type: Optional[str] = None,
    category: Optional[str] = None,
    payment_mode: Optional[str] = None,
    location: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    search: Optional[str] = None,
    sort_by: str = "date",
    sort_order: str = "desc",
) -> Tuple[int, List[Dict[str, Any]]]:
    query = "SELECT * FROM transactions WHERE user_id = ?"
    count_query = "SELECT COUNT(*) as count FROM transactions WHERE user_id = ?"
    params: List[Any] = [user_id]
    count_params: List[Any] = [user_id]

    if transaction_type and transaction_type.lower() != "all":
        query += " AND LOWER(transaction_type) = LOWER(?)"
        count_query += " AND LOWER(transaction_type) = LOWER(?)"
        params.append(transaction_type)
        count_params.append(transaction_type)

    if category and category.lower() != "all":
        query += " AND LOWER(category) = LOWER(?)"
        count_query += " AND LOWER(category) = LOWER(?)"
        params.append(category)
        count_params.append(category)

    if payment_mode and payment_mode.lower() != "all":
        query += " AND LOWER(payment_mode) = LOWER(?)"
        count_query += " AND LOWER(payment_mode) = LOWER(?)"
        params.append(payment_mode)
        count_params.append(payment_mode)

    if location and location.lower() != "all":
        query += " AND LOWER(location) = LOWER(?)"
        count_query += " AND LOWER(location) = LOWER(?)"
        params.append(location)
        count_params.append(location)

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

    if search:
        search_like = f"%{search.lower()}%"
        query += " AND (LOWER(COALESCE(notes, '')) LIKE ? OR LOWER(category) LIKE ?)"
        count_query += " AND (LOWER(COALESCE(notes, '')) LIKE ? OR LOWER(category) LIKE ?)"
        params.extend([search_like, search_like])
        count_params.extend([search_like, search_like])

    # Safe sort column
    valid_sort_cols = {"date", "amount", "category", "transaction_type", "payment_mode", "location"}
    col = sort_by if sort_by in valid_sort_cols else "date"
    order = "ASC" if sort_order.lower() == "asc" else "DESC"
    query += f" ORDER BY {col} {order}, created_at DESC"

    # Pagination
    offset = (page - 1) * page_size
    query += " LIMIT ? OFFSET ?"
    params.extend([page_size, offset])

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(count_query, count_params)
        total = cursor.fetchone()["count"]

        cursor.execute(query, params)
        rows = [dict(r) for r in cursor.fetchall()]

    return total, rows

def create_transaction(user_id: str, data: TransactionCreate) -> Dict[str, Any]:
    tx_id = str(uuid.uuid4())
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO transactions (id, user_id, date, transaction_type, category, amount, payment_mode, location, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            tx_id,
            user_id,
            data.date,
            data.transaction_type,
            data.category,
            data.amount,
            data.payment_mode,
            data.location,
            data.notes,
        ))
        cursor.execute("SELECT * FROM transactions WHERE id = ?", (tx_id,))
        return dict(cursor.fetchone())

def update_transaction(user_id: str, tx_id: str, data: TransactionUpdate) -> Optional[Dict[str, Any]]:
    updates = []
    params = []
    for field, val in data.model_dump(exclude_unset=True).items():
        if val is not None:
            updates.append(f"{field} = ?")
            params.append(val)

    if not updates:
        return None

    params.extend([tx_id, user_id])
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(f"""
            UPDATE transactions
            SET {', '.join(updates)}, updated_at = CURRENT_TIMESTAMP
            WHERE id = ? AND user_id = ?
        """, params)
        if cursor.rowcount == 0:
            return None
        cursor.execute("SELECT * FROM transactions WHERE id = ?", (tx_id,))
        return dict(cursor.fetchone())

def delete_transaction(user_id: str, tx_id: str) -> bool:
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM transactions WHERE id = ? AND user_id = ?", (tx_id, user_id))
        return cursor.rowcount > 0

def bulk_delete_transactions(user_id: str, tx_ids: List[str]) -> int:
    if not tx_ids:
        return 0
    placeholders = ",".join("?" for _ in tx_ids)
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(f"DELETE FROM transactions WHERE user_id = ? AND id IN ({placeholders})", [user_id, *tx_ids])
        return cursor.rowcount

def export_transactions_csv(user_id: str) -> str:
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, date, transaction_type, category, amount, payment_mode, location, notes
            FROM transactions
            WHERE user_id = ?
            ORDER BY date DESC
        """, (user_id,))
        rows = cursor.fetchall()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["transaction_id", "date", "transaction_type", "category", "amount", "payment_mode", "location", "notes"])
    for r in rows:
        writer.writerow([r["id"], r["date"], r["transaction_type"], r["category"], r["amount"], r["payment_mode"], r["location"], r["notes"] or ""])
    return output.getvalue()
