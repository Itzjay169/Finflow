import uuid
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException

from ..auth import get_current_user
from ..database import get_db
from ..models import (
    BudgetCreate,
    BudgetResponse,
    GoalContribute,
    GoalCreate,
    GoalResponse,
    NotificationResponse,
    ProfileResponse,
    ProfileUpdate,
    RecurringItemCreate,
    RecurringItemResponse,
)

router = APIRouter(prefix="/api", tags=["Smart Features & Budgets"])


# ==============================================================================
# 1. BUDGETS
# ==============================================================================

@router.get("/budgets", response_model=list[BudgetResponse])
async def get_budgets(
    month: int | None = None,
    year: int | None = None,
    user: dict = Depends(get_current_user),
):
    """Get all budgets for user with current month spending calculations."""
    user_id = user["id"]
    now = datetime.now()
    cur_month = month or now.month
    cur_year = year or now.year

    # Format month pattern for SQLite date filtering: YYYY-MM
    month_str = f"{cur_year:04d}-{cur_month:02d}"

    with get_db() as conn:
        cursor = conn.cursor()

        # Check if user has budgets, if not seed default starter budgets
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

        # Fetch budgets
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

        # Fetch actual expenses for these categories in the same month
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

        # Get current spent
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
async def delete_budget(
    budget_id: str,
    user: dict = Depends(get_current_user),
):
    """Delete a budget item."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "DELETE FROM budgets WHERE id = ? AND user_id = ?",
            (budget_id, user["id"]),
        )
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Budget not found")
    return {"message": "Budget deleted successfully"}


# ==============================================================================
# 2. SAVINGS GOALS
# ==============================================================================

@router.get("/goals", response_model=list[GoalResponse])
async def get_goals(user: dict = Depends(get_current_user)):
    """Get all savings goals with progress and remaining calculations."""
    user_id = user["id"]
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM goals WHERE user_id = ?", (user_id,))
        count = cursor.fetchone()[0]

        if count == 0:
            # Seed default starter savings goals
            default_goals = [
                ("Emergency Fund (6 Months)", 150000.0, 95000.0, "2026-12-31", "Safety"),
                ("Europe Vacation 2027", 120000.0, 48000.0, "2027-05-01", "Travel"),
                ("New MacBook Pro M4", 175000.0, 130000.0, "2026-11-15", "Tech"),
                ("Down Payment for Car", 250000.0, 85000.0, "2027-08-01", "Vehicle"),
            ]
            for title, target, cur, deadline, cat in default_goals:
                gid = f"g_{uuid.uuid4().hex[:10]}"
                cursor.execute(
                    """
                    INSERT INTO goals (id, user_id, title, target_amount, current_amount, deadline, category)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    """,
                    (gid, user_id, title, target, cur, deadline, cat),
                )
            conn.commit()

        cursor.execute(
            """
            SELECT id, user_id, title, target_amount, current_amount, deadline, category
            FROM goals
            WHERE user_id = ?
            ORDER BY created_at DESC
            """,
            (user_id,),
        )
        rows = cursor.fetchall()

    results = []
    for r in rows:
        target = float(r["target_amount"])
        cur = float(r["current_amount"])
        pct = round(min(100.0, (cur / target) * 100), 1) if target > 0 else 0.0
        rem = max(0.0, target - cur)
        results.append(
            GoalResponse(
                id=r["id"],
                user_id=r["user_id"],
                title=r["title"],
                target_amount=target,
                current_amount=cur,
                deadline=r["deadline"],
                category=r["category"],
                percentage=pct,
                remaining=round(rem, 2),
            )
        )
    return results


@router.post("/goals", response_model=GoalResponse)
async def create_goal(data: GoalCreate, user: dict = Depends(get_current_user)):
    """Create a new savings goal."""
    gid = f"g_{uuid.uuid4().hex[:10]}"
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO goals (id, user_id, title, target_amount, current_amount, deadline, category)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                gid,
                user["id"],
                data.title,
                data.target_amount,
                data.current_amount,
                data.deadline,
                data.category,
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
        percentage=pct,
        remaining=max(0.0, data.target_amount - data.current_amount),
    )


@router.post("/goals/{goal_id}/contribute", response_model=GoalResponse)
async def contribute_to_goal(
    goal_id: str,
    data: GoalContribute,
    user: dict = Depends(get_current_user),
):
    """Add contribution funds towards a savings goal."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT * FROM goals WHERE id = ? AND user_id = ?",
            (goal_id, user["id"]),
        )
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Goal not found")

        new_amt = float(row["current_amount"]) + data.amount
        cursor.execute(
            "UPDATE goals SET current_amount = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
            (new_amt, goal_id),
        )

        target = float(row["target_amount"])
        pct = round(min(100.0, (new_amt / target) * 100), 1) if target > 0 else 0.0

    return GoalResponse(
        id=row["id"],
        user_id=row["user_id"],
        title=row["title"],
        target_amount=target,
        current_amount=new_amt,
        deadline=row["deadline"],
        category=row["category"],
        percentage=pct,
        remaining=max(0.0, target - new_amt),
    )


@router.delete("/goals/{goal_id}")
async def delete_goal(goal_id: str, user: dict = Depends(get_current_user)):
    """Delete a goal."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "DELETE FROM goals WHERE id = ? AND user_id = ?",
            (goal_id, user["id"]),
        )
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Goal not found")
    return {"message": "Goal deleted successfully"}


# ==============================================================================
# 3. RECURRING TRANSACTIONS & BILLS
# ==============================================================================

@router.get("/recurring", response_model=list[RecurringItemResponse])
async def get_recurring_items(user: dict = Depends(get_current_user)):
    """Get all recurring income/expense items with days until due."""
    user_id = user["id"]
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM recurring_items WHERE user_id = ?", (user_id,))
        count = cursor.fetchone()[0]

        if count == 0:
            # Seed starter recurring bills
            today = datetime.now()
            d3 = (today + timedelta(days=3)).strftime("%Y-%m-%d")
            d7 = (today + timedelta(days=7)).strftime("%Y-%m-%d")
            d12 = (today + timedelta(days=12)).strftime("%Y-%m-%d")
            d20 = (today + timedelta(days=20)).strftime("%Y-%m-%d")

            defaults = [
                ("Apartment Rent", 22000.0, "Expense", "Rent", "Monthly", d3),
                ("High-Speed Fiber Internet", 1199.0, "Expense", "Bills", "Monthly", d7),
                ("Netflix & Spotify Family", 1049.0, "Expense", "Entertainment", "Monthly", d12),
                ("Mutual Fund SIP", 15000.0, "Expense", "Investment", "Monthly", d20),
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
    """Create a recurring item."""
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


@router.delete("/recurring/{item_id}")
async def delete_recurring_item(item_id: str, user: dict = Depends(get_current_user)):
    """Delete a recurring item."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "DELETE FROM recurring_items WHERE id = ? AND user_id = ?",
            (item_id, user["id"]),
        )
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Recurring item not found")
    return {"message": "Recurring item deleted successfully"}


# ==============================================================================
# 4. SMART INSIGHTS ENGINE
# ==============================================================================

@router.get("/smart/insights")
async def get_smart_insights(user: dict = Depends(get_current_user)):
    """Compute automated algorithmic financial insights and tips for the user."""
    user_id = user["id"]
    tips = []

    with get_db() as conn:
        cursor = conn.cursor()

        # 1. Total summary
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
                })
            elif rate < 10:
                tips.append({
                    "id": "rate_low",
                    "type": "warning",
                    "title": "Tight Cashflow Buffer",
                    "description": f"Savings rate is currently {rate}%. Consider reviewing non-essential discretionary expenses.",
                    "icon": "AlertTriangle",
                })

        # 2. Top spending category
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
        top_cat = cursor.fetchone()
        if top_cat:
            cat_name = top_cat["category"]
            cat_amt = float(top_cat["amt"])
            pct = round((cat_amt / tot_exp) * 100, 1) if tot_exp > 0 else 0
            tips.append({
                "id": "top_category",
                "type": "info",
                "title": f"Highest Expense: {cat_name}",
                "description": f"{cat_name} accounts for ₹{cat_amt:,.0f} ({pct}%) of all outgoing expenses.",
                "icon": "PieChart",
            })

        # 3. Preferred payment mode
        cursor.execute(
            """
            SELECT payment_mode, COUNT(*) as c, SUM(amount) as s
            FROM transactions
            WHERE user_id = ?
            GROUP BY payment_mode
            ORDER BY c DESC
            LIMIT 1
            """,
            (user_id,),
        )
        top_pm = cursor.fetchone()
        if top_pm:
            tips.append({
                "id": "top_mode",
                "type": "info",
                "title": f"Primary Payment Method: {top_pm['payment_mode']}",
                "description": f"You use {top_pm['payment_mode']} for {top_pm['c']} transactions (₹{float(top_pm['s']):,.0f} volume).",
                "icon": "CreditCard",
            })

        # 4. Exceeded or near-limit budgets
        cursor.execute(
            """
            SELECT category, monthly_limit FROM budgets
            WHERE user_id = ?
            """,
            (user_id,),
        )
        budgets = cursor.fetchall()
        for b in budgets:
            c_name = b["category"]
            c_lim = float(b["monthly_limit"])
            cursor.execute(
                """
                SELECT COALESCE(SUM(amount), 0) FROM transactions
                WHERE user_id = ? AND transaction_type = 'Expense' AND category = ?
                """,
                (user_id, c_name),
            )
            spent = float(cursor.fetchone()[0])
            if spent > c_lim:
                tips.append({
                    "id": f"budget_exceeded_{c_name}",
                    "type": "alert",
                    "title": f"Budget Alert: {c_name} Over Limit",
                    "description": f"Spent ₹{spent:,.0f} against your ₹{c_lim:,.0f} limit (+₹{spent-c_lim:,.0f}).",
                    "icon": "AlertCircle",
                })
                break

    if not tips:
        tips.append({
            "id": "welcome",
            "type": "info",
            "title": "Welcome to FinFlow AI",
            "description": "Log more transactions to unlock customized algorithmic spending insights.",
            "icon": "Sparkles",
        })

    return {"insights": tips}


# ==============================================================================
# 5. DAILY SPENDING HEATMAP (GitHub-style)
# ==============================================================================

@router.get("/analytics/daily-heatmap")
async def get_daily_heatmap(
    days: int = 180,
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

    # Find max amount to calculate intensity level (0 to 4)
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
# 6. NOTIFICATIONS
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
                ("ML Model Updated", "Random Forest classifier updated with 99.2% benchmark accuracy.", "info"),
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
            LIMIT 20
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
    return {"message": "Notification marked read"}


@router.post("/notifications/read-all")
async def mark_all_notifications_read(user: dict = Depends(get_current_user)):
    """Mark all notifications as read."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE notifications SET is_read = 1 WHERE user_id = ?",
            (user["id"],),
        )
    return {"message": "All notifications marked read"}


# ==============================================================================
# 7. USER PROFILE & SETTINGS
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
            # Create default profile
            cursor.execute(
                """
                INSERT INTO profiles (id, email, full_name, currency, theme_preference, accent_color)
                VALUES (?, ?, ?, 'INR', 'dark', 'indigo')
                """,
                (user_id, email, "Alex Mercer"),
            )
            conn.commit()
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
    """Update profile preferences."""
    user_id = user["id"]
    email = user.get("email", "demo@finflow.app")

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM profiles WHERE id = ?", (user_id,))
        existing = cursor.fetchone()

        if existing:
            full_name = data.full_name if data.full_name is not None else existing["full_name"]
            currency = data.currency if data.currency is not None else existing["currency"]
            theme = data.theme_preference if data.theme_preference is not None else existing["theme_preference"]
            accent = data.accent_color if data.accent_color is not None else existing["accent_color"]

            cursor.execute(
                """
                UPDATE profiles
                SET full_name = ?, currency = ?, theme_preference = ?, accent_color = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
                """,
                (full_name, currency, theme, accent, user_id),
            )
        else:
            full_name = data.full_name or "Alex Mercer"
            currency = data.currency or "INR"
            theme = data.theme_preference or "dark"
            accent = data.accent_color or "indigo"
            cursor.execute(
                """
                INSERT INTO profiles (id, email, full_name, currency, theme_preference, accent_color)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (user_id, email, full_name, currency, theme, accent),
            )

    return ProfileResponse(
        id=user_id,
        email=email,
        full_name=full_name,
        currency=currency,
        theme_preference=theme,
        accent_color=accent,
    )
