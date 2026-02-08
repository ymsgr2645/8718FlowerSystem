from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date
from decimal import Decimal


class InvoiceItemResponse(BaseModel):
    id: int
    item_id: Optional[int] = None
    item_name: str
    quantity: int
    unit_price: Decimal
    subtotal: Decimal
    tax_rate: Decimal
    transferred_at: Optional[date] = None

    class Config:
        from_attributes = True


class InvoiceCreate(BaseModel):
    store_id: int
    invoice_type: str  # flower/supply/contractor
    period_start: date
    period_end: date
    prev_invoice_amount: Optional[Decimal] = 0
    prev_payment_amount: Optional[Decimal] = 0
    carryover_amount: Optional[Decimal] = 0


class InvoiceGenerateRequest(BaseModel):
    store_id: int
    invoice_type: str = "flower"  # flower/supply/contractor
    period_start: date
    period_end: date
    prev_invoice_amount: Optional[Decimal] = 0
    prev_payment_amount: Optional[Decimal] = 0
    carryover_amount: Optional[Decimal] = 0
    created_by: Optional[int] = None


class InvoiceResponse(BaseModel):
    id: int
    store_id: int
    invoice_number: str
    invoice_type: str
    period_start: date
    period_end: date
    prev_invoice_amount: Decimal
    prev_payment_amount: Decimal
    carryover_amount: Decimal
    subtotal_10: Decimal
    tax_amount_10: Decimal
    subtotal_08: Decimal
    tax_amount_08: Decimal
    total_amount: Decimal
    status: str
    pdf_path: Optional[str] = None
    sent_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class InvoiceDetailResponse(InvoiceResponse):
    items: List[InvoiceItemResponse] = []

    class Config:
        from_attributes = True
