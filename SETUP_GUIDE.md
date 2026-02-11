# 8718 Flower System - セットアップガイド

## 概要

花屋の業務管理システムです。入荷ロット単位の在庫管理、店舗別持出、請求書発行などを行います。

現在はローカル環境（FastAPI + SQLite）で運用しています。

## セットアップ手順

### 1. 依存パッケージのインストール

```bash
# フロントエンド
npm install

# バックエンド
cd backend
pip install fastapi uvicorn sqlalchemy pydantic
```

### 2. 環境変数の確認

`.env.local` に以下が設定されていることを確認:

```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 3. サーバーの起動

```bash
# ワンコマンド起動
./start.sh
```

これにより以下が起動します:
- Next.js フロントエンド: http://localhost:3000
- FastAPI バックエンド: http://localhost:8000
- API ドキュメント: http://localhost:8000/docs

### 4. ログイン

ブラウザで http://localhost:3000 にアクセスし、クイックログインボタンでログイン。

| ロール | 用途 |
|--------|------|
| ADMIN | 全機能の確認・設定 |
| Boss | 経営管理 + 日常業務 |
| Manager | 店舗業務管理 |
| Staff | 入荷・持出等の基本操作 |

## データベース

SQLiteファイル `backend/8718_flower_system.db` にデータが保存されます。
バックエンド初回起動時にテーブルが自動作成されます。

### 主なテーブル

| テーブル | 内容 |
|----------|------|
| stores | 店舗マスタ（11店舗 + 委託等） |
| items | 品目マスタ |
| inventory | 在庫（入荷ロット単位） |
| transfers | 持出記録 |
| invoices | 請求書 |
| settings | システム設定 |

## トラブルシューティング

### バックエンドが起動しない
- Python 3.10+ がインストールされているか確認
- `pip install fastapi uvicorn sqlalchemy` を再実行

### フロントエンドでAPIエラー
- バックエンドが port 8000 で起動しているか確認
- `.env.local` の `NEXT_PUBLIC_API_URL` が正しいか確認

### データベースをリセットしたい
- `backend/8718_flower_system.db` を削除してバックエンドを再起動
