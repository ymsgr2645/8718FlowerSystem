from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime


class ErrorAlertCreate(BaseModel):
    type: str
    message: str
    detail: Optional[Dict[str, Any]] = None


class ErrorAlertResponse(BaseModel):
    id: int
    type: str
    message: str
    detail: Optional[Dict[str, Any]] = None
    status: str
    resolved_by: Optional[int] = None
    created_at: datetime
    resolved_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ErrorAlertResolve(BaseModel):
    resolved_by: Optional[int] = None
