-- FinFlow Database Schema Migration
-- Features: Profiles, User Preferences, Transactions, Budgets, Goals, Recurring Items,
--           Prediction History, Prediction Feedback, Tags, Saved Filters, Category Rules, Notifications
-- Security: Full Row Level Security (RLS) with auth.uid() isolation across SELECT, INSERT, UPDATE, DELETE.

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    currency TEXT DEFAULT 'INR',
    theme_preference TEXT DEFAULT 'dark',
    accent_color TEXT DEFAULT 'indigo',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can delete their own profile"
    ON public.profiles FOR DELETE
    USING (auth.uid() = id);

-- Trigger to create profile upon new auth user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url)
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
        new.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        avatar_url = EXCLUDED.avatar_url;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. User Preferences Table
CREATE TABLE IF NOT EXISTS public.user_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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
    monthly_income_target NUMERIC(12, 2) DEFAULT 0,
    monthly_expense_target NUMERIC(12, 2) DEFAULT 0,
    savings_rate_target NUMERIC(5, 2) DEFAULT 20.0,
    enable_confetti BOOLEAN DEFAULT TRUE,
    confetti_enabled BOOLEAN DEFAULT TRUE,
    enable_onboarding_tour BOOLEAN DEFAULT TRUE,
    onboarding_tour_enabled BOOLEAN DEFAULT TRUE,
    enable_compact_tables BOOLEAN DEFAULT FALSE,
    compact_tables BOOLEAN DEFAULT FALSE,
    notifications_enabled BOOLEAN DEFAULT TRUE,
    master_notifications BOOLEAN DEFAULT TRUE,
    budget_alerts_enabled BOOLEAN DEFAULT TRUE,
    budget_alerts BOOLEAN DEFAULT TRUE,
    recurring_bill_reminders_enabled BOOLEAN DEFAULT TRUE,
    recurring_reminders BOOLEAN DEFAULT TRUE,
    goal_milestone_notifications_enabled BOOLEAN DEFAULT TRUE,
    milestone_alerts BOOLEAN DEFAULT TRUE,
    weekly_summary_enabled BOOLEAN DEFAULT TRUE,
    weekly_summary BOOLEAN DEFAULT TRUE,
    quiet_hours_enabled BOOLEAN DEFAULT FALSE,
    quiet_hours_start TEXT DEFAULT '22:00',
    quiet_hours_end TEXT DEFAULT '08:00',
    dashboard_layout TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_preferences_user_id ON public.user_preferences(user_id);

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Preferences select isolation" ON public.user_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Preferences insert isolation" ON public.user_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Preferences update isolation" ON public.user_preferences FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Preferences delete isolation" ON public.user_preferences FOR DELETE USING (auth.uid() = user_id);

-- 3. Transactions Table
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('Income', 'Expense')),
    category TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0 AND amount <= 100000000),
    payment_mode TEXT NOT NULL,
    location TEXT NOT NULL,
    notes TEXT CHECK (length(notes) <= 500),
    tags TEXT[] DEFAULT '{}',
    attachment_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON public.transactions(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_user_type ON public.transactions(user_id, transaction_type);
CREATE INDEX IF NOT EXISTS idx_transactions_user_category ON public.transactions(user_id, category);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Transactions select isolation" ON public.transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Transactions insert isolation" ON public.transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Transactions update isolation" ON public.transactions FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Transactions delete isolation" ON public.transactions FOR DELETE USING (auth.uid() = user_id);

-- 4. Budgets Table
CREATE TABLE IF NOT EXISTS public.budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    monthly_limit NUMERIC(12, 2) NOT NULL CHECK (monthly_limit > 0),
    month INT NOT NULL CHECK (month BETWEEN 1 AND 12),
    year INT NOT NULL CHECK (year >= 2020),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, category, month, year)
);

CREATE INDEX IF NOT EXISTS idx_budgets_user_my ON public.budgets(user_id, month, year);

ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Budgets select isolation" ON public.budgets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Budgets insert isolation" ON public.budgets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Budgets update isolation" ON public.budgets FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Budgets delete isolation" ON public.budgets FOR DELETE USING (auth.uid() = user_id);

-- 5. Savings Goals Table
CREATE TABLE IF NOT EXISTS public.goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    target_amount NUMERIC(12, 2) NOT NULL CHECK (target_amount > 0),
    current_amount NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (current_amount >= 0),
    deadline DATE,
    category TEXT,
    monthly_contribution NUMERIC(12, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_goals_user ON public.goals(user_id);

ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Goals select isolation" ON public.goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Goals insert isolation" ON public.goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Goals update isolation" ON public.goals FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Goals delete isolation" ON public.goals FOR DELETE USING (auth.uid() = user_id);

-- 6. Recurring Items Table
CREATE TABLE IF NOT EXISTS public.recurring_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('Income', 'Expense')),
    category TEXT NOT NULL,
    frequency TEXT NOT NULL DEFAULT 'Monthly' CHECK (frequency IN ('Weekly', 'Monthly', 'Quarterly', 'Yearly')),
    next_due_date DATE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recurring_user_due ON public.recurring_items(user_id, next_due_date);

ALTER TABLE public.recurring_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Recurring select isolation" ON public.recurring_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Recurring insert isolation" ON public.recurring_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Recurring update isolation" ON public.recurring_items FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Recurring delete isolation" ON public.recurring_items FOR DELETE USING (auth.uid() = user_id);

-- 7. Prediction History Table
CREATE TABLE IF NOT EXISTS public.prediction_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL,
    date DATE NOT NULL,
    payment_mode TEXT NOT NULL,
    location TEXT NOT NULL,
    predicted_type TEXT NOT NULL,
    confidence NUMERIC(5, 4) NOT NULL,
    income_probability NUMERIC(5, 4) NOT NULL,
    expense_probability NUMERIC(5, 4) NOT NULL,
    is_uncertain BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pred_history_user ON public.prediction_history(user_id, created_at DESC);

ALTER TABLE public.prediction_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Prediction history select isolation" ON public.prediction_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Prediction history insert isolation" ON public.prediction_history FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Prediction history delete isolation" ON public.prediction_history FOR DELETE USING (auth.uid() = user_id);

-- 8. Prediction Feedback Table
CREATE TABLE IF NOT EXISTS public.prediction_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    prediction_id UUID,
    actual_type TEXT NOT NULL CHECK (actual_type IN ('Income', 'Expense')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.prediction_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Prediction feedback select isolation" ON public.prediction_feedback FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Prediction feedback insert isolation" ON public.prediction_feedback FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 9. User Tags Table
CREATE TABLE IF NOT EXISTS public.tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT DEFAULT 'indigo',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, name)
);

ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tags select isolation" ON public.tags FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Tags insert isolation" ON public.tags FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Tags delete isolation" ON public.tags FOR DELETE USING (auth.uid() = user_id);

-- 10. Saved Filters Table
CREATE TABLE IF NOT EXISTS public.saved_filters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    criteria_json JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.saved_filters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Saved filters select isolation" ON public.saved_filters FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Saved filters insert isolation" ON public.saved_filters FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Saved filters delete isolation" ON public.saved_filters FOR DELETE USING (auth.uid() = user_id);

-- 11. Category Auto-Categorization Rules Table
CREATE TABLE IF NOT EXISTS public.category_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    keyword TEXT NOT NULL,
    category TEXT NOT NULL,
    priority INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.category_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Category rules select isolation" ON public.category_rules FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Category rules insert isolation" ON public.category_rules FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Category rules update isolation" ON public.category_rules FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Category rules delete isolation" ON public.category_rules FOR DELETE USING (auth.uid() = user_id);

-- 12. Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    notification_type TEXT NOT NULL DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_time ON public.notifications(user_id, created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Notifications select isolation" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Notifications update isolation" ON public.notifications FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Notifications delete isolation" ON public.notifications FOR DELETE USING (auth.uid() = user_id);
