"""
花マスタ
4桁コード: 初期はランダム、後から変更可
"""

from sqlalchemy import Column, Integer, String, Numeric, Boolean, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Item(Base):
    __tablename__ = "items"

    id = Column(Integer, primary_key=True, index=True)
    item_code = Column(String(4), unique=True, index=True, nullable=False)
    name = Column(String(200), nullable=False)
    variety = Column(String(200))
    category = Column(String(50))  # 切花/鉢花/資材など
    default_unit_price = Column(Numeric(10, 2))
    tax_rate = Column(Numeric(4, 2), default=0.10)
    sort_order = Column(Integer, default=99)  # 表示順
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    inventory = relationship("Inventory", back_populates="item")
    arrivals = relationship("Arrival", back_populates="item")
    transfers = relationship("Transfer", back_populates="item")
    price_changes = relationship("PriceChange", back_populates="item")

    def __repr__(self):
        return f"<Item {self.item_code}: {self.name}>"


def generate_item_code():
    """4桁のランダムコードを生成"""
    import random
    return str(random.randint(1000, 9999))
