"""
在庫・入荷・調整・廃棄 API
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime, timedelta, date, time

from app.database import get_db
from app.models.inventory import Inventory, Arrival, InventoryAdjustment, Disposal
from app.models.items import Item
from app.models.settings import Setting
from app.schemas.inventory import (
    InventoryResponse, ArrivalCreate, ArrivalResponse,
    InventoryAdjustmentCreate, InventoryAdjustmentResponse,
    LongTermAlertResponse, DisposalCreate, DisposalResponse
)

router = APIRouter()


@router.get("/", response_model=List[InventoryResponse])
def get_inventory(
    skip: int = 0,
    limit: int = 100,
    low_stock: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    """倉庫在庫一覧"""
    query = db.query(Inventory).join(Item).filter(Item.is_active == True)

    if low_stock:
        query = query.filter(Inventory.quantity < 10)

    return query.offset(skip).limit(limit).all()


@router.get("/item/{item_id}", response_model=InventoryResponse)
def get_inventory_by_item(item_id: int, db: Session = Depends(get_db)):
    inventory = db.query(Inventory).filter(Inventory.item_id == item_id).first()
    if not inventory:
        raise HTTPException(status_code=404, detail="Inventory not found")
    return inventory


@router.get("/arrivals", response_model=List[ArrivalResponse])
def get_arrivals(
    item_id: Optional[int] = None,
    supplier_id: Optional[int] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """入荷履歴一覧"""
    query = db.query(Arrival)
    if item_id:
        query = query.filter(Arrival.item_id == item_id)
    if supplier_id:
        query = query.filter(Arrival.supplier_id == supplier_id)
    if date_from:
        query = query.filter(Arrival.arrived_at >= datetime.combine(date_from, time.min))
    if date_to:
        query = query.filter(Arrival.arrived_at <= datetime.combine(date_to, time.max))

    return query.order_by(Arrival.arrived_at.desc()).offset(skip).limit(limit).all()


@router.post("/arrivals", response_model=ArrivalResponse)
def create_arrival(arrival: ArrivalCreate, db: Session = Depends(get_db)):
    """入荷登録"""
    item = db.query(Item).filter(Item.id == arrival.item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    if arrival.quantity <= 0:
        raise HTTPException(status_code=400, detail="Quantity must be positive")

    db_arrival = Arrival(
        item_id=arrival.item_id,
        supplier_id=arrival.supplier_id,
        quantity=arrival.quantity,
        wholesale_price=arrival.wholesale_price,
        source_type=arrival.source_type or "manual",
        arrived_at=arrival.arrived_at or None,
    )
    db.add(db_arrival)

    inventory = db.query(Inventory).filter(Inventory.item_id == arrival.item_id).first()
    if inventory:
        inventory.quantity += arrival.quantity
    else:
        inventory = Inventory(
            item_id=arrival.item_id,
            quantity=arrival.quantity,
            unit_price=item.default_unit_price,
        )
        db.add(inventory)

    db.commit()
    db.refresh(db_arrival)
    return db_arrival


@router.get("/adjustments", response_model=List[InventoryAdjustmentResponse])
def get_adjustments(
    item_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """在庫調整履歴"""
    query = db.query(InventoryAdjustment)
    if item_id:
        query = query.filter(InventoryAdjustment.item_id == item_id)
    return query.order_by(InventoryAdjustment.adjusted_at.desc()).offset(skip).limit(limit).all()


@router.post("/adjustments", response_model=InventoryAdjustmentResponse)
def create_adjustment(
    adjustment: InventoryAdjustmentCreate,
    db: Session = Depends(get_db)
):
    """在庫調整登録"""
    item = db.query(Item).filter(Item.id == adjustment.item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    if adjustment.quantity == 0:
        raise HTTPException(status_code=400, detail="Quantity must not be zero")

    db_adjustment = InventoryAdjustment(
        item_id=adjustment.item_id,
        adjustment_type=adjustment.adjustment_type,
        quantity=adjustment.quantity,
        reason=adjustment.reason,
        note=adjustment.note,
        adjusted_by=adjustment.adjusted_by,
    )
    db.add(db_adjustment)

    inventory = db.query(Inventory).filter(Inventory.item_id == adjustment.item_id).first()
    if inventory:
        inventory.quantity += adjustment.quantity

    db.commit()
    db.refresh(db_adjustment)
    return db_adjustment


@router.get("/disposals", response_model=List[DisposalResponse])
def get_disposals(
    item_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """廃棄・ロス一覧"""
    query = db.query(Disposal)
    if item_id:
        query = query.filter(Disposal.item_id == item_id)
    return query.order_by(Disposal.disposed_at.desc()).offset(skip).limit(limit).all()


@router.post("/disposals", response_model=DisposalResponse)
def create_disposal(disposal: DisposalCreate, db: Session = Depends(get_db)):
    """廃棄・ロス登録"""
    item = db.query(Item).filter(Item.id == disposal.item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    if disposal.quantity <= 0:
        raise HTTPException(status_code=400, detail="Quantity must be positive")

    inventory = db.query(Inventory).filter(Inventory.item_id == disposal.item_id).first()
    if not inventory or inventory.quantity < disposal.quantity:
        raise HTTPException(status_code=400, detail="Insufficient inventory")

    db_disposal = Disposal(
        item_id=disposal.item_id,
        quantity=disposal.quantity,
        reason=disposal.reason,
        note=disposal.note,
        disposed_by=disposal.disposed_by,
    )
    db.add(db_disposal)
    inventory.quantity -= disposal.quantity

    db.commit()
    db.refresh(db_disposal)
    return db_disposal


@router.get("/long-term-alerts", response_model=List[LongTermAlertResponse])
def get_long_term_alerts(days: Optional[int] = None, db: Session = Depends(get_db)):
    """長期在庫アラート"""
    setting = db.query(Setting).filter(Setting.key == "inventory_alert_days").first()
    alert_days = days if days is not None else int(setting.value) if setting else 5

    threshold_date = datetime.now() - timedelta(days=alert_days)

    alerts = (
        db.query(
            Arrival.item_id,
            Item.name,
            Item.item_code,
            Arrival.arrived_at,
            Inventory.quantity,
            func.julianday(func.now()) - func.julianday(Arrival.arrived_at)
        )
        .join(Item, Arrival.item_id == Item.id)
        .join(Inventory, Inventory.item_id == Item.id)
        .filter(Arrival.arrived_at < threshold_date)
        .filter(Inventory.quantity > 0)
        .group_by(Arrival.item_id)
        .all()
    )

    return [
        {
            "item_id": a[0],
            "item_name": a[1],
            "item_code": a[2],
            "arrived_at": a[3],
            "quantity": a[4],
            "days_in_stock": int(a[5]) if a[5] else 0,
        }
        for a in alerts
    ]


# Backward compatible path
@router.get("/alerts/long-term", response_model=List[LongTermAlertResponse])
def get_long_term_alerts_compat(db: Session = Depends(get_db)):
    return get_long_term_alerts(db)
