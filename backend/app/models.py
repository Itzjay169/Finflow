import re
import zoneinfo
from datetime import datetime
from typing import Any, Generic, Literal, TypeVar

from pydantic import BaseModel, ConfigDict, Field, field_validator

# Type definitions & Literals
TransactionType = Literal["Income", "Expense"]
PaymentMode = Literal["Bank Transfer", "Cash", "Credit Card", "Debit Card", "Net Banking", "UPI"]
Frequency = Literal["Weekly", "Monthly", "Quarterly", "Yearly"]
ThemePreference = Literal["light", "dark", "system"]
DensityPreference = Literal["comfortable", "compact"]
CurrencyCode = Literal["INR", "USD", "EUR", "GBP"]
StartDay = Literal["Sunday", "Monday"]

SUPPORTED_CITIES = [
    "Bangalore",
    "Bhubaneswar",
    "Chennai",
    "Delhi",
    "Hyderabad",
    "Jaipur",
    "Kolkata",
    "Mumbai",
    "Pune",
    "Ahmedabad",
]

def normalize_location(v: str) -> str:
    """Normalizes known city spellings while safely trimming free-text input."""
    if not v or not v.strip():
        raise ValueError("Location must not be empty.")
    cleaned = v.strip()
    if len(cleaned) > 80:
        raise ValueError("Location must be 80 characters or fewer.")
    if cleaned.lower() in ("bangalore", "bengaluru"):
        return "Bangalore"
    # Title-case match if in supported cities
    for city in SUPPORTED_CITIES:
        if cleaned.lower() == city.lower():
            return city
    return cleaned

def validate_iso_date(v: str) -> str:
    """Validates YYYY-MM-DD date format."""
    try:
        datetime.strptime(v, "%Y-%m-%d")
        return v
    except (ValueError, TypeError) as exc:
        raise ValueError(f"Invalid date format '{v}'. Expected YYYY-MM-DD.") from exc


# ==============================================================================
# Consistent API Envelopes & Pagination
# ==============================================================================

T = TypeVar("T")

class PaginationMeta(BaseModel):
    page: int
    page_size: int
    total: int
    total_pages: int
    has_next: bool
    has_previous: bool

class APIResponse(BaseModel, Generic[T]):
    success: bool = True
    data: T
    message: str = ""
    meta: dict[str, Any] = Field(default_factory=dict)

class APIErrorDetail(BaseModel):
    field: str | None = None
    message: str

class APIErrorPayload(BaseModel):
    code: str
    message: str
    details: list[APIErrorDetail] = Field(default_factory=list)

class APIErrorResponse(BaseModel):
    success: bool = False
    error: APIErrorPayload


# ==============================================================================
# Transactions Models
# ==============================================================================

class TransactionCreate(BaseModel):
    date: str = Field(..., description="ISO date YYYY-MM-DD")
    transaction_type: TransactionType = Field(..., description="'Income' or 'Expense'")
    category: str = Field(..., min_length=1, max_length=50)
    amount: float = Field(..., gt=0, le=100_000_000, description="Amount must be positive up to 100,000,000")
    payment_mode: PaymentMode = Field(..., description="Supported payment mode")
    location: str = Field(..., min_length=1, max_length=80)
    notes: str | None = Field(default=None, max_length=500)
    tags: list[str] | str | None = Field(default=None)
    attachment_url: str | None = Field(default=None, max_length=500)

    @field_validator("date")
    @classmethod
    def check_date(cls, v: str) -> str:
        return validate_iso_date(v)

    @field_validator("location")
    @classmethod
    def check_location(cls, v: str) -> str:
        return normalize_location(v)

    @field_validator("category")
    @classmethod
    def clean_category(cls, v: str) -> str:
        s = v.strip()
        if not s:
            raise ValueError("Category must not be empty.")
        return s

class TransactionUpdate(BaseModel):
    date: str | None = None
    transaction_type: TransactionType | None = None
    category: str | None = Field(default=None, max_length=50)
    amount: float | None = Field(default=None, gt=0, le=100_000_000)
    payment_mode: PaymentMode | None = None
    location: str | None = Field(default=None, max_length=80)
    notes: str | None = Field(default=None, max_length=500)
    tags: list[str] | str | None = None
    attachment_url: str | None = Field(default=None, max_length=500)

    @field_validator("date")
    @classmethod
    def check_date(cls, v: str | None) -> str | None:
        return validate_iso_date(v) if v else None

    @field_validator("location")
    @classmethod
    def check_location(cls, v: str | None) -> str | None:
        return normalize_location(v) if v else None

class TransactionResponse(BaseModel):
    id: str
    user_id: str
    date: str
    transaction_type: str
    category: str
    amount: float
    payment_mode: str
    location: str
    notes: str | None = None
    tags: list[str] = Field(default_factory=list)
    attachment_url: str | None = None
    created_at: str | None = None
    updated_at: str | None = None

class TransactionListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    total_pages: int
    has_next: bool
    has_previous: bool
    transactions: list[TransactionResponse]

class BulkDeleteRequest(BaseModel):
    transaction_ids: list[str] = Field(..., min_length=1)

class SeedSampleRequest(BaseModel):
    replace_existing: bool = False
    confirm: bool = False
    confirmation: str | None = None

class AccountDeleteRequest(BaseModel):
    confirmation: str = Field(..., description="Must equal 'DELETE MY ACCOUNT'")
    confirm_permanent: bool = Field(default=False, description="Must be True")

    @field_validator("confirmation")
    @classmethod
    def check_confirmation(cls, v: str) -> str:
        if v.strip() != "DELETE MY ACCOUNT":
            raise ValueError("Confirmation must be exactly 'DELETE MY ACCOUNT'.")
        return v.strip()

    @field_validator("confirm_permanent")
    @classmethod
    def check_confirm_permanent(cls, v: bool) -> bool:
        if not v:
            raise ValueError("confirm_permanent must be True to proceed with account deletion.")
        return v

class CSVImportResponse(BaseModel):
    success: bool
    total_rows: int
    imported: int
    skipped: int
    duplicates: int
    errors: list[str] = Field(default_factory=list)
    message: str = ""

class SystemInfoResponse(BaseModel):
    app_name: str = "FinFlow"
    version: str = "2.4.0"
    environment: str = "production"
    status: str = "healthy"
    api_version: str = "v1"
    build_date: str = "2026-11-09"
    held_out_model_accuracy: str = "Held-out test accuracy: 95.83% on 240 unseen rows."
    model_algorithm: str = "RandomForestClassifier (100 estimators)"
    model_features_count: int = 18
    support_email: str = "support@finflow.app"
    documentation_url: str = "/docs"
    terms_url: str = "/terms"
    privacy_url: str = "/privacy"

class DuplicateCheckRequest(BaseModel):
    date: str
    amount: float = Field(..., gt=0)
    category: str
    payment_mode: str
    notes: str | None = None

class DuplicateCheckResponse(BaseModel):
    is_duplicate: bool
    confidence: float
    matched_transaction: TransactionResponse | None = None
    message: str


# ==============================================================================
# Summary & Analytics Models
# ==============================================================================

class SummaryResponse(BaseModel):
    total_income: float
    total_expense: float
    net_savings: float
    savings_rate: float
    transaction_count: int

class MonthlyAnalyticsItem(BaseModel):
    month: str
    income: float
    expense: float
    net: float

class CategoryAnalyticsItem(BaseModel):
    category: str
    amount: float
    percentage: float
    count: int

class PaymentModeAnalyticsItem(BaseModel):
    payment_mode: str
    amount: float
    percentage: float
    count: int

class LocationAnalyticsItem(BaseModel):
    location: str
    amount: float
    percentage: float
    count: int

class TrendsResponse(BaseModel):
    income_mom_pct: float
    expense_mom_pct: float
    spending_velocity: float
    avg_daily_spend: float
    largest_single_expense: float
    top_categories: list[CategoryAnalyticsItem]
    top_locations: list[LocationAnalyticsItem]

class CashFlowForecastMonth(BaseModel):
    month_label: str
    projected_income: float
    projected_expenses: float
    projected_recurring: float
    projected_net: float
    projected_ending_balance: float

class CashFlowForecastResponse(BaseModel):
    current_balance: float
    forecast_months: list[CashFlowForecastMonth]
    assumptions: str
    disclaimer: str = "Algorithmic projection for informational purposes only. Not financial advice."


# ==============================================================================
# ML Predictor Models
# ==============================================================================

class PredictRequest(BaseModel):
    amount: float = Field(..., gt=0, le=100_000_000)
    date: str = Field(..., description="YYYY-MM-DD")
    payment_mode: PaymentMode
    location: str = Field(..., min_length=1, max_length=80)

    @field_validator("date")
    @classmethod
    def check_date(cls, v: str) -> str:
        return validate_iso_date(v)

    @field_validator("location")
    @classmethod
    def check_location(cls, v: str) -> str:
        return normalize_location(v)

class PredictResponse(BaseModel):
    id: str | None = None
    prediction: str
    confidence: float
    income_probability: float
    expense_probability: float
    is_uncertain: bool = False
    explanation: str = "This prediction is mainly influenced by amount, payment mode, and location."
    amount: float
    date: str
    payment_mode: str
    location: str

class PredictionHistoryItem(BaseModel):
    id: str
    user_id: str
    amount: float
    date: str
    payment_mode: str
    location: str
    predicted_type: str
    confidence: float
    income_probability: float
    expense_probability: float
    is_uncertain: bool
    created_at: str

class PredictionHistoryListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    total_pages: int
    has_next: bool
    has_previous: bool
    predictions: list[PredictionHistoryItem]

class PredictionFeedbackRequest(BaseModel):
    actual_type: TransactionType

class ModelInsightsResponse(BaseModel):
    model_name: str
    accuracy: float
    held_out_accuracy_label: str = "Held-out test accuracy: 95.83% on 240 unseen rows."
    expense_precision: float
    expense_recall: float
    income_precision: float
    income_recall: float
    confusion_matrix: list[list[int]]
    feature_importances: list[dict[str, Any]]
    total_samples: int
    feature_columns: list[str]

class ModelSummaryResponse(BaseModel):
    model_name: str
    feature_count: int
    accuracy: float
    badge_text: str
    held_out_test_description: str
    total_samples: int
    categories_count: int
    payment_modes_count: int
    locations_count: int
    currency: str

class ModelHealthResponse(BaseModel):
    status: str
    model_loaded: bool
    expected_features: int
    actual_features: int
    pipeline_check: bool
    metadata_available: bool


# ==============================================================================
# Budgets Models
# ==============================================================================

class BudgetCreate(BaseModel):
    category: str = Field(..., min_length=1, max_length=50)
    monthly_limit: float = Field(..., gt=0, le=100_000_000)
    month: int = Field(..., ge=1, le=12)
    year: int = Field(..., ge=2020, le=2050)

class BudgetResponse(BaseModel):
    id: str
    user_id: str
    category: str
    monthly_limit: float
    month: int
    year: int
    spent: float = 0.0
    remaining: float = 0.0
    percentage: float = 0.0
    is_exceeded: bool = False


# ==============================================================================
# Savings Goals Models
# ==============================================================================

class GoalCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=100)
    target_amount: float = Field(..., gt=0, le=100_000_000)
    current_amount: float = Field(default=0.0, ge=0, le=100_000_000)
    deadline: str | None = None
    category: str | None = Field(default=None, max_length=50)
    monthly_contribution: float = Field(default=0.0, ge=0)

    @field_validator("deadline")
    @classmethod
    def check_deadline(cls, v: str | None) -> str | None:
        return validate_iso_date(v) if v else None

class GoalContribute(BaseModel):
    amount: float = Field(..., gt=0, le=100_000_000)

class GoalResponse(BaseModel):
    id: str
    user_id: str
    title: str
    target_amount: float
    current_amount: float
    deadline: str | None = None
    category: str | None = None
    monthly_contribution: float = 0.0
    percentage: float = 0.0
    remaining: float = 0.0
    projected_completion_date: str | None = None


# ==============================================================================
# Recurring Transactions Models
# ==============================================================================

class RecurringItemCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=100)
    amount: float = Field(..., gt=0, le=100_000_000)
    transaction_type: TransactionType
    category: str = Field(..., min_length=1, max_length=50)
    frequency: Frequency = "Monthly"
    next_due_date: str
    is_active: bool = True

    @field_validator("next_due_date")
    @classmethod
    def check_due_date(cls, v: str) -> str:
        return validate_iso_date(v)

class RecurringItemResponse(BaseModel):
    id: str
    user_id: str
    title: str
    amount: float
    transaction_type: str
    category: str
    frequency: str
    next_due_date: str
    is_active: bool
    days_until_due: int


# ==============================================================================
# Tags, Saved Filters & Category Rules Models
# ==============================================================================

class TagCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=30)
    color: str = Field(default="indigo", max_length=20)

class TagResponse(BaseModel):
    id: str
    user_id: str
    name: str
    color: str
    created_at: str

class SavedFilterCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=50)
    criteria_json: str

class SavedFilterResponse(BaseModel):
    id: str
    user_id: str
    name: str
    criteria_json: str
    created_at: str

class CategoryRuleCreate(BaseModel):
    keyword: str = Field(..., min_length=2, max_length=50)
    category: str = Field(..., min_length=1, max_length=50)
    priority: int = Field(default=0, ge=0, le=100)
    is_active: bool = True

class CategoryRuleResponse(BaseModel):
    id: str
    user_id: str
    keyword: str
    category: str
    priority: int
    is_active: bool
    created_at: str


# ==============================================================================
# Notifications Models
# ==============================================================================

class NotificationResponse(BaseModel):
    id: str
    user_id: str
    title: str
    message: str
    notification_type: str
    is_read: bool
    created_at: str


# ==============================================================================
# Profile & Complete User Preferences Models
# ==============================================================================

class ProfileUpdate(BaseModel):
    full_name: str | None = Field(default=None, max_length=100)
    avatar_url: str | None = Field(default=None)
    currency: CurrencyCode | None = None
    theme_preference: ThemePreference | None = None
    accent_color: str | None = Field(default=None, max_length=30)

    @field_validator("avatar_url")
    @classmethod
    def check_avatar(cls, v: str | None) -> str | None:
        if v is None or not v.strip():
            return None
        cleaned = v.strip()
        if cleaned.startswith("data:"):
            # Format validation
            header = cleaned.split(";")[0].lower()
            if header not in ("data:image/jpeg", "data:image/jpg", "data:image/png", "data:image/webp"):
                raise ValueError("Avatar file must be a JPG, PNG, or WEBP image.")
            # Size validation (max 2MB)
            if "," in cleaned:
                data_part = cleaned.split(",", 1)[1]
                # Each base64 char is roughly 6 bits (0.75 byte)
                est_bytes = (len(data_part) * 3) // 4
                if est_bytes > 2 * 1024 * 1024:
                    raise ValueError("Avatar file size must not exceed 2 MB.")
        return cleaned

class ProfileResponse(BaseModel):
    id: str
    email: str
    full_name: str | None = None
    avatar_url: str | None = None
    currency: str = "INR"
    theme_preference: str = "dark"
    accent_color: str = "indigo"

class UserPreferencesUpdate(BaseModel):
    currency: CurrencyCode | None = None
    theme_preference: ThemePreference | None = None
    accent_color: str | None = None
    ui_density: DensityPreference | None = None
    density: DensityPreference | None = None
    language: str | None = "en"
    timezone: str | None = None
    start_day_of_week: StartDay | None = None
    week_start_day: StartDay | None = None
    default_transaction_type: TransactionType | None = None
    default_payment_mode: PaymentMode | None = None
    default_location: str | None = None
    default_category: str | None = None
    monthly_income_target: float | None = Field(default=None, ge=0)
    monthly_expense_target: float | None = Field(default=None, ge=0)
    savings_rate_target: float | None = Field(default=None, ge=0, le=100)
    enable_confetti: bool | None = None
    confetti_enabled: bool | None = None
    enable_onboarding_tour: bool | None = None
    onboarding_tour_enabled: bool | None = None
    enable_compact_tables: bool | None = None
    compact_tables: bool | None = None
    notifications_enabled: bool | None = None
    master_notifications: bool | None = None
    budget_alerts_enabled: bool | None = None
    budget_alerts: bool | None = None
    recurring_bill_reminders_enabled: bool | None = None
    recurring_reminders: bool | None = None
    goal_milestone_notifications_enabled: bool | None = None
    milestone_alerts: bool | None = None
    weekly_summary_enabled: bool | None = None
    weekly_summary: bool | None = None
    quiet_hours_enabled: bool | None = None
    quiet_hours_start: str | None = None
    quiet_hours_end: str | None = None
    dashboard_layout: str | None = None

    @field_validator("timezone")
    @classmethod
    def check_timezone(cls, v: str | None) -> str | None:
        if v is None or not v.strip():
            return None
        cleaned = v.strip()
        try:
            zoneinfo.ZoneInfo(cleaned)
            return cleaned
        except Exception as exc:
            raise ValueError(f"Invalid IANA timezone: '{v}'.") from exc

    @field_validator("quiet_hours_start", "quiet_hours_end")
    @classmethod
    def check_quiet_hours(cls, v: str | None) -> str | None:
        if v is None or not v.strip():
            return None
        cleaned = v.strip()
        if not re.match(r"^([01]\d|2[0-3]):[0-5]\d$", cleaned):
            raise ValueError(f"Time must be in 24-hour HH:MM format (00:00 - 23:59), got '{v}'.")
        return cleaned

class UserPreferencesResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str | None = None
    user_id: str
    currency: str = "INR"
    theme_preference: str = "dark"
    accent_color: str = "indigo"
    ui_density: str = "comfortable"
    density: str = "comfortable"
    language: str = "en"
    timezone: str = "Asia/Kolkata"
    start_day_of_week: str = "Monday"
    week_start_day: str = "Monday"
    default_transaction_type: str = "Expense"
    default_payment_mode: str = "UPI"
    default_location: str = "Bangalore"
    default_category: str = "Food"
    monthly_income_target: float = 0.0
    monthly_expense_target: float = 0.0
    savings_rate_target: float = 20.0
    enable_confetti: bool = True
    confetti_enabled: bool = True
    enable_onboarding_tour: bool = True
    onboarding_tour_enabled: bool = True
    enable_compact_tables: bool = False
    compact_tables: bool = False
    notifications_enabled: bool = True
    master_notifications: bool = True
    budget_alerts_enabled: bool = True
    budget_alerts: bool = True
    recurring_bill_reminders_enabled: bool = True
    recurring_reminders: bool = True
    goal_milestone_notifications_enabled: bool = True
    milestone_alerts: bool = True
    weekly_summary_enabled: bool = True
    weekly_summary: bool = True
    quiet_hours_enabled: bool = False
    quiet_hours_start: str = "22:00"
    quiet_hours_end: str = "08:00"
    dashboard_layout: str = ""
    created_at: str | None = None
    updated_at: str | None = None

class PrintableReportResponse(BaseModel):
    report_title: str = "FinFlow Personal Financial Report"
    generated_at: str
    user_id: str
    currency: str
    summary: SummaryResponse
    category_breakdown: list[CategoryAnalyticsItem]
    monthly_trends: list[MonthlyAnalyticsItem]
    active_budgets: list[BudgetResponse]
    upcoming_bills: list[RecurringItemResponse]
    goals_progress: list[GoalResponse]
    disclaimer: str = "This document is an algorithmic financial summary for personal record-keeping only."


# ==============================================================================
# Offline Local Auth Session Models
# ==============================================================================

class LocalAuthRequest(BaseModel):
    email: str
    password: str | None = None
    full_name: str | None = None

class LocalAuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict[str, Any]
