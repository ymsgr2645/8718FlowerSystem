from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class StoreBase(BaseModel):
    name: str
    operation_type: str  # headquarters / franchise
    store_type: str      # store / online / consignment
    email: Optional[str] = None
    color: Optional[str] = None  # 店舗カラー (hex)


class StoreCreate(StoreBase):
    pass


class StoreUpdate(BaseModel):
    name: Optional[str] = None
    operation_type: Optional[str] = None
    store_type: Optional[str] = None
    email: Optional[str] = None
    color: Optional[str] = None
    is_active: Optional[bool] = None
    sort_order: Optional[int] = None


class StoreResponse(StoreBase):
    id: int
    sort_order: Optional[int] = 99
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class ReorderItem(BaseModel):
    id: int
    sort_order: int


class ReorderRequest(BaseModel):
    items: List[ReorderItem]
