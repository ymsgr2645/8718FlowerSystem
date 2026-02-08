# 8718system

## セットアップ手順

### 1. Supabaseデータベースのセットアップ

1. [Supabase Dashboard](https://supabase.com/dashboard) にアクセス
2. プロジェクト `klxefzlppwcaaukqzhzp` を選択
3. 左メニューから「SQL Editor」を選択
4. `supabase/schema.sql` の内容をコピー&ペースト
5. 「Run」ボタンをクリックしてスキーマを作成

### 2. テストユーザーの作成

Supabase Dashboard の「Authentication」→「Users」から手動でユーザーを作成:

#### 管理者ユーザー
- Email: `admin@example.com`
- Password: `password123`

作成後、SQL Editorで以下を実行:
```sql
INSERT INTO users (id, email, role, name)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'admin@example.com'),
  'admin@example.com',
  'admin',
  '管理者'
);
```

#### 店舗ユーザー
- Email: `store@example.com`
- Password: `password123`

作成後、SQL Editorで以下を実行:
```sql
INSERT INTO users (id, email, role, store_id, name)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'store@example.com'),
  'store@example.com',
  'store',
  (SELECT id FROM stores WHERE code = 'MAIN001'),
  '店舗担当者'
);
```

### 3. ローカル開発サーバーの起動

```bash
npm run dev
```

ブラウザで http://localhost:3000 にアクセス

## 主な機能

### 管理者機能
- CSV一括取り込み（列マッピング対応）
- 品目マスタ管理
- 卸業者管理
- 店舗管理
- 請求書生成

### 店舗機能
- 商品発注（モバイル最適化）
- 発注履歴確認

## 技術スタック

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Supabase (PostgreSQL + 認証)
- jsPDF (PDF生成)
- PapaParse (CSV解析)
