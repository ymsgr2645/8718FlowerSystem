"""
在庫関連テーブル
- inventory: 倉庫在庫
- arrivals: 入荷記録
- disposals: 廃棄・ロス
- inventory_adjustments: 在庫調整
"""

from sqlalchemy import Column, Integer, String, Numeric, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Inventory(Base):
    """倉庫在庫"""
    __tablename__ = "inventory"

    id = Column(Integer, primary_key=True, index=True)
    item_id = Column(Integer, ForeignKey("items.id"), nullable=False)
    quantity = Column(Integer, default=0)
    unit_price = Column(Numeric(10, 2))  # 参考単価（販売単価）
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

    item = relationship("Item", back_populates="inventory")

    def __repr__(self):
        return f"<Inventory item_id={self.item_id} qty={self.quantity}>"


class Arrival(Base):
    """入荷記録"""
    __tablename__ = "arrivals"

    id = Column(Integer, primary_key=True, index=True)
    item_id = Column(Integer, ForeignKey("items.id"), nullable=False)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"))
    quantity = Column(Integer, nullable=False)
    wholesale_price = Column(Numeric(10, 2))  # 仕入単価
    arrived_at = Column(DateTime(timezone=True), server_default=func.now())
    source_type = Column(String(20))  # csv / pdf / manual
    source_file = Column(String(500))
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    item = relationship("Item", back_populates="arrivals")
    supplier = relationship("Supplier", back_populates="arrivals")

    def __repr__(self):
        return f"<Arrival item_id={self.item_id} qty={self.quantity}>"


class Disposal(Base):
    """廃棄・ロス"""
    __tablename__ = "disposals"

    id = Column(Integer, primary_key=True, index=True)
    item_id = Column(Integer, ForeignKey("items.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    reason = Column(String(50))  # damage/expired/lost/other
    note = Column(Text)
    disposed_by = Column(Integer, ForeignKey("users.id"))
    disposed_at = Column(DateTime(timezone=True), server_default=func.now())

    def __repr__(self):
        return f"<Disposal item_id={self.item_id} qty={self.quantity}>"


class InventoryAdjustment(Base):
    """在庫調整"""
    __tablename__ = "inventory_adjustments"

    id = Column(Integer, primary_key=True, index=True)
    item_id = Column(Integer, ForeignKey("items.id"), nullable=False)
    adjustment_type = Column(String(20), nullable=False)  # increase/decrease/correction
    quantity = Column(Integer, nullable=False)  # +/- 数量
    reason = Column(String(50))  # unknown/damage/counting_error/other
    note = Column(Text)
    adjusted_by = Column(Integer, ForeignKey("users.id"))
    adjusted_at = Column(DateTime(timezone=True), server_default=func.now())

    def __repr__(self):
        return f"<InventoryAdjustment item_id={self.item_id} type={self.adjustment_type} qty={self.quantity}>"
