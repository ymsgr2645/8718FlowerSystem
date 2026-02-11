"""
8718 Flower System - Backup Router
データベースバックアップとCSVエクスポート
"""

import os
import io
import csv
import zipfile
import shutil
from fastapi import APIRouter, Depends
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import inspect

from app.database import get_db, engine

router = APIRouter()

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "8718_flower_system.db")


@router.get("/export")
async def export_database():
    """SQLiteデータベースファイルをそのままダウンロード"""
    if not os.path.exists(DB_PATH):
        return {"error": "Database file not found"}
    return FileResponse(
        DB_PATH,
        media_type="application/octet-stream",
        filename=f"8718_flower_system_backup.db",
    )


@router.get("/export-csv")
async def export_csv(db: Session = Depends(get_db)):
    """全テーブルをCSVにエクスポートしてZIPで返す"""
    inspector = inspect(engine)
    table_names = inspector.get_table_names()

    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as zf:
        for table_name in table_names:
            rows = db.execute(f"SELECT * FROM {table_name}").fetchall()
            if not rows:
                continue
            columns = db.execute(f"SELECT * FROM {table_name} LIMIT 0").keys()

            csv_buffer = io.StringIO()
            writer = csv.writer(csv_buffer)
            writer.writerow(columns)
            for row in rows:
                writer.writerow(row)

            zf.writestr(f"{table_name}.csv", csv_buffer.getvalue())

    buffer.seek(0)
    return StreamingResponse(
        buffer,
        media_type="application/zip",
        headers={"Content-Disposition": "attachment; filename=8718_data_export.zip"},
    )
