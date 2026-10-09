import sqlite3
import os
from pathlib import Path
from contextlib import contextmanager
from typing import Generator

DB_FILE = Path(__file__).resolve().parent.parent / "finflow.db"

def init_db():
    """Initializes SQLite database with all tables matching Supabase schema."""
    conn = sqlite3.connect(DB_FILE)
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

    # 2. Transactions Table
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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_tx_user_date ON transactions(user_id, date);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_tx_user_type ON transactions(user_id, transaction_type);")

    # 3. Budgets Table
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

    # 4. Savings Goals Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS goals (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        title TEXT NOT NULL,
        target_amount REAL NOT NULL,
        current_amount REAL NOT NULL DEFAULT 0,
        deadline TEXT,
        category TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 5. Recurring Items Table
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

    # 6. Prediction History Table
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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 7. Notifications Table
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

    conn.commit()
    conn.close()

@contextmanager
def get_db():
    """Context manager yielding SQLite connection with dict row factory."""
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()
