"""
設定/税率/仕入先 API
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.settings import Setting, TaxRate, Supplier
from app.schemas.settings import (
    SettingResponse, SettingUpdate,
    TaxRateResponse, TaxRateCreate,
    SupplierResponse, SupplierCreate, SupplierUpdate
)

router = APIRouter()


@router.get("/", response_model=List[SettingResponse])
def get_settings(db: Session = Depends(get_db)):
    return db.query(Setting).order_by(Setting.key.asc()).all()


@router.put("/{key}", response_model=SettingResponse)
def update_setting(key: str, setting: SettingUpdate, db: Session = Depends(get_db)):
    db_setting = db.query(Setting).filter(Setting.key == key).first()
    if not db_setting:
        raise HTTPException(status_code=404, detail="Setting not found")
    db_setting.value = setting.value
    db.commit()
    db.refresh(db_setting)
    return db_setting


@router.get("/tax-rates", response_model=List[TaxRateResponse])
def get_tax_rates(db: Session = Depends(get_db)):
    return db.query(TaxRate).order_by(TaxRate.effective_from.desc()).all()


@router.post("/tax-rates", response_model=TaxRateResponse)
def create_tax_rate(tax_rate: TaxRateCreate, db: Session = Depends(get_db)):
    db_tax = TaxRate(**tax_rate.model_dump())
    db.add(db_tax)
    db.commit()
    db.refresh(db_tax)
    return db_tax


@router.get("/suppliers", response_model=List[SupplierResponse])
def get_suppliers(db: Session = Depends(get_db)):
    return db.query(Supplier).order_by(Supplier.name.asc()).all()


@router.post("/suppliers", response_model=SupplierResponse)
def create_supplier(supplier: SupplierCreate, db: Session = Depends(get_db)):
    db_supplier = Supplier(**supplier.model_dump())
    db.add(db_supplier)
    db.commit()
    db.refresh(db_supplier)
    return db_supplier


@router.put("/suppliers/{supplier_id}", response_model=SupplierResponse)
def update_supplier(supplier_id: int, supplier: SupplierUpdate, db: Session = Depends(get_db)):
    db_supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not db_supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    update_data = supplier.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_supplier, key, value)
    db.commit()
    db.refresh(db_supplier)
    return db_supplier
