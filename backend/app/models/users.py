"""
ユーザー認証（ローカル）
ロール: boss / manager / staff
"""

from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False)  # boss / manager / staff
    store_id = Column(Integer, ForeignKey("stores.id"))  # boss は NULL 可
    display_name = Column(String(100), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_login = Column(DateTime(timezone=True))

    def __repr__(self):
        return f"<User {self.email} role={self.role}>"


INITIAL_USERS = [
    {"email": "hanaichiya@8718.jp", "role": "boss", "display_name": "花市屋", "store_id": None},
    {"email": "toyohira-manager@8718.jp", "role": "manager", "display_name": "豊平マネージャー", "store_id": 5},
    {"email": "toyohira-staff@8718.jp", "role": "staff", "display_name": "豊平スタッフ", "store_id": 5},
    {"email": "410@8718.jp", "role": "manager", "display_name": "本部管理", "store_id": None},
]
