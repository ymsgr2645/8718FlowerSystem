// API Client for 8718 Flower System (FastAPI, Phase 1)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface ApiOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  body?: unknown;
  headers?: Record<string, string>;
}

async function apiRequest<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const { method = "GET", body, headers = {} } = options;
  const config: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(error.detail || `API Error: ${response.status}`);
  }
  return response.json();
}

// ========== Stores ==========
export interface Store {
  id: number;
  name: string;
  operation_type: "headquarters" | "franchise";
  store_type: "store" | "online" | "consignment";
  email?: string;
  color?: string;
  sort_order?: number;
  is_active: boolean;
  created_at: string;
}

export const storesApi = {
  getAll: () => apiRequest<Store[]>("/api/stores"),
  getById: (id: number) => apiRequest<Store>(`/api/stores/${id}`),
  create: (data: Omit<Store, "id" | "is_active" | "created_at">) =>
    apiRequest<Store>("/api/stores", { method: "POST", body: data }),
  update: (id: number, data: Partial<Store>) =>
    apiRequest<Store>(`/api/stores/${id}`, { method: "PUT", body: data }),
  delete: (id: number) =>
    apiRequest<{ status: string }>(`/api/stores/${id}`, { method: "DELETE" }),
  reorder: (items: { id: number; sort_order: number }[]) =>
    apiRequest<{ status: string; updated: number }>("/api/stores/reorder", { method: "POST", body: { items } }),
};

// ========== Items ==========
export interface Item {
  id: number;
  item_code: string;
  name: string;
  variety?: string;
  category?: string;
  default_unit_price?: number;
  tax_rate: number;
  sort_order?: number;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export const itemsApi = {
  getAll: (params?: { skip?: number; limit?: number; category?: string; search?: string; is_active?: boolean }) => {
    const searchParams = new URLSearchParams();
    if (params?.skip) searchParams.set("skip", String(params.skip));
    if (params?.limit) searchParams.set("limit", String(params.limit));
    if (params?.category) searchParams.set("category", params.category);
    if (params?.search) searchParams.set("search", params.search);
    if (params?.is_active !== undefined) searchParams.set("is_active", String(params.is_active));
    return apiRequest<Item[]>(`/api/items?${searchParams}`);
  },
  getById: (id: number) => apiRequest<Item>(`/api/items/${id}`),
  create: (data: {
    name: string;
    variety?: string;
    category?: string;
    default_unit_price?: number;
    tax_rate?: number;
    item_code?: string;
  }) => apiRequest<Item>("/api/items", { method: "POST", body: data }),
  update: (id: number, data: Partial<Item>) =>
    apiRequest<Item>(`/api/items/${id}`, { method: "PUT", body: data }),
  delete: (id: number) =>
    apiRequest<{ status: string }>(`/api/items/${id}`, { method: "DELETE" }),
  reorder: (items: { id: number; sort_order: number }[]) =>
    apiRequest<{ status: string; updated: number }>("/api/items/reorder", { method: "POST", body: { items } }),
};

// ========== Inventory ==========
export interface Inventory {
  id: number;
  item_id: number;
  quantity: number;
  unit_price?: number;
  updated_at?: string;
}

export interface Arrival {
  id: number;
  display_id?: string;
  item_id: number;
  supplier_id?: number;
  quantity: number;
  wholesale_price?: number;
  color?: string;
  grade?: string;
  grade_class?: string;
  stem_length?: number;
  bloom_count?: number;
  remaining_quantity?: number;
  arrived_at: string;
  source_type?: string;
  created_at: string;
  item_name?: string;
  item_variety?: string;
  supplier_name?: string;
}

export interface InventoryAdjustment {
  id: number;
  item_id: number;
  adjustment_type: "increase" | "decrease" | "correction";
  quantity: number;
  reason?: string;
  note?: string;
  adjusted_by?: number;
  adjusted_at: string;
}

export interface Disposal {
  id: number;
  item_id: number;
  quantity: number;
  reason?: string;
  note?: string;
  disposed_by?: number;
  disposed_at: string;
}

export const inventoryApi = {
  getAll: () => apiRequest<Inventory[]>("/api/inventory"),
  getByItem: (itemId: number) => apiRequest<Inventory>(`/api/inventory/item/${itemId}`),

  // Arrivals
  createArrival: (data: {
    item_id: number;
    supplier_id?: number;
    quantity: number;
    wholesale_price?: number;
    source_type?: string;
    arrived_at?: string;
  }) => apiRequest<Arrival>("/api/inventory/arrivals", { method: "POST", body: data }),
  getArrivals: (params?: {
    item_id?: number;
    supplier_id?: number;
    date_from?: string;
    date_to?: string;
    skip?: number;
    limit?: number;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.item_id) searchParams.set("item_id", String(params.item_id));
    if (params?.supplier_id) searchParams.set("supplier_id", String(params.supplier_id));
    if (params?.date_from) searchParams.set("date_from", params.date_from);
    if (params?.date_to) searchParams.set("date_to", params.date_to);
    if (params?.skip) searchParams.set("skip", String(params.skip));
    if (params?.limit) searchParams.set("limit", String(params.limit));
    return apiRequest<Arrival[]>(`/api/inventory/arrivals?${searchParams}`);
  },

  // Adjustments
  createAdjustment: (data: {
    item_id: number;
    adjustment_type: string;
    quantity: number;
    reason?: string;
    note?: string;
    adjusted_by?: number;
  }) => apiRequest<InventoryAdjustment>("/api/inventory/adjustments", { method: "POST", body: data }),
  getAdjustments: (params?: { item_id?: number; skip?: number; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.item_id) searchParams.set("item_id", String(params.item_id));
    if (params?.skip) searchParams.set("skip", String(params.skip));
    if (params?.limit) searchParams.set("limit", String(params.limit));
    return apiRequest<InventoryAdjustment[]>(`/api/inventory/adjustments?${searchParams}`);
  },

  // Disposals
  createDisposal: (data: { item_id: number; arrival_id?: number; quantity: number; reason?: string; note?: string; disposed_by?: number }) =>
    apiRequest<Disposal>("/api/inventory/disposals", { method: "POST", body: data }),
  getDisposals: (params?: { item_id?: number; skip?: number; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.item_id) searchParams.set("item_id", String(params.item_id));
    if (params?.skip) searchParams.set("skip", String(params.skip));
    if (params?.limit) searchParams.set("limit", String(params.limit));
    return apiRequest<Disposal[]>(`/api/inventory/disposals?${searchParams}`);
  },

  // Long-term stock alerts
  getLongTermAlerts: (days?: number) =>
    apiRequest<
      Array<{ item_id: number; item_name: string; item_code: string; arrived_at: string; quantity: number; days_in_stock: number }>
    >(`/api/inventory/long-term-alerts?days=${days || 7}`),
};

// ========== Transfers ==========
export interface Transfer {
  id: number;
  store_id: number;
  item_id: number;
  arrival_id?: number;
  quantity: number;
  unit_price: number;
  wholesale_price?: number;
  margin?: number;
  transferred_at: string;
  input_by?: number;
  created_at: string;
}

export const transfersApi = {
  getAll: (params?: {
    store_id?: number;
    item_id?: number;
    date_from?: string;
    date_to?: string;
    skip?: number;
    limit?: number;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.store_id) searchParams.set("store_id", String(params.store_id));
    if (params?.item_id) searchParams.set("item_id", String(params.item_id));
    if (params?.date_from) searchParams.set("date_from", params.date_from);
    if (params?.date_to) searchParams.set("date_to", params.date_to);
    if (params?.skip) searchParams.set("skip", String(params.skip));
    if (params?.limit) searchParams.set("limit", String(params.limit));
    return apiRequest<Transfer[]>(`/api/transfers?${searchParams}`);
  },
  create: (data: {
    store_id: number;
    item_id: number;
    arrival_id?: number;
    quantity: number;
    unit_price: number;
    wholesale_price?: number;
    transferred_at: string;
    input_by?: number;
  }) => apiRequest<Transfer>("/api/transfers", { method: "POST", body: data }),
  getByStore: (storeId: number, dateFrom?: string, dateTo?: string) => {
    const searchParams = new URLSearchParams();
    if (dateFrom) searchParams.set("date_from", dateFrom);
    if (dateTo) searchParams.set("date_to", dateTo);
    return apiRequest<Transfer[]>(`/api/transfers/store/${storeId}?${searchParams}`);
  },
  createPriceChange: (data: {
    item_id: number;
    old_price?: number;
    new_price: number;
    reason?: string;
  }) => apiRequest<unknown>("/api/transfers/price-changes", { method: "POST", body: data }),
  getLatestPrices: () => apiRequest<Record<string, number>>("/api/transfers/price-changes-latest"),
  getPriceChanges: (itemId: number) =>
    apiRequest<Array<{ id: number; item_id: number; old_price?: number; new_price: number; changed_at: string; reason?: string }>>(
      `/api/transfers/price-changes/${itemId}`
    ),
};

// ========== Supplies ==========
export interface Supply {
  id: number;
  name: string;
  specification?: string;
  unit_price?: number;
  category?: string;
  stock_quantity?: number;  // 現在庫
  sort_order?: number;  // 表示順序
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface SupplyTransfer {
  id: number;
  store_id: number;
  supply_id: number;
  quantity: number;
  unit_price: number;
  transferred_at: string;
  input_by?: number;
  created_at: string;
}

export const suppliesApi = {
  getAll: (includeInactive?: boolean) => {
    const params = includeInactive ? "?include_inactive=true" : "";
    return apiRequest<Supply[]>(`/api/supplies${params}`);
  },
  create: (data: { name: string; specification?: string; unit_price?: number; category?: string }) =>
    apiRequest<Supply>("/api/supplies", { method: "POST", body: data }),
  update: (id: number, data: Partial<Supply>) =>
    apiRequest<Supply>(`/api/supplies/${id}`, { method: "PUT", body: data }),
  delete: (id: number) =>
    apiRequest<{ status: string }>(`/api/supplies/${id}`, { method: "DELETE" }),
  addStock: (id: number, quantity: number) =>
    apiRequest<{ id: number; name: string; stock_quantity: number }>(
      `/api/supplies/${id}/add-stock?quantity=${quantity}`,
      { method: "POST" }
    ),
  getTransfers: (params?: { store_id?: number; supply_id?: number; date_from?: string; date_to?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.store_id) searchParams.set("store_id", String(params.store_id));
    if (params?.supply_id) searchParams.set("supply_id", String(params.supply_id));
    if (params?.date_from) searchParams.set("date_from", params.date_from);
    if (params?.date_to) searchParams.set("date_to", params.date_to);
    return apiRequest<SupplyTransfer[]>(`/api/supplies/transfers?${searchParams}`);
  },
  createTransfer: (data: {
    store_id: number;
    supply_id: number;
    quantity: number;
    unit_price: number;
    transferred_at: string;
    input_by?: number;
  }) => apiRequest<SupplyTransfer>("/api/supplies/transfers", { method: "POST", body: data }),
  reorder: (items: { id: number; sort_order: number }[]) =>
    apiRequest<{ status: string; updated: number }>("/api/supplies/reorder", { method: "POST", body: { items } }),
};

// ========== Settings / Suppliers ==========
export interface Setting {
  id: number;
  key: string;
  value: string;
  description?: string;
  updated_at: string;
}

export interface TaxRate {
  id: number;
  name: string;
  rate: number;
  effective_from: string;
  is_default: boolean;
  is_active: boolean;
}

export interface Supplier {
  id: number;
  name: string;
  email?: string;
  csv_encoding: string;
  csv_format?: string;
  sort_order?: number;
  is_active: boolean;
  created_at: string;
}

export const settingsApi = {
  getAll: () => apiRequest<Setting[]>("/api/settings"),
  update: (key: string, value: string) => apiRequest<Setting>(`/api/settings/${key}`, { method: "PUT", body: { value } }),
  getTaxRates: () => apiRequest<TaxRate[]>("/api/settings/tax-rates"),
  createTaxRate: (data: { name: string; rate: number; effective_from: string; is_default?: boolean; is_active?: boolean }) =>
    apiRequest<TaxRate>("/api/settings/tax-rates", { method: "POST", body: data }),
  getSuppliers: () => apiRequest<Supplier[]>("/api/settings/suppliers"),
  createSupplier: (data: { name: string; email?: string; csv_encoding?: string; csv_format?: string }) =>
    apiRequest<Supplier>("/api/settings/suppliers", { method: "POST", body: data }),
  updateSupplier: (id: number, data: Partial<Supplier>) =>
    apiRequest<Supplier>(`/api/settings/suppliers/${id}`, { method: "PUT", body: data }),
  deleteSupplier: (id: number) =>
    apiRequest<{ status: string }>(`/api/settings/suppliers/${id}`, { method: "DELETE" }),
  reorderSuppliers: (items: { id: number; sort_order: number }[]) =>
    apiRequest<{ status: string; updated: number }>("/api/settings/suppliers/reorder", { method: "POST", body: { items } }),
};

// ========== Expenses ==========
export interface Expense {
  id: number;
  store_id: number;
  category: string;
  year_month: string;
  amount: number;
  billing_method: string;
  invoice_no?: string;
  note?: string;
  created_by?: number;
  created_at: string;
}

export const expensesApi = {
  getAll: (params?: { store_id?: number; year_month?: string; category?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.store_id) searchParams.set("store_id", String(params.store_id));
    if (params?.year_month) searchParams.set("year_month", params.year_month);
    if (params?.category) searchParams.set("category", params.category);
    return apiRequest<Expense[]>(`/api/expenses?${searchParams}`);
  },
  create: (data: {
    store_id: number;
    category: string;
    year_month: string;
    amount: number;
    billing_method: string;
    invoice_no?: string;
    note?: string;
    created_by?: number;
  }) => apiRequest<Expense>("/api/expenses", { method: "POST", body: data }),
};

// ========== Alerts ==========
export interface ErrorAlert {
  id: number;
  type: string;
  message: string;
  detail?: Record<string, unknown>;
  status: "pending" | "resolved";
  resolved_by?: number;
  created_at: string;
  resolved_at?: string;
}

export const alertsApi = {
  getAll: (status?: string) => apiRequest<ErrorAlert[]>(`/api/alerts?status=${status || ""}`),
  create: (data: { type: string; message: string; detail?: Record<string, unknown> }) =>
    apiRequest<ErrorAlert>("/api/alerts", { method: "POST", body: data }),
  resolve: (id: number, resolved_by?: number) =>
    apiRequest<ErrorAlert>(`/api/alerts/${id}/resolve`, { method: "PATCH", body: { resolved_by } }),
};

// ========== Invoices ==========
export interface Invoice {
  id: number;
  store_id: number;
  invoice_number: string;
  invoice_type: "flower" | "supply" | "contractor";
  period_start: string;
  period_end: string;
  prev_invoice_amount: number;
  prev_payment_amount: number;
  carryover_amount: number;
  subtotal_10: number;
  tax_amount_10: number;
  subtotal_08: number;
  tax_amount_08: number;
  total_amount: number;
  status: "draft" | "sent" | "paid" | "generated";
  pdf_path?: string;
  sent_at?: string;
  created_at: string;
}

export interface InvoiceItem {
  id: number;
  item_id?: number;
  item_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  tax_rate: number;
  transferred_at?: string;
}

export interface InvoiceDetail extends Invoice {
  items: InvoiceItem[];
}

export const invoicesApi = {
  getAll: (params?: { store_id?: number; invoice_type?: string; status?: string; skip?: number; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.store_id) searchParams.set("store_id", String(params.store_id));
    if (params?.invoice_type) searchParams.set("invoice_type", params.invoice_type);
    if (params?.status) searchParams.set("status", params.status);
    if (params?.skip) searchParams.set("skip", String(params.skip));
    if (params?.limit) searchParams.set("limit", String(params.limit));
    return apiRequest<Invoice[]>(`/api/invoices?${searchParams}`);
  },
  getById: (id: number) => apiRequest<InvoiceDetail>(`/api/invoices/${id}`),
  generate: (data: {
    store_id: number;
    invoice_type: string;
    period_start: string;
    period_end: string;
    prev_invoice_amount?: number;
    prev_payment_amount?: number;
    carryover_amount?: number;
    created_by?: number;
  }) => apiRequest<InvoiceDetail>("/api/invoices/generate", { method: "POST", body: data }),
  updateStatus: (id: number, status: string) =>
    apiRequest<Invoice>(`/api/invoices/${id}/status?status=${status}`, { method: "PATCH" }),
};

// ========== Analytics ==========
export interface SupplierSummary {
  supplier_id: number;
  supplier_name: string;
  arrival_count: number;
  total_quantity: number;
  total_amount: number;
}

export interface StoreSummary {
  store_id: number;
  store_name: string;
  operation_type: string;
  transfer_count: number;
  total_quantity: number;
  delivery_amount: number;
  purchase_amount: number;
  margin: number;
}

export interface DailyComparison {
  date: string;
  purchase_amount: number;
  purchase_quantity: number;
  delivery_amount: number;
  delivery_quantity: number;
  difference: number;
}

export const analyticsApi = {
  getSupplierSummary: (year: number, month: number) =>
    apiRequest<{ year: number; month: number; suppliers: SupplierSummary[]; grand_total: number }>(
      `/api/analytics/supplier-summary?year=${year}&month=${month}`
    ),
  getStoreSummary: (year: number, month: number) =>
    apiRequest<{ year: number; month: number; stores: StoreSummary[]; total_delivery: number; total_purchase: number; total_margin: number }>(
      `/api/analytics/store-summary?year=${year}&month=${month}`
    ),
  getPurchaseDeliveryComparison: (year: number, month: number) =>
    apiRequest<{
      year: number; month: number; daily: DailyComparison[];
      period_totals: Record<string, { purchase: number; delivery: number }>;
      total_purchase: number; total_delivery: number; total_difference: number;
    }>(`/api/analytics/purchase-delivery-comparison?year=${year}&month=${month}`),
  getMonthlyPL: (year: number, month: number, storeId?: number) => {
    const params = storeId ? `&store_id=${storeId}` : "";
    return apiRequest<{
      year: number; month: number; store_id: number | null;
      summary: {
        total_purchase: number; total_revenue: number; total_cost: number;
        gross_profit: number; gross_margin: number; total_expenses: number;
        total_supply_cost: number; operating_profit: number; total_quantity: number;
      };
      expenses_by_category: Record<string, number>;
      store_breakdown: { store_id: number; store_name: string; revenue: number; quantity: number }[];
    }>(`/api/analytics/monthly-pl?year=${year}&month=${month}${params}`);
  },
};

// ========== Payments ==========
export interface Payment {
  id: number;
  invoice_id: number;
  amount: number;
  payment_date: string;
  payment_method?: string;
  bank_name?: string;
  note?: string;
}

export interface PaymentConfirmation {
  invoice_id: number;
  invoice_number: string;
  store_name: string;
  period: string;
  billed_amount: number;
  paid_amount: number;
  difference: number;
  status: string;
}

export const paymentsApi = {
  getAll: (invoiceId?: number) => {
    const params = invoiceId ? `?invoice_id=${invoiceId}` : "";
    return apiRequest<Payment[]>(`/api/payments${params}`);
  },
  create: (data: {
    invoice_id: number; amount: number; payment_date: string;
    payment_method?: string; bank_name?: string; note?: string;
  }) => apiRequest<Payment>("/api/payments", { method: "POST", body: data }),
  getConfirmation: (year: number, month: number) =>
    apiRequest<{
      year: number; month: number; items: PaymentConfirmation[];
      total_billed: number; total_paid: number; total_difference: number;
    }>(`/api/payments/confirmation?year=${year}&month=${month}`),
};

// ========== CSV Import ==========
export interface CSVImportResult {
  total_rows: number;
  imported: number;
  skipped: number;
  errors: string[];
  new_items_created: number;
}

export interface CSVPreviewData {
  supplier_id: number;
  supplier_name: string;
  encoding: string;
  headers: string[];
  rows: { row_number: number; raw: string[] }[];
  total_columns: number;
}

export const csvImportApi = {
  getSuppliers: () =>
    apiRequest<{ id: number; name: string; csv_encoding: string; csv_format: string | null }[]>(
      "/api/csv-import/suppliers"
    ),
  preview: async (file: File, supplierId: number, encoding: string): Promise<CSVPreviewData> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("supplier_id", String(supplierId));
    formData.append("encoding", encoding);
    const response = await fetch(`${API_BASE_URL}/api/csv-import/preview`, {
      method: "POST",
      body: formData,
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Unknown error" }));
      throw new Error(error.detail || `API Error: ${response.status}`);
    }
    return response.json();
  },
  execute: async (
    file: File,
    params: {
      supplier_id: number;
      encoding: string;
      item_name_col: number;
      variety_col: number;
      quantity_col: number;
      unit_price_col: number;
      arrived_date: string;
    }
  ): Promise<CSVImportResult> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("supplier_id", String(params.supplier_id));
    formData.append("encoding", params.encoding);
    formData.append("item_name_col", String(params.item_name_col));
    formData.append("variety_col", String(params.variety_col));
    formData.append("quantity_col", String(params.quantity_col));
    formData.append("unit_price_col", String(params.unit_price_col));
    formData.append("arrived_date", params.arrived_date);
    const response = await fetch(`${API_BASE_URL}/api/csv-import/execute`, {
      method: "POST",
      body: formData,
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Unknown error" }));
      throw new Error(error.detail || `API Error: ${response.status}`);
    }
    return response.json();
  },
};

const api = {
  stores: storesApi,
  items: itemsApi,
  inventory: inventoryApi,
  transfers: transfersApi,
  supplies: suppliesApi,
  settings: settingsApi,
  expenses: expensesApi,
  alerts: alertsApi,
  invoices: invoicesApi,
  analytics: analyticsApi,
  payments: paymentsApi,
  csvImport: csvImportApi,
};

export default api;
