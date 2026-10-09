from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class TransactionCreate(BaseModel):
    date: str
    transaction_type: str = Field(..., description="'Income' or 'Expense'")
    category: str
    amount: float = Field(..., gt=0)
    payment_mode: str
    location: str
    notes: Optional[str] = None

class TransactionUpdate(BaseModel):
    date: Optional[str] = None
    transaction_type: Optional[str] = None
    category: Optional[str] = None
    amount: Optional[float] = None
    payment_mode: Optional[str] = None
    location: Optional[str] = None
    notes: Optional[str] = None

class TransactionResponse(BaseModel):
    id: str
    user_id: str
    date: str
    transaction_type: str
    category: str
    amount: float
    payment_mode: str
    location: str
    notes: Optional[str] = None
    created_at: Optional[str] = None

class TransactionListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    transactions: List[TransactionResponse]

class BulkDeleteRequest(BaseModel):
    transaction_ids: List[str]

class SummaryResponse(BaseModel):
    total_income: float
    total_expense: float
    net_savings: float
    savings_rate: float
    transaction_count: int

class MonthlyAnalyticsItem(BaseModel):
    month: str # e.g. "2024-01" or "Jan 2024"
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
    top_categories: List[CategoryAnalyticsItem]
    top_locations: List[LocationAnalyticsItem]

class PredictRequest(BaseModel):
    amount: float
    date: str # YYYY-MM-DD
    payment_mode: str
    location: str

class PredictResponse(BaseModel):
    prediction: str # 'Income' or 'Expense'
    confidence: float # e.g. 0.95
    income_probability: float
    expense_probability: float
    amount: float
    date: str
    payment_mode: str
    location: str

class ModelInsightsResponse(BaseModel):
    accuracy: float
    expense_precision: float
    expense_recall: float
    income_precision: float
    income_recall: float
    confusion_matrix: List[List[int]]
    feature_importances: List[Dict[str, Any]]
    total_samples: int
    feature_columns: List[str]

# === Phase 7: Budgets ===
class BudgetCreate(BaseModel):
    category: str
    monthly_limit: float = Field(..., gt=0)
    month: int
    year: int

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

# === Phase 7: Savings Goals ===
class GoalCreate(BaseModel):
    title: str
    target_amount: float = Field(..., gt=0)
    current_amount: float = Field(default=0.0, ge=0)
    deadline: Optional[str] = None
    category: Optional[str] = None

class GoalContribute(BaseModel):
    amount: float = Field(..., gt=0)

class GoalResponse(BaseModel):
    id: str
    user_id: str
    title: str
    target_amount: float
    current_amount: float
    deadline: Optional[str] = None
    category: Optional[str] = None
    percentage: float = 0.0
    remaining: float = 0.0

# === Phase 7: Recurring Transactions ===
class RecurringItemCreate(BaseModel):
    title: str
    amount: float = Field(..., gt=0)
    transaction_type: str = Field(..., description="'Income' or 'Expense'")
    category: str
    frequency: str = "Monthly"
    next_due_date: str
    is_active: bool = True

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

# === Phase 7: Notifications ===
class NotificationResponse(BaseModel):
    id: str
    user_id: str
    title: str
    message: str
    notification_type: str
    is_read: bool
    created_at: str

# === Phase 7: Profile & Settings ===
class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    currency: Optional[str] = None
    theme_preference: Optional[str] = None
    accent_color: Optional[str] = None

class ProfileResponse(BaseModel):
    id: str
    email: str
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    currency: str = "INR"
    theme_preference: str = "dark"
    accent_color: str = "indigo"

