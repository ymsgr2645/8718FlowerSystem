"""
店舗マスタ
11店舗: 本部直営4店 + 業務委託7店
"""

from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Store(Base):
    __tablename__ = "stores"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True)
    operation_type = Column(String(20), nullable=False)  # headquarters / franchise
    store_type = Column(String(20), nullable=False)  # store / online / consignment
    email = Column(String(255))
    color = Column(String(7))  # 店舗カラー e.g. #E53935
    sort_order = Column(Integer, default=99)  # 表示順
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    transfers = relationship("Transfer", back_populates="store")
    invoices = relationship("Invoice", back_populates="store")

    def __repr__(self):
        return f"<Store {self.name}>"


# 店舗順: 豊平→月寒→新琴似→山の手→手稲→ことに→澄川→大曲→北野→通信販売→委託
INITIAL_STORES = [
    {"id": 1, "name": "豊平", "operation_type": "franchise", "store_type": "store", "email": "toyohira@8718.jp", "sort_order": 1, "color": "#E53935"},
    {"id": 2, "name": "月寒", "operation_type": "franchise", "store_type": "store", "email": "tukisamu@8718.jp", "sort_order": 2, "color": "#FB8C00"},
    {"id": 3, "name": "新琴似", "operation_type": "headquarters", "store_type": "store", "email": "shinkotoni@8718.jp", "sort_order": 3, "color": "#43A047"},
    {"id": 4, "name": "山の手", "operation_type": "headquarters", "store_type": "store", "email": "yamanote@8718.jp", "sort_order": 4, "color": "#1E88E5"},
    {"id": 5, "name": "手稲", "operation_type": "franchise", "store_type": "store", "email": "teine@8718.jp", "sort_order": 5, "color": "#8E24AA"},
    {"id": 6, "name": "琴似", "operation_type": "franchise", "store_type": "store", "email": "kotoni@8718.jp", "sort_order": 6, "color": "#00ACC1"},
    {"id": 7, "name": "澄川", "operation_type": "franchise", "store_type": "store", "email": "sumikawa@8718.jp", "sort_order": 7, "color": "#F4511E"},
    {"id": 8, "name": "大曲", "operation_type": "franchise", "store_type": "store", "email": "omagari@8718.jp", "sort_order": 8, "color": "#6D4C41"},
    {"id": 9, "name": "北野", "operation_type": "franchise", "store_type": "store", "email": "kitano@8718.jp", "sort_order": 9, "color": "#EC407A"},
    {"id": 10, "name": "通信販売", "operation_type": "headquarters", "store_type": "online", "email": "net@8718.jp", "sort_order": 10, "color": "#7CB342"},
    {"id": 11, "name": "委託", "operation_type": "headquarters", "store_type": "consignment", "email": "itaku@8718.jp", "sort_order": 11, "color": "#546E7A"},
]
