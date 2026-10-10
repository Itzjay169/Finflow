from typing import Any

from ..database import get_db


def get_monthly_analytics(user_id: str) -> list[dict[str, Any]]:
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT 
                SUBSTR(date, 1, 7) AS month,
                COALESCE(SUM(CASE WHEN transaction_type = 'Income' THEN amount ELSE 0 END), 0) AS income,
                COALESCE(SUM(CASE WHEN transaction_type = 'Expense' THEN amount ELSE 0 END), 0) AS expense
            FROM transactions
            WHERE user_id = ?
            GROUP BY SUBSTR(date, 1, 7)
            ORDER BY month ASC
        """, (user_id,))
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
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT 
                category,
                SUM(amount) as total_amount,
                COUNT(*) as count
            FROM transactions
            WHERE user_id = ? AND transaction_type = 'Expense'
            GROUP BY category
            ORDER BY total_amount DESC
        """, (user_id,))
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
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT 
                payment_mode,
                SUM(amount) as total_amount,
                COUNT(*) as count
            FROM transactions
            WHERE user_id = ?
            GROUP BY payment_mode
            ORDER BY total_amount DESC
        """, (user_id,))
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
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT 
                location,
                SUM(amount) as total_amount,
                COUNT(*) as count
            FROM transactions
            WHERE user_id = ?
            GROUP BY location
            ORDER BY total_amount DESC
        """, (user_id,))
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

def get_trends(user_id: str) -> dict[str, Any]:
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

    return {
        "income_mom_pct": income_mom,
        "expense_mom_pct": expense_mom,
        "top_categories": categories[:5],
        "top_locations": locations[:5],
    }
