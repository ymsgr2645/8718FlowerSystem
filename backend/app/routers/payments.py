"""
入金管理 API
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from typing import List, Optional
from datetime import date
from decimal import Decimal
from pydantic import BaseModel

from app.database import get_db
from app.models.payments import Payment
from app.models.invoices import Invoice
from app.models.stores import Store

router = APIRouter()


class PaymentCreate(BaseModel):
    invoice_id: int
    amount: Decimal
    payment_date: date
    payment_method: str = "transfer"
    bank_name: Optional[str] = None
    note: Optional[str] = None


class PaymentResponse(BaseModel):
    id: int
    invoice_id: int
    amount: Decimal
    payment_date: date
    payment_method: Optional[str] = None
    bank_name: Optional[str] = None
    note: Optional[str] = None

    class Config:
        from_attributes = True


@router.get("/", response_model=List[PaymentResponse])
def get_payments(
    invoice_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """入金一覧"""
    query = db.query(Payment)
    if invoice_id:
        query = query.filter(Payment.invoice_id == invoice_id)
    return query.order_by(Payment.payment_date.desc()).all()


@router.post("/", response_model=PaymentResponse)
def create_payment(req: PaymentCreate, db: Session = Depends(get_db)):
    """入金登録"""
    invoice = db.query(Invoice).filter(Invoice.id == req.invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    payment = Payment(
        invoice_id=req.invoice_id,
        amount=req.amount,
        payment_date=req.payment_date,
        payment_method=req.payment_method,
        bank_name=req.bank_name,
        note=req.note,
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)
    return payment


@router.get("/confirmation")
def get_payment_confirmation(
    year: int,
    month: int,
    db: Session = Depends(get_db)
):
    """入金確認票 - 請求 vs 入金の差額追跡"""
    invoices = (
        db.query(Invoice)
        .filter(
            extract("year", Invoice.period_end) == year,
            extract("month", Invoice.period_end) == month,
        )
        .all()
    )

    rows = []
    for inv in invoices:
        store = db.query(Store).filter(Store.id == inv.store_id).first()
        paid_total = (
            db.query(func.sum(Payment.amount))
            .filter(Payment.invoice_id == inv.id)
            .scalar() or Decimal(0)
        )
        rows.append({
            "invoice_id": inv.id,
            "invoice_number": inv.invoice_number,
            "store_name": store.name if store else "",
            "period": f"{inv.period_start} ~ {inv.period_end}",
            "billed_amount": float(inv.total_amount),
            "paid_amount": float(paid_total),
            "difference": float(inv.total_amount - paid_total),
            "status": inv.status,
        })

    return {
        "year": year,
        "month": month,
        "items": rows,
        "total_billed": sum(r["billed_amount"] for r in rows),
        "total_paid": sum(r["paid_amount"] for r in rows),
        "total_difference": sum(r["difference"] for r in rows),
    }
