from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime
from decimal import Decimal


class SettingResponse(BaseModel):
    id: int
    key: str
    value: str
    description: Optional[str] = None
    updated_at: datetime

    class Config:
        from_attributes = True


class SettingUpdate(BaseModel):
    value: str


class TaxRateResponse(BaseModel):
    id: int
    name: str
    rate: Decimal
    effective_from: date
    is_default: bool
    is_active: bool

    class Config:
        from_attributes = True


class TaxRateCreate(BaseModel):
    name: str
    rate: Decimal
    effective_from: date
    is_default: bool = False
    is_active: bool = True


class SupplierResponse(BaseModel):
    id: int
    name: str
    email: Optional[str] = None
    csv_encoding: str
    csv_format: Optional[str] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class SupplierCreate(BaseModel):
    name: str
    email: Optional[str] = None
    csv_encoding: Optional[str] = "utf-8"
    csv_format: Optional[str] = None


class SupplierUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    csv_encoding: Optional[str] = None
    csv_format: Optional[str] = None
    is_active: Optional[bool] = None
