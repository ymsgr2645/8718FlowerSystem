from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from decimal import Decimal


class ExpenseCreate(BaseModel):
    store_id: int
    category: str
    year_month: str  # YYYY-MM
    amount: Decimal
    billing_method: str  # invoice/transfer
    invoice_no: Optional[str] = None
    note: Optional[str] = None
    created_by: Optional[int] = None


class ExpenseResponse(BaseModel):
    id: int
    store_id: int
    category: str
    year_month: str
    amount: Decimal
    billing_method: str
    invoice_no: Optional[str] = None
    note: Optional[str] = None
    created_by: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True
