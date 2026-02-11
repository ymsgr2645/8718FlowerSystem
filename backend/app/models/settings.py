"""
設定・税率・仕入先
- settings: システム設定
- tax_rates: 消費税率マスタ
- suppliers: 卸売業者マスタ
"""

from sqlalchemy import Column, Integer, String, Numeric, Boolean, DateTime, Date
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
from datetime import date


class Setting(Base):
    """システム設定"""
    __tablename__ = "settings"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(100), unique=True, nullable=False, index=True)
    value = Column(String(500), nullable=False)
    description = Column(String(500))
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

    def __repr__(self):
        return f"<Setting {self.key}={self.value}>"


class TaxRate(Base):
    """消費税率マスタ"""
    __tablename__ = "tax_rates"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), nullable=False)
    rate = Column(Numeric(4, 2), nullable=False)  # 0.10 = 10%
    effective_from = Column(Date, nullable=False)
    is_default = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    def __repr__(self):
        return f"<TaxRate {self.name} {float(self.rate) * 100}%>"


class Supplier(Base):
    """卸売業者マスタ"""
    __tablename__ = "suppliers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True)
    email = Column(String(255))
    csv_encoding = Column(String(20), default="utf-8")
    csv_format = Column(String(50))
    sort_order = Column(Integer, default=99)  # 表示順
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    arrivals = relationship("Arrival", back_populates="supplier")

    def __repr__(self):
        return f"<Supplier {self.name}>"


INITIAL_SETTINGS = [
    {"key": "tax_rate", "value": "0.10", "description": "標準税率"},
    {"key": "tax_rate_reduced", "value": "0.08", "description": "軽減税率"},
    {"key": "tax_rounding", "value": "floor", "description": "税の丸め処理（floor/round/ceil）"},
    {"key": "tax_calculation", "value": "per_item", "description": "税計算（per_item/total）"},
    {"key": "inventory_alert_days", "value": "5", "description": "長期在庫アラート日数"},
    {"key": "backup_retention_days", "value": "30", "description": "バックアップ保持日数"},
    {"key": "invoice_number_format", "value": "{year}-{month:02d}-{day:02d}-{seq:03d}", "description": "請求書番号形式"},
    {"key": "fiscal_year_start", "value": "4", "description": "会計年度開始月"},
]

INITIAL_TAX_RATES = [
    {"name": "標準税率", "rate": 0.10, "effective_from": date(2024, 1, 1), "is_default": True},
    {"name": "軽減税率", "rate": 0.08, "effective_from": date(2024, 1, 1), "is_default": False},
]

INITIAL_SUPPLIERS = [
    {"name": "大田花き", "csv_encoding": "shift_jis"},
    {"name": "なにわ花き", "csv_encoding": "shift_jis"},
    {"name": "東京フラワーポート", "csv_encoding": "shift_jis"},
    {"name": "OTA花き", "csv_encoding": "shift_jis"},
    {"name": "世田谷花き", "csv_encoding": "shift_jis"},
    {"name": "F・ジャパン", "csv_encoding": "utf-8"},
    {"name": "ブランドア", "csv_encoding": "utf-8"},
    {"name": "サクモト", "csv_encoding": "utf-8"},
    {"name": "葛西花き", "csv_encoding": "shift_jis"},
]
