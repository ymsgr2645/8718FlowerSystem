"""
経費 API
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.models.expenses import Expense
from app.schemas.expenses import ExpenseCreate, ExpenseResponse

router = APIRouter()


@router.get("/", response_model=List[ExpenseResponse])
def get_expenses(
    store_id: Optional[int] = None,
    year_month: Optional[str] = None,
    category: Optional[str] = None,
    skip: int = 0,
    limit: int = 200,
    db: Session = Depends(get_db)
):
    query = db.query(Expense)
    if store_id:
        query = query.filter(Expense.store_id == store_id)
    if year_month:
        query = query.filter(Expense.year_month == year_month)
    if category:
        query = query.filter(Expense.category == category)
    return query.order_by(Expense.created_at.desc()).offset(skip).limit(limit).all()


@router.post("/", response_model=ExpenseResponse)
def create_expense(expense: ExpenseCreate, db: Session = Depends(get_db)):
    if expense.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")
    db_expense = Expense(**expense.model_dump())
    db.add(db_expense)
    db.commit()
    db.refresh(db_expense)
    return db_expense
