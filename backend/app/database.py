import sqlite3
from collections.abc import Generator
from contextlib import contextmanager, suppress

from .config import DB_FILE


class DatabaseAdapter:
    """Authoritative database adapter interface ensuring parameterized queries and user isolation."""

    @staticmethod
    def get_connection():
        conn = sqlite3.connect(DB_FILE, check_same_thread=False)
        conn.row_factory = sqlite3.Row
        return conn


def init_db():
    """Initializes SQLite database with all tables, indexes, and migrations."""
    DB_FILE.parent.mkdir(parents=True, exist_ok=True)
    conn = DatabaseAdapter.get_connection()
    cursor = conn.cursor()

    # 1. Profiles Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS profiles (
        id TEXT PRIMARY KEY,
        email TEXT,
        full_name TEXT,
        avatar_url TEXT,
        currency TEXT DEFAULT 'INR',
        theme_preference TEXT DEFAULT 'dark',
        accent_color TEXT DEFAULT 'indigo',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 2. User Preferences Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS user_preferences (
        id TEXT PRIMARY KEY,
        user_id TEXT UNIQUE NOT NULL,
        currency TEXT DEFAULT 'INR',
        theme_preference TEXT DEFAULT 'dark',
        accent_color TEXT DEFAULT 'indigo',
        ui_density TEXT DEFAULT 'comfortable',
        density TEXT DEFAULT 'comfortable',
        language TEXT DEFAULT 'en',
        timezone TEXT DEFAULT 'Asia/Kolkata',
        start_day_of_week TEXT DEFAULT 'Monday',
        week_start_day TEXT DEFAULT 'Monday',
        default_transaction_type TEXT DEFAULT 'Expense',
        default_category TEXT DEFAULT 'Food',
        default_payment_mode TEXT DEFAULT 'UPI',
        default_location TEXT DEFAULT 'Bangalore',
        monthly_income_target REAL DEFAULT 0.0,
        monthly_expense_target REAL DEFAULT 0.0,
        savings_rate_target REAL DEFAULT 20.0,
        enable_confetti INTEGER DEFAULT 1,
        confetti_enabled INTEGER DEFAULT 1,
        enable_onboarding_tour INTEGER DEFAULT 1,
        onboarding_tour_enabled INTEGER DEFAULT 1,
        enable_compact_tables INTEGER DEFAULT 0,
        compact_tables INTEGER DEFAULT 0,
        notifications_enabled INTEGER DEFAULT 1,
        master_notifications INTEGER DEFAULT 1,
        budget_alerts_enabled INTEGER DEFAULT 1,
        budget_alerts INTEGER DEFAULT 1,
        recurring_bill_reminders_enabled INTEGER DEFAULT 1,
        recurring_reminders INTEGER DEFAULT 1,
        goal_milestone_notifications_enabled INTEGER DEFAULT 1,
        milestone_alerts INTEGER DEFAULT 1,
        weekly_summary_enabled INTEGER DEFAULT 1,
        weekly_summary INTEGER DEFAULT 1,
        quiet_hours_enabled INTEGER DEFAULT 0,
        quiet_hours_start TEXT DEFAULT '22:00',
        quiet_hours_end TEXT DEFAULT '08:00',
        dashboard_layout TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)
    cursor.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);")

    # Safe migrations for user_preferences columns
    for pref_col, pref_type in [
        ("id", "TEXT"),
        ("ui_density", "TEXT DEFAULT 'comfortable'"),
        ("start_day_of_week", "TEXT DEFAULT 'Monday'"),
        ("enable_confetti", "INTEGER DEFAULT 1"),
        ("enable_onboarding_tour", "INTEGER DEFAULT 1"),
        ("enable_compact_tables", "INTEGER DEFAULT 0"),
        ("notifications_enabled", "INTEGER DEFAULT 1"),
        ("budget_alerts_enabled", "INTEGER DEFAULT 1"),
        ("recurring_bill_reminders_enabled", "INTEGER DEFAULT 1"),
        ("goal_milestone_notifications_enabled", "INTEGER DEFAULT 1"),
        ("weekly_summary_enabled", "INTEGER DEFAULT 1"),
        ("created_at", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP"),
    ]:
        with suppress(sqlite3.OperationalError):
            cursor.execute(f"ALTER TABLE user_preferences ADD COLUMN {pref_col} {pref_type};")

    # 3. Transactions Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        date TEXT NOT NULL,
        transaction_type TEXT NOT NULL,
        category TEXT NOT NULL,
        amount REAL NOT NULL,
        payment_mode TEXT NOT NULL,
        location TEXT NOT NULL,
        notes TEXT,
        tags TEXT DEFAULT '',
        attachment_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_tx_user_date ON transactions(user_id, date);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_tx_user_type ON transactions(user_id, transaction_type);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_tx_user_cat ON transactions(user_id, category);")

    # Safe migrations for existing SQLite database files
    for col_def in [
        ("tags", "TEXT DEFAULT ''"),
        ("attachment_url", "TEXT DEFAULT NULL"),
    ]:
        with suppress(sqlite3.OperationalError):
            cursor.execute(f"ALTER TABLE transactions ADD COLUMN {col_def[0]} {col_def[1]};")

    # 4. Budgets Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS budgets (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        category TEXT NOT NULL,
        monthly_limit REAL NOT NULL,
        month INTEGER NOT NULL,
        year INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, category, month, year)
    );
    """)
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_budgets_user_my ON budgets(user_id, month, year);")

    # 5. Savings Goals Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS goals (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        title TEXT NOT NULL,
        target_amount REAL NOT NULL,
        current_amount REAL NOT NULL DEFAULT 0,
        deadline TEXT,
        category TEXT,
        monthly_contribution REAL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)
    with suppress(sqlite3.OperationalError):
        cursor.execute("ALTER TABLE goals ADD COLUMN monthly_contribution REAL DEFAULT 0;")

    # 6. Recurring Items Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS recurring_items (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        title TEXT NOT NULL,
        amount REAL NOT NULL,
        transaction_type TEXT NOT NULL,
        category TEXT NOT NULL,
        frequency TEXT NOT NULL DEFAULT 'Monthly',
        next_due_date TEXT NOT NULL,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_rec_user_due ON recurring_items(user_id, next_due_date);")

    # 7. Prediction History Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS prediction_history (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        amount REAL NOT NULL,
        date TEXT NOT NULL,
        payment_mode TEXT NOT NULL,
        location TEXT NOT NULL,
        predicted_type TEXT NOT NULL,
        confidence REAL NOT NULL,
        income_probability REAL NOT NULL,
        expense_probability REAL NOT NULL,
        is_uncertain INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_pred_user_time ON prediction_history(user_id, created_at DESC);")
    with suppress(sqlite3.OperationalError):
        cursor.execute("ALTER TABLE prediction_history ADD COLUMN is_uncertain INTEGER DEFAULT 0;")

    # 8. Prediction Feedback Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS prediction_feedback (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        prediction_id TEXT NOT NULL,
        actual_type TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 9. User Tags Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS tags (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        color TEXT DEFAULT 'indigo',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, name)
    );
    """)

    # 10. Saved Filters Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS saved_filters (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        criteria_json TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 11. Category Auto-categorization Rules Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS category_rules (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        keyword TEXT NOT NULL,
        category TEXT NOT NULL,
        priority INTEGER DEFAULT 0,
        is_active INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 12. Notifications Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        notification_type TEXT NOT NULL DEFAULT 'info',
        is_read INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_notif_user_time ON notifications(user_id, created_at DESC);")

    conn.commit()
    conn.close()


@contextmanager
def get_db() -> Generator[sqlite3.Connection, None, None]:
    """Context manager yielding SQLite connection with dict row factory."""
    conn = DatabaseAdapter.get_connection()
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()
