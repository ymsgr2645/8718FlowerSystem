"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import MD3AppLayout from "@/components/layout/MD3AppLayout"
import { MD3Card, MD3CardContent, MD3CardHeader, MD3CardTitle } from "@/components/md3/MD3Card"
import { MD3StatusBadge } from "@/components/md3/MD3Badge"
import { MD3Button } from "@/components/md3/MD3Button"
import {
  MD3Table,
  MD3TableHead,
  MD3TableBody,
  MD3TableRow,
  MD3TableHeaderCell,
  MD3TableCell,
} from "@/components/md3/MD3Table"
import { md3 } from "@/lib/md3-theme"
import {
  inventoryApi,
  transfersApi,
  invoicesApi,
  alertsApi,
  storesApi,
  itemsApi,
  expensesApi,
  suppliesApi,
  Arrival,
  Store,
  Transfer,
  Invoice,
  Item,
  Inventory,
  Expense,
  SupplyTransfer,
} from "@/lib/api"
import {
  TrendingUp,
  AlertTriangle,
  FileText,
  Store as StoreIcon,
  Package,
  ShoppingCart,
  Wallet,
  Boxes,
  Clock,
  ArrowRight,
  Flower2,
} from "lucide-react"

interface MetricCardProps {
  label: string
  value: string | number
  subValue?: string
  icon: React.ReactNode
  iconBg?: string
  iconColor?: string
  trend?: { value: string; positive: boolean }
  href?: string
}

function MetricCard({ label, value, subValue, icon, iconBg, iconColor, trend, href }: MetricCardProps) {
  const content = (
    <MD3Card variant="elevated" hoverable={!!href}>
      <MD3CardContent>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 13, color: md3.onSurfaceVariant, margin: 0, fontWeight: 500 }}>{label}</p>
            <p style={{ fontSize: 28, fontWeight: 600, color: md3.onSurface, margin: "6px 0 0 0" }}>{value}</p>
            {subValue && (
              <p style={{ fontSize: 12, color: md3.onSurfaceVariant, margin: "4px 0 0 0" }}>{subValue}</p>
            )}
            {trend && (
              <p
                style={{
                  fontSize: 12,
                  color: trend.positive ? md3.secondary : md3.error,
                  margin: "4px 0 0 0",
                  fontWeight: 500,
                }}
              >
                {trend.positive ? "↑" : "↓"} {trend.value}
              </p>
            )}
          </div>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              backgroundColor: iconBg || md3.primaryContainer,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: iconColor || md3.onPrimaryContainer,
              flexShrink: 0,
            }}
          >
            {icon}
          </div>
        </div>
      </MD3CardContent>
    </MD3Card>
  )

  if (href) {
    return <Link href={href} style={{ textDecoration: "none" }}>{content}</Link>
  }
  return content
}

interface SummaryItemProps {
  label: string
  value: string | number
  badge?: { label: string; status: "success" | "warning" | "error" | "info" | "neutral" }
}

function SummaryItem({ label, value, badge }: SummaryItemProps) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "10px 0",
        borderBottom: `1px solid ${md3.outlineVariant}`,
      }}
    >
      <span style={{ fontSize: 14, color: md3.onSurfaceVariant }}>{label}</span>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: md3.onSurface }}>{value}</span>
        {badge && <MD3StatusBadge status={badge.status} label={badge.label} size="small" />}
      </div>
    </div>
  )
}

function getNextInvoiceDate(today = new Date()) {
  const year = today.getFullYear()
  const month = today.getMonth()
  const day = today.getDate()
  const targets = [10, 20]
  for (const t of targets) {
    if (day <= t) return new Date(year, month, t)
  }
  return new Date(year, month + 1, 0)
}

export default function DashboardPage() {
  const [arrivals, setArrivals] = useState<Arrival[]>([])
  const [transfers, setTransfers] = useState<Transfer[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [stores, setStores] = useState<Store[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [inventory, setInventory] = useState<Inventory[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [supplyTransfers, setSupplyTransfers] = useState<SupplyTransfer[]>([])
  const [pendingAlerts, setPendingAlerts] = useState(0)
  const [longTermAlerts, setLongTermAlerts] = useState<
    Array<{ item_id: number; item_name: string; days_in_stock: number; quantity: number }>
  >([])

  useEffect(() => {
    const load = async () => {
      const [
        arrivalsData,
        transfersData,
        invoicesData,
        storesData,
        itemsData,
        inventoryData,
        alertsData,
        longTermData,
        expensesData,
        supplyData,
      ] = await Promise.all([
        inventoryApi.getArrivals({ limit: 300 }),
        transfersApi.getAll({ limit: 300 }),
        invoicesApi.getAll({ limit: 20 }),
        storesApi.getAll(),
        itemsApi.getAll({ limit: 500 }),
        inventoryApi.getAll(),
        alertsApi.getAll("pending"),
        inventoryApi.getLongTermAlerts(),
        expensesApi.getAll({ year_month: monthKey }),
        suppliesApi.getTransfers(),
      ])
      setArrivals(arrivalsData)
      setTransfers(transfersData)
      setInvoices(invoicesData)
      setStores(storesData)
      setItems(itemsData)
      setInventory(inventoryData)
      setPendingAlerts(alertsData.length)
      setLongTermAlerts(longTermData)
      setExpenses(expensesData)
      setSupplyTransfers(supplyData)
    }
    load().catch(console.error)
  }, [])

  const today = new Date()
  const todayKey = today.toISOString().split("T")[0]
  const monthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)

  // Arrivals summary
  const todayArrivals = arrivals.filter((a) => a.arrived_at.startsWith(todayKey))
  const monthArrivals = arrivals.filter((a) => a.arrived_at.startsWith(monthKey))
  const weekArrivals = arrivals.filter((a) => new Date(a.arrived_at) >= weekAgo)

  // Transfers summary
  const todayTransfers = transfers.filter((t) => t.transferred_at.startsWith(todayKey))
  const monthTransfers = transfers.filter((t) => t.transferred_at.startsWith(monthKey))

  // Inventory summary
  const totalStock = inventory.reduce((sum, inv) => sum + inv.quantity, 0)
  const lowStockCount = inventory.filter((inv) => inv.quantity < 10 && inv.quantity > 0).length
  const outOfStockCount = inventory.filter((inv) => inv.quantity === 0).length

  // Expenses summary (this month) - already filtered by year_month in API call
  const monthExpenseTotal = expenses.reduce((sum, e) => sum + Number(e.amount), 0)

  // Supply transfers summary (this month)
  const monthSupplyTotal = supplyTransfers
    .filter((t) => t.transferred_at.startsWith(monthKey))
    .reduce((sum, t) => sum + t.quantity * Number(t.unit_price), 0)

  // Store breakdown
  const storeBreakdown = useMemo(() => {
    const totals = new Map<number, { qty: number; amount: number }>()
    transfers.forEach((t) => {
      const current = totals.get(t.store_id) || { qty: 0, amount: 0 }
      current.qty += t.quantity
      current.amount += t.quantity * Number(t.unit_price || 0)
      totals.set(t.store_id, current)
    })
    return stores
      .map((s) => ({
        id: s.id,
        name: s.name,
        type: s.operation_type,
        qty: totals.get(s.id)?.qty || 0,
        amount: totals.get(s.id)?.amount || 0,
      }))
      .filter((s) => s.qty > 0)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5)
  }, [transfers, stores])

  // Category breakdown
  const categoryBreakdown = useMemo(() => {
    const itemMap = new Map(items.map((i) => [i.id, i]))
    const totals = new Map<string, { qty: number; count: number }>()
    inventory.forEach((inv) => {
      const item = itemMap.get(inv.item_id)
      const cat = item?.category || "その他"
      const current = totals.get(cat) || { qty: 0, count: 0 }
      current.qty += inv.quantity
      current.count += 1
      totals.set(cat, current)
    })
    return Array.from(totals.entries())
      .map(([category, data]) => ({ category, ...data }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5)
  }, [inventory, items])

  const nextInvoiceDate = getNextInvoiceDate(today)
  const itemMap = useMemo(() => new Map(items.map((i) => [i.id, i])), [items])

  return (
    <MD3AppLayout title="ダッシュボード" subtitle="すべてのサマリーを一覧">
      {/* Row 1: Key Metrics */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 12, marginBottom: 20 }}>
        <MetricCard
          label="今日の入荷"
          value={`${todayArrivals.length}件`}
          subValue={`今週 ${weekArrivals.length}件`}
          icon={<TrendingUp size={22} />}
          href="/arrivals"
        />
        <MetricCard
          label="今月の入荷"
          value={`${monthArrivals.length}件`}
          icon={<Flower2 size={22} />}
          iconBg={md3.secondaryContainer}
          iconColor={md3.onSecondaryContainer}
          href="/arrivals"
        />
        <MetricCard
          label="今日の持出"
          value={`${todayTransfers.length}件`}
          subValue={`今月 ${monthTransfers.length}件`}
          icon={<ShoppingCart size={22} />}
          iconBg={md3.tertiaryContainer}
          iconColor={md3.onTertiaryContainer}
          href="/transfer-entry"
        />
        <MetricCard
          label="在庫合計"
          value={totalStock.toLocaleString()}
          subValue={`${inventory.length}品目`}
          icon={<Package size={22} />}
          href="/inventory"
        />
        <MetricCard
          label="在庫注意"
          value={`${lowStockCount + outOfStockCount}件`}
          subValue={outOfStockCount > 0 ? `欠品${outOfStockCount}件` : undefined}
          icon={<AlertTriangle size={22} />}
          iconBg={lowStockCount + outOfStockCount > 0 ? md3.errorContainer : md3.surfaceContainerHigh}
          iconColor={lowStockCount + outOfStockCount > 0 ? md3.onErrorContainer : md3.onSurfaceVariant}
          href="/inventory"
        />
        <MetricCard
          label="未対応アラート"
          value={`${pendingAlerts}件`}
          icon={<AlertTriangle size={22} />}
          iconBg={pendingAlerts > 0 ? md3.errorContainer : md3.surfaceContainerHigh}
          iconColor={pendingAlerts > 0 ? md3.onErrorContainer : md3.onSurfaceVariant}
        />
      </div>

      {/* Row 2: Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
        <MetricCard
          label="今月の経費"
          value={`¥${monthExpenseTotal.toLocaleString()}`}
          subValue={`${expenses.length}件`}
          icon={<Wallet size={22} />}
          iconBg={md3.surfaceContainerHigh}
          iconColor={md3.onSurface}
          href="/expenses"
        />
        <MetricCard
          label="資材持出(今月)"
          value={`¥${monthSupplyTotal.toLocaleString()}`}
          icon={<Boxes size={22} />}
          iconBg={md3.surfaceContainerHigh}
          iconColor={md3.onSurface}
          href="/warehouse"
        />
        <MetricCard
          label="次回請求日"
          value={nextInvoiceDate.toLocaleDateString("ja-JP", { month: "short", day: "numeric" })}
          icon={<FileText size={22} />}
          href="/invoices"
        />
        <MetricCard
          label="長期在庫"
          value={`${longTermAlerts.length}件`}
          subValue={longTermAlerts.length > 0 ? "要確認" : "なし"}
          icon={<Clock size={22} />}
          iconBg={longTermAlerts.length > 0 ? md3.tertiaryContainer : md3.surfaceContainerHigh}
          iconColor={longTermAlerts.length > 0 ? md3.onTertiaryContainer : md3.onSurfaceVariant}
          href="/warehouse"
        />
      </div>

      {/* Row 3: Tables */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 20 }}>
        {/* Store Breakdown */}
        <MD3Card variant="outlined">
          <MD3CardHeader>
            <MD3CardTitle style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 15 }}>
              <StoreIcon size={18} color={md3.primary} />
              店舗別持出（上位）
            </MD3CardTitle>
          </MD3CardHeader>
          <MD3CardContent style={{ padding: 0 }}>
            <MD3Table>
              <MD3TableHead>
                <MD3TableRow hoverable={false}>
                  <MD3TableHeaderCell>店舗</MD3TableHeaderCell>
                  <MD3TableHeaderCell align="right">数量</MD3TableHeaderCell>
                  <MD3TableHeaderCell align="right">金額</MD3TableHeaderCell>
                </MD3TableRow>
              </MD3TableHead>
              <MD3TableBody>
                {storeBreakdown.length === 0 ? (
                  <MD3TableRow hoverable={false}>
                    <MD3TableCell colSpan={3}>
                      <div style={{ textAlign: "center", padding: 16, color: md3.onSurfaceVariant, fontSize: 13 }}>
                        データなし
                      </div>
                    </MD3TableCell>
                  </MD3TableRow>
                ) : (
                  storeBreakdown.map((store) => (
                    <MD3TableRow key={store.id}>
                      <MD3TableCell>
                        <span style={{ fontSize: 13 }}>{store.name}</span>
                      </MD3TableCell>
                      <MD3TableCell align="right">
                        <span style={{ fontSize: 13 }}>{store.qty.toLocaleString()}</span>
                      </MD3TableCell>
                      <MD3TableCell align="right">
                        <span style={{ fontSize: 13 }}>¥{store.amount.toLocaleString()}</span>
                      </MD3TableCell>
                    </MD3TableRow>
                  ))
                )}
              </MD3TableBody>
            </MD3Table>
          </MD3CardContent>
        </MD3Card>

        {/* Category Breakdown */}
        <MD3Card variant="outlined">
          <MD3CardHeader>
            <MD3CardTitle style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 15 }}>
              <Flower2 size={18} color={md3.secondary} />
              カテゴリ別在庫
            </MD3CardTitle>
          </MD3CardHeader>
          <MD3CardContent style={{ padding: "0 16px 16px" }}>
            {categoryBreakdown.length === 0 ? (
              <div style={{ textAlign: "center", padding: 16, color: md3.onSurfaceVariant, fontSize: 13 }}>
                データなし
              </div>
            ) : (
              categoryBreakdown.map((cat, i) => (
                <SummaryItem
                  key={cat.category}
                  label={cat.category}
                  value={cat.qty.toLocaleString()}
                  badge={{ label: `${cat.count}品目`, status: "neutral" }}
                />
              ))
            )}
          </MD3CardContent>
        </MD3Card>

        {/* Recent Invoices */}
        <MD3Card variant="outlined">
          <MD3CardHeader>
            <MD3CardTitle style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 15 }}>
              <FileText size={18} color={md3.tertiary} />
              最近の請求書
            </MD3CardTitle>
          </MD3CardHeader>
          <MD3CardContent style={{ padding: "0 16px 16px" }}>
            {invoices.length === 0 ? (
              <div style={{ textAlign: "center", padding: 16, color: md3.onSurfaceVariant, fontSize: 13 }}>
                請求書なし
              </div>
            ) : (
              invoices.slice(0, 4).map((inv) => (
                <SummaryItem
                  key={inv.id}
                  label={inv.invoice_number}
                  value={`${inv.period_start.slice(5)} ~ ${inv.period_end.slice(5)}`}
                  badge={{
                    label: inv.status === "paid" ? "支払済" : inv.status === "sent" ? "送付済" : "下書き",
                    status: inv.status === "paid" ? "success" : inv.status === "sent" ? "info" : "neutral",
                  }}
                />
              ))
            )}
          </MD3CardContent>
        </MD3Card>
      </div>

      {/* Row 4: Recent Activities */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Recent Arrivals */}
        <MD3Card variant="outlined">
          <MD3CardHeader>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
              <MD3CardTitle style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 15 }}>
                <TrendingUp size={18} color={md3.primary} />
                最近の入荷
              </MD3CardTitle>
              <Link href="/arrivals">
                <MD3Button variant="text" size="small" icon={<ArrowRight size={16} />}>
                  すべて見る
                </MD3Button>
              </Link>
            </div>
          </MD3CardHeader>
          <MD3CardContent style={{ padding: 0 }}>
            <MD3Table>
              <MD3TableHead>
                <MD3TableRow hoverable={false}>
                  <MD3TableHeaderCell>日付</MD3TableHeaderCell>
                  <MD3TableHeaderCell>商品</MD3TableHeaderCell>
                  <MD3TableHeaderCell align="right">数量</MD3TableHeaderCell>
                </MD3TableRow>
              </MD3TableHead>
              <MD3TableBody>
                {arrivals.length === 0 ? (
                  <MD3TableRow hoverable={false}>
                    <MD3TableCell colSpan={3}>
                      <div style={{ textAlign: "center", padding: 16, color: md3.onSurfaceVariant, fontSize: 13 }}>
                        入荷なし
                      </div>
                    </MD3TableCell>
                  </MD3TableRow>
                ) : (
                  arrivals.slice(0, 5).map((arrival) => {
                    const item = itemMap.get(arrival.item_id)
                    return (
                      <MD3TableRow key={arrival.id}>
                        <MD3TableCell>
                          <span style={{ fontSize: 13 }}>{arrival.arrived_at.slice(5, 10)}</span>
                        </MD3TableCell>
                        <MD3TableCell>
                          <span style={{ fontSize: 13 }}>{item?.name || `ID:${arrival.item_id}`}</span>
                        </MD3TableCell>
                        <MD3TableCell align="right">
                          <span style={{ fontSize: 13, fontWeight: 500 }}>{arrival.quantity}</span>
                        </MD3TableCell>
                      </MD3TableRow>
                    )
                  })
                )}
              </MD3TableBody>
            </MD3Table>
          </MD3CardContent>
        </MD3Card>

        {/* Long-term Stock Alerts */}
        <MD3Card variant="outlined">
          <MD3CardHeader>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
              <MD3CardTitle style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 15 }}>
                <Clock size={18} color={md3.tertiary} />
                長期在庫アラート
              </MD3CardTitle>
              <Link href="/warehouse">
                <MD3Button variant="text" size="small" icon={<ArrowRight size={16} />}>
                  すべて見る
                </MD3Button>
              </Link>
            </div>
          </MD3CardHeader>
          <MD3CardContent style={{ padding: 0 }}>
            <MD3Table>
              <MD3TableHead>
                <MD3TableRow hoverable={false}>
                  <MD3TableHeaderCell>商品</MD3TableHeaderCell>
                  <MD3TableHeaderCell align="right">在庫</MD3TableHeaderCell>
                  <MD3TableHeaderCell align="right">日数</MD3TableHeaderCell>
                </MD3TableRow>
              </MD3TableHead>
              <MD3TableBody>
                {longTermAlerts.length === 0 ? (
                  <MD3TableRow hoverable={false}>
                    <MD3TableCell colSpan={3}>
                      <div style={{ textAlign: "center", padding: 16, color: md3.onSurfaceVariant, fontSize: 13 }}>
                        長期在庫なし
                      </div>
                    </MD3TableCell>
                  </MD3TableRow>
                ) : (
                  longTermAlerts.slice(0, 5).map((alert) => (
                    <MD3TableRow key={alert.item_id}>
                      <MD3TableCell>
                        <span style={{ fontSize: 13 }}>{alert.item_name}</span>
                      </MD3TableCell>
                      <MD3TableCell align="right">
                        <span style={{ fontSize: 13 }}>{alert.quantity}</span>
                      </MD3TableCell>
                      <MD3TableCell align="right">
                        <MD3StatusBadge
                          status={alert.days_in_stock > 14 ? "warning" : "neutral"}
                          label={`${alert.days_in_stock}日`}
                          size="small"
                        />
                      </MD3TableCell>
                    </MD3TableRow>
                  ))
                )}
              </MD3TableBody>
            </MD3Table>
          </MD3CardContent>
        </MD3Card>
      </div>
    </MD3AppLayout>
  )
}
