# 8718system - セットアップガイド

## 概要
このシステムは、在庫管理システムです。管理者は卸業者からのCSVデータを一括取り込みでき、店舗スタッフはモバイルから簡単に発注できます。

## 機能一覧

### 管理者機能
- ✅ CSV一括取り込み（列マッピング対応）
- ✅ 品目マスタ管理
- ✅ 卸業者管理
- ✅ 店舗管理
- ✅ 請求書生成・PDF出力

### 店舗機能
- ✅ 商品発注（モバイル最適化）
- ✅ 発注履歴確認

## セットアップ手順

### 1. Supabaseの設定

#### データベーススキーマの適用

1. [Supabase Dashboard](https://app.supabase.com/project/klxefzlppwcaaukqzhzp) にアクセス
2. 左メニューから「SQL Editor」を選択
3. `supabase/schema.sql` の内容をコピー&ペースト
4. 「Run」ボタンをクリックしてスキーマを作成

これにより以下のテーブルが作成されます:
- stores（店舗マスタ）
- users（ユーザー情報）
- vendors（卸業者）
- items（品目マスタ）
- transactions（取引記録）
- invoices（請求書）
- invoice_items（請求書明細）

#### テストユーザーの作成

##### 1. 管理者ユーザーの作成

Supabase Dashboard の「Authentication」→「Users」から:
- Email: `admin@example.com`
- Password: `password123`

ユーザー作成後、SQL Editorで以下を実行:
```sql
INSERT INTO users (id, email, role, name)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'admin@example.com'),
  'admin@example.com',
  'admin',
  '管理者'
);
```

##### 2. 店舗ユーザーの作成

Supabase Dashboard の「Authentication」→「Users」から:
- Email: `store@example.com`
- Password: `password123`

ユーザー作成後、SQL Editorで以下を実行:
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

### 2. ローカル開発環境のセットアップ

プロジェクトは既に以下の環境変数が設定されています:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

開発サーバーを起動:
```bash
npm run dev
```

ブラウザで http://localhost:3000 にアクセス

### 3. 初期データの登録

#### 管理者としてログイン
- Email: `admin@example.com`
- Password: `password123`

#### CSVデータの取り込み

1. 「卸業者管理」から卸業者を確認（サンプルデータが既に登録済み）
2. 「CSV取り込み」をクリック
3. `sample-data/sample-flowers.csv` をアップロード
4. 列マッピングを確認・調整
   - 品名: 1列目
   - 単価: 2列目
   - 商品コード: 4列目
   - 単位: 5列目
5. 「取り込み実行」をクリック

### 4. 店舗での発注テスト

#### 店舗ユーザーとしてログイン
- Email: `store@example.com`
- Password: `password123`

#### 発注の流れ
1. 「商品発注」をクリック
2. 必要な商品を選択し、+/-ボタンで数量を調整
3. 画面下部の「確認画面へ」をクリック
4. 内容を確認して「発注確定」

### 5. 請求書の生成

管理者アカウントで:
1. 「請求書管理」をクリック
2. 「請求書作成」をクリック
3. 店舗と期間を選択
4. 「作成」をクリック
5. 作成された請求書の「PDF」ボタンでダウンロード

## トラブルシューティング

### データベース接続エラー
- `.env.local` ファイルが正しく設定されているか確認
- Supabaseプロジェクトがアクティブか確認

### ログインできない
- Supabaseダッシュボードでユーザーが正しく作成されているか確認
- usersテーブルにレコードが追加されているか確認

### CSV取り込みがうまくいかない
- CSVファイルがUTF-8エンコーディングか確認
- 列マッピングが正しく設定されているか確認

## モバイル対応

店舗の発注画面はモバイルファーストで設計されています:
- レスポンシブデザイン
- タッチ操作に最適化された+/-ボタン
- 固定されたボトムバーで常に合計金額を確認可能

iPhone、Android両方で快適に動作します。

## 技術スタック

- **フロントエンド**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **バックエンド**: Supabase (PostgreSQL + 認証)
- **PDF生成**: jsPDF
- **CSV解析**: PapaParse

## セキュリティ

- Row Level Security (RLS) によるデータアクセス制御
- 管理者は全データにアクセス可能
- 店舗ユーザーは自店舗のデータのみアクセス可能
- 環境変数ファイルは.gitignoreで除外済み

## サポート

問題が発生した場合は、以下を確認してください:
1. ブラウザのコンソールエラーログ
2. Supabaseダッシュボードのログ
3. 開発サーバーのターミナル出力
