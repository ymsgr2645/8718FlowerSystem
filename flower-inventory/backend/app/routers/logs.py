"""
エラーアラート API
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.database import get_db
from app.models.logs import ErrorAlert
from app.schemas.logs import ErrorAlertCreate, ErrorAlertResponse, ErrorAlertResolve

router = APIRouter()


@router.get("/", response_model=List[ErrorAlertResponse])
def get_alerts(
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 200,
    db: Session = Depends(get_db)
):
    query = db.query(ErrorAlert)
    if status:
        query = query.filter(ErrorAlert.status == status)
    return query.order_by(ErrorAlert.created_at.desc()).offset(skip).limit(limit).all()


@router.post("/", response_model=ErrorAlertResponse)
def create_alert(alert: ErrorAlertCreate, db: Session = Depends(get_db)):
    db_alert = ErrorAlert(
        type=alert.type,
        message=alert.message,
        detail=alert.detail,
        status="pending",
    )
    db.add(db_alert)
    db.commit()
    db.refresh(db_alert)
    return db_alert


@router.patch("/{alert_id}/resolve", response_model=ErrorAlertResponse)
def resolve_alert(alert_id: int, payload: ErrorAlertResolve, db: Session = Depends(get_db)):
    db_alert = db.query(ErrorAlert).filter(ErrorAlert.id == alert_id).first()
    if not db_alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    db_alert.status = "resolved"
    db_alert.resolved_by = payload.resolved_by
    db_alert.resolved_at = datetime.now()
    db.commit()
    db.refresh(db_alert)
    return db_alert
