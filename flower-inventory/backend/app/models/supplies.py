"""
備品関連
- supplies: 備品マスタ
- supply_transfers: 備品持ち出し
- supply_price_changes: 備品価格変更履歴
"""

from sqlalchemy import Column, Integer, String, Numeric, DateTime, Date, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Supply(Base):
    """備品マスタ"""
    __tablename__ = "supplies"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    specification = Column(String(200))
    unit_price = Column(Numeric(10, 2))
    category = Column(String(50))
    stock_quantity = Column(Integer, default=0)  # 現在庫
    sort_order = Column(Integer, default=0)  # 表示順序
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    transfers = relationship("SupplyTransfer", back_populates="supply")
    price_changes = relationship("SupplyPriceChange", back_populates="supply")

    def __repr__(self):
        return f"<Supply {self.name}>"


class SupplyTransfer(Base):
    """備品持ち出し"""
    __tablename__ = "supply_transfers"

    id = Column(Integer, primary_key=True, index=True)
    store_id = Column(Integer, ForeignKey("stores.id"), nullable=False)
    supply_id = Column(Integer, ForeignKey("supplies.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Numeric(10, 2), nullable=False)
    transferred_at = Column(Date, nullable=False)
    input_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    supply = relationship("Supply", back_populates="transfers")

    def __repr__(self):
        return f"<SupplyTransfer supply={self.supply_id} qty={self.quantity}>"


class SupplyPriceChange(Base):
    """備品価格変更履歴"""
    __tablename__ = "supply_price_changes"

    id = Column(Integer, primary_key=True, index=True)
    supply_id = Column(Integer, ForeignKey("supplies.id"), nullable=False)
    old_price = Column(Numeric(10, 2))
    new_price = Column(Numeric(10, 2), nullable=False)
    changed_by = Column(Integer, ForeignKey("users.id"))
    changed_at = Column(DateTime(timezone=True), server_default=func.now())
    reason = Column(Text)

    supply = relationship("Supply", back_populates="price_changes")

    def __repr__(self):
        return f"<SupplyPriceChange supply={self.supply_id} {self.old_price} -> {self.new_price}>"


# 共同購入備品リスト（Excelマスタより）
INITIAL_SUPPLIES = [
    {"name": "オアシス 仕事用", "specification": "48個入", "unit_price": 3350, "category": "共同購入"},
    {"name": "セロハン（大）", "specification": "#40 70㎝×500ｍ", "unit_price": 6200, "category": "共同購入"},
    {"name": "セロハン（小）", "specification": "#40 50㎝×500ｍ", "unit_price": 4300, "category": "共同購入"},
    {"name": "包装紙 半切", "specification": "500枚", "unit_price": 2950, "category": "共同購入"},
    {"name": "包装紙 四つ切", "specification": "2000枚", "unit_price": 5900, "category": "共同購入"},
    {"name": "キープ・フラワー", "specification": "200ml 40本", "unit_price": 9600, "category": "共同購入"},
    {"name": "ペーパーバスケ（白）", "specification": "3B-081W 20個入", "unit_price": 1640, "category": "共同購入"},
    {"name": "レジロール紙", "specification": "5個 1袋", "unit_price": 364, "category": "共同購入"},
    {"name": "オアシス 赤箱", "specification": "48個入", "unit_price": 4418, "category": "共同購入"},
    {"name": "プチプチ", "specification": "幅1200 巻42メートル", "unit_price": 1364, "category": "共同購入"},
    {"name": "純性インクカートリッジ", "specification": "大容量 ブラック", "unit_price": 1682, "category": "共同購入"},
    {"name": "厚紙補強", "specification": "1枚", "unit_price": 227, "category": "共同購入"},
    {"name": "JFTD 注文承り票", "specification": "2枚伝票", "unit_price": 300, "category": "共同購入"},
    {"name": "配達伝票", "specification": "4枚複写", "unit_price": 700, "category": "共同購入"},
    {"name": "持ち帰り伝票", "specification": "2枚複写", "unit_price": 300, "category": "共同購入"},
    {"name": "段ボール", "specification": "80㎝", "unit_price": 68, "category": "共同購入"},
    {"name": "段ボール(花束用)", "specification": "140㎝", "unit_price": 282, "category": "共同購入"},
    {"name": "Vパック", "specification": "450×300×50H", "unit_price": 363, "category": "共同購入"},
    {"name": "クラフトテープ", "specification": "500mm×50m 50個", "unit_price": 70, "category": "共同購入"},
    {"name": "スーパーパワーゴミ袋", "specification": "半透明 90ℓ 200枚", "unit_price": 3000, "category": "共同購入"},
    {"name": "セロテープ", "specification": "15㎜×50m", "unit_price": 682, "category": "共同購入"},
    {"name": "ニューイージーバック", "specification": "LLL", "unit_price": 530, "category": "共同購入"},
    {"name": "ピエーガ 6.5号 角 WB", "specification": "10入1袋", "unit_price": 1730, "category": "共同購入"},
    {"name": "ピエーガ 5号 角 WB", "specification": "10入1袋", "unit_price": 1150, "category": "共同購入"},
    {"name": "LP 5号 丸型 WB", "specification": "10入1袋", "unit_price": 1000, "category": "共同購入"},
    {"name": "輪ゴム 500ｇ #16", "specification": None, "unit_price": 455, "category": "共同購入"},
    {"name": "アルミホイール", "specification": "30×50m", "unit_price": 500, "category": "共同購入"},
    {"name": "籐のかご 10個入り", "specification": "DA64 Lサイズ", "unit_price": 1250, "category": "共同購入"},
    {"name": "籐のかご 16個入り", "specification": "DA63 Mサイズ", "unit_price": 1680, "category": "共同購入"},
    {"name": "ソフィー（ピンク/ブラウン）", "specification": "750mm×10m", "unit_price": 664, "category": "共同購入"},
    {"name": "ニュアンセ（各種）", "specification": "600mm×20m", "unit_price": 890, "category": "共同購入"},
    {"name": "ウィズ（各種）", "specification": "650mm×30m", "unit_price": 710, "category": "共同購入"},
    {"name": "玉乗りベアピック", "specification": "10本入れ", "unit_price": 1137, "category": "共同購入"},
    {"name": "OPアラモード（各種）", "specification": "700mm×20m", "unit_price": 664, "category": "共同購入"},
    {"name": "プラポットS グレージュ", "specification": "10個入れ", "unit_price": 670, "category": "共同購入"},
    {"name": "プラポットM グレージュ", "specification": "10個入れ", "unit_price": 850, "category": "共同購入"},
]
