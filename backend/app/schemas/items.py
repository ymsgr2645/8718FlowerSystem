from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from decimal import Decimal


class ItemBase(BaseModel):
    name: str
    variety: Optional[str] = None
    category: Optional[str] = None
    default_unit_price: Optional[Decimal] = None
    tax_rate: Optional[Decimal] = 0.10


class ItemCreate(ItemBase):
    item_code: Optional[str] = None  # 4桁コード（省略時は自動生成）


class ItemUpdate(BaseModel):
    name: Optional[str] = None
    variety: Optional[str] = None
    category: Optional[str] = None
    default_unit_price: Optional[Decimal] = None
    tax_rate: Optional[Decimal] = None
    is_active: Optional[bool] = None


class ItemResponse(ItemBase):
    id: int
    item_code: str
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
