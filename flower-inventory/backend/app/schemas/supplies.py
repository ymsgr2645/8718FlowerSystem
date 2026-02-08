from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime
from decimal import Decimal


class SupplyResponse(BaseModel):
    id: int
    name: str
    specification: Optional[str] = None
    unit_price: Optional[Decimal] = None
    category: Optional[str] = None
    stock_quantity: Optional[int] = 0  # 現在庫
    sort_order: Optional[int] = 0  # 表示順序
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class SupplyCreate(BaseModel):
    name: str
    specification: Optional[str] = None
    unit_price: Optional[Decimal] = None
    category: Optional[str] = None


class SupplyUpdate(BaseModel):
    name: Optional[str] = None
    specification: Optional[str] = None
    unit_price: Optional[Decimal] = None
    category: Optional[str] = None
    sort_order: Optional[int] = None
    is_active: Optional[bool] = None


class SupplyReorderItem(BaseModel):
    id: int
    sort_order: int


class SupplyReorderRequest(BaseModel):
    items: List[SupplyReorderItem]


class SupplyTransferCreate(BaseModel):
    store_id: int
    supply_id: int
    quantity: int
    unit_price: Decimal
    transferred_at: date
    input_by: Optional[int] = None


class SupplyTransferResponse(BaseModel):
    id: int
    store_id: int
    supply_id: int
    quantity: int
    unit_price: Decimal
    transferred_at: date
    input_by: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True
