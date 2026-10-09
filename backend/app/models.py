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
