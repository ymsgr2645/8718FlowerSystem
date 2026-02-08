from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class StoreBase(BaseModel):
    name: str
    operation_type: str  # headquarters / franchise
    store_type: str      # store / online / consignment
    email: Optional[str] = None


class StoreCreate(StoreBase):
    pass


class StoreUpdate(BaseModel):
    name: Optional[str] = None
    operation_type: Optional[str] = None
    store_type: Optional[str] = None
    email: Optional[str] = None
    is_active: Optional[bool] = None


class StoreResponse(StoreBase):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True
