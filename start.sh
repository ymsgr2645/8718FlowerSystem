#!/bin/bash
# 8718 Flower System - ワンコマンド起動スクリプト
# Usage: ./start.sh

DIR="$(cd "$(dirname "$0")" && pwd)"

echo "🌸 8718 Flower System を起動しています..."

# バックエンド起動
echo "  → FastAPI バックエンド (port 8000)..."
cd "$DIR/backend"
python3 -m uvicorn app.main:app --reload --port 8000 &
BACKEND_PID=$!

# フロントエンド起動
echo "  → Next.js フロントエンド (port 3000)..."
cd "$DIR"
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ 起動完了!"
echo "  フロントエンド: http://localhost:3000"
echo "  バックエンドAPI: http://localhost:8000"
echo "  API ドキュメント: http://localhost:8000/docs"
echo ""
echo "停止するには Ctrl+C を押してください"

# Ctrl+C で両方終了
trap "echo ''; echo '🛑 停止中...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" SIGINT SIGTERM

wait
