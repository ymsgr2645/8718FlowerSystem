"""
ログ/アラート
- operation_logs: 操作ログ
- error_alerts: エラーアラート
"""

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON
from sqlalchemy.sql import func
from app.database import Base


class OperationLog(Base):
    """操作ログ"""
    __tablename__ = "operation_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    action = Column(String(20), nullable=False)  # create/update/delete
    table_name = Column(String(50), nullable=False)
    record_id = Column(Integer)
    old_value = Column(JSON)
    new_value = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    def __repr__(self):
        return f"<OperationLog {self.action} on {self.table_name}>"


class ErrorAlert(Base):
    """エラーアラート"""
    __tablename__ = "error_alerts"

    id = Column(Integer, primary_key=True, index=True)
    type = Column(String(30), nullable=False)  # csv_import/pdf_generate/email_send
    message = Column(String(500), nullable=False)
    detail = Column(JSON)
    status = Column(String(20), default="pending")  # pending/resolved
    resolved_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    resolved_at = Column(DateTime(timezone=True))

    def __repr__(self):
        return f"<ErrorAlert {self.type} status={self.status}>"
