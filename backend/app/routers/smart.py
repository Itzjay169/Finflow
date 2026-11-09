import calendar
import logging
import uuid
from datetime import date, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query, status

from ..auth import get_current_user
from ..database import get_db
from ..models import (
    AccountDeleteRequest,
    BudgetCreate,
    BudgetResponse,
    CategoryAnalyticsItem,
    CategoryRuleCreate,
    CategoryRuleResponse,
    GoalContribute,
    GoalCreate,
    GoalResponse,
    MonthlyAnalyticsItem,
    NotificationResponse,
    PrintableReportResponse,
    ProfileResponse,
    ProfileUpdate,
    RecurringItemCreate,
    RecurringItemResponse,
    SavedFilterCreate,
    SavedFilterResponse,
    SummaryResponse,
    SystemInfoResponse,
    TagCreate,
    TagResponse,
    UserPreferencesResponse,
    UserPreferencesUpdate,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["Smart Features & Budgets"])


def advance_due_date(current_due_str: str, frequency: str) -> str:
    """Calculates the subsequent due date based on recurrence frequency."""
    try:
        dt = datetime.strptime(current_due_str, "%Y-%m-%d").date()
    except Exception:
        dt = datetime.now().date()

    freq = frequency.strip().title()
    if freq == "Weekly":
        next_dt = dt + timedelta(days=7)
    elif freq == "Quarterly":
        # Advance by 3 months safely
        month = dt.month + 3
        year = dt.year + (month - 1) // 12
        month = ((month - 1) % 12) + 1
        day = min(dt.day, calendar.monthrange(year, month)[1])
        next_dt = date(year, month, day)
    elif freq == "Yearly":
        try:
            next_dt = dt.replace(year=dt.year + 1)
        except ValueError:
            next_dt = dt.replace(year=dt.year + 1, day=28)
    else:  # Monthly default
        month = dt.month + 1
        year = dt.year + (month - 1) // 12
        month = ((month - 1) % 12) + 1
        day = min(dt.day, calendar.monthrange(year, month)[1])
        next_dt = date(year, month, day)

    return next_dt.strftime("%Y-%m-%d")


# ==============================================================================
# 1. BUDGETS
# ==============================================================================

@router.get("/budgets", response_model=list[BudgetResponse])
async def get_budgets(
    month: int | None = Query(None, ge=1, le=12),
    year: int | None = Query(None, ge=2020, le=2050),
    user: dict = Depends(get_current_user),
):
    """Get all budgets for user with current month/year spending calculations."""
    user_id = user["id"]
    now = datetime.now()
    cur_month = month or now.month
    cur_year = year or now.year
    month_str = f"{cur_year:04d}-{cur_month:02d}"

    with get_db() as conn:
        cursor = conn.cursor()

        # Seed starter budgets if user has none
        cursor.execute(
            "SELECT COUNT(*) FROM budgets WHERE user_id = ? AND month = ? AND year = ?",
            (user_id, cur_month, cur_year),
        )
        count = cursor.fetchone()[0]
        if count == 0:
            default_budgets = [
                ("Food", 8000.0),
                ("Groceries", 6000.0),
                ("Entertainment", 4000.0),
                ("Bills", 5000.0),
                ("Shopping", 5000.0),
            ]
            for cat, limit in default_budgets:
                bid = f"b_{uuid.uuid4().hex[:10]}"
                cursor.execute(
                    """
                    INSERT OR IGNORE INTO budgets (id, user_id, category, monthly_limit, month, year)
                    VALUES (?, ?, ?, ?, ?, ?)
                    """,
                    (bid, user_id, cat, limit, cur_month, cur_year),
                )
            conn.commit()

        cursor.execute(
            """
            SELECT id, user_id, category, monthly_limit, month, year
            FROM budgets
            WHERE user_id = ? AND month = ? AND year = ?
            ORDER BY monthly_limit DESC
            """,
            (user_id, cur_month, cur_year),
        )
        budget_rows = cursor.fetchall()

        # Fetch actual expenses for these categories strictly filtered to month and year
        cursor.execute(
            """
            SELECT category, SUM(amount) as spent
            FROM transactions
            WHERE user_id = ?
              AND transaction_type = 'Expense'
              AND strftime('%Y-%m', date) = ?
            GROUP BY category
            """,
            (user_id, month_str),
        )
        spent_map = {row["category"]: float(row["spent"]) for row in cursor.fetchall()}

    results = []
    for b in budget_rows:
        limit = float(b["monthly_limit"])
        spent = spent_map.get(b["category"], 0.0)
        remaining = max(0.0, limit - spent)
        pct = round((spent / limit) * 100, 1) if limit > 0 else 0.0
        results.append(
            BudgetResponse(
                id=b["id"],
                user_id=b["user_id"],
                category=b["category"],
                monthly_limit=limit,
                month=b["month"],
                year=b["year"],
                spent=round(spent, 2),
                remaining=round(remaining, 2),
                percentage=pct,
                is_exceeded=spent > limit,
            )
        )
    return results


@router.post("/budgets", response_model=BudgetResponse)
async def create_or_update_budget(
    data: BudgetCreate,
    user: dict = Depends(get_current_user),
):
    """Create or update a monthly category budget."""
    user_id = user["id"]
    month_str = f"{data.year:04d}-{data.month:02d}"

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT id FROM budgets
            WHERE user_id = ? AND category = ? AND month = ? AND year = ?
            """,
            (user_id, data.category, data.month, data.year),
        )
        existing = cursor.fetchone()

        if existing:
            bid = existing["id"]
            cursor.execute(
                "UPDATE budgets SET monthly_limit = ? WHERE id = ?",
                (data.monthly_limit, bid),
            )
        else:
            bid = f"b_{uuid.uuid4().hex[:10]}"
            cursor.execute(
                """
                INSERT INTO budgets (id, user_id, category, monthly_limit, month, year)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (bid, user_id, data.category, data.monthly_limit, data.month, data.year),
            )

        cursor.execute(
            """
            SELECT SUM(amount) FROM transactions
            WHERE user_id = ? AND transaction_type = 'Expense'
              AND category = ? AND strftime('%Y-%m', date) = ?
            """,
            (user_id, data.category, month_str),
        )
        spent_row = cursor.fetchone()
        spent = float(spent_row[0] or 0.0)

    remaining = max(0.0, data.monthly_limit - spent)
    pct = round((spent / data.monthly_limit) * 100, 1) if data.monthly_limit > 0 else 0.0

    return BudgetResponse(
        id=bid,
        user_id=user_id,
        category=data.category,
        monthly_limit=data.monthly_limit,
        month=data.month,
        year=data.year,
        spent=round(spent, 2),
        remaining=round(remaining, 2),
        percentage=pct,
        is_exceeded=spent > data.monthly_limit,
    )


@router.delete("/budgets/{budget_id}")
async def delete_budget(budget_id: str, user: dict = Depends(get_current_user)):
    """Delete a budget item."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM budgets WHERE id = ? AND user_id = ?", (budget_id, user["id"]))
        if cursor.rowcount == 0:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Budget not found.")
    return {"success": True, "message": "Budget deleted successfully."}


# ==============================================================================
# 2. SAVINGS GOALS & AUTOMATION
# ==============================================================================

@router.get("/goals", response_model=list[GoalResponse])
async def get_goals(user: dict = Depends(get_current_user)):
    """Get all savings goals with projected completion dates and progress calculations."""
    user_id = user["id"]
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM goals WHERE user_id = ?", (user_id,))
        count = cursor.fetchone()[0]

        if count == 0:
            default_goals = [
                ("Emergency Fund (6 Months)", 150000.0, 95000.0, "2026-12-31", "Safety", 5000.0),
                ("Europe Vacation 2027", 120000.0, 48000.0, "2027-05-01", "Travel", 4000.0),
                ("New MacBook Pro M4", 175000.0, 130000.0, "2026-11-15", "Tech", 15000.0),
                ("Down Payment for Car", 250000.0, 85000.0, "2027-08-01", "Vehicle", 8000.0),
            ]
            for title, target, cur, deadline, cat, monthly_c in default_goals:
                gid = f"g_{uuid.uuid4().hex[:10]}"
                cursor.execute(
                    """
                    INSERT INTO goals (id, user_id, title, target_amount, current_amount, deadline, category, monthly_contribution)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (gid, user_id, title, target, cur, deadline, cat, monthly_c),
                )
            conn.commit()

        cursor.execute(
            """
            SELECT id, user_id, title, target_amount, current_amount, deadline, category, monthly_contribution
            FROM goals
            WHERE user_id = ?
            ORDER BY created_at DESC
            """,
            (user_id,),
        )
        rows = cursor.fetchall()

    results = []
    now_date = datetime.now().date()
    for r in rows:
        target = float(r["target_amount"])
        cur = float(r["current_amount"])
        pct = round(min(100.0, (cur / target) * 100), 1) if target > 0 else 0.0
        rem = max(0.0, target - cur)
        monthly_c = float(r["monthly_contribution"] or 0.0)

        # Compute projected completion date
        projected_completion = None
        if rem <= 0:
            projected_completion = "Completed"
        elif monthly_c > 0:
            months_needed = int(rem // monthly_c) + (1 if rem % monthly_c > 0 else 0)
            proj_date = now_date + timedelta(days=months_needed * 30)
            projected_completion = proj_date.strftime("%Y-%m-%d")

        results.append(
            GoalResponse(
                id=r["id"],
                user_id=r["user_id"],
                title=r["title"],
                target_amount=target,
                current_amount=cur,
                deadline=r["deadline"],
                category=r["category"],
                monthly_contribution=monthly_c,
                percentage=pct,
                remaining=round(rem, 2),
                projected_completion_date=projected_completion,
            )
        )
    return results


@router.post("/goals", response_model=GoalResponse)
async def create_goal(data: GoalCreate, user: dict = Depends(get_current_user)):
    """Create a new savings goal with target and monthly contribution settings."""
    gid = f"g_{uuid.uuid4().hex[:10]}"
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO goals (id, user_id, title, target_amount, current_amount, deadline, category, monthly_contribution)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                gid,
                user["id"],
                data.title,
                data.target_amount,
                data.current_amount,
                data.deadline,
                data.category,
                data.monthly_contribution,
            ),
        )
    pct = round(min(100.0, (data.current_amount / data.target_amount) * 100), 1) if data.target_amount > 0 else 0.0
    return GoalResponse(
        id=gid,
        user_id=user["id"],
        title=data.title,
        target_amount=data.target_amount,
        current_amount=data.current_amount,
        deadline=data.deadline,
        category=data.category,
        monthly_contribution=data.monthly_contribution,
        percentage=pct,
        remaining=max(0.0, data.target_amount - data.current_amount),
    )


@router.post("/goals/{goal_id}/contribute", response_model=GoalResponse)
async def contribute_to_goal(
    goal_id: str,
    data: GoalContribute,
    user: dict = Depends(get_current_user),
):
    """Add contribution funds towards a savings goal and trigger milestone notifications."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM goals WHERE id = ? AND user_id = ?", (goal_id, user["id"]))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Goal not found.")

        old_cur = float(row["current_amount"])
        target = float(row["target_amount"])
        new_amt = old_cur + data.amount
        cursor.execute(
            "UPDATE goals SET current_amount = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
            (new_amt, goal_id),
        )

        old_pct = (old_cur / target * 100) if target > 0 else 0
        new_pct = min(100.0, (new_amt / target * 100)) if target > 0 else 0

        # Check milestone thresholds: 25%, 50%, 75%, 100%
        for milestone in (25, 50, 75, 100):
            if old_pct < milestone <= new_pct:
                nid = f"notif_{uuid.uuid4().hex[:10]}"
                cursor.execute(
                    """
                    INSERT INTO notifications (id, user_id, title, message, notification_type, is_read)
                    VALUES (?, ?, ?, ?, 'goal', 0)
                    """,
                    (
                        nid,
                        user["id"],
                        f"Milestone Reached: {row['title']}",
                        f"Congratulations! You have reached {milestone}% of your target for '{row['title']}'.",
                    ),
                )
                break

    return GoalResponse(
        id=row["id"],
        user_id=row["user_id"],
        title=row["title"],
        target_amount=target,
        current_amount=new_amt,
        deadline=row["deadline"],
        category=row["category"],
        monthly_contribution=float(row["monthly_contribution"] or 0.0),
        percentage=round(new_pct, 1),
        remaining=max(0.0, target - new_amt),
    )


@router.delete("/goals/{goal_id}")
async def delete_goal(goal_id: str, user: dict = Depends(get_current_user)):
    """Delete a goal."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM goals WHERE id = ? AND user_id = ?", (goal_id, user["id"]))
        if cursor.rowcount == 0:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Goal not found.")
    return {"success": True, "message": "Goal deleted successfully."}


# ==============================================================================
# 3. RECURRING TRANSACTIONS & BILLS AUTOMATION
# ==============================================================================

@router.get("/recurring", response_model=list[RecurringItemResponse])
async def get_recurring_items(
    days: int | None = Query(None, ge=1, le=365, description="Filter bills due within N days (e.g. 7, 30, 90)"),
    user: dict = Depends(get_current_user),
):
    """Get all recurring income/expense items with days until due."""
    user_id = user["id"]
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM recurring_items WHERE user_id = ?", (user_id,))
        count = cursor.fetchone()[0]

        if count == 0:
            today = datetime.now()
            d3 = (today + timedelta(days=3)).strftime("%Y-%m-%d")
            d7 = (today + timedelta(days=7)).strftime("%Y-%m-%d")
            d12 = (today + timedelta(days=12)).strftime("%Y-%m-%d")
            d20 = (today + timedelta(days=20)).strftime("%Y-%m-%d")

            defaults = [
                ("Apartment Rent", 22000.0, "Expense", "Rent", "Monthly", d3),
                ("High-Speed Fiber Internet", 1199.0, "Expense", "Bills", "Monthly", d7),
                ("Netflix & Spotify Family", 1049.0, "Expense", "Entertainment", "Monthly", d12),
                ("Mutual Fund SIP", 15000.0, "Expense", "Investments", "Monthly", d20),
            ]
            for title, amt, t_type, cat, freq, due in defaults:
                rid = f"rec_{uuid.uuid4().hex[:10]}"
                cursor.execute(
                    """
                    INSERT INTO recurring_items (id, user_id, title, amount, transaction_type, category, frequency, next_due_date)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (rid, user_id, title, amt, t_type, cat, freq, due),
                )
            conn.commit()

        cursor.execute(
            """
            SELECT id, user_id, title, amount, transaction_type, category, frequency, next_due_date, is_active
            FROM recurring_items
            WHERE user_id = ?
            ORDER BY next_due_date ASC
            """,
            (user_id,),
        )
        rows = cursor.fetchall()

    today = datetime.now().date()
    results = []
    for r in rows:
        try:
            due_date = datetime.strptime(r["next_due_date"], "%Y-%m-%d").date()
            days_until = (due_date - today).days
        except Exception:
            days_until = 0

        if days is not None and days_until > days:
            continue

        results.append(
            RecurringItemResponse(
                id=r["id"],
                user_id=r["user_id"],
                title=r["title"],
                amount=float(r["amount"]),
                transaction_type=r["transaction_type"],
                category=r["category"],
                frequency=r["frequency"],
                next_due_date=r["next_due_date"],
                is_active=bool(r["is_active"]),
                days_until_due=days_until,
            )
        )
    return results


@router.post("/recurring", response_model=RecurringItemResponse)
async def create_recurring_item(data: RecurringItemCreate, user: dict = Depends(get_current_user)):
    """Create a recurring bill or automated subscription."""
    rid = f"rec_{uuid.uuid4().hex[:10]}"
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO recurring_items (id, user_id, title, amount, transaction_type, category, frequency, next_due_date, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                rid,
                user["id"],
                data.title,
                data.amount,
                data.transaction_type,
                data.category,
                data.frequency,
                data.next_due_date,
                1 if data.is_active else 0,
            ),
        )
    today = datetime.now().date()
    try:
        due = datetime.strptime(data.next_due_date, "%Y-%m-%d").date()
        days_until = (due - today).days
    except Exception:
        days_until = 0

    return RecurringItemResponse(
        id=rid,
        user_id=user["id"],
        title=data.title,
        amount=data.amount,
        transaction_type=data.transaction_type,
        category=data.category,
        frequency=data.frequency,
        next_due_date=data.next_due_date,
        is_active=data.is_active,
        days_until_due=days_until,
    )


@router.post("/recurring/{item_id}/mark-paid")
async def mark_recurring_item_paid(item_id: str, user: dict = Depends(get_current_user)):
    """
    Automates recurring bill payments:
    1. Creates a corresponding transaction in the transactions ledger.
    2. Advances the next_due_date based on frequency (Weekly, Monthly, Quarterly, Yearly).
    """
    user_id = user["id"]
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM recurring_items WHERE id = ? AND user_id = ?", (item_id, user_id))
        item = cursor.fetchone()
        if not item:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recurring item not found.")

        # 1. Create transaction record
        tx_id = f"tx_{uuid.uuid4().hex[:12]}"
        today_str = datetime.now().strftime("%Y-%m-%d")
        cursor.execute(
            """
            INSERT INTO transactions (id, user_id, date, transaction_type, category, amount, payment_mode, location, notes)
            VALUES (?, ?, ?, ?, ?, ?, 'Net Banking', 'Online', ?)
            """,
            (
                tx_id,
                user_id,
                today_str,
                item["transaction_type"],
                item["category"],
                float(item["amount"]),
                f"Automated payment for {item['title']}",
            ),
        )

        # 2. Advance due date
        next_date = advance_due_date(item["next_due_date"], item["frequency"])
        cursor.execute(
            "UPDATE recurring_items SET next_due_date = ? WHERE id = ?",
            (next_date, item_id),
        )

    return {
        "success": True,
        "message": f"Bill '{item['title']}' marked as paid. Next due date updated to {next_date}.",
        "transaction_id": tx_id,
        "next_due_date": next_date,
    }


@router.delete("/recurring/{item_id}")
async def delete_recurring_item(item_id: str, user: dict = Depends(get_current_user)):
    """Delete a recurring item."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM recurring_items WHERE id = ? AND user_id = ?", (item_id, user["id"]))
        if cursor.rowcount == 0:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recurring item not found.")
    return {"success": True, "message": "Recurring item deleted successfully."}


# ==============================================================================
# 4. SMART INSIGHTS & AI FINANCIAL COACH
# ==============================================================================

@router.get("/smart/insights")
async def get_smart_insights(user: dict = Depends(get_current_user)):
    """
    Computes algorithmic spending insights and AI-like financial coaching recommendations.
    Fixes month calculation bug by filtering budget spending strictly to the budget's month and year.
    Returns all exceeded budgets with full details and action links.
    """
    user_id = user["id"]
    tips = []
    now = datetime.now()
    cur_month = now.month
    cur_year = now.year
    month_str = f"{cur_year:04d}-{cur_month:02d}"

    # Previous month string for MoM comparison
    prev_dt = now.replace(day=1) - timedelta(days=1)
    prev_month_str = f"{prev_dt.year:04d}-{prev_dt.month:02d}"

    with get_db() as conn:
        cursor = conn.cursor()

        # 1. Total summary & savings rate
        cursor.execute(
            """
            SELECT
                COALESCE(SUM(CASE WHEN transaction_type = 'Income' THEN amount ELSE 0 END), 0) as inc,
                COALESCE(SUM(CASE WHEN transaction_type = 'Expense' THEN amount ELSE 0 END), 0) as exp
            FROM transactions
            WHERE user_id = ?
            """,
            (user_id,),
        )
        tot_row = cursor.fetchone()
        tot_inc = float(tot_row["inc"])
        tot_exp = float(tot_row["exp"])

        if tot_inc > 0:
            rate = round(((tot_inc - tot_exp) / tot_inc) * 100, 1)
            if rate >= 30:
                tips.append({
                    "id": "rate_high",
                    "type": "positive",
                    "title": "Healthy Savings Rate",
                    "description": f"You are saving {rate}% of total income, well above the recommended 20% benchmark.",
                    "icon": "TrendingUp",
                    "action_url": "/dashboard",
                })
            elif rate < 10:
                tips.append({
                    "id": "rate_low",
                    "type": "warning",
                    "title": "Tight Cashflow Buffer",
                    "description": f"Savings rate is currently {rate}%. Consider reviewing non-essential discretionary expenses.",
                    "icon": "AlertTriangle",
                    "action_url": "/transactions",
                })

        # 2. Month-over-Month Category Trend (AI Coach Insight)
        cursor.execute(
            """
            SELECT category, SUM(amount) as amt
            FROM transactions
            WHERE user_id = ? AND transaction_type = 'Expense' AND strftime('%Y-%m', date) = ?
            GROUP BY category
            ORDER BY amt DESC
            LIMIT 1
            """,
            (user_id, month_str),
        )
        top_cur_row = cursor.fetchone()
        if top_cur_row:
            top_cat = top_cur_row["category"]
            cur_amt = float(top_cur_row["amt"])

            cursor.execute(
                """
                SELECT SUM(amount) as amt
                FROM transactions
                WHERE user_id = ? AND transaction_type = 'Expense' AND category = ? AND strftime('%Y-%m', date) = ?
                """,
                (user_id, top_cat, prev_month_str),
            )
            prev_row = cursor.fetchone()
            prev_amt = float(prev_row["amt"] or 0.0)

            if prev_amt > 0:
                change_pct = round(((cur_amt - prev_amt) / prev_amt) * 100, 1)
                if change_pct > 15:
                    tips.append({
                        "id": f"mom_increase_{top_cat}",
                        "type": "warning",
                        "title": f"{top_cat} Spending Jump",
                        "description": f"Your {top_cat} spending increased {change_pct}% compared with last month (₹{cur_amt:,.0f} vs ₹{prev_amt:,.0f}).",
                        "icon": "TrendingDown",
                        "action_url": f"/transactions?category={top_cat}",
                    })

        # 3. Exceeded & Near-Limit Budgets (FIX G: strict month/year filter and return ALL)
        cursor.execute(
            """
            SELECT id, category, monthly_limit, month, year FROM budgets
            WHERE user_id = ? AND month = ? AND year = ?
            ORDER BY monthly_limit DESC
            """,
            (user_id, cur_month, cur_year),
        )
        budgets = cursor.fetchall()
        for b in budgets:
            c_name = b["category"]
            c_lim = float(b["monthly_limit"])
            cursor.execute(
                """
                SELECT COALESCE(SUM(amount), 0) FROM transactions
                WHERE user_id = ? AND transaction_type = 'Expense' AND category = ?
                  AND strftime('%Y-%m', date) = ?
                """,
                (user_id, c_name, month_str),
            )
            spent = float(cursor.fetchone()[0])
            pct = round((spent / c_lim * 100), 1) if c_lim > 0 else 0
            rem = max(0.0, c_lim - spent)

            if spent > c_lim:
                over = spent - c_lim
                tips.append({
                    "id": f"budget_exceeded_{c_name}_{cur_year}_{cur_month}",
                    "type": "alert",
                    "title": f"Budget Alert: {c_name} Over Limit",
                    "description": f"Spent ₹{spent:,.0f} against your ₹{c_lim:,.0f} limit (+₹{over:,.0f}) in {now.strftime('%B %Y')}.",
                    "budget_name": f"{c_name} Monthly Budget",
                    "category": c_name,
                    "limit": c_lim,
                    "spent": round(spent, 2),
                    "remaining": 0.0,
                    "percentage": pct,
                    "month": cur_month,
                    "year": cur_year,
                    "icon": "AlertCircle",
                    "action_url": "/budgets",
                })
            elif pct >= 80:
                tips.append({
                    "id": f"budget_warning_{c_name}_{cur_year}_{cur_month}",
                    "type": "warning",
                    "title": f"Approaching Budget: {c_name}",
                    "description": f"You have utilized {pct}% of your ₹{c_lim:,.0f} budget for {c_name}. ₹{rem:,.0f} remaining.",
                    "budget_name": f"{c_name} Monthly Budget",
                    "category": c_name,
                    "limit": c_lim,
                    "spent": round(spent, 2),
                    "remaining": round(rem, 2),
                    "percentage": pct,
                    "month": cur_month,
                    "year": cur_year,
                    "icon": "AlertTriangle",
                    "action_url": "/budgets",
                })

        # 4. Top expense representation
        cursor.execute(
            """
            SELECT category, SUM(amount) as amt
            FROM transactions
            WHERE user_id = ? AND transaction_type = 'Expense'
            GROUP BY category
            ORDER BY amt DESC
            LIMIT 1
            """,
            (user_id,),
        )
        top_cat_all = cursor.fetchone()
        if top_cat_all and tot_exp > 0:
            cat_name = top_cat_all["category"]
            cat_amt = float(top_cat_all["amt"])
            pct_exp = round((cat_amt / tot_exp) * 100, 1)
            tips.append({
                "id": "top_category_overall",
                "type": "info",
                "title": f"Primary Expense: {cat_name}",
                "description": f"Your top expense category is {cat_name}, representing {pct_exp}% of all recorded spending (₹{cat_amt:,.0f}).",
                "icon": "PieChart",
                "action_url": f"/transactions?category={cat_name}",
            })

    if not tips:
        tips.append({
            "id": "welcome_coach",
            "type": "info",
            "title": "Welcome to FinFlow AI Coach",
            "description": "Log your recurring bills and daily expenses to generate real-time automated telemetry.",
            "icon": "Sparkles",
            "action_url": "/transactions",
        })

    return {"insights": tips}


# ==============================================================================
# 5. CASH FLOW FORECAST (Feature E)
# ==============================================================================

@router.get("/analytics/forecast")
async def get_cashflow_forecast(
    months: int = Query(3, ge=1, le=12),
    user: dict = Depends(get_current_user),
):
    """
    Project upcoming monthly cashflow from average income, average expenses,
    active budgets, and recurring scheduled bills.
    Clearly labeled as an algorithmic projection, not financial advice.
    """
    user_id = user["id"]
    with get_db() as conn:
        cursor = conn.cursor()

        # Overall summary to compute baseline net balance
        cursor.execute(
            """
            SELECT
                COALESCE(SUM(CASE WHEN transaction_type = 'Income' THEN amount ELSE 0 END), 0) -
                COALESCE(SUM(CASE WHEN transaction_type = 'Expense' THEN amount ELSE 0 END), 0) as net_balance
            FROM transactions
            WHERE user_id = ?
            """,
            (user_id,),
        )
        current_balance = float(cursor.fetchone()["net_balance"])

        # Monthly averages over previous months
        cursor.execute(
            """
            SELECT strftime('%Y-%m', date) as m,
                   SUM(CASE WHEN transaction_type = 'Income' THEN amount ELSE 0 END) as inc,
                   SUM(CASE WHEN transaction_type = 'Expense' THEN amount ELSE 0 END) as exp
            FROM transactions
            WHERE user_id = ?
            GROUP BY m
            ORDER BY m DESC
            LIMIT 6
            """,
            (user_id,),
        )
        history = cursor.fetchall()

        if history:
            avg_income = sum(float(h["inc"]) for h in history) / len(history)
            avg_expense = sum(float(h["exp"]) for h in history) / len(history)
        else:
            avg_income = 75000.0
            avg_expense = 45000.0

        # Recurring active monthly bills
        cursor.execute(
            """
            SELECT SUM(amount) as rec_total FROM recurring_items
            WHERE user_id = ? AND is_active = 1 AND transaction_type = 'Expense'
            """,
            (user_id,),
        )
        rec_row = cursor.fetchone()
        rec_expenses = float(rec_row["rec_total"] or 0.0)

    forecast_items = []
    running_balance = current_balance
    now = datetime.now()

    for i in range(1, months + 1):
        target_month_dt = now.replace(day=1) + timedelta(days=32 * i)
        label = target_month_dt.strftime("%b %Y")

        proj_inc = round(avg_income, 2)
        proj_exp = round(max(avg_expense, rec_expenses * 1.2), 2)
        net_change = proj_inc - proj_exp
        running_balance += net_change

        forecast_items.append({
            "month_label": label,
            "projected_income": proj_inc,
            "projected_expenses": proj_exp,
            "projected_recurring": round(rec_expenses, 2),
            "projected_net": round(net_change, 2),
            "projected_ending_balance": round(running_balance, 2),
        })

    return {
        "current_balance": round(current_balance, 2),
        "forecast_months": forecast_items,
        "assumptions": f"Based on rolling 6-month averages (₹{avg_income:,.0f} income, ₹{avg_expense:,.0f} expenses) and ₹{rec_expenses:,.0f} scheduled recurring bills.",
        "disclaimer": "Algorithmic projection for informational purposes only. Not financial advice.",
    }


# ==============================================================================
# 6. DAILY HEATMAP & ACTIVITY
# ==============================================================================

@router.get("/analytics/daily-heatmap")
async def get_daily_heatmap(
    days: int = Query(180, ge=30, le=365),
    user: dict = Depends(get_current_user),
):
    """Returns daily expense sums for GitHub-style activity calendar heatmap."""
    user_id = user["id"]
    start_date = (datetime.now() - timedelta(days=days)).strftime("%Y-%m-%d")

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT date, SUM(amount) as total_amount, COUNT(*) as count
            FROM transactions
            WHERE user_id = ? AND transaction_type = 'Expense' AND date >= ?
            GROUP BY date
            ORDER BY date ASC
            """,
            (user_id, start_date),
        )
        rows = cursor.fetchall()

    daily_map = {r["date"]: {"amount": float(r["total_amount"]), "count": int(r["count"])} for r in rows}
    max_amt = max([v["amount"] for v in daily_map.values()], default=1.0)
    if max_amt == 0:
        max_amt = 1.0

    calendar_data = []
    curr = datetime.now() - timedelta(days=days)
    end = datetime.now()

    while curr <= end:
        d_str = curr.strftime("%Y-%m-%d")
        entry = daily_map.get(d_str, {"amount": 0.0, "count": 0})
        amt = entry["amount"]

        if amt == 0:
            level = 0
        elif amt < max_amt * 0.2:
            level = 1
        elif amt < max_amt * 0.5:
            level = 2
        elif amt < max_amt * 0.8:
            level = 3
        else:
            level = 4

        calendar_data.append({
            "date": d_str,
            "amount": amt,
            "count": entry["count"],
            "level": level,
        })
        curr += timedelta(days=1)

    return {"heatmap": calendar_data, "max_amount": max_amt}


# ==============================================================================
# 7. TAGS MANAGEMENT (Feature B)
# ==============================================================================

@router.get("/tags", response_model=list[TagResponse])
async def get_tags(user: dict = Depends(get_current_user)):
    """Get all tags created by the user."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM tags WHERE user_id = ? ORDER BY name ASC", (user["id"],))
        rows = cursor.fetchall()
    return [
        TagResponse(
            id=r["id"],
            user_id=r["user_id"],
            name=r["name"],
            color=r["color"] or "indigo",
            created_at=r["created_at"] or "",
        )
        for r in rows
    ]


@router.post("/tags", response_model=TagResponse)
async def create_tag(data: TagCreate, user: dict = Depends(get_current_user)):
    """Create a new transaction tag."""
    tag_id = f"tag_{uuid.uuid4().hex[:10]}"
    with get_db() as conn:
        cursor = conn.cursor()
        try:
            cursor.execute(
                "INSERT INTO tags (id, user_id, name, color) VALUES (?, ?, ?, ?)",
                (tag_id, user["id"], data.name.strip(), data.color),
            )
        except Exception as exc:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Tag '{data.name}' already exists.") from exc
    return TagResponse(
        id=tag_id,
        user_id=user["id"],
        name=data.name.strip(),
        color=data.color,
        created_at=datetime.now().isoformat(),
    )


@router.delete("/tags/{tag_id}")
async def delete_tag(tag_id: str, user: dict = Depends(get_current_user)):
    """Delete a tag."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM tags WHERE id = ? AND user_id = ?", (tag_id, user["id"]))
        if cursor.rowcount == 0:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tag not found.")
    return {"success": True, "message": "Tag deleted."}


# ==============================================================================
# 8. SAVED FILTERS & VIEWS (Feature C)
# ==============================================================================

@router.get("/saved-filters", response_model=list[SavedFilterResponse])
async def get_saved_filters(user: dict = Depends(get_current_user)):
    """Get all saved custom transaction filter views for user."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM saved_filters WHERE user_id = ? ORDER BY created_at DESC", (user["id"],))
        rows = cursor.fetchall()
    return [
        SavedFilterResponse(
            id=r["id"],
            user_id=r["user_id"],
            name=r["name"],
            criteria_json=r["criteria_json"],
            created_at=r["created_at"] or "",
        )
        for r in rows
    ]


@router.post("/saved-filters", response_model=SavedFilterResponse)
async def create_saved_filter(data: SavedFilterCreate, user: dict = Depends(get_current_user)):
    """Save a frequently used filter configuration."""
    fid = f"filter_{uuid.uuid4().hex[:10]}"
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO saved_filters (id, user_id, name, criteria_json) VALUES (?, ?, ?, ?)",
            (fid, user["id"], data.name.strip(), data.criteria_json),
        )
    return SavedFilterResponse(
        id=fid,
        user_id=user["id"],
        name=data.name.strip(),
        criteria_json=data.criteria_json,
        created_at=datetime.now().isoformat(),
    )


@router.delete("/saved-filters/{filter_id}")
async def delete_saved_filter(filter_id: str, user: dict = Depends(get_current_user)):
    """Delete a saved filter."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM saved_filters WHERE id = ? AND user_id = ?", (filter_id, user["id"]))
        if cursor.rowcount == 0:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Saved filter not found.")
    return {"success": True, "message": "Saved filter deleted."}


# ==============================================================================
# 9. CATEGORY RULES AUTO-CATEGORIZATION (Feature G)
# ==============================================================================

@router.get("/category-rules", response_model=list[CategoryRuleResponse])
async def get_category_rules(user: dict = Depends(get_current_user)):
    """Get all auto-categorization rules owned by the user."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT * FROM category_rules WHERE user_id = ? ORDER BY priority DESC, created_at DESC",
            (user["id"],),
        )
        rows = cursor.fetchall()
    return [
        CategoryRuleResponse(
            id=r["id"],
            user_id=r["user_id"],
            keyword=r["keyword"],
            category=r["category"],
            priority=r["priority"],
            is_active=bool(r["is_active"]),
            created_at=r["created_at"] or "",
        )
        for r in rows
    ]


@router.post("/category-rules", response_model=CategoryRuleResponse)
async def create_category_rule(data: CategoryRuleCreate, user: dict = Depends(get_current_user)):
    """Create an auto-categorization rule (e.g. notes contains 'swiggy' -> Food)."""
    crid = f"rule_{uuid.uuid4().hex[:10]}"
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO category_rules (id, user_id, keyword, category, priority, is_active)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (crid, user["id"], data.keyword.strip(), data.category.strip(), data.priority, 1 if data.is_active else 0),
        )
    return CategoryRuleResponse(
        id=crid,
        user_id=user["id"],
        keyword=data.keyword.strip(),
        category=data.category.strip(),
        priority=data.priority,
        is_active=data.is_active,
        created_at=datetime.now().isoformat(),
    )


@router.delete("/category-rules/{rule_id}")
async def delete_category_rule(rule_id: str, user: dict = Depends(get_current_user)):
    """Delete a categorization rule."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM category_rules WHERE id = ? AND user_id = ?", (rule_id, user["id"]))
        if cursor.rowcount == 0:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rule not found.")
    return {"success": True, "message": "Category rule deleted."}


# ==============================================================================
# 10. NOTIFICATIONS
# ==============================================================================

@router.get("/notifications", response_model=list[NotificationResponse])
async def get_notifications(user: dict = Depends(get_current_user)):
    """Fetch user notifications (seeds starter reminders if none)."""
    user_id = user["id"]
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM notifications WHERE user_id = ?", (user_id,))
        count = cursor.fetchone()[0]

        if count == 0:
            defaults = [
                ("Upcoming Rent Bill", "Apartment rent of ₹22,000 is due in 3 days.", "recurring"),
                ("ML Model Evaluated", "Random Forest classifier evaluated with held-out test accuracy: 95.83% on 240 unseen rows.", "info"),
                ("Budget Alert", "Food & Dining reached 82% of monthly target.", "budget"),
                ("Savings Milestone", "Emergency Fund has reached 63% of your target goal!", "goal"),
            ]
            for title, msg, ntype in defaults:
                nid = f"notif_{uuid.uuid4().hex[:10]}"
                cursor.execute(
                    """
                    INSERT INTO notifications (id, user_id, title, message, notification_type, is_read)
                    VALUES (?, ?, ?, ?, ?, 0)
                    """,
                    (nid, user_id, title, msg, ntype),
                )
            conn.commit()

        cursor.execute(
            """
            SELECT id, user_id, title, message, notification_type, is_read, created_at
            FROM notifications
            WHERE user_id = ?
            ORDER BY created_at DESC
            LIMIT 30
            """,
            (user_id,),
        )
        rows = cursor.fetchall()

    return [
        NotificationResponse(
            id=r["id"],
            user_id=r["user_id"],
            title=r["title"],
            message=r["message"],
            notification_type=r["notification_type"],
            is_read=bool(r["is_read"]),
            created_at=r["created_at"] or "",
        )
        for r in rows
    ]


@router.post("/notifications/{notif_id}/read")
async def mark_notification_read(notif_id: str, user: dict = Depends(get_current_user)):
    """Mark a notification as read."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?",
            (notif_id, user["id"]),
        )
    return {"success": True, "message": "Notification marked read."}


@router.post("/notifications/read-all")
async def mark_all_notifications_read(user: dict = Depends(get_current_user)):
    """Mark all notifications as read."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("UPDATE notifications SET is_read = 1 WHERE user_id = ?", (user["id"],))
    return {"success": True, "message": "All notifications marked read."}


@router.delete("/notifications/clear-all")
@router.delete("/notifications")
async def clear_all_notifications(user: dict = Depends(get_current_user)):
    """Clear all notifications for user."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM notifications WHERE user_id = ?", (user["id"],))
    return {"success": True, "message": "All notifications cleared."}


# ==============================================================================
# 11. USER PROFILE & PREFERENCES CENTER (Section 4)
# ==============================================================================

@router.get("/user/profile", response_model=ProfileResponse)
async def get_user_profile(user: dict = Depends(get_current_user)):
    """Get current user settings and profile."""
    user_id = user["id"]
    email = user.get("email", "demo@finflow.app")

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM profiles WHERE id = ?", (user_id,))
        row = cursor.fetchone()

        if not row:
            cursor.execute(
                """
                INSERT INTO profiles (id, email, full_name, currency, theme_preference, accent_color)
                VALUES (?, ?, 'Alex Mercer', 'INR', 'dark', 'indigo')
                """,
                (user_id, email),
            )
            return ProfileResponse(
                id=user_id,
                email=email,
                full_name="Alex Mercer",
                currency="INR",
                theme_preference="dark",
                accent_color="indigo",
            )

    return ProfileResponse(
        id=row["id"],
        email=row["email"] or email,
        full_name=row["full_name"],
        avatar_url=row["avatar_url"],
        currency=row["currency"] or "INR",
        theme_preference=row["theme_preference"] or "dark",
        accent_color=row["accent_color"] or "indigo",
    )


@router.put("/user/profile", response_model=ProfileResponse)
async def update_user_profile(
    data: ProfileUpdate,
    user: dict = Depends(get_current_user),
):
    """Update profile details (name, avatar, currency, theme, accent)."""
    user_id = user["id"]
    email = user.get("email", "demo@finflow.app")

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM profiles WHERE id = ?", (user_id,))
        existing = cursor.fetchone()

        if existing:
            full_name = data.full_name if data.full_name is not None else existing["full_name"]
            avatar_url = data.avatar_url if data.avatar_url is not None else existing["avatar_url"]
            currency = data.currency if data.currency is not None else existing["currency"]
            theme = data.theme_preference if data.theme_preference is not None else existing["theme_preference"]
            accent = data.accent_color if data.accent_color is not None else existing["accent_color"]

            cursor.execute(
                """
                UPDATE profiles
                SET full_name = ?, avatar_url = ?, currency = ?, theme_preference = ?, accent_color = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
                """,
                (full_name, avatar_url, currency, theme, accent, user_id),
            )
        else:
            full_name = data.full_name or "Alex Mercer"
            avatar_url = data.avatar_url
            currency = data.currency or "INR"
            theme = data.theme_preference or "dark"
            accent = data.accent_color or "indigo"
            cursor.execute(
                """
                INSERT INTO profiles (id, email, full_name, avatar_url, currency, theme_preference, accent_color)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (user_id, email, full_name, avatar_url, currency, theme, accent),
            )

        # Also sync common preference fields to user_preferences table
        pref_updates = []
        pref_params = []
        if data.currency is not None:
            pref_updates.append("currency = ?")
            pref_params.append(data.currency)
        if data.theme_preference is not None:
            pref_updates.append("theme_preference = ?")
            pref_params.append(data.theme_preference)
        if data.accent_color is not None:
            pref_updates.append("accent_color = ?")
            pref_params.append(data.accent_color)
        if pref_updates:
            pref_params.append(user_id)
            cursor.execute(f"UPDATE user_preferences SET {', '.join(pref_updates)}, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?", pref_params)

    return ProfileResponse(
        id=user_id,
        email=email,
        full_name=full_name,
        avatar_url=avatar_url,
        currency=currency,
        theme_preference=theme,
        accent_color=accent,
    )


def _normalize_preference_dict(d: dict, user_id: str) -> dict:
    """Normalizes raw DB preference row into full UserPreferencesResponse schema."""
    out = dict(d)
    out["user_id"] = user_id
    if not out.get("id"):
        out["id"] = f"pref_{user_id[:8]}"

    # Synchronize density
    if "ui_density" in out and out["ui_density"]:
        out["density"] = out["ui_density"]
    else:
        out["ui_density"] = out.get("density") or "comfortable"
        out["density"] = out["ui_density"]

    # Synchronize start_day_of_week
    if "start_day_of_week" in out and out["start_day_of_week"]:
        out["week_start_day"] = out["start_day_of_week"]
    else:
        out["start_day_of_week"] = out.get("week_start_day") or "Monday"
        out["week_start_day"] = out["start_day_of_week"]

    # Normalize all boolean preferences
    bool_pairs = [
        ("enable_confetti", "confetti_enabled", True),
        ("enable_onboarding_tour", "onboarding_tour_enabled", True),
        ("enable_compact_tables", "compact_tables", False),
        ("notifications_enabled", "master_notifications", True),
        ("budget_alerts_enabled", "budget_alerts", True),
        ("recurring_bill_reminders_enabled", "recurring_reminders", True),
        ("goal_milestone_notifications_enabled", "milestone_alerts", True),
        ("weekly_summary_enabled", "weekly_summary", True),
        ("quiet_hours_enabled", "quiet_hours_enabled", False),
    ]
    for p1, p2, default_val in bool_pairs:
        raw_val = out.get(p1) if p1 in out and out.get(p1) is not None else out.get(p2)
        val = bool(raw_val) if raw_val is not None else default_val
        out[p1] = val
        out[p2] = val

    return out


@router.get("/user/preferences", response_model=UserPreferencesResponse)
async def get_user_preferences(user: dict = Depends(get_current_user)):
    """Retrieve full user control preferences."""
    user_id = user["id"]
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM user_preferences WHERE user_id = ?", (user_id,))
        row = cursor.fetchone()
        if not row:
            pref_id = f"pref_{uuid.uuid4().hex[:12]}"
            cursor.execute("INSERT OR IGNORE INTO user_preferences (id, user_id) VALUES (?, ?)", (pref_id, user_id))
            cursor.execute("SELECT * FROM user_preferences WHERE user_id = ?", (user_id,))
            row = cursor.fetchone()

    d = _normalize_preference_dict(dict(row), user_id)
    return UserPreferencesResponse(**d)


@router.put("/user/preferences", response_model=UserPreferencesResponse)
async def update_user_preferences(
    data: UserPreferencesUpdate,
    user: dict = Depends(get_current_user),
):
    """Update user preferences and financial defaults."""
    user_id = user["id"]
    dump = data.model_dump(exclude_unset=True)

    # Reconcile aliases for database update
    if "ui_density" in dump:
        dump["density"] = dump["ui_density"]
    elif "density" in dump:
        dump["ui_density"] = dump["density"]

    if "start_day_of_week" in dump:
        dump["week_start_day"] = dump["start_day_of_week"]
    elif "week_start_day" in dump:
        dump["start_day_of_week"] = dump["week_start_day"]

    for p1, p2 in [
        ("enable_confetti", "confetti_enabled"),
        ("enable_onboarding_tour", "onboarding_tour_enabled"),
        ("enable_compact_tables", "compact_tables"),
        ("notifications_enabled", "master_notifications"),
        ("budget_alerts_enabled", "budget_alerts"),
        ("recurring_bill_reminders_enabled", "recurring_reminders"),
        ("goal_milestone_notifications_enabled", "milestone_alerts"),
        ("weekly_summary_enabled", "weekly_summary"),
    ]:
        if p1 in dump:
            dump[p2] = dump[p1]
        elif p2 in dump:
            dump[p1] = dump[p2]

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM user_preferences WHERE user_id = ?", (user_id,))
        existing = cursor.fetchone()
        if not existing:
            pref_id = f"pref_{uuid.uuid4().hex[:12]}"
            cursor.execute("INSERT OR IGNORE INTO user_preferences (id, user_id) VALUES (?, ?)", (pref_id, user_id))

        if dump:
            updates = []
            params = []
            for k, v in dump.items():
                if isinstance(v, bool):
                    v = 1 if v else 0
                updates.append(f"{k} = ?")
                params.append(v)
            params.append(user_id)
            cursor.execute(
                f"UPDATE user_preferences SET {', '.join(updates)}, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?",
                params,
            )

            # Also sync common preference fields to profiles table
            prof_updates = []
            prof_params = []
            if "currency" in dump:
                prof_updates.append("currency = ?")
                prof_params.append(dump["currency"])
            if "theme_preference" in dump:
                prof_updates.append("theme_preference = ?")
                prof_params.append(dump["theme_preference"])
            if "accent_color" in dump:
                prof_updates.append("accent_color = ?")
                prof_params.append(dump["accent_color"])
            if prof_updates:
                prof_params.append(user_id)
                cursor.execute(
                    f"UPDATE profiles SET {', '.join(prof_updates)}, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                    prof_params,
                )

        cursor.execute("SELECT * FROM user_preferences WHERE user_id = ?", (user_id,))
        row = cursor.fetchone()

    d = _normalize_preference_dict(dict(row), user_id)
    return UserPreferencesResponse(**d)


@router.post("/user/reset-demo")
async def reset_demo_data(
    confirm: bool = Query(False),
    confirmation: str | None = Query(None),
    payload: dict | None = None,
    user: dict = Depends(get_current_user),
):
    """Resets demo data for authenticated demo user account and reseeds starter records."""
    is_confirmed = False
    if payload:
        if payload.get("confirmation") == "RESET DEMO DATA" or payload.get("confirm"):
            is_confirmed = True
    elif confirmation == "RESET DEMO DATA" or confirm:
        is_confirmed = True

    if not is_confirmed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Confirmation required. Pass confirmation='RESET DEMO DATA' to reset demo data.",
        )

    user_id = user["id"]
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM transactions WHERE user_id = ?", (user_id,))
        cursor.execute("DELETE FROM budgets WHERE user_id = ?", (user_id,))
        cursor.execute("DELETE FROM goals WHERE user_id = ?", (user_id,))
        cursor.execute("DELETE FROM recurring_items WHERE user_id = ?", (user_id,))
        cursor.execute("DELETE FROM prediction_history WHERE user_id = ?", (user_id,))
        cursor.execute("DELETE FROM notifications WHERE user_id = ?", (user_id,))

    # Automatically reseed standard demo transactions so user has working data
    from ..services.transactions import seed_sample_data
    seed_sample_data(user_id)

    return {"success": True, "message": "Demo data has been successfully reset and starter data re-seeded."}


@router.delete("/user/account")
async def delete_user_account(
    payload: AccountDeleteRequest | None = None,
    confirm: bool = Query(False),
    confirmation: str | None = Query(None),
    user: dict = Depends(get_current_user),
):
    """
    Permanently deletes all data associated with the user account.
    Requires two confirmations:
    1. confirmation phrase: 'DELETE MY ACCOUNT'
    2. permanent confirmation: confirm_permanent=True (or confirm=True).
    """
    is_confirmed = False
    if payload:
        if payload.confirmation == "DELETE MY ACCOUNT" and payload.confirm_permanent:
            is_confirmed = True
    elif confirmation == "DELETE MY ACCOUNT" and confirm:
        is_confirmed = True

    if not is_confirmed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Two-step confirmation required. Provide confirmation='DELETE MY ACCOUNT' and confirm_permanent=True.",
        )

    user_id = user["id"]
    logger.info("Permanently deleting account for user_id=%s", user_id)
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM transactions WHERE user_id = ?", (user_id,))
        cursor.execute("DELETE FROM budgets WHERE user_id = ?", (user_id,))
        cursor.execute("DELETE FROM goals WHERE user_id = ?", (user_id,))
        cursor.execute("DELETE FROM recurring_items WHERE user_id = ?", (user_id,))
        cursor.execute("DELETE FROM prediction_history WHERE user_id = ?", (user_id,))
        cursor.execute("DELETE FROM prediction_feedback WHERE user_id = ?", (user_id,))
        cursor.execute("DELETE FROM tags WHERE user_id = ?", (user_id,))
        cursor.execute("DELETE FROM saved_filters WHERE user_id = ?", (user_id,))
        cursor.execute("DELETE FROM category_rules WHERE user_id = ?", (user_id,))
        cursor.execute("DELETE FROM notifications WHERE user_id = ?", (user_id,))
        cursor.execute("DELETE FROM user_preferences WHERE user_id = ?", (user_id,))
        cursor.execute("DELETE FROM profiles WHERE id = ?", (user_id,))

    return {"success": True, "message": "Account and all associated records have been permanently deleted."}


@router.get("/user/export-json")
@router.get("/export/all/json")
async def export_all_user_data_json(user: dict = Depends(get_current_user)):
    """Exports entire user financial database in comprehensive JSON format for portability (excludes secrets)."""
    user_id = user["id"]
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id, email, full_name, avatar_url, currency, theme_preference, accent_color, created_at, updated_at FROM profiles WHERE id = ?", (user_id,))
        profile_row = cursor.fetchone()
        profile = dict(profile_row) if profile_row else {}

        cursor.execute("SELECT * FROM user_preferences WHERE user_id = ?", (user_id,))
        pref_row = cursor.fetchone()
        pref = _normalize_preference_dict(dict(pref_row), user_id) if pref_row else {}

        cursor.execute("SELECT * FROM transactions WHERE user_id = ? ORDER BY date DESC", (user_id,))
        txs = [dict(r) for r in cursor.fetchall()]

        cursor.execute("SELECT * FROM budgets WHERE user_id = ?", (user_id,))
        budgets = [dict(r) for r in cursor.fetchall()]

        cursor.execute("SELECT * FROM goals WHERE user_id = ?", (user_id,))
        goals = [dict(r) for r in cursor.fetchall()]

        cursor.execute("SELECT * FROM recurring_items WHERE user_id = ?", (user_id,))
        rec = [dict(r) for r in cursor.fetchall()]

        cursor.execute("SELECT * FROM tags WHERE user_id = ?", (user_id,))
        tags = [dict(r) for r in cursor.fetchall()]

    return {
        "schema_version": "1.0.0",
        "generated_at": datetime.now().isoformat(),
        "user_id": user_id,
        "profile": profile,
        "preferences": pref,
        "transactions": txs,
        "budgets": budgets,
        "goals": goals,
        "recurring_items": rec,
        "tags": tags,
    }


@router.get("/system/info", response_model=SystemInfoResponse)
async def get_system_info():
    """Returns application, API, ML model, build, and support metadata without exposing any secrets."""
    from ..config import ENVIRONMENT
    return SystemInfoResponse(
        app_name="FinFlow",
        version="2.4.0",
        environment=ENVIRONMENT,
        status="healthy",
        api_version="v1",
        build_date="2026-11-09",
        held_out_model_accuracy="Held-out test accuracy: 95.83% on 240 unseen rows.",
        model_algorithm="RandomForestClassifier (100 estimators)",
        model_features_count=18,
        support_email="support@finflow.app",
        documentation_url="/docs",
        terms_url="/terms",
        privacy_url="/privacy",
    )


@router.get("/reports/printable", response_model=PrintableReportResponse)
async def get_printable_report(user: dict = Depends(get_current_user)):
    """Builds a comprehensive printable financial report payload."""
    user_id = user["id"]
    now = datetime.now()
    month_str = f"{now.year:04d}-{now.month:02d}"

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT currency FROM user_preferences WHERE user_id = ?", (user_id,))
        pref_row = cursor.fetchone()
        currency = pref_row["currency"] if pref_row and pref_row["currency"] else "INR"

        cursor.execute(
            """
            SELECT
                COALESCE(SUM(CASE WHEN transaction_type = 'Income' THEN amount ELSE 0 END), 0) as inc,
                COALESCE(SUM(CASE WHEN transaction_type = 'Expense' THEN amount ELSE 0 END), 0) as exp,
                COUNT(*) as count
            FROM transactions
            WHERE user_id = ?
            """,
            (user_id,),
        )
        tot_row = cursor.fetchone()
        tot_inc = float(tot_row["inc"])
        tot_exp = float(tot_row["exp"])
        savings = tot_inc - tot_exp
        rate = round((savings / tot_inc) * 100, 1) if tot_inc > 0 else 0.0

        summary = SummaryResponse(
            total_income=round(tot_inc, 2),
            total_expense=round(tot_exp, 2),
            net_savings=round(savings, 2),
            savings_rate=rate,
            transaction_count=int(tot_row["count"]),
        )

        # Category breakdown
        cursor.execute(
            """
            SELECT category, SUM(amount) as amt, COUNT(*) as cnt
            FROM transactions
            WHERE user_id = ? AND transaction_type = 'Expense'
            GROUP BY category
            ORDER BY amt DESC
            LIMIT 10
            """,
            (user_id,),
        )
        cat_rows = cursor.fetchall()
        cat_items = [
            CategoryAnalyticsItem(
                category=r["category"],
                amount=round(float(r["amt"]), 2),
                percentage=round((float(r["amt"]) / tot_exp) * 100, 1) if tot_exp > 0 else 0.0,
                count=int(r["cnt"]),
            )
            for r in cat_rows
        ]

        # Monthly trends (last 6 months)
        cursor.execute(
            """
            SELECT
                strftime('%Y-%m', date) as m,
                COALESCE(SUM(CASE WHEN transaction_type = 'Income' THEN amount ELSE 0 END), 0) as inc,
                COALESCE(SUM(CASE WHEN transaction_type = 'Expense' THEN amount ELSE 0 END), 0) as exp
            FROM transactions
            WHERE user_id = ?
            GROUP BY strftime('%Y-%m', date)
            ORDER BY m DESC
            LIMIT 6
            """,
            (user_id,),
        )
        month_rows = cursor.fetchall()
        monthly_items = [
            MonthlyAnalyticsItem(
                month=r["m"],
                income=round(float(r["inc"]), 2),
                expense=round(float(r["exp"]), 2),
                net=round(float(r["inc"]) - float(r["exp"]), 2),
            )
            for r in reversed(month_rows)
        ]

        # Active budgets
        cursor.execute(
            "SELECT * FROM budgets WHERE user_id = ? AND month = ? AND year = ?",
            (user_id, now.month, now.year),
        )
        budget_rows = cursor.fetchall()
        budgets_list = []
        for b in budget_rows:
            limit = float(b["monthly_limit"])
            cursor.execute(
                """
                SELECT COALESCE(SUM(amount), 0) FROM transactions
                WHERE user_id = ? AND transaction_type = 'Expense' AND category = ? AND strftime('%Y-%m', date) = ?
                """,
                (user_id, b["category"], month_str),
            )
            spent = float(cursor.fetchone()[0])
            budgets_list.append(
                BudgetResponse(
                    id=b["id"],
                    user_id=b["user_id"],
                    category=b["category"],
                    monthly_limit=limit,
                    month=b["month"],
                    year=b["year"],
                    spent=round(spent, 2),
                    remaining=round(max(0.0, limit - spent), 2),
                    percentage=round((spent / limit) * 100, 1) if limit > 0 else 0.0,
                    is_exceeded=spent > limit,
                )
            )

        # Upcoming bills
        cursor.execute("SELECT * FROM recurring_items WHERE user_id = ? AND is_active = 1 ORDER BY next_due_date ASC LIMIT 5", (user_id,))
        bills_rows = cursor.fetchall()
        bills_list = []
        today = now.date()
        for r in bills_rows:
            try:
                due = datetime.strptime(r["next_due_date"], "%Y-%m-%d").date()
                days_until = (due - today).days
            except Exception:
                days_until = 0
            bills_list.append(
                RecurringItemResponse(
                    id=r["id"],
                    user_id=r["user_id"],
                    title=r["title"],
                    amount=float(r["amount"]),
                    transaction_type=r["transaction_type"],
                    category=r["category"],
                    frequency=r["frequency"],
                    next_due_date=r["next_due_date"],
                    is_active=bool(r["is_active"]),
                    days_until_due=days_until,
                )
            )

        # Goals progress
        cursor.execute("SELECT * FROM goals WHERE user_id = ? ORDER BY created_at DESC", (user_id,))
        goals_rows = cursor.fetchall()
        goals_list = []
        for g in goals_rows:
            target = float(g["target_amount"])
            cur = float(g["current_amount"])
            pct = round((cur / target) * 100, 1) if target > 0 else 0.0
            goals_list.append(
                GoalResponse(
                    id=g["id"],
                    user_id=g["user_id"],
                    title=g["title"],
                    target_amount=target,
                    current_amount=cur,
                    deadline=g["deadline"],
                    category=g["category"],
                    monthly_contribution=float(g.get("monthly_contribution", 0) or 0),
                    percentage=pct,
                    remaining=round(max(0.0, target - cur), 2),
                )
            )

    return PrintableReportResponse(
        report_title="FinFlow Personal Financial Report",
        generated_at=now.isoformat(),
        user_id=user_id,
        currency=currency,
        summary=summary,
        category_breakdown=cat_items,
        monthly_trends=monthly_items,
        active_budgets=budgets_list,
        upcoming_bills=bills_list,
        goals_progress=goals_list,
        disclaimer="This document is an algorithmic financial summary for personal record-keeping only.",
    )
