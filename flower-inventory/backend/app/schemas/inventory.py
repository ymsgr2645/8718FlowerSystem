from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from decimal import Decimal


class InventoryResponse(BaseModel):
    id: int
    item_id: int
    quantity: int
    unit_price: Optional[Decimal] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ArrivalCreate(BaseModel):
    item_id: int
    supplier_id: Optional[int] = None
    quantity: int
    wholesale_price: Optional[Decimal] = None
    source_type: Optional[str] = "manual"
    arrived_at: Optional[datetime] = None


class ArrivalResponse(BaseModel):
    id: int
    item_id: int
    supplier_id: Optional[int] = None
    quantity: int
    wholesale_price: Optional[Decimal] = None
    arrived_at: datetime
    source_type: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class DisposalCreate(BaseModel):
    item_id: int
    quantity: int
    reason: Optional[str] = None
    note: Optional[str] = None
    disposed_by: Optional[int] = None


class DisposalResponse(BaseModel):
    id: int
    item_id: int
    quantity: int
    reason: Optional[str] = None
    note: Optional[str] = None
    disposed_by: Optional[int] = None
    disposed_at: datetime

    class Config:
        from_attributes = True


class InventoryAdjustmentCreate(BaseModel):
    item_id: int
    adjustment_type: str  # increase/decrease/correction
    quantity: int         # can be negative
    reason: Optional[str] = None
    note: Optional[str] = None
    adjusted_by: Optional[int] = None


class InventoryAdjustmentResponse(BaseModel):
    id: int
    item_id: int
    adjustment_type: str
    quantity: int
    reason: Optional[str] = None
    note: Optional[str] = None
    adjusted_by: Optional[int] = None
    adjusted_at: datetime

    class Config:
        from_attributes = True


class LongTermAlertResponse(BaseModel):
    item_id: int
    item_name: str
    item_code: str
    arrived_at: datetime
    quantity: int
    days_in_stock: int
