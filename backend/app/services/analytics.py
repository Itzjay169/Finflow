from datetime import datetime, timedelta
from typing import Any

from ..database import get_db


def get_monthly_analytics(user_id: str, months: int = 12) -> list[dict[str, Any]]:
    """Monthly cashflow aggregates for the past N months."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT 
                SUBSTR(date, 1, 7) AS month,
                COALESCE(SUM(CASE WHEN transaction_type = 'Income' THEN amount ELSE 0 END), 0) AS income,
                COALESCE(SUM(CASE WHEN transaction_type = 'Expense' THEN amount ELSE 0 END), 0) AS expense
            FROM transactions
            WHERE user_id = ?
            GROUP BY SUBSTR(date, 1, 7)
            ORDER BY month ASC
            LIMIT ?
            """,
            (user_id, months),
        )
        rows = cursor.fetchall()

    result = []
    for r in rows:
        inc = float(r["income"])
        exp = float(r["expense"])
        result.append({
            "month": r["month"],
            "income": inc,
            "expense": exp,
            "net": inc - exp,
        })
    return result


def get_category_analytics(user_id: str) -> list[dict[str, Any]]:
    """Expense breakdown by category with percentage and transaction counts."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT 
                category,
                SUM(amount) as total_amount,
                COUNT(*) as count
            FROM transactions
            WHERE user_id = ? AND transaction_type = 'Expense'
            GROUP BY category
            ORDER BY total_amount DESC
            """,
            (user_id,),
        )
        rows = cursor.fetchall()

    total_expense = sum(float(r["total_amount"]) for r in rows) or 1.0
    return [
        {
            "category": r["category"],
            "amount": float(r["total_amount"]),
            "percentage": round((float(r["total_amount"]) / total_expense) * 100, 1),
            "count": int(r["count"]),
        }
        for r in rows
    ]


def get_payment_mode_analytics(user_id: str) -> list[dict[str, Any]]:
    """Distribution of transactions across payment modes."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT 
                payment_mode,
                SUM(amount) as total_amount,
                COUNT(*) as count
            FROM transactions
            WHERE user_id = ?
            GROUP BY payment_mode
            ORDER BY total_amount DESC
            """,
            (user_id,),
        )
        rows = cursor.fetchall()

    total_amount = sum(float(r["total_amount"]) for r in rows) or 1.0
    return [
        {
            "payment_mode": r["payment_mode"],
            "amount": float(r["total_amount"]),
            "percentage": round((float(r["total_amount"]) / total_amount) * 100, 1),
            "count": int(r["count"]),
        }
        for r in rows
    ]


def get_location_analytics(user_id: str) -> list[dict[str, Any]]:
    """Geographic spending distribution across supported cities."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT 
                location,
                SUM(amount) as total_amount,
                COUNT(*) as count
            FROM transactions
            WHERE user_id = ?
            GROUP BY location
            ORDER BY total_amount DESC
            """,
            (user_id,),
        )
        rows = cursor.fetchall()

    total_amount = sum(float(r["total_amount"]) for r in rows) or 1.0
    return [
        {
            "location": r["location"],
            "amount": float(r["total_amount"]),
            "percentage": round((float(r["total_amount"]) / total_amount) * 100, 1),
            "count": int(r["count"]),
        }
        for r in rows
    ]


def get_tag_analytics(user_id: str) -> list[dict[str, Any]]:
    """Spending breakdown by assigned user transaction tags."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT tags, amount FROM transactions
            WHERE user_id = ? AND transaction_type = 'Expense' AND tags IS NOT NULL AND tags != ''
            """,
            (user_id,),
        )
        rows = cursor.fetchall()

    tag_totals: dict[str, float] = {}
    tag_counts: dict[str, int] = {}
    for r in rows:
        tags = [t.strip() for t in r["tags"].split(",") if t.strip()]
        for t in tags:
            tag_totals[t] = tag_totals.get(t, 0.0) + float(r["amount"])
            tag_counts[t] = tag_counts.get(t, 0) + 1

    total_tagged = sum(tag_totals.values()) or 1.0
    results = [
        {
            "tag": t,
            "amount": round(amt, 2),
            "percentage": round((amt / total_tagged) * 100, 1),
            "count": tag_counts[t],
        }
        for t, amt in sorted(tag_totals.items(), key=lambda x: -x[1])
    ]
    return results


def get_trends(user_id: str) -> dict[str, Any]:
    """Computes advanced velocity, averages, largest expense, and period trends."""
    monthly = get_monthly_analytics(user_id)
    income_mom = 0.0
    expense_mom = 0.0

    if len(monthly) >= 2:
        last = monthly[-1]
        prev = monthly[-2]
        if prev["income"] > 0:
            income_mom = round(((last["income"] - prev["income"]) / prev["income"]) * 100, 1)
        if prev["expense"] > 0:
            expense_mom = round(((last["expense"] - prev["expense"]) / prev["expense"]) * 100, 1)

    categories = get_category_analytics(user_id)
    locations = get_location_analytics(user_id)

    # Compute largest single expense and average daily spend over last 30 days
    thirty_days_ago = (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d")
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT MAX(amount) as largest FROM transactions
            WHERE user_id = ? AND transaction_type = 'Expense'
            """,
            (user_id,),
        )
        largest_row = cursor.fetchone()
        largest_expense = float(largest_row["largest"] or 0.0)

        cursor.execute(
            """
            SELECT COALESCE(SUM(amount), 0) as recent_exp FROM transactions
            WHERE user_id = ? AND transaction_type = 'Expense' AND date >= ?
            """,
            (user_id, thirty_days_ago),
        )
        recent_total = float(cursor.fetchone()["recent_exp"])
        avg_daily = round(recent_total / 30.0, 2)

    # Spending velocity: daily rate of spend in current month
    now = datetime.now()
    cur_days = max(1, now.day)
    cur_month_str = now.strftime("%Y-%m")
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT COALESCE(SUM(amount), 0) as cur_spent FROM transactions
            WHERE user_id = ? AND transaction_type = 'Expense' AND strftime('%Y-%m', date) = ?
            """,
            (user_id, cur_month_str),
        )
        cur_spent = float(cursor.fetchone()["cur_spent"])
        spending_velocity = round(cur_spent / cur_days, 2)

    return {
        "income_mom_pct": income_mom,
        "expense_mom_pct": expense_mom,
        "spending_velocity": spending_velocity,
        "avg_daily_spend": avg_daily,
        "largest_single_expense": largest_expense,
        "top_categories": categories[:5],
        "top_locations": locations[:5],
    }
