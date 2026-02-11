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
    from app.models import stores, items, inventory, transfers, invoices, supplies, users, settings, logs, expenses, payments
    Base.metadata.create_all(bind=engine)

    # Add sort_order columns if they don't exist (migration for existing DBs)
    from sqlalchemy import text, inspect
    inspector = inspect(engine)
    with engine.connect() as conn:
        for table_name in ["items", "suppliers"]:
            columns = [c["name"] for c in inspector.get_columns(table_name)]
            if "sort_order" not in columns:
                conn.execute(text(f"ALTER TABLE {table_name} ADD COLUMN sort_order INTEGER DEFAULT 99"))
                conn.commit()
                print(f"Added sort_order column to {table_name}")

        # Arrivals: add detail columns if missing
        arrival_cols = [c["name"] for c in inspector.get_columns("arrivals")]
        for col_name, col_type in [
            ("color", "VARCHAR(100)"),
            ("grade", "VARCHAR(50)"),
            ("grade_class", "VARCHAR(50)"),
            ("stem_length", "INTEGER"),
            ("bloom_count", "INTEGER"),
            ("remaining_quantity", "INTEGER"),
        ]:
            if col_name not in arrival_cols:
                conn.execute(text(f"ALTER TABLE arrivals ADD COLUMN {col_name} {col_type}"))
                conn.commit()
                print(f"Added {col_name} column to arrivals")
        # Initialize remaining_quantity from quantity if null
        if "remaining_quantity" in [c["name"] for c in inspector.get_columns("arrivals")]:
            conn.execute(text("UPDATE arrivals SET remaining_quantity = quantity WHERE remaining_quantity IS NULL"))
            conn.commit()

        # Arrivals: add display_id if missing
        if "display_id" not in arrival_cols:
            conn.execute(text("ALTER TABLE arrivals ADD COLUMN display_id VARCHAR(20)"))
            conn.commit()
            print("Added display_id column to arrivals")

        # Stores: add color if missing
        store_cols = [c["name"] for c in inspector.get_columns("stores")]
        if "color" not in store_cols:
            conn.execute(text("ALTER TABLE stores ADD COLUMN color VARCHAR(7)"))
            conn.commit()
            print("Added color column to stores")

        # Transfers: add arrival_id if missing
        transfer_cols = [c["name"] for c in inspector.get_columns("transfers")]
        if "arrival_id" not in transfer_cols:
            conn.execute(text("ALTER TABLE transfers ADD COLUMN arrival_id INTEGER REFERENCES arrivals(id)"))
            conn.commit()
            print("Added arrival_id column to transfers")

        # Disposals: add arrival_id if missing
        disposal_cols = [c["name"] for c in inspector.get_columns("disposals")]
        if "arrival_id" not in disposal_cols:
            conn.execute(text("ALTER TABLE disposals ADD COLUMN arrival_id INTEGER REFERENCES arrivals(id)"))
            conn.commit()
            print("Added arrival_id column to disposals")

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
