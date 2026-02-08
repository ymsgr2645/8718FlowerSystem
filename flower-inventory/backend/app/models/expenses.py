"""
経費
"""

from sqlalchemy import Column, Integer, String, Numeric, Date, DateTime, ForeignKey, Text
from sqlalchemy.sql import func
from app.database import Base


class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    store_id = Column(Integer, ForeignKey("stores.id"), nullable=False)
    category = Column(String(50), nullable=False)  # jftd/yupack/eneos/ntt/freight/electric/water/gas/common_fee/other
    year_month = Column(String(7), nullable=False)  # YYYY-MM
    amount = Column(Numeric(12, 2), nullable=False)
    billing_method = Column(String(20), nullable=False)  # invoice/transfer
    invoice_no = Column(String(50))
    note = Column(Text)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    def __repr__(self):
        return f"<Expense {self.category} {self.amount}>"
