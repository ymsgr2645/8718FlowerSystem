"""
店舗 API
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.stores import Store, INITIAL_STORES
from app.models.transfers import Transfer
from app.models.supplies import SupplyTransfer
from app.schemas.stores import StoreResponse, StoreCreate, StoreUpdate, ReorderRequest

router = APIRouter()


@router.get("/", response_model=List[StoreResponse])
def get_stores(db: Session = Depends(get_db)):
    return db.query(Store).filter(Store.is_active == True).order_by(Store.sort_order.asc()).all()


@router.get("/{store_id}", response_model=StoreResponse)
def get_store(store_id: int, db: Session = Depends(get_db)):
    store = db.query(Store).filter(Store.id == store_id).first()
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
    return store


@router.post("/", response_model=StoreResponse)
def create_store(store: StoreCreate, db: Session = Depends(get_db)):
    db_store = Store(**store.model_dump())
    db.add(db_store)
    db.commit()
    db.refresh(db_store)
    return db_store


@router.put("/{store_id}", response_model=StoreResponse)
def update_store(store_id: int, store: StoreUpdate, db: Session = Depends(get_db)):
    db_store = db.query(Store).filter(Store.id == store_id).first()
    if not db_store:
        raise HTTPException(status_code=404, detail="Store not found")
    update_data = store.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_store, key, value)
    db.commit()
    db.refresh(db_store)
    return db_store


@router.post("/reorder")
def reorder_stores(request: ReorderRequest, db: Session = Depends(get_db)):
    """店舗の表示順を一括更新"""
    for item in request.items:
        db_store = db.query(Store).filter(Store.id == item.id).first()
        if db_store:
            db_store.sort_order = item.sort_order
    db.commit()
    return {"status": "ok", "updated": len(request.items)}


@router.delete("/{store_id}")
def delete_store(store_id: int, db: Session = Depends(get_db)):
    """店舗を削除（関連データも全て削除）"""
    db_store = db.query(Store).filter(Store.id == store_id).first()
    if not db_store:
        raise HTTPException(status_code=404, detail="Store not found")

    db.query(Transfer).filter(Transfer.store_id == store_id).delete()
    db.query(SupplyTransfer).filter(SupplyTransfer.store_id == store_id).delete()
    db.delete(db_store)
    db.commit()
    return {"status": "ok", "deleted_id": store_id}


@router.post("/init")
def init_stores(db: Session = Depends(get_db)):
    for store_data in INITIAL_STORES:
        existing = db.query(Store).filter(Store.id == store_data["id"]).first()
        if not existing:
            db.add(Store(**store_data))
    db.commit()
    return {"message": f"Initialized {len(INITIAL_STORES)} stores"}
