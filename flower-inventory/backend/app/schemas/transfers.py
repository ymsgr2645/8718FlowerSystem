from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date
from decimal import Decimal


class TransferCreate(BaseModel):
    store_id: int
    item_id: int
    quantity: int
    unit_price: Decimal
    wholesale_price: Optional[Decimal] = None
    transferred_at: date
    input_by: Optional[int] = None


class TransferResponse(BaseModel):
    id: int
    store_id: int
    item_id: int
    quantity: int
    unit_price: Decimal
    wholesale_price: Optional[Decimal] = None
    margin: Optional[Decimal] = None
    transferred_at: date
    input_by: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


class PriceChangeResponse(BaseModel):
    id: int
    item_id: int
    old_price: Optional[Decimal] = None
    new_price: Decimal
    changed_by: Optional[int] = None
    changed_at: datetime
    reason: Optional[str] = None

    class Config:
        from_attributes = True
