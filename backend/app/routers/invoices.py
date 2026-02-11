"""
請求書 API（インボイス対応）
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date, datetime
import math

from app.database import get_db
from app.models.invoices import Invoice, InvoiceItem
from app.models.transfers import Transfer
from app.models.supplies import SupplyTransfer, Supply
from app.models.stores import Store
from app.models.settings import Setting
from app.schemas.invoices import (
    InvoiceResponse, InvoiceDetailResponse,
    InvoiceGenerateRequest
)

router = APIRouter()


def generate_invoice_number(store_id: int, period_end: date, db: Session) -> str:
    """請求書番号を生成"""
    setting = db.query(Setting).filter(Setting.key == "invoice_number_format").first()
    format_str = setting.value if setting else "{year}-{month:02d}-{day:02d}-{seq:03d}"

    count = db.query(Invoice).filter(
        Invoice.period_end == period_end,
        Invoice.store_id == store_id
    ).count()

    return format_str.format(
        year=period_end.year,
        month=period_end.month,
        day=period_end.day,
        seq=count + 1
    )


@router.get("/", response_model=List[InvoiceResponse])
def get_invoices(
    store_id: Optional[int] = None,
    invoice_type: Optional[str] = None,
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """請求書一覧"""
    query = db.query(Invoice)

    if store_id:
        query = query.filter(Invoice.store_id == store_id)
    if invoice_type:
        query = query.filter(Invoice.invoice_type == invoice_type)
    if status:
        query = query.filter(Invoice.status == status)

    return query.order_by(Invoice.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/{invoice_id}", response_model=InvoiceDetailResponse)
def get_invoice(invoice_id: int, db: Session = Depends(get_db)):
    """請求書詳細"""
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return invoice


@router.post("/generate", response_model=InvoiceResponse)
def generate_invoice(request: InvoiceGenerateRequest, db: Session = Depends(get_db)):
    """請求書生成（花/備品）"""
    store = db.query(Store).filter(Store.id == request.store_id).first()
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")

    rounding_setting = db.query(Setting).filter(Setting.key == "tax_rounding").first()
    rounding = rounding_setting.value if rounding_setting else "floor"

    def apply_rounding(value: float) -> float:
        if rounding == "floor":
            return math.floor(value)
        if rounding == "ceil":
            return math.ceil(value)
        return round(value)

    invoice_number = generate_invoice_number(request.store_id, request.period_end, db)

    invoice = Invoice(
        store_id=request.store_id,
        invoice_number=invoice_number,
        invoice_type=request.invoice_type,
        period_start=request.period_start,
        period_end=request.period_end,
        prev_invoice_amount=request.prev_invoice_amount or 0,
        prev_payment_amount=request.prev_payment_amount or 0,
        carryover_amount=request.carryover_amount or 0,
        status="draft",
        created_by=request.created_by,
        total_amount=0,
    )
    db.add(invoice)
    db.flush()

    subtotal_10 = 0
    subtotal_08 = 0

    if request.invoice_type == "supply":
        transfers = (
            db.query(SupplyTransfer)
            .filter(SupplyTransfer.store_id == request.store_id)
            .filter(SupplyTransfer.transferred_at >= request.period_start)
            .filter(SupplyTransfer.transferred_at <= request.period_end)
            .all()
        )
        if not transfers:
            raise HTTPException(status_code=400, detail="No supply transfers found for this period")

        for transfer in transfers:
            subtotal = float(transfer.unit_price) * transfer.quantity
            tax_rate = 0.10
            subtotal_10 += subtotal
            supply = db.query(Supply).filter(Supply.id == transfer.supply_id).first()
            item_line = InvoiceItem(
                invoice_id=invoice.id,
                item_id=None,
                item_name=supply.name if supply else "備品",
                quantity=transfer.quantity,
                unit_price=transfer.unit_price,
                subtotal=subtotal,
                tax_rate=tax_rate,
                transferred_at=transfer.transferred_at,
            )
            db.add(item_line)
    else:
        transfers = (
            db.query(Transfer)
            .filter(Transfer.store_id == request.store_id)
            .filter(Transfer.transferred_at >= request.period_start)
            .filter(Transfer.transferred_at <= request.period_end)
            .all()
        )
        if not transfers:
            raise HTTPException(status_code=400, detail="No transfers found for this period")

        for transfer in transfers:
            subtotal = float(transfer.unit_price) * transfer.quantity
            tax_rate = float(transfer.item.tax_rate) if transfer.item else 0.10
            if tax_rate == 0.10:
                subtotal_10 += subtotal
            else:
                subtotal_08 += subtotal

            item_line = InvoiceItem(
                invoice_id=invoice.id,
                item_id=transfer.item_id,
                item_name=transfer.item.name if transfer.item else "花",
                quantity=transfer.quantity,
                unit_price=transfer.unit_price,
                subtotal=subtotal,
                tax_rate=tax_rate,
                transferred_at=transfer.transferred_at,
            )
            db.add(item_line)

    tax_amount_10 = apply_rounding(subtotal_10 * 0.10)
    tax_amount_08 = apply_rounding(subtotal_08 * 0.08)

    invoice.subtotal_10 = subtotal_10
    invoice.tax_amount_10 = tax_amount_10
    invoice.subtotal_08 = subtotal_08
    invoice.tax_amount_08 = tax_amount_08
    invoice.total_amount = (
        subtotal_10 + tax_amount_10 +
        subtotal_08 + tax_amount_08 +
        float(invoice.carryover_amount or 0)
    )

    db.commit()
    db.refresh(invoice)
    return invoice


@router.patch("/{invoice_id}/status")
def update_invoice_status(
    invoice_id: int,
    status: str,
    db: Session = Depends(get_db)
):
    """請求書ステータス更新"""
    if status not in ["draft", "generated", "sent", "paid"]:
        raise HTTPException(status_code=400, detail="Invalid status")

    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    invoice.status = status
    if status == "sent":
        invoice.sent_at = datetime.now()

    db.commit()
    return {"message": f"Status updated to {status}"}
