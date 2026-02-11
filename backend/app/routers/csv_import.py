"""
CSVインポート API
仕入先CSVファイルを読み込み、入荷レコードを自動生成
- Shift-JIS / UTF-8 対応
- 仕入先ごとのカラムマッピング
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
import csv
import io

from app.database import get_db
from app.models.items import Item, generate_item_code
from app.models.inventory import Inventory, Arrival
from app.models.settings import Supplier

router = APIRouter()


class CSVColumnMapping(BaseModel):
    item_name_col: int = 0
    variety_col: Optional[int] = None
    quantity_col: int = 1
    unit_price_col: Optional[int] = None
    category_col: Optional[int] = None
    origin_col: Optional[int] = None


class CSVPreviewRow(BaseModel):
    row_number: int
    raw: List[str]
    item_name: Optional[str] = None
    variety: Optional[str] = None
    quantity: Optional[int] = None
    unit_price: Optional[float] = None


class CSVImportResult(BaseModel):
    total_rows: int
    imported: int
    skipped: int
    errors: List[str]
    new_items_created: int


@router.post("/preview")
async def preview_csv(
    file: UploadFile = File(...),
    supplier_id: int = Form(...),
    encoding: str = Form("shift_jis"),
    skip_header: int = Form(1),
    delimiter: str = Form(","),
    db: Session = Depends(get_db),
):
    """CSVファイルをプレビュー（最初の20行）"""
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="仕入先が見つかりません")

    content = await file.read()

    try:
        text = content.decode(encoding)
    except (UnicodeDecodeError, LookupError):
        try:
            text = content.decode("utf-8")
        except UnicodeDecodeError:
            text = content.decode("cp932")

    reader = csv.reader(io.StringIO(text), delimiter=delimiter)
    rows = []
    headers = []
    for i, row in enumerate(reader):
        if i == 0:
            headers = row
        if i >= skip_header:
            rows.append({"row_number": i + 1, "raw": row})
        if len(rows) >= 20:
            break

    return {
        "supplier_id": supplier_id,
        "supplier_name": supplier.name,
        "encoding": encoding,
        "headers": headers,
        "rows": rows,
        "total_columns": len(headers),
    }


@router.post("/execute", response_model=CSVImportResult)
async def execute_csv_import(
    file: UploadFile = File(...),
    supplier_id: int = Form(...),
    encoding: str = Form("shift_jis"),
    skip_header: int = Form(1),
    delimiter: str = Form(","),
    item_name_col: int = Form(0),
    variety_col: int = Form(-1),
    quantity_col: int = Form(1),
    unit_price_col: int = Form(-1),
    arrived_date: str = Form(...),
    db: Session = Depends(get_db),
):
    """CSVファイルをインポートして入荷レコードを生成"""
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="仕入先が見つかりません")

    content = await file.read()

    try:
        text = content.decode(encoding)
    except (UnicodeDecodeError, LookupError):
        try:
            text = content.decode("utf-8")
        except UnicodeDecodeError:
            text = content.decode("cp932")

    try:
        arrive_dt = datetime.strptime(arrived_date, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(status_code=400, detail="日付の形式が不正です (YYYY-MM-DD)")

    reader = csv.reader(io.StringIO(text), delimiter=delimiter)
    imported = 0
    skipped = 0
    errors = []
    new_items = 0

    for i, row in enumerate(reader):
        if i < skip_header:
            continue

        try:
            if len(row) <= item_name_col:
                skipped += 1
                continue

            item_name = row[item_name_col].strip()
            if not item_name:
                skipped += 1
                continue

            variety = row[variety_col].strip() if variety_col >= 0 and len(row) > variety_col else None

            try:
                qty_str = row[quantity_col].strip().replace(",", "") if len(row) > quantity_col else "0"
                quantity = int(float(qty_str)) if qty_str else 0
            except (ValueError, IndexError):
                quantity = 0

            if quantity <= 0:
                skipped += 1
                continue

            unit_price = None
            if unit_price_col >= 0 and len(row) > unit_price_col:
                try:
                    price_str = row[unit_price_col].strip().replace(",", "").replace("¥", "")
                    unit_price = float(price_str) if price_str else None
                except ValueError:
                    unit_price = None

            item = db.query(Item).filter(Item.name == item_name).first()
            if not item and variety:
                item = db.query(Item).filter(
                    Item.name == item_name, Item.variety == variety
                ).first()

            if not item:
                existing_codes = {i.item_code for i in db.query(Item.item_code).all()}
                new_code = generate_item_code()
                while new_code in existing_codes:
                    new_code = generate_item_code()

                item = Item(
                    item_code=new_code,
                    name=item_name,
                    variety=variety,
                    category="切花",
                    default_unit_price=unit_price,
                    tax_rate=0.10,
                )
                db.add(item)
                db.flush()
                new_items += 1

            arrival = Arrival(
                item_id=item.id,
                supplier_id=supplier_id,
                quantity=quantity,
                wholesale_price=unit_price,
                source_type="csv_import",
                arrived_at=arrive_dt,
            )
            db.add(arrival)

            inv = db.query(Inventory).filter(Inventory.item_id == item.id).first()
            if inv:
                inv.quantity += quantity
            else:
                inv = Inventory(
                    item_id=item.id,
                    quantity=quantity,
                    unit_price=unit_price or item.default_unit_price,
                )
                db.add(inv)

            imported += 1

        except Exception as e:
            errors.append(f"行 {i + 1}: {str(e)}")
            skipped += 1

    db.commit()

    return CSVImportResult(
        total_rows=i + 1 - skip_header if 'i' in dir() else 0,
        imported=imported,
        skipped=skipped,
        errors=errors[:10],
        new_items_created=new_items,
    )


@router.get("/suppliers")
def get_import_suppliers(db: Session = Depends(get_db)):
    """インポート対応の仕入先一覧"""
    suppliers = db.query(Supplier).filter(Supplier.is_active == True).all()
    return [
        {
            "id": s.id,
            "name": s.name,
            "csv_encoding": s.csv_encoding,
            "csv_format": s.csv_format,
        }
        for s in suppliers
    ]
