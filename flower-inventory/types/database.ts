export type UserRole = "admin" | "store" | "boss" | "manager" | "staff"

export type OperationType = "headquarters" | "franchise"

export interface Store {
  id: string
  name: string
  code: string
  operation_type: OperationType
  store_type: "store" | "online" | "consignment"
  email?: string
  address?: string
  phone?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface User {
  id: string
  email: string
  role: UserRole
  store_id?: string
  name?: string
  created_at: string
  updated_at: string
}

export interface Vendor {
  id: string
  name: string
  code: string
  email?: string
  csv_encoding?: string
  csv_config?: CSVConfig
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CSVConfig {
  item_name_col: number
  variety_col?: number
  origin_col?: number
  grade_col?: number
  size_col?: number
  price_col: number
  quantity_col?: number
  code_col?: number
  unit_col?: number
  category_col?: number
}

export interface Item {
  id: string
  vendor_id: string
  name: string
  variety?: string
  code?: string
  default_unit_price: number
  unit?: string
  category?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

// 入荷記録
export interface Arrival {
  id: string
  vendor_id: string
  item_id?: string
  item_name: string
  variety?: string
  origin?: string
  grade?: string
  size?: string
  quantity: number
  wholesale_price: number
  unit_price: number
  arrived_at: string
  note?: string
  created_by?: string
  created_at: string
}

// 倉庫在庫
export interface Inventory {
  id: string
  arrival_id: string
  item_id?: string
  item_name: string
  variety?: string
  remaining_quantity: number
  wholesale_price: number
  unit_price: number
  arrived_at: string
  updated_at: string
}

// 持ち出し記録
export interface Transfer {
  id: string
  store_id: string
  inventory_id: string
  item_name: string
  variety?: string
  quantity: number
  wholesale_price: number
  unit_price: number
  margin: number
  transferred_at: string
  input_by?: string
  created_at: string
}

// 単価変更履歴
export interface PriceChange {
  id: string
  inventory_id: string
  old_price: number
  new_price: number
  changed_by?: string
  changed_at: string
  reason?: string
}

// 廃棄・ロス
export interface Disposal {
  id: string
  inventory_id: string
  quantity: number
  reason: "damage" | "expired" | "lost" | "other"
  note?: string
  disposed_by?: string
  disposed_at: string
}

// 請求書
export interface Invoice {
  id: string
  store_id: string
  invoice_number: string
  invoice_type: "flower" | "supply" | "contractor"
  period_start: string
  period_end: string
  prev_invoice_amount: number
  prev_payment_amount: number
  carryover_amount: number
  subtotal_10: number
  tax_amount_10: number
  subtotal_08: number
  tax_amount_08: number
  total_amount: number
  status: "draft" | "generated" | "sent" | "paid"
  pdf_path?: string
  sent_at?: string
  created_by?: string
  created_at: string
  updated_at: string
}

export interface InvoiceItem {
  id: string
  invoice_id: string
  item_name: string
  variety?: string
  quantity: number
  unit_price: number
  subtotal: number
  tax_rate: number
  transferred_at: string
  created_at: string
}

// 経費
export interface Expense {
  id: string
  store_id: string
  category: "jftd" | "yupack" | "eneos" | "ntt" | "freight" | "electric" | "water" | "gas" | "common_fee" | "other"
  year_month: string
  amount: number
  billing_method: "invoice" | "transfer"
  invoice_no?: string
  note?: string
  created_by?: string
  created_at: string
}

// エラーアラート
export interface ErrorAlert {
  id: string
  type: "csv_import" | "pdf_generate" | "email_send" | "gmail_fetch"
  message: string
  detail?: Record<string, unknown>
  status: "pending" | "resolved"
  resolved_by?: string
  created_at: string
  resolved_at?: string
}

// Gmail監視設定
export interface GmailConfig {
  id: string
  vendor_id: string
  sender_email: string
  subject_pattern?: string
  is_active: boolean
  last_checked_at?: string
  created_at: string
  updated_at: string
}

// 取込履歴
export interface ImportHistory {
  id: string
  vendor_id: string
  file_name: string
  file_type: "csv" | "xlsx" | "pdf"
  source: "manual" | "gmail"
  items_count: number
  status: "success" | "partial" | "failed"
  error_message?: string
  imported_by?: string
  imported_at: string
}

// バケツ用紙印刷用
export interface BucketPaperItem {
  arrival_id: string
  item_name: string
  variety?: string
  origin?: string
  grade?: string
  size?: string
  wholesale_price: number
  unit_price: number
  quantity: number
  stores: string[]
}

export interface Transaction {
  id: string
  store_id: string
  item_id: string
  quantity: number
  unit_price: number
  subtotal: number
  transaction_date: string
  created_by?: string
  created_at: string
  updated_at: string
}
