"""
持ち出し API
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import date

from app.database import get_db
from app.models.transfers import Transfer, PriceChange
from app.models.inventory import Inventory, Arrival
from app.models.items import Item
from app.schemas.transfers import TransferCreate, TransferResponse, PriceChangeCreate, PriceChangeResponse

router = APIRouter()


@router.get("/", response_model=List[TransferResponse])
def get_transfers(
    store_id: Optional[int] = None,
    item_id: Optional[int] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """持ち出し一覧"""
    query = db.query(Transfer)

    if store_id:
        query = query.filter(Transfer.store_id == store_id)
    if item_id:
        query = query.filter(Transfer.item_id == item_id)
    if date_from:
        query = query.filter(Transfer.transferred_at >= date_from)
    if date_to:
        query = query.filter(Transfer.transferred_at <= date_to)

    return query.order_by(Transfer.transferred_at.desc()).offset(skip).limit(limit).all()


@router.post("/", response_model=TransferResponse)
def create_transfer(transfer: TransferCreate, db: Session = Depends(get_db)):
    """持ち出し登録"""
    item = db.query(Item).filter(Item.id == transfer.item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    if transfer.quantity <= 0:
        raise HTTPException(status_code=400, detail="Quantity must be positive")
    if transfer.unit_price < 0:
        raise HTTPException(status_code=400, detail="Unit price must be non-negative")
    if transfer.wholesale_price is not None and transfer.wholesale_price < 0:
        raise HTTPException(status_code=400, detail="Wholesale price must be non-negative")

    # 入荷ロット単位の在庫チェック
    if transfer.arrival_id:
        arrival = db.query(Arrival).filter(Arrival.id == transfer.arrival_id).first()
        if not arrival:
            raise HTTPException(status_code=404, detail="Arrival not found")
        remaining = arrival.remaining_quantity if arrival.remaining_quantity is not None else arrival.quantity
        if remaining < transfer.quantity:
            raise HTTPException(status_code=400, detail=f"ロット残数不足 (残: {remaining}, 要求: {transfer.quantity})")

    # アイテム全体の在庫も更新（集計用）
    inventory = db.query(Inventory).filter(Inventory.item_id == transfer.item_id).first()
    if not inventory:
        total_arrived = db.query(func.coalesce(func.sum(Arrival.quantity), 0)).filter(
            Arrival.item_id == transfer.item_id
        ).scalar()
        total_transferred = db.query(func.coalesce(func.sum(Transfer.quantity), 0)).filter(
            Transfer.item_id == transfer.item_id
        ).scalar()
        available = int(total_arrived) - int(total_transferred)
        inventory = Inventory(
            item_id=transfer.item_id,
            quantity=max(0, available),
            unit_price=transfer.unit_price,
        )
        db.add(inventory)
        db.flush()

    margin = None
    if transfer.unit_price and transfer.wholesale_price:
        margin = (float(transfer.unit_price) - float(transfer.wholesale_price)) * transfer.quantity

    db_transfer = Transfer(
        store_id=transfer.store_id,
        item_id=transfer.item_id,
        arrival_id=transfer.arrival_id,
        quantity=transfer.quantity,
        unit_price=transfer.unit_price,
        wholesale_price=transfer.wholesale_price,
        margin=margin,
        transferred_at=transfer.transferred_at,
        input_by=transfer.input_by,
    )
    db.add(db_transfer)

    # 入荷ロットの残数を減らす
    if transfer.arrival_id and arrival:
        if arrival.remaining_quantity is not None:
            arrival.remaining_quantity -= transfer.quantity
        else:
            arrival.remaining_quantity = arrival.quantity - transfer.quantity

    # アイテム全体の在庫も減らす
    inventory.quantity -= transfer.quantity

    db.commit()
    db.refresh(db_transfer)
    return db_transfer


@router.get("/store/{store_id}", response_model=List[TransferResponse])
def get_transfers_by_store(
    store_id: int,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    db: Session = Depends(get_db)
):
    """店舗別持ち出し"""
    query = db.query(Transfer).filter(Transfer.store_id == store_id)
    if date_from:
        query = query.filter(Transfer.transferred_at >= date_from)
    if date_to:
        query = query.filter(Transfer.transferred_at <= date_to)
    return query.order_by(Transfer.transferred_at.desc()).all()


@router.get("/by-store/{store_id}", response_model=List[TransferResponse])
def get_transfers_by_store_compat(
    store_id: int,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    db: Session = Depends(get_db)
):
    return get_transfers_by_store(store_id, date_from, date_to, db)


@router.get("/price-changes/{item_id}", response_model=List[PriceChangeResponse])
def get_price_changes(item_id: int, db: Session = Depends(get_db)):
    """単価変更履歴"""
    return (
        db.query(PriceChange)
        .filter(PriceChange.item_id == item_id)
        .order_by(PriceChange.changed_at.desc())
        .all()
    )


@router.post("/price-changes", response_model=PriceChangeResponse)
def create_price_change(data: PriceChangeCreate, db: Session = Depends(get_db)):
    """単価変更を保存"""
    pc = PriceChange(
        item_id=data.item_id,
        old_price=data.old_price,
        new_price=data.new_price,
        reason=data.reason,
    )
    db.add(pc)
    db.commit()
    db.refresh(pc)
    return pc


@router.get("/price-changes-latest", response_model=dict)
def get_latest_prices(db: Session = Depends(get_db)):
    """全アイテムの最新単価をitem_id -> priceのマップで返す"""
    from sqlalchemy import distinct
    item_ids = db.query(distinct(PriceChange.item_id)).all()
    result = {}
    for (item_id,) in item_ids:
        latest = (
            db.query(PriceChange)
            .filter(PriceChange.item_id == item_id)
            .order_by(PriceChange.changed_at.desc())
            .first()
        )
        if latest:
            result[str(item_id)] = float(latest.new_price)
    return result
