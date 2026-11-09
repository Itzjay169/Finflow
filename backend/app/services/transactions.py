import csv
import io
import uuid
from datetime import datetime, timedelta
from typing import Any

import pandas as pd

from ..config import DATASET_PATH
from ..database import get_db
from ..models import (
    DuplicateCheckResponse,
    SeedSampleRequest,
    TransactionCreate,
    TransactionResponse,
    TransactionUpdate,
)


def apply_category_rules(user_id: str, notes: str | None, current_category: str) -> str:
    """Applies active user auto-categorization rules ordered by priority."""
    if not notes or not notes.strip():
        return current_category

    text = notes.strip().lower()
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT keyword, category FROM category_rules
            WHERE user_id = ? AND is_active = 1
            ORDER BY priority DESC, created_at DESC
            """,
            (user_id,),
        )
        rules = cursor.fetchall()
        for r in rules:
            if r["keyword"].strip().lower() in text:
                return r["category"].strip()

    return current_category


def check_potential_duplicate(
    user_id: str,
    date_str: str,
    amount: float,
    category: str,
    payment_mode: str,
    notes: str | None = None,
) -> DuplicateCheckResponse:
    """
    Detects potential duplicate transactions within +/- 1 day
    matching amount, category, or payment mode.
    """
    try:
        dt = datetime.strptime(date_str, "%Y-%m-%d").date()
        d_minus = (dt - timedelta(days=1)).strftime("%Y-%m-%d")
        d_plus = (dt + timedelta(days=1)).strftime("%Y-%m-%d")
    except Exception:
        d_minus = date_str
        d_plus = date_str

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT * FROM transactions
            WHERE user_id = ?
              AND amount = ?
              AND date BETWEEN ? AND ?
            ORDER BY created_at DESC
            LIMIT 1
            """,
            (user_id, amount, d_minus, d_plus),
        )
        row = cursor.fetchone()
        if not row:
            return DuplicateCheckResponse(
                is_duplicate=False,
                confidence=0.0,
                matched_transaction=None,
                message="No duplicate detected.",
            )

        match = dict(row)
        score = 0.5  # Base match on amount + date
        if match["category"].lower() == category.lower():
            score += 0.25
        if match["payment_mode"].lower() == payment_mode.lower():
            score += 0.25

        tags_list = [t.strip() for t in (match.get("tags") or "").split(",") if t.strip()]
        matched_tx = TransactionResponse(
            id=match["id"],
            user_id=match["user_id"],
            date=match["date"],
            transaction_type=match["transaction_type"],
            category=match["category"],
            amount=float(match["amount"]),
            payment_mode=match["payment_mode"],
            location=match["location"],
            notes=match.get("notes"),
            tags=tags_list,
            attachment_url=match.get("attachment_url"),
            created_at=match.get("created_at"),
            updated_at=match.get("updated_at"),
        )

        return DuplicateCheckResponse(
            is_duplicate=score >= 0.75,
            confidence=round(score, 2),
            matched_transaction=matched_tx,
            message=(
                f"Potential duplicate detected: identical amount of ₹{amount:,.2f} on {match['date']} "
                f"({match['category']} via {match['payment_mode']})."
            ),
        )


def seed_sample_data(user_id: str, options: SeedSampleRequest | None = None) -> dict[str, Any]:
    """
    Safely seeds the 1,200 benchmark records from CSV into user account.
    Non-destructive by default. If replace_existing is True, requires explicit confirmation.
    """
    if not DATASET_PATH.exists():
        raise FileNotFoundError(f"Benchmark dataset not found at {DATASET_PATH}")

    opts = options or SeedSampleRequest()

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM transactions WHERE user_id = ?", (user_id,))
        current_count = cursor.fetchone()[0]

        if opts.replace_existing:
            is_confirmed = opts.confirm or (opts.confirmation == "RESET DEMO DATA")
            if not is_confirmed:
                return {
                    "success": False,
                    "requires_confirmation": True,
                    "existing_count": current_count,
                    "message": (
                        f"Confirmation required: you currently have {current_count} transactions. "
                        "Provide confirmation='RESET DEMO DATA' or confirm=True to replace existing records."
                    ),
                }
            cursor.execute("DELETE FROM transactions WHERE user_id = ?", (user_id,))

        df = pd.read_csv(DATASET_PATH)
        rows_to_insert = []
        for _, row in df.iterrows():
            tx_id = f"tx_{uuid.uuid4().hex[:12]}"
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
                "",
                None,
            ))

        cursor.executemany("""
            INSERT INTO transactions (id, user_id, date, transaction_type, category, amount, payment_mode, location, notes, tags, attachment_url)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, rows_to_insert)

    return {
        "success": True,
        "inserted_count": len(rows_to_insert),
        "replaced_existing": opts.replace_existing,
        "message": f"Successfully ingested {len(rows_to_insert)} benchmark records.",
    }


def get_summary(user_id: str) -> dict[str, Any]:
    """Computes total income, expense, net savings, and savings rate for user."""
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
    transaction_type: str | None = None,
    category: str | None = None,
    payment_mode: str | None = None,
    location: str | None = None,
    tag: str | None = None,
    has_attachment: bool | None = None,
    start_date: str | None = None,
    end_date: str | None = None,
    search: str | None = None,
    sort_by: str = "date",
    sort_order: str = "desc",
) -> tuple[int, list[dict[str, Any]]]:
    """Retrieves paginated, filtered, and sorted transactions strictly isolated by user_id."""
    query = "SELECT * FROM transactions WHERE user_id = ?"
    count_query = "SELECT COUNT(*) as count FROM transactions WHERE user_id = ?"
    params: list[Any] = [user_id]
    count_params: list[Any] = [user_id]

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

    if tag and tag.lower() != "all":
        tag_like = f"%{tag.lower()}%"
        query += " AND LOWER(COALESCE(tags, '')) LIKE ?"
        count_query += " AND LOWER(COALESCE(tags, '')) LIKE ?"
        params.append(tag_like)
        count_params.append(tag_like)

    if has_attachment is not None:
        if has_attachment:
            query += " AND attachment_url IS NOT NULL AND attachment_url != ''"
            count_query += " AND attachment_url IS NOT NULL AND attachment_url != ''"
        else:
            query += " AND (attachment_url IS NULL OR attachment_url = '')"
            count_query += " AND (attachment_url IS NULL OR attachment_url = '')"

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
        query += " AND (LOWER(COALESCE(notes, '')) LIKE ? OR LOWER(category) LIKE ? OR LOWER(location) LIKE ?)"
        count_query += " AND (LOWER(COALESCE(notes, '')) LIKE ? OR LOWER(category) LIKE ? OR LOWER(location) LIKE ?)"
        params.extend([search_like, search_like, search_like])
        count_params.extend([search_like, search_like, search_like])

    valid_sort_cols = {"date", "amount", "category", "transaction_type", "payment_mode", "location", "created_at"}
    col = sort_by if sort_by in valid_sort_cols else "date"
    order = "ASC" if sort_order.lower() == "asc" else "DESC"
    query += f" ORDER BY {col} {order}, created_at DESC LIMIT ? OFFSET ?"

    offset = (page - 1) * page_size
    params.extend([page_size, offset])

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(count_query, count_params)
        total = cursor.fetchone()["count"]

        cursor.execute(query, params)
        rows = []
        for r in cursor.fetchall():
            d = dict(r)
            tags_str = d.get("tags") or ""
            d["tags"] = [t.strip() for t in tags_str.split(",") if t.strip()]
            rows.append(d)

    return total, rows


def create_transaction(user_id: str, data: TransactionCreate) -> dict[str, Any]:
    """Creates a new transaction with category rules application and strict parameterization."""
    tx_id = f"tx_{uuid.uuid4().hex[:12]}"

    # Auto-categorize via active rules if applicable
    final_category = apply_category_rules(user_id, data.notes, data.category)

    # Normalize tags
    if isinstance(data.tags, list):
        tags_str = ",".join(t.strip() for t in data.tags if t.strip())
    elif isinstance(data.tags, str):
        tags_str = data.tags.strip()
    else:
        tags_str = ""

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO transactions (id, user_id, date, transaction_type, category, amount, payment_mode, location, notes, tags, attachment_url)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            tx_id,
            user_id,
            data.date,
            data.transaction_type,
            final_category,
            data.amount,
            data.payment_mode,
            data.location,
            data.notes,
            tags_str,
            data.attachment_url,
        ))
        cursor.execute("SELECT * FROM transactions WHERE id = ?", (tx_id,))
        row = dict(cursor.fetchone())
        row["tags"] = [t.strip() for t in (row.get("tags") or "").split(",") if t.strip()]
        return row


def update_transaction(user_id: str, tx_id: str, data: TransactionUpdate) -> dict[str, Any] | None:
    """Updates an existing transaction owned by user_id."""
    updates = []
    params = []
    dump = data.model_dump(exclude_unset=True)

    for field, val in dump.items():
        if val is not None:
            if field == "tags":
                if isinstance(val, list):
                    val = ",".join(t.strip() for t in val if t.strip())
                updates.append("tags = ?")
                params.append(val)
            else:
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
        row = dict(cursor.fetchone())
        row["tags"] = [t.strip() for t in (row.get("tags") or "").split(",") if t.strip()]
        return row


def delete_transaction(user_id: str, tx_id: str) -> bool:
    """Deletes a single transaction owned by user_id."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM transactions WHERE id = ? AND user_id = ?", (tx_id, user_id))
        return cursor.rowcount > 0


def bulk_delete_transactions(user_id: str, tx_ids: list[str]) -> int:
    """Deletes multiple transactions owned by user_id in a single transaction."""
    if not tx_ids:
        return 0
    placeholders = ",".join("?" for _ in tx_ids)
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(f"DELETE FROM transactions WHERE user_id = ? AND id IN ({placeholders})", [user_id, *tx_ids])
        return cursor.rowcount


def export_transactions_csv(
    user_id: str,
    filtered: bool = False,
    start_date: str | None = None,
    end_date: str | None = None,
    transaction_type: str | None = None,
    category: str | None = None,
) -> str:
    """Exports transactions of user_id as RFC 4180 compliant CSV."""
    query = """
        SELECT id, date, transaction_type, category, amount, payment_mode, location, notes, tags, attachment_url, created_at, updated_at
        FROM transactions
        WHERE user_id = ?
    """
    params: list[Any] = [user_id]
    if filtered:
        if start_date:
            query += " AND date >= ?"
            params.append(start_date)
        if end_date:
            query += " AND date <= ?"
            params.append(end_date)
        if transaction_type and transaction_type.lower() != "all":
            query += " AND LOWER(transaction_type) = LOWER(?)"
            params.append(transaction_type)
        if category and category.lower() != "all":
            query += " AND LOWER(category) = LOWER(?)"
            params.append(category)

    query += " ORDER BY date DESC"

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(query, params)
        rows = cursor.fetchall()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "transaction_id",
        "date",
        "transaction_type",
        "category",
        "amount",
        "payment_mode",
        "location",
        "notes",
        "tags",
        "created_at",
        "updated_at",
    ])
    for r in rows:
        writer.writerow([
            r["id"],
            r["date"],
            r["transaction_type"],
            r["category"],
            r["amount"],
            r["payment_mode"],
            r["location"],
            r["notes"] or "",
            r["tags"] or "",
            r["created_at"] or "",
            r["updated_at"] or "",
        ])
    return output.getvalue()


def get_transactions_csv_template() -> str:
    """Returns a RFC 4180 CSV sample template for importing transactions."""
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["date", "transaction_type", "category", "amount", "payment_mode", "location", "notes", "tags"])
    writer.writerow(["2026-11-01", "Expense", "Groceries", "2450.00", "UPI", "Bangalore", "Weekly grocery store run", "essentials,groceries"])
    writer.writerow(["2026-11-02", "Income", "Salary", "85000.00", "Bank Transfer", "Bangalore", "Monthly salary payout", "salary,work"])
    writer.writerow(["2026-11-03", "Expense", "Food & Dining", "850.00", "Credit Card", "Bangalore", "Dinner with team", "dining,outdoors"])
    return output.getvalue()


def import_transactions_csv(user_id: str, csv_content: str) -> dict[str, Any]:
    """
    Parses and validates CSV transactions, checking for duplicates and applying auto-categorization.
    Atomically inserts valid rows with automatic rollback on fatal parsing failure.
    """
    reader = csv.DictReader(io.StringIO(csv_content.strip()))
    total_rows = 0
    inserted_count = 0
    skipped_count = 0
    duplicate_count = 0
    errors: list[str] = []
    rows_to_insert = []

    # Pre-fetch existing transactions for duplicate detection
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT date, amount, category, payment_mode FROM transactions WHERE user_id = ?", (user_id,))
        existing_tx_set = {
            (r["date"], round(float(r["amount"]), 2), str(r["category"]).lower(), str(r["payment_mode"]).lower())
            for r in cursor.fetchall()
        }

    for row_num, row in enumerate(reader, start=2):
        total_rows += 1
        try:
            date_val = (row.get("date") or "").strip()
            if not date_val:
                errors.append(f"Row {row_num}: Date is missing.")
                skipped_count += 1
                continue
            datetime.strptime(date_val, "%Y-%m-%d")

            t_type = (row.get("transaction_type") or "Expense").strip().title()
            if t_type not in ("Income", "Expense"):
                t_type = "Expense"

            category = (row.get("category") or "General").strip() or "General"

            raw_amt = str(row.get("amount", "")).replace("$", "").replace("₹", "").replace("€", "").replace("£", "").replace(",", "").strip()
            try:
                amount = float(raw_amt)
            except (ValueError, TypeError):
                errors.append(f"Row {row_num}: Invalid amount '{raw_amt}'.")
                skipped_count += 1
                continue

            if amount <= 0:
                errors.append(f"Row {row_num}: Amount must be positive.")
                skipped_count += 1
                continue

            pm = (row.get("payment_mode") or "UPI").strip() or "UPI"
            loc = (row.get("location") or "Bangalore").strip() or "Bangalore"
            notes = (row.get("notes") or "").strip() or None
            tags = (row.get("tags") or "").strip()
            attachment = (row.get("attachment_url") or "").strip() or None

            # Check duplicate against existing transactions and current batch
            sig = (date_val, round(amount, 2), category.lower(), pm.lower())
            if sig in existing_tx_set:
                duplicate_count += 1
                continue

            existing_tx_set.add(sig)

            # Apply categorization rules
            category = apply_category_rules(user_id, notes, category)

            tx_id = f"tx_{uuid.uuid4().hex[:12]}"
            rows_to_insert.append((tx_id, user_id, date_val, t_type, category, amount, pm, loc, notes, tags, attachment))
            inserted_count += 1
        except Exception as exc:
            errors.append(f"Row {row_num}: {str(exc)}")
            skipped_count += 1

    if rows_to_insert:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.executemany("""
                INSERT INTO transactions (id, user_id, date, transaction_type, category, amount, payment_mode, location, notes, tags, attachment_url)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, rows_to_insert)

    return {
        "success": True,
        "total_rows": total_rows,
        "imported": inserted_count,
        "inserted_count": inserted_count,
        "skipped": skipped_count,
        "skipped_count": skipped_count,
        "duplicates": duplicate_count,
        "errors": errors[:10],
        "message": f"Imported {inserted_count} transactions ({duplicate_count} duplicates skipped, {len(errors)} errors).",
    }
