"""
分析・レポート API
- 仕入先別集計
- 店舗別集計
- 仕入・納品 金額比較
- 月間報告書 (P&L)
- 運賃明細
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, extract, case, and_
from typing import Optional
from datetime import date, datetime
from decimal import Decimal

from app.database import get_db
from app.models.inventory import Arrival
from app.models.transfers import Transfer
from app.models.invoices import Invoice
from app.models.expenses import Expense
from app.models.supplies import SupplyTransfer, Supply
from app.models.stores import Store
from app.models.items import Item
from app.models.settings import Supplier

router = APIRouter()


@router.get("/supplier-summary")
def get_supplier_summary(
    year: int = Query(...),
    month: int = Query(...),
    db: Session = Depends(get_db)
):
    """仕入先別 仕入金額集計"""
    results = (
        db.query(
            Supplier.id,
            Supplier.name,
            func.count(Arrival.id).label("arrival_count"),
            func.sum(Arrival.quantity).label("total_quantity"),
            func.sum(Arrival.quantity * Arrival.wholesale_price).label("total_amount"),
        )
        .outerjoin(Arrival, and_(
            Arrival.supplier_id == Supplier.id,
            extract("year", Arrival.arrived_at) == year,
            extract("month", Arrival.arrived_at) == month,
        ))
        .group_by(Supplier.id, Supplier.name)
        .order_by(func.sum(Arrival.quantity * Arrival.wholesale_price).desc().nullslast())
        .all()
    )

    suppliers = []
    grand_total = Decimal(0)
    for row in results:
        amount = Decimal(str(row.total_amount or 0))
        grand_total += amount
        suppliers.append({
            "supplier_id": row.id,
            "supplier_name": row.name,
            "arrival_count": row.arrival_count or 0,
            "total_quantity": row.total_quantity or 0,
            "total_amount": float(amount),
        })

    return {
        "year": year,
        "month": month,
        "suppliers": suppliers,
        "grand_total": float(grand_total),
    }


@router.get("/store-summary")
def get_store_summary(
    year: int = Query(...),
    month: int = Query(...),
    db: Session = Depends(get_db)
):
    """店舗別 納品金額集計"""
    results = (
        db.query(
            Store.id,
            Store.name,
            Store.operation_type,
            func.count(Transfer.id).label("transfer_count"),
            func.sum(Transfer.quantity).label("total_quantity"),
            func.sum(Transfer.quantity * Transfer.unit_price).label("delivery_amount"),
            func.sum(Transfer.quantity * Transfer.wholesale_price).label("purchase_amount"),
        )
        .outerjoin(Transfer, and_(
            Transfer.store_id == Store.id,
            extract("year", Transfer.transferred_at) == year,
            extract("month", Transfer.transferred_at) == month,
        ))
        .filter(Store.is_active == True)
        .group_by(Store.id, Store.name, Store.operation_type)
        .order_by(Store.sort_order)
        .all()
    )

    stores = []
    total_delivery = Decimal(0)
    total_purchase = Decimal(0)
    for row in results:
        d_amount = Decimal(str(row.delivery_amount or 0))
        p_amount = Decimal(str(row.purchase_amount or 0))
        total_delivery += d_amount
        total_purchase += p_amount
        stores.append({
            "store_id": row.id,
            "store_name": row.name,
            "operation_type": row.operation_type,
            "transfer_count": row.transfer_count or 0,
            "total_quantity": row.total_quantity or 0,
            "delivery_amount": float(d_amount),
            "purchase_amount": float(p_amount),
            "margin": float(d_amount - p_amount),
        })

    return {
        "year": year,
        "month": month,
        "stores": stores,
        "total_delivery": float(total_delivery),
        "total_purchase": float(total_purchase),
        "total_margin": float(total_delivery - total_purchase),
    }


@router.get("/purchase-delivery-comparison")
def get_purchase_delivery_comparison(
    year: int = Query(...),
    month: int = Query(...),
    db: Session = Depends(get_db)
):
    """仕入・納品 金額比較 (日別)"""
    # 日別仕入金額
    arrivals_by_day = (
        db.query(
            func.date(Arrival.arrived_at).label("day"),
            func.sum(Arrival.quantity * Arrival.wholesale_price).label("amount"),
            func.sum(Arrival.quantity).label("quantity"),
        )
        .filter(
            extract("year", Arrival.arrived_at) == year,
            extract("month", Arrival.arrived_at) == month,
        )
        .group_by(func.date(Arrival.arrived_at))
        .all()
    )

    # 日別納品金額
    transfers_by_day = (
        db.query(
            Transfer.transferred_at.label("day"),
            func.sum(Transfer.quantity * Transfer.unit_price).label("amount"),
            func.sum(Transfer.quantity).label("quantity"),
        )
        .filter(
            extract("year", Transfer.transferred_at) == year,
            extract("month", Transfer.transferred_at) == month,
        )
        .group_by(Transfer.transferred_at)
        .all()
    )

    arrival_map = {str(r.day): {"amount": float(r.amount or 0), "quantity": int(r.quantity or 0)} for r in arrivals_by_day}
    transfer_map = {str(r.day): {"amount": float(r.amount or 0), "quantity": int(r.quantity or 0)} for r in transfers_by_day}

    all_days = sorted(set(list(arrival_map.keys()) + list(transfer_map.keys())))

    daily = []
    period_totals = {"1-10": {"purchase": 0, "delivery": 0}, "11-20": {"purchase": 0, "delivery": 0}, "21-end": {"purchase": 0, "delivery": 0}}
    for day_str in all_days:
        day_num = int(day_str.split("-")[2])
        purchase = arrival_map.get(day_str, {"amount": 0, "quantity": 0})
        delivery = transfer_map.get(day_str, {"amount": 0, "quantity": 0})

        if day_num <= 10:
            period = "1-10"
        elif day_num <= 20:
            period = "11-20"
        else:
            period = "21-end"

        period_totals[period]["purchase"] += purchase["amount"]
        period_totals[period]["delivery"] += delivery["amount"]

        daily.append({
            "date": day_str,
            "purchase_amount": purchase["amount"],
            "purchase_quantity": purchase["quantity"],
            "delivery_amount": delivery["amount"],
            "delivery_quantity": delivery["quantity"],
            "difference": delivery["amount"] - purchase["amount"],
        })

    total_purchase = sum(d["purchase_amount"] for d in daily)
    total_delivery = sum(d["delivery_amount"] for d in daily)

    return {
        "year": year,
        "month": month,
        "daily": daily,
        "period_totals": period_totals,
        "total_purchase": total_purchase,
        "total_delivery": total_delivery,
        "total_difference": total_delivery - total_purchase,
    }


@router.get("/monthly-pl")
def get_monthly_pl(
    year: int = Query(...),
    month: int = Query(...),
    store_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """月間報告書 (P&L)"""
    # 仕入金額
    arrival_query = db.query(
        func.sum(Arrival.quantity * Arrival.wholesale_price).label("total")
    ).filter(
        extract("year", Arrival.arrived_at) == year,
        extract("month", Arrival.arrived_at) == month,
    )

    # 納品金額 (売上)
    transfer_query = db.query(
        func.sum(Transfer.quantity * Transfer.unit_price).label("revenue"),
        func.sum(Transfer.quantity * Transfer.wholesale_price).label("cost"),
        func.sum(Transfer.quantity).label("quantity"),
    ).filter(
        extract("year", Transfer.transferred_at) == year,
        extract("month", Transfer.transferred_at) == month,
    )

    # 経費
    expense_query = db.query(
        Expense.category,
        func.sum(Expense.amount).label("total"),
    ).filter(
        Expense.target_month == f"{year}-{month:02d}",
    )

    # 資材持出
    supply_query = db.query(
        func.sum(SupplyTransfer.quantity * SupplyTransfer.unit_price).label("total")
    ).filter(
        extract("year", SupplyTransfer.transferred_at) == year,
        extract("month", SupplyTransfer.transferred_at) == month,
    )

    if store_id:
        transfer_query = transfer_query.filter(Transfer.store_id == store_id)
        expense_query = expense_query.filter(Expense.store_id == store_id)
        supply_query = supply_query.filter(SupplyTransfer.store_id == store_id)

    arrival_result = arrival_query.first()
    transfer_result = transfer_query.first()
    expense_results = expense_query.group_by(Expense.category).all()
    supply_result = supply_query.first()

    total_purchase = float(arrival_result.total or 0)
    total_revenue = float(transfer_result.revenue or 0)
    total_cost = float(transfer_result.cost or 0)
    total_quantity = int(transfer_result.quantity or 0)
    total_supply = float(supply_result.total or 0)

    expenses_by_category = {r.category: float(r.total) for r in expense_results}
    total_expenses = sum(expenses_by_category.values())

    gross_profit = total_revenue - total_cost
    gross_margin = (gross_profit / total_revenue * 100) if total_revenue > 0 else 0
    operating_profit = gross_profit - total_expenses - total_supply

    # 店舗別売上
    store_breakdown = (
        db.query(
            Store.id,
            Store.name,
            func.sum(Transfer.quantity * Transfer.unit_price).label("revenue"),
            func.sum(Transfer.quantity).label("quantity"),
        )
        .join(Transfer, Transfer.store_id == Store.id)
        .filter(
            extract("year", Transfer.transferred_at) == year,
            extract("month", Transfer.transferred_at) == month,
        )
        .group_by(Store.id, Store.name)
        .order_by(func.sum(Transfer.quantity * Transfer.unit_price).desc())
        .all()
    )

    stores = [
        {
            "store_id": r.id,
            "store_name": r.name,
            "revenue": float(r.revenue or 0),
            "quantity": int(r.quantity or 0),
        }
        for r in store_breakdown
    ]

    return {
        "year": year,
        "month": month,
        "store_id": store_id,
        "summary": {
            "total_purchase": total_purchase,
            "total_revenue": total_revenue,
            "total_cost": total_cost,
            "gross_profit": gross_profit,
            "gross_margin": round(gross_margin, 1),
            "total_expenses": total_expenses,
            "total_supply_cost": total_supply,
            "operating_profit": operating_profit,
            "total_quantity": total_quantity,
        },
        "expenses_by_category": expenses_by_category,
        "store_breakdown": stores,
    }


@router.get("/shipping-costs")
def get_shipping_costs(
    year: int = Query(...),
    month: int = Query(...),
    db: Session = Depends(get_db)
):
    """運賃明細 (経費の運賃カテゴリ)"""
    results = (
        db.query(
            Expense.store_id,
            Store.name.label("store_name"),
            Expense.category,
            Expense.amount,
            Expense.target_month,
            Expense.note,
            Expense.created_at,
        )
        .join(Store, Store.id == Expense.store_id)
        .filter(
            Expense.target_month == f"{year}-{month:02d}",
            Expense.category.in_(["freight_brandia", "freight_ota", "freight", "shipping"]),
        )
        .order_by(Expense.created_at)
        .all()
    )

    items = [
        {
            "store_name": r.store_name,
            "category": r.category,
            "amount": float(r.amount),
            "note": r.note,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r in results
    ]

    total = sum(item["amount"] for item in items)

    return {
        "year": year,
        "month": month,
        "items": items,
        "total": total,
    }
