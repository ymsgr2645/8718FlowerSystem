"""
持ち出し/単価変更
- transfers: 持ち出し記録
- price_changes: 単価変更履歴
"""

from sqlalchemy import Column, Integer, Numeric, DateTime, Date, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Transfer(Base):
    """持ち出し記録"""
    __tablename__ = "transfers"

    id = Column(Integer, primary_key=True, index=True)
    store_id = Column(Integer, ForeignKey("stores.id"), nullable=False)
    item_id = Column(Integer, ForeignKey("items.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Numeric(10, 2), nullable=False)  # 販売単価
    wholesale_price = Column(Numeric(10, 2))  # 仕切値（持ち出し時に手入力）
    margin = Column(Numeric(10, 2))  # 差額
    transferred_at = Column(Date, nullable=False)
    input_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    store = relationship("Store", back_populates="transfers")
    item = relationship("Item", back_populates="transfers")

    def __repr__(self):
        return f"<Transfer store={self.store_id} item={self.item_id} qty={self.quantity}>"

    def calculate_margin(self):
        """差額を計算"""
        if self.unit_price and self.wholesale_price and self.quantity:
            return (float(self.unit_price) - float(self.wholesale_price)) * self.quantity
        return None


class PriceChange(Base):
    """単価変更履歴"""
    __tablename__ = "price_changes"

    id = Column(Integer, primary_key=True, index=True)
    item_id = Column(Integer, ForeignKey("items.id"), nullable=False)
    old_price = Column(Numeric(10, 2))
    new_price = Column(Numeric(10, 2), nullable=False)
    changed_by = Column(Integer, ForeignKey("users.id"))
    changed_at = Column(DateTime(timezone=True), server_default=func.now())
    reason = Column(Text)

    item = relationship("Item", back_populates="price_changes")

    def __repr__(self):
        return f"<PriceChange item={self.item_id} {self.old_price} -> {self.new_price}>"
