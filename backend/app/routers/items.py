"""
花マスタ API
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.models.items import Item, generate_item_code
from app.models.inventory import Inventory, Arrival, Disposal, InventoryAdjustment
from app.models.transfers import Transfer, PriceChange
from app.schemas.items import ItemResponse, ItemCreate, ItemUpdate, ItemReorderRequest

router = APIRouter()


@router.get("/", response_model=List[ItemResponse])
def get_items(
    skip: int = 0,
    limit: int = 100,
    category: Optional[str] = None,
    search: Optional[str] = None,
    is_active: Optional[bool] = True,
    db: Session = Depends(get_db)
):
    """花一覧を取得"""
    query = db.query(Item)
    if is_active is not None:
        query = query.filter(Item.is_active == is_active)

    if category:
        query = query.filter(Item.category == category)

    if search:
        query = query.filter(
            (Item.name.contains(search)) |
            (Item.item_code.contains(search))
        )

    return query.order_by(Item.sort_order.asc(), Item.id.asc()).offset(skip).limit(limit).all()


@router.get("/{item_id}", response_model=ItemResponse)
def get_item(item_id: int, db: Session = Depends(get_db)):
    """花詳細を取得"""
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item


@router.get("/code/{item_code}", response_model=ItemResponse)
def get_item_by_code(item_code: str, db: Session = Depends(get_db)):
    """4桁コードで花を取得"""
    item = db.query(Item).filter(Item.item_code == item_code).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item


@router.post("/", response_model=ItemResponse)
def create_item(item: ItemCreate, db: Session = Depends(get_db)):
    """花を作成"""
    # 4桁コードを自動生成（指定がない場合）
    item_code = item.item_code or generate_item_code()

    # 重複チェック
    existing = db.query(Item).filter(Item.item_code == item_code).first()
    while existing:
        item_code = generate_item_code()
        existing = db.query(Item).filter(Item.item_code == item_code).first()

    db_item = Item(
        item_code=item_code,
        name=item.name,
        variety=item.variety,
        category=item.category,
        default_unit_price=item.default_unit_price,
        tax_rate=item.tax_rate or 0.10,
    )
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item


@router.put("/{item_id}", response_model=ItemResponse)
def update_item(item_id: int, item: ItemUpdate, db: Session = Depends(get_db)):
    """花を更新"""
    db_item = db.query(Item).filter(Item.id == item_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Item not found")

    update_data = item.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_item, key, value)

    db.commit()
    db.refresh(db_item)
    return db_item


@router.post("/reorder")
def reorder_items(request: ItemReorderRequest, db: Session = Depends(get_db)):
    """花の表示順を一括更新"""
    for item in request.items:
        db_item = db.query(Item).filter(Item.id == item.id).first()
        if db_item:
            db_item.sort_order = item.sort_order
    db.commit()
    return {"status": "ok", "updated": len(request.items)}


@router.delete("/{item_id}")
def delete_item(item_id: int, db: Session = Depends(get_db)):
    """花を削除（関連データも全て削除）"""
    db_item = db.query(Item).filter(Item.id == item_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Item not found")

    db.query(PriceChange).filter(PriceChange.item_id == item_id).delete()
    db.query(Transfer).filter(Transfer.item_id == item_id).delete()
    db.query(Disposal).filter(Disposal.item_id == item_id).delete()
    db.query(InventoryAdjustment).filter(InventoryAdjustment.item_id == item_id).delete()
    db.query(Arrival).filter(Arrival.item_id == item_id).delete()
    db.query(Inventory).filter(Inventory.item_id == item_id).delete()
    db.delete(db_item)
    db.commit()
    return {"status": "ok", "deleted_id": item_id}
