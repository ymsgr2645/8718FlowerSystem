"""
備品 API
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date

from app.database import get_db
from app.models.supplies import Supply, SupplyTransfer
from app.schemas.supplies import (
    SupplyResponse, SupplyCreate, SupplyUpdate,
    SupplyTransferCreate, SupplyTransferResponse,
    SupplyReorderRequest
)

router = APIRouter()


@router.get("/", response_model=List[SupplyResponse])
def get_supplies(
    is_active: Optional[bool] = True,
    include_inactive: bool = False,
    db: Session = Depends(get_db)
):
    query = db.query(Supply)
    if include_inactive:
        # 全件取得：有効を先に、無効を後ろに
        pass
    elif is_active is not None:
        query = query.filter(Supply.is_active == is_active)
    # sort_order順、その中で無効なものを後ろに
    return query.order_by(Supply.is_active.desc(), Supply.sort_order.asc(), Supply.id.asc()).all()


@router.post("/", response_model=SupplyResponse)
def create_supply(supply: SupplyCreate, db: Session = Depends(get_db)):
    db_supply = Supply(**supply.model_dump())
    db.add(db_supply)
    db.commit()
    db.refresh(db_supply)
    return db_supply


@router.put("/{supply_id}", response_model=SupplyResponse)
def update_supply(supply_id: int, supply: SupplyUpdate, db: Session = Depends(get_db)):
    db_supply = db.query(Supply).filter(Supply.id == supply_id).first()
    if not db_supply:
        raise HTTPException(status_code=404, detail="Supply not found")

    update_data = supply.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_supply, key, value)
    db.commit()
    db.refresh(db_supply)
    return db_supply


@router.delete("/{supply_id}")
def delete_supply(supply_id: int, db: Session = Depends(get_db)):
    """資材を削除（関連データも全て削除）"""
    from app.models.supplies import SupplyPriceChange
    db_supply = db.query(Supply).filter(Supply.id == supply_id).first()
    if not db_supply:
        raise HTTPException(status_code=404, detail="Supply not found")

    db.query(SupplyPriceChange).filter(SupplyPriceChange.supply_id == supply_id).delete()
    db.query(SupplyTransfer).filter(SupplyTransfer.supply_id == supply_id).delete()
    db.delete(db_supply)
    db.commit()
    return {"status": "ok", "deleted_id": supply_id}


@router.post("/reorder")
def reorder_supplies(request: SupplyReorderRequest, db: Session = Depends(get_db)):
    """資材の表示順を一括更新"""
    for item in request.items:
        db_supply = db.query(Supply).filter(Supply.id == item.id).first()
        if db_supply:
            db_supply.sort_order = item.sort_order
    db.commit()
    return {"status": "ok", "updated": len(request.items)}


@router.get("/transfers", response_model=List[SupplyTransferResponse])
def get_supply_transfers(
    store_id: Optional[int] = None,
    supply_id: Optional[int] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    query = db.query(SupplyTransfer)
    if store_id:
        query = query.filter(SupplyTransfer.store_id == store_id)
    if supply_id:
        query = query.filter(SupplyTransfer.supply_id == supply_id)
    if date_from:
        query = query.filter(SupplyTransfer.transferred_at >= date_from)
    if date_to:
        query = query.filter(SupplyTransfer.transferred_at <= date_to)
    return query.order_by(SupplyTransfer.transferred_at.desc()).offset(skip).limit(limit).all()


@router.post("/transfers", response_model=SupplyTransferResponse)
def create_supply_transfer(transfer: SupplyTransferCreate, db: Session = Depends(get_db)):
    supply = db.query(Supply).filter(Supply.id == transfer.supply_id).first()
    if not supply:
        raise HTTPException(status_code=404, detail="Supply not found")
    if transfer.quantity <= 0:
        raise HTTPException(status_code=400, detail="Quantity must be positive")
    if transfer.unit_price < 0:
        raise HTTPException(status_code=400, detail="Unit price must be non-negative")

    # 在庫チェック
    current_stock = supply.stock_quantity or 0
    if transfer.quantity > current_stock:
        raise HTTPException(
            status_code=400,
            detail=f"在庫不足: {supply.name}の在庫は{current_stock}個です（要求: {transfer.quantity}個）"
        )

    # 在庫を減らす
    supply.stock_quantity = current_stock - transfer.quantity

    db_transfer = SupplyTransfer(**transfer.model_dump())
    db.add(db_transfer)
    db.commit()
    db.refresh(db_transfer)
    return db_transfer


@router.post("/{supply_id}/add-stock")
def add_supply_stock(supply_id: int, quantity: int, db: Session = Depends(get_db)):
    """入庫: 在庫を追加"""
    supply = db.query(Supply).filter(Supply.id == supply_id).first()
    if not supply:
        raise HTTPException(status_code=404, detail="Supply not found")
    if quantity <= 0:
        raise HTTPException(status_code=400, detail="Quantity must be positive")

    current_stock = supply.stock_quantity or 0
    supply.stock_quantity = current_stock + quantity
    db.commit()
    db.refresh(supply)
    return {"id": supply.id, "name": supply.name, "stock_quantity": supply.stock_quantity}
