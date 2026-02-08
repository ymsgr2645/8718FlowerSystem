"""
8718 Flower System - Database Configuration
Phase 1: SQLite (ローカル運用)
Phase 2+: PostgreSQL (クラウド移行時)
"""

from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, declarative_base
import os

# Phase 1: SQLite
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./8718_flower_system.db")

# SQLite specific settings
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},  # SQLite requires this
        echo=False,  # Set to True for SQL debugging
    )

    # Enable foreign key support for SQLite
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()
else:
    # PostgreSQL (Phase 2+)
    engine = create_engine(DATABASE_URL, echo=False)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """Dependency to get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Initialize database tables and default data"""
    from app.models import stores, items, inventory, transfers, invoices, supplies, users, settings, logs, expenses
    Base.metadata.create_all(bind=engine)

    # Initialize default data
    db = SessionLocal()
    try:
        # Initialize stores if empty
        from app.models.stores import Store, INITIAL_STORES
        if db.query(Store).count() == 0:
            for store_data in INITIAL_STORES:
                store = Store(**store_data)
                db.add(store)
            db.commit()
            print(f"Initialized {len(INITIAL_STORES)} stores")

        # Initialize supplies if empty
        from app.models.supplies import Supply, INITIAL_SUPPLIES
        if db.query(Supply).count() == 0:
            for supply_data in INITIAL_SUPPLIES:
                supply = Supply(**supply_data)
                db.add(supply)
            db.commit()
            print(f"Initialized {len(INITIAL_SUPPLIES)} supplies")

        # Initialize settings if empty
        from app.models.settings import Setting, INITIAL_SETTINGS
        if db.query(Setting).count() == 0:
            for setting_data in INITIAL_SETTINGS:
                db.add(Setting(**setting_data))
            db.commit()
            print(f"Initialized {len(INITIAL_SETTINGS)} settings")

        # Initialize tax rates if empty
        from app.models.settings import TaxRate, INITIAL_TAX_RATES
        if db.query(TaxRate).count() == 0:
            for tax_data in INITIAL_TAX_RATES:
                db.add(TaxRate(**tax_data))
            db.commit()
            print(f"Initialized {len(INITIAL_TAX_RATES)} tax rates")

        # Initialize suppliers if empty
        from app.models.settings import Supplier, INITIAL_SUPPLIERS
        if db.query(Supplier).count() == 0:
            for supplier_data in INITIAL_SUPPLIERS:
                supplier = Supplier(**supplier_data)
                db.add(supplier)
            db.commit()
            print(f"Initialized {len(INITIAL_SUPPLIERS)} suppliers")

        # Initialize users if empty
        from app.models.users import User, INITIAL_USERS
        if db.query(User).count() == 0:
            for user_data in INITIAL_USERS:
                # Placeholder password hash for local phase
                db.add(User(hashed_password="local", **user_data))
            db.commit()
            print(f"Initialized {len(INITIAL_USERS)} users")

    except Exception as e:
        print(f"Error initializing database: {e}")
        db.rollback()
    finally:
        db.close()
