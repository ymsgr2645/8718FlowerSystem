"""
8718 Flower System - FastAPI Backend
Phase 1: ローカル + SQLite
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.database import init_db
from app.routers import stores, items, inventory, transfers, invoices, supplies, settings, expenses, logs, analytics, payments, csv_import, backup


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    print("[START] 8718 Flower System starting...")
    init_db()
    print("[OK] Database initialized")
    yield
    print("[END] Shutting down...")


app = FastAPI(
    title="8718 Flower System API",
    description="入荷・在庫・持ち出し・請求書システム - Phase 1 ローカル運用",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(stores.router, prefix="/api/stores", tags=["stores"])
app.include_router(items.router, prefix="/api/items", tags=["items"])
app.include_router(inventory.router, prefix="/api/inventory", tags=["inventory"])
app.include_router(transfers.router, prefix="/api/transfers", tags=["transfers"])
app.include_router(invoices.router, prefix="/api/invoices", tags=["invoices"])
app.include_router(supplies.router, prefix="/api/supplies", tags=["supplies"])
app.include_router(settings.router, prefix="/api/settings", tags=["settings"])
app.include_router(expenses.router, prefix="/api/expenses", tags=["expenses"])
app.include_router(logs.router, prefix="/api/alerts", tags=["alerts"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["analytics"])
app.include_router(payments.router, prefix="/api/payments", tags=["payments"])
app.include_router(csv_import.router, prefix="/api/csv-import", tags=["csv-import"])
app.include_router(backup.router, prefix="/api/backup", tags=["backup"])


@app.get("/")
async def root():
    return {
        "message": "8718 Flower System API",
        "version": "1.0.0",
        "phase": "Phase 1 (Local)",
        "docs": "/docs",
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
