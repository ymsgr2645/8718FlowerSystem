# 8718 Flower System

花屋の業務管理システム。入荷・持出・在庫・請求書・経費を一元管理します。

## 技術スタック

- **フロントエンド**: Next.js 16 (App Router), TypeScript, Material Design 3
- **バックエンド**: FastAPI (Python), SQLite
- **PDF生成**: jsPDF
- **CSV解析**: PapaParse

## セットアップ

### 必要なもの

- Node.js 18+
- Python 3.10+

### インストール

```bash
# フロントエンド
npm install

# バックエンド
cd backend
pip install -r requirements.txt
```

### 起動

```bash
# ワンコマンド起動（フロント + バックエンド）
./start.sh

# または個別に起動
npm run dev                                          # フロントエンド (port 3000)
cd backend && python3 -m uvicorn app.main:app --reload --port 8000  # バックエンド (port 8000)
```

ブラウザで http://localhost:3000 にアクセス

### 開発用ログイン

ログイン画面のクイックログインボタンで即座にアクセス可能:

| ロール | 権限 |
|--------|------|
| ADMIN | 全機能アクセス |
| Boss | 経営管理 + 業務 |
| Manager | 業務管理 |
| Staff | 基本業務のみ |

## 主な機能

### 業務機能
- 入荷管理（ロット単位の在庫登録）
- 持出入力（花・資材の店舗別振り分け、廃棄/ロス記録）
- 倉庫在庫管理
- 請求書発行（PDF出力）
- 経費入力
- エラーアラート
- 分析・レポート

### 管理機能
- マスタ管理（品目・店舗・卸業者）
- 花カタログ
- 権限設定
- バックアップ
- 店舗ポータル

## 店舗構成

札幌圏11店舗 + 委託販売 + 通信販売 + 高円寺

## API ドキュメント

バックエンド起動後: http://localhost:8000/docs
