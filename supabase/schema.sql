-- 店舗マスタ
CREATE TABLE IF NOT EXISTS stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  address TEXT,
  phone VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ユーザー（Supabase認証と連携）
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'store')),
  store_id UUID REFERENCES stores(id),
  name VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 卸業者マスタ（CSV列設定を含む）
CREATE TABLE IF NOT EXISTS vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  csv_config JSONB, -- 列マッピング設定 {"item_name_col": 0, "price_col": 1, "quantity_col": 2}
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 品目マスタ
CREATE TABLE IF NOT EXISTS items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES vendors(id),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(100),
  unit_price DECIMAL(10, 2) NOT NULL,
  unit VARCHAR(50), -- 単位（本、束、箱など）
  category VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 取引記録
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) NOT NULL,
  item_id UUID REFERENCES items(id) NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 請求書
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) NOT NULL,
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  invoice_date DATE NOT NULL,
  total_amount DECIMAL(12, 2) NOT NULL,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'issued', 'paid')),
  pdf_url TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 請求書明細
CREATE TABLE IF NOT EXISTS invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE NOT NULL,
  item_id UUID REFERENCES items(id) NOT NULL,
  item_name VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_users_store_id ON users(store_id);
CREATE INDEX IF NOT EXISTS idx_items_vendor_id ON items(vendor_id);
CREATE INDEX IF NOT EXISTS idx_transactions_store_id ON transactions(store_id);
CREATE INDEX IF NOT EXISTS idx_transactions_item_id ON transactions(item_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_invoices_store_id ON invoices(store_id);
CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(invoice_date);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);

-- 部分的なUNIQUE制約（vendor_idとcodeが両方NULLでない場合のみ適用）
CREATE UNIQUE INDEX IF NOT EXISTS idx_items_vendor_code ON items(vendor_id, code)
WHERE vendor_id IS NOT NULL AND code IS NOT NULL;

-- Row Level Security (RLS) の有効化
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;

-- RLSポリシー: 管理者は全てのデータにアクセス可能
CREATE POLICY "Admins can access all stores" ON stores
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

CREATE POLICY "Store users can view their store" ON stores
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users WHERE users.id = auth.uid() AND users.store_id = stores.id
    )
  );

-- Users RLS
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can manage all users" ON users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Vendors RLS（管理者のみ）
CREATE POLICY "Admins can manage vendors" ON vendors
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Items RLS（全ユーザーが閲覧可能、管理者のみ編集可能）
CREATE POLICY "All authenticated users can view items" ON items
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage items" ON items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can update items" ON items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete items" ON items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Transactions RLS
CREATE POLICY "Users can view transactions for their store" ON transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users WHERE users.id = auth.uid()
      AND (users.role = 'admin' OR users.store_id = transactions.store_id)
    )
  );

CREATE POLICY "Store users can create transactions for their store" ON transactions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users WHERE users.id = auth.uid()
      AND (users.role = 'admin' OR users.store_id = transactions.store_id)
    )
  );

-- Invoices RLS
CREATE POLICY "Users can view invoices for their store" ON invoices
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users WHERE users.id = auth.uid()
      AND (users.role = 'admin' OR users.store_id = invoices.store_id)
    )
  );

CREATE POLICY "Admins can manage invoices" ON invoices
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Invoice Items RLS
CREATE POLICY "Users can view invoice items" ON invoice_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM invoices
      JOIN users ON users.id = auth.uid()
      WHERE invoices.id = invoice_items.invoice_id
      AND (users.role = 'admin' OR users.store_id = invoices.store_id)
    )
  );

CREATE POLICY "Admins can manage invoice items" ON invoice_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Sample data
INSERT INTO stores (name, code, address, phone) VALUES
  ('Hanaya Main Store', 'MAIN001', 'Tokyo Shibuya 1-1-1', '03-1234-5678'),
  ('Hanaya Shinjuku', 'SHINJU01', 'Tokyo Shinjuku 2-2-2', '03-2345-6789'),
  ('Hanaya Yokohama', 'YOKOH01', 'Yokohama 3-3-3', '045-3456-7890')
ON CONFLICT (code) DO NOTHING;

INSERT INTO vendors (name, code, csv_config) VALUES
  ('Flower Vendor A', 'VENDOR_A', '{"item_name_col": 0, "price_col": 1, "quantity_col": 2, "code_col": 3}'),
  ('Flower Vendor B', 'VENDOR_B', '{"item_name_col": 1, "price_col": 2, "quantity_col": 0, "code_col": 3}')
ON CONFLICT (code) DO NOTHING;
