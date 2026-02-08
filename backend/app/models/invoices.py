"""
請求書（インボイス対応）
- invoices: 請求書
- invoice_items: 請求明細
"""

from sqlalchemy import Column, Integer, String, Numeric, DateTime, Date, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Invoice(Base):
    """請求書（インボイス対応）"""
    __tablename__ = "invoices"

    id = Column(Integer, primary_key=True, index=True)
    store_id = Column(Integer, ForeignKey("stores.id"), nullable=False)
    invoice_number = Column(String(50), unique=True, nullable=False)
    invoice_type = Column(String(20), nullable=False)  # flower/supply/contractor

    period_start = Column(Date, nullable=False)
    period_end = Column(Date, nullable=False)

    prev_invoice_amount = Column(Numeric(12, 2), default=0)
    prev_payment_amount = Column(Numeric(12, 2), default=0)
    carryover_amount = Column(Numeric(12, 2), default=0)

    subtotal_10 = Column(Numeric(12, 2), default=0)
    tax_amount_10 = Column(Numeric(12, 2), default=0)
    subtotal_08 = Column(Numeric(12, 2), default=0)
    tax_amount_08 = Column(Numeric(12, 2), default=0)

    total_amount = Column(Numeric(12, 2), nullable=False)

    status = Column(String(20), default="draft")  # draft/generated/sent/paid
    pdf_path = Column(String(500))
    sent_at = Column(DateTime(timezone=True))

    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    store = relationship("Store", back_populates="invoices")
    items = relationship("InvoiceItem", back_populates="invoice")

    def __repr__(self):
        return f"<Invoice {self.invoice_number} store={self.store_id}>"

    def calculate_totals(self):
        """合計を計算"""
        self.subtotal_10 = sum(
            item.subtotal for item in self.items if item.tax_rate == 0.10
        ) or 0
        self.subtotal_08 = sum(
            item.subtotal for item in self.items if item.tax_rate == 0.08
        ) or 0

        import math
        self.tax_amount_10 = math.floor(float(self.subtotal_10) * 0.10)
        self.tax_amount_08 = math.floor(float(self.subtotal_08) * 0.08)
        self.total_amount = (
            float(self.subtotal_10) + self.tax_amount_10 +
            float(self.subtotal_08) + self.tax_amount_08 +
            float(self.carryover_amount or 0)
        )


class InvoiceItem(Base):
    """請求書明細"""
    __tablename__ = "invoice_items"

    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id"), nullable=False)
    item_id = Column(Integer, ForeignKey("items.id"))
    item_name = Column(String(200), nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Numeric(10, 2), nullable=False)
    subtotal = Column(Numeric(12, 2), nullable=False)
    tax_rate = Column(Numeric(4, 2), default=0.10)
    transferred_at = Column(Date)

    invoice = relationship("Invoice", back_populates="items")

    def __repr__(self):
        return f"<InvoiceItem {self.item_name} qty={self.quantity}>"
