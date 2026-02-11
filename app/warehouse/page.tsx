"use client"

import { useEffect, useMemo, useState } from "react"
import MD3AppLayout from "@/components/layout/MD3AppLayout"
import { MD3Card, MD3CardContent, MD3CardHeader, MD3CardTitle } from "@/components/md3/MD3Card"
import { MD3StatusBadge } from "@/components/md3/MD3Badge"
import { MD3Button } from "@/components/md3/MD3Button"
import { MD3TextField } from "@/components/md3/MD3TextField"
import { MD3Select } from "@/components/md3/MD3Select"
import { MD3NumberField } from "@/components/md3/MD3NumberField"
import {
  MD3Dialog,
  MD3DialogHeader,
  MD3DialogTitle,
  MD3DialogDescription,
  MD3DialogBody,
  MD3DialogFooter,
} from "@/components/md3/MD3Dialog"
import { md3 } from "@/lib/md3-theme"
import { Package, Search, AlertTriangle, Settings, Boxes, Flower2, TrendingUp, BarChart3, PieChart } from "lucide-react"
import { inventoryApi, itemsApi, suppliesApi, storesApi, settingsApi, Inventory, Item, Supply, SupplyTransfer, Store, Setting } from "@/lib/api"

type AdjustmentType = "increase" | "decrease" | "correction"
type TabType = "flower" | "supplies"

interface InventoryView extends Inventory {
  item?: Item
}

export default function WarehousePage() {
  const [activeTab, setActiveTab] = useState<TabType>("flower")

  // Flower inventory state
  const [inventory, setInventory] = useState<InventoryView[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<InventoryView | null>(null)
  const [adjustmentType, setAdjustmentType] = useState<AdjustmentType>("increase")
  const [adjustmentAmount, setAdjustmentAmount] = useState("")
  const [reason, setReason] = useState("")
  const [longTermAlerts, setLongTermAlerts] = useState<
    Array<{ item_id: number; item_name: string; item_code: string; arrived_at: string; quantity: number; days_in_stock: number }>
  >([])

  // Supplies state
  const [supplies, setSupplies] = useState<Supply[]>([])
  const [stores, setStores] = useState<Store[]>([])
  const [transfers, setTransfers] = useState<SupplyTransfer[]>([])
  const [lowStockThreshold, setLowStockThreshold] = useState(5)

  useEffect(() => {
    const load = async () => {
      const [itemsData, inventoryData, alerts, suppliesData, storesData, transferData, settingsData] = await Promise.all([
        itemsApi.getAll({ limit: 500 }),
        inventoryApi.getAll(),
        inventoryApi.getLongTermAlerts(),
        suppliesApi.getAll(),
        storesApi.getAll(),
        suppliesApi.getTransfers(),
        settingsApi.getAll(),
      ])
      const map = new Map(itemsData.map((i) => [i.id, i]))
      setItems(itemsData)
      setInventory(inventoryData.map((inv) => ({ ...inv, item: map.get(inv.item_id) })))
      setLongTermAlerts(alerts)
      setSupplies(suppliesData)
      setStores(storesData)
      setTransfers(transferData)
      const thresholdSetting = settingsData.find((s: Setting) => s.key === "low_stock_alert_threshold")
      if (thresholdSetting) {
        setLowStockThreshold(Number(thresholdSetting.value) || 5)
      }
    }
    load().catch(console.error)
  }, [])

  // Flower inventory helpers
  const filteredInventory = useMemo(() => {
    return inventory.filter((inv) => {
      const name = inv.item?.name || ""
      const code = inv.item?.item_code || ""
      const category = inv.item?.category || ""
      const matchesSearch =
        searchQuery === "" || name.toLowerCase().includes(searchQuery.toLowerCase()) || code.includes(searchQuery)
      const matchesCategory = categoryFilter === "" || category === categoryFilter
      return matchesSearch && matchesCategory
    })
  }, [inventory, searchQuery, categoryFilter])

  const categoryOptions = useMemo(() => {
    const set = new Set(items.map((i) => i.category).filter(Boolean) as string[])
    return [{ value: "", label: "すべて表示" }, ...Array.from(set).map((c) => ({ value: c, label: c }))]
  }, [items])

  const handleAdjustInventory = (item: InventoryView) => {
    setSelectedItem(item)
    setAdjustmentType("increase")
    setAdjustmentAmount("")
    setReason("")
    setDialogOpen(true)
  }

  const handleConfirmAdjustment = async () => {
    if (!selectedItem || !adjustmentAmount) return
    const amount = Number(adjustmentAmount)
    const signedAmount =
      adjustmentType === "decrease" ? -Math.abs(amount) : adjustmentType === "correction" ? amount : Math.abs(amount)
    await inventoryApi.createAdjustment({
      item_id: selectedItem.item_id,
      adjustment_type: adjustmentType,
      quantity: signedAmount,
      reason: reason || undefined,
    })
    const inventoryData = await inventoryApi.getAll()
    const map = new Map(items.map((i) => [i.id, i]))
    setInventory(inventoryData.map((inv) => ({ ...inv, item: map.get(inv.item_id) })))
    setDialogOpen(false)
  }

  // Supplies helpers
  const supplyMap = useMemo(() => new Map(supplies.map((s) => [s.id, s])), [supplies])
  const storeMap = useMemo(() => new Map(stores.map((s) => [s.id, s])), [stores])

  // 花の在庫 カテゴリ別集計
  const flowerCategoryStats = useMemo(() => {
    const stats = new Map<string, { count: number; quantity: number; value: number }>()
    inventory.forEach((inv) => {
      const category = inv.item?.category || "未分類"
      const current = stats.get(category) || { count: 0, quantity: 0, value: 0 }
      current.count += 1
      current.quantity += inv.quantity
      current.value += inv.quantity * Number(inv.unit_price || 0)
      stats.set(category, current)
    })
    return Array.from(stats.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.value - a.value)
  }, [inventory])

  // 資材の在庫状況
  const supplyStats = useMemo(() => {
    const activeSupplies = supplies.filter((s) => s.is_active)
    const totalStock = activeSupplies.reduce((sum, s) => sum + (s.stock_quantity || 0), 0)
    const totalValue = activeSupplies.reduce((sum, s) => sum + (s.stock_quantity || 0) * (s.unit_price || 0), 0)
    const lowStock = activeSupplies.filter((s) => (s.stock_quantity || 0) <= lowStockThreshold).length
    const outOfStock = activeSupplies.filter((s) => (s.stock_quantity || 0) === 0).length
    return { totalStock, totalValue, lowStock, outOfStock, count: activeSupplies.length }
  }, [supplies, lowStockThreshold])

  // 資材 店舗別持ち出し集計（品目詳細付き）
  const transfersByStore = useMemo(() => {
    const stats = new Map<number, { qty: number; amount: number; items: Map<number, { name: string; qty: number; amount: number }> }>()
    transfers.forEach((t) => {
      const current = stats.get(t.store_id) || { qty: 0, amount: 0, items: new Map() }
      current.qty += t.quantity
      current.amount += Number(t.unit_price) * t.quantity

      const supply = supplyMap.get(t.supply_id)
      const itemData = current.items.get(t.supply_id) || { name: supply?.name || `資材${t.supply_id}`, qty: 0, amount: 0 }
      itemData.qty += t.quantity
      itemData.amount += Number(t.unit_price) * t.quantity
      current.items.set(t.supply_id, itemData)

      stats.set(t.store_id, current)
    })
    return Array.from(stats.entries())
      .map(([storeId, data]) => ({
        storeId,
        store: storeMap.get(storeId),
        qty: data.qty,
        amount: data.amount,
        items: Array.from(data.items.values()).sort((a, b) => b.amount - a.amount),
      }))
      .sort((a, b) => b.amount - a.amount)
  }, [transfers, storeMap, supplyMap])

  // グラフ用の色
  const chartColors = [
    md3.primary,
    md3.secondary,
    md3.tertiary,
    "#E57373",
    "#81C784",
    "#64B5F6",
    "#FFB74D",
    "#BA68C8",
    "#4DB6AC",
    "#A1887F",
  ]

  return (
    <MD3AppLayout title="倉庫在庫" subtitle="花・資材の在庫状況とグラフ分析">
      {/* Tab Navigation */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        <button
          onClick={() => setActiveTab("flower")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "12px 24px",
            borderRadius: 100,
            border: "none",
            backgroundColor: activeTab === "flower" ? md3.primaryContainer : md3.surfaceContainerHigh,
            color: activeTab === "flower" ? md3.onPrimaryContainer : md3.onSurface,
            fontFamily: "'Zen Maru Gothic', sans-serif",
            fontSize: 14,
            fontWeight: activeTab === "flower" ? 600 : 400,
            cursor: "pointer",
            transition: "all 200ms ease",
          }}
        >
          <Flower2 size={18} />
          花の在庫
          <MD3StatusBadge status={activeTab === "flower" ? "success" : "neutral"} label={`${inventory.length}`} size="small" />
        </button>
        <button
          onClick={() => setActiveTab("supplies")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "12px 24px",
            borderRadius: 100,
            border: "none",
            backgroundColor: activeTab === "supplies" ? md3.primaryContainer : md3.surfaceContainerHigh,
            color: activeTab === "supplies" ? md3.onPrimaryContainer : md3.onSurface,
            fontFamily: "'Zen Maru Gothic', sans-serif",
            fontSize: 14,
            fontWeight: activeTab === "supplies" ? 600 : 400,
            cursor: "pointer",
            transition: "all 200ms ease",
          }}
        >
          <Boxes size={18} />
          資材在庫
          <MD3StatusBadge status={activeTab === "supplies" ? "success" : "neutral"} label={`${supplies.filter(s => s.is_active).length}`} size="small" />
        </button>
      </div>

      {/* Flower Inventory Tab */}
      {activeTab === "flower" && (
        <>
          {/* サマリーカード */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
            <MD3Card variant="filled">
              <MD3CardContent style={{ padding: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ padding: 12, borderRadius: 12, backgroundColor: md3.primaryContainer }}>
                    <Package size={24} color={md3.onPrimaryContainer} />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: md3.onSurfaceVariant, fontFamily: "'Zen Maru Gothic', sans-serif" }}>総在庫数</div>
                    <div style={{ fontSize: 28, fontWeight: 700, color: md3.onSurface, fontFamily: "'Zen Maru Gothic', sans-serif" }}>
                      {inventory.reduce((sum, inv) => sum + inv.quantity, 0).toLocaleString()}
                    </div>
                  </div>
                </div>
              </MD3CardContent>
            </MD3Card>

            <MD3Card variant="filled">
              <MD3CardContent style={{ padding: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ padding: 12, borderRadius: 12, backgroundColor: md3.secondaryContainer }}>
                    <TrendingUp size={24} color={md3.onSecondaryContainer} />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: md3.onSurfaceVariant, fontFamily: "'Zen Maru Gothic', sans-serif" }}>在庫金額</div>
                    <div style={{ fontSize: 28, fontWeight: 700, color: md3.onSurface, fontFamily: "'Zen Maru Gothic', sans-serif" }}>
                      ¥{inventory.reduce((sum, inv) => sum + inv.quantity * Number(inv.unit_price || 0), 0).toLocaleString()}
                    </div>
                  </div>
                </div>
              </MD3CardContent>
            </MD3Card>

            <MD3Card variant="filled">
              <MD3CardContent style={{ padding: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ padding: 12, borderRadius: 12, backgroundColor: md3.tertiaryContainer }}>
                    <BarChart3 size={24} color={md3.onTertiaryContainer} />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: md3.onSurfaceVariant, fontFamily: "'Zen Maru Gothic', sans-serif" }}>花の種類</div>
                    <div style={{ fontSize: 28, fontWeight: 700, color: md3.onSurface, fontFamily: "'Zen Maru Gothic', sans-serif" }}>
                      {inventory.length}
                    </div>
                  </div>
                </div>
              </MD3CardContent>
            </MD3Card>

            <MD3Card variant="filled">
              <MD3CardContent style={{ padding: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ padding: 12, borderRadius: 12, backgroundColor: md3.errorContainer }}>
                    <AlertTriangle size={24} color={md3.onErrorContainer} />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: md3.onSurfaceVariant, fontFamily: "'Zen Maru Gothic', sans-serif" }}>長期在庫</div>
                    <div style={{ fontSize: 28, fontWeight: 700, color: longTermAlerts.length > 0 ? md3.error : md3.onSurface, fontFamily: "'Zen Maru Gothic', sans-serif" }}>
                      {longTermAlerts.length}
                    </div>
                  </div>
                </div>
              </MD3CardContent>
            </MD3Card>
          </div>

          {/* カテゴリ別グラフ＋検索 */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
            {/* カテゴリ別在庫（横棒グラフ風） */}
            <MD3Card variant="outlined">
              <MD3CardHeader>
                <MD3CardTitle style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <PieChart size={20} color={md3.primary} />
                  カテゴリ別在庫金額
                </MD3CardTitle>
              </MD3CardHeader>
              <MD3CardContent>
                {flowerCategoryStats.length === 0 ? (
                  <div style={{ textAlign: "center", padding: 24, color: md3.onSurfaceVariant }}>データなし</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {flowerCategoryStats.slice(0, 8).map((cat, i) => {
                      const maxValue = flowerCategoryStats[0]?.value || 1
                      const percentage = (cat.value / maxValue) * 100
                      return (
                        <div key={cat.name}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                            <span style={{ fontSize: 13, fontWeight: 500, color: md3.onSurface, fontFamily: "'Zen Maru Gothic', sans-serif" }}>
                              {cat.name}
                            </span>
                            <span style={{ fontSize: 13, color: md3.onSurfaceVariant, fontFamily: "'Zen Maru Gothic', sans-serif" }}>
                              ¥{cat.value.toLocaleString()} ({cat.quantity}個)
                            </span>
                          </div>
                          <div style={{ height: 8, backgroundColor: md3.surfaceContainerHigh, borderRadius: 4, overflow: "hidden" }}>
                            <div
                              style={{
                                height: "100%",
                                width: `${percentage}%`,
                                backgroundColor: chartColors[i % chartColors.length],
                                borderRadius: 4,
                                transition: "width 500ms ease",
                              }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </MD3CardContent>
            </MD3Card>

            {/* 長期在庫アラート */}
            <MD3Card variant="outlined">
              <MD3CardHeader>
                <MD3CardTitle style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <AlertTriangle size={20} color={md3.error} />
                  長期在庫アラート
                  <MD3StatusBadge status="warning" label={`${longTermAlerts.length}件`} size="small" />
                </MD3CardTitle>
              </MD3CardHeader>
              <MD3CardContent style={{ padding: 0 }}>
                {longTermAlerts.length === 0 ? (
                  <p style={{ textAlign: "center", padding: "24px 16px", color: md3.onSurfaceVariant, margin: 0 }}>
                    長期在庫アラートはありません
                  </p>
                ) : (
                  longTermAlerts.slice(0, 8).map((alert, i) => (
                    <div key={alert.item_id}>
                      <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 16px" }}>
                        <div>
                          <p style={{ fontSize: 14, fontWeight: 500, margin: 0, fontFamily: "'Zen Maru Gothic', sans-serif" }}>{alert.item_name}</p>
                          <p style={{ fontSize: 12, color: md3.onSurfaceVariant, margin: "2px 0 0 0", fontFamily: "'Zen Maru Gothic', sans-serif" }}>
                            {alert.item_code} / 在庫 {alert.quantity}
                          </p>
                        </div>
                        <MD3StatusBadge status="warning" label={`${alert.days_in_stock}日`} />
                      </div>
                      {i < Math.min(longTermAlerts.length, 8) - 1 && (
                        <div style={{ height: 1, backgroundColor: md3.outlineVariant, margin: "0 16px" }} />
                      )}
                    </div>
                  ))
                )}
              </MD3CardContent>
            </MD3Card>
          </div>

          {/* 検索・フィルター + 一覧 */}
          <MD3Card variant="outlined" style={{ marginBottom: 24 }}>
            <MD3CardHeader>
              <MD3CardTitle style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Search size={20} color={md3.primary} />
                検索・フィルター
              </MD3CardTitle>
            </MD3CardHeader>
            <MD3CardContent>
              <div style={{ display: "flex", gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <MD3TextField
                    placeholder="花名またはコードで検索..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    fullWidth
                  />
                </div>
                <div style={{ width: 220 }}>
                  <MD3Select
                    label="カテゴリ"
                    options={categoryOptions}
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    fullWidth
                  />
                </div>
              </div>
            </MD3CardContent>
          </MD3Card>

          {/* 在庫一覧（カード） */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <Package size={20} color={md3.primary} />
            <span style={{ fontSize: 16, fontWeight: 600, color: md3.onSurface }}>在庫一覧</span>
            <MD3StatusBadge status="neutral" label={`${filteredInventory.length}件`} size="small" />
          </div>
          {filteredInventory.length === 0 ? (
            <div style={{ textAlign: "center", padding: 48, color: md3.onSurfaceVariant }}>在庫データがありません</div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
              {filteredInventory.map((inv) => {
                const stockValue = inv.quantity * Number(inv.unit_price || 0)
                const isLow = inv.quantity <= 5
                const isOut = inv.quantity === 0
                return (
                  <MD3Card
                    key={inv.id}
                    variant="outlined"
                    hoverable
                    onClick={() => handleAdjustInventory(inv)}
                    style={{
                      cursor: "pointer",
                      borderColor: isOut ? md3.error : isLow ? md3.tertiary : undefined,
                    }}
                  >
                    <MD3CardContent style={{ padding: 16 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                        <div style={{ fontSize: 16, fontWeight: 600, color: md3.onSurface }}>{inv.item?.name || "花"}</div>
                        <span style={{ fontFamily: "monospace", fontSize: 11, color: md3.onSurfaceVariant }}>{inv.item?.item_code}</span>
                      </div>
                      <div style={{
                        fontSize: 28,
                        fontWeight: 700,
                        color: isOut ? md3.error : isLow ? md3.tertiary : md3.primary,
                        marginBottom: 4,
                      }}>
                        {inv.quantity.toLocaleString()}
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 12, color: md3.onSurfaceVariant }}>
                          @¥{Number(inv.unit_price || 0).toLocaleString()}
                        </span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: md3.primary }}>
                          ¥{stockValue.toLocaleString()}
                        </span>
                      </div>
                      {inv.item?.category && (
                        <div style={{ marginTop: 8 }}>
                          <MD3StatusBadge status="neutral" label={inv.item.category} size="small" />
                        </div>
                      )}
                    </MD3CardContent>
                  </MD3Card>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* Supplies Tab */}
      {activeTab === "supplies" && (
        <>
          {/* サマリーカード */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
            <MD3Card variant="filled">
              <MD3CardContent style={{ padding: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ padding: 12, borderRadius: 12, backgroundColor: md3.primaryContainer }}>
                    <Boxes size={24} color={md3.onPrimaryContainer} />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: md3.onSurfaceVariant, fontFamily: "'Zen Maru Gothic', sans-serif" }}>総在庫数</div>
                    <div style={{ fontSize: 28, fontWeight: 700, color: md3.onSurface, fontFamily: "'Zen Maru Gothic', sans-serif" }}>
                      {supplyStats.totalStock.toLocaleString()}
                    </div>
                  </div>
                </div>
              </MD3CardContent>
            </MD3Card>

            <MD3Card variant="filled">
              <MD3CardContent style={{ padding: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ padding: 12, borderRadius: 12, backgroundColor: md3.secondaryContainer }}>
                    <TrendingUp size={24} color={md3.onSecondaryContainer} />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: md3.onSurfaceVariant, fontFamily: "'Zen Maru Gothic', sans-serif" }}>在庫金額</div>
                    <div style={{ fontSize: 28, fontWeight: 700, color: md3.onSurface, fontFamily: "'Zen Maru Gothic', sans-serif" }}>
                      ¥{supplyStats.totalValue.toLocaleString()}
                    </div>
                  </div>
                </div>
              </MD3CardContent>
            </MD3Card>

            <MD3Card variant="filled">
              <MD3CardContent style={{ padding: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ padding: 12, borderRadius: 12, backgroundColor: md3.errorContainer }}>
                    <AlertTriangle size={24} color={md3.onErrorContainer} />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: md3.onSurfaceVariant, fontFamily: "'Zen Maru Gothic', sans-serif" }}>在庫少</div>
                    <div style={{ fontSize: 28, fontWeight: 700, color: supplyStats.lowStock > 0 ? md3.error : md3.onSurface, fontFamily: "'Zen Maru Gothic', sans-serif" }}>
                      {supplyStats.lowStock}
                    </div>
                  </div>
                </div>
              </MD3CardContent>
            </MD3Card>

            <MD3Card variant="filled">
              <MD3CardContent style={{ padding: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ padding: 12, borderRadius: 12, backgroundColor: md3.tertiaryContainer }}>
                    <Package size={24} color={md3.onTertiaryContainer} />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: md3.onSurfaceVariant, fontFamily: "'Zen Maru Gothic', sans-serif" }}>資材種類</div>
                    <div style={{ fontSize: 28, fontWeight: 700, color: md3.onSurface, fontFamily: "'Zen Maru Gothic', sans-serif" }}>
                      {supplyStats.count}
                    </div>
                  </div>
                </div>
              </MD3CardContent>
            </MD3Card>
          </div>

          {/* グラフエリア */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
            {/* 店舗別持ち出し集計 */}
            <MD3Card variant="outlined">
              <MD3CardHeader>
                <MD3CardTitle style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <BarChart3 size={20} color={md3.primary} />
                  店舗別持ち出し（累計）
                </MD3CardTitle>
              </MD3CardHeader>
              <MD3CardContent style={{ padding: 0 }}>
                {transfersByStore.length === 0 ? (
                  <div style={{ textAlign: "center", padding: 24, color: md3.onSurfaceVariant }}>データなし</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    {transfersByStore.slice(0, 6).map((storeData, storeIdx) => {
                      const maxAmount = transfersByStore[0]?.amount || 1
                      const percentage = (storeData.amount / maxAmount) * 100
                      const storeColor = chartColors[storeIdx % chartColors.length]
                      return (
                        <div key={storeData.storeId}>
                          <div style={{ padding: "12px 16px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                              <span style={{ fontSize: 14, fontWeight: 600, color: md3.onSurface, fontFamily: "'Zen Maru Gothic', sans-serif" }}>
                                {storeData.store?.name || storeData.storeId}
                              </span>
                              <span style={{ fontSize: 14, fontWeight: 600, color: storeColor, fontFamily: "'Zen Maru Gothic', sans-serif" }}>
                                ¥{storeData.amount.toLocaleString()}
                              </span>
                            </div>
                            <div style={{ height: 8, backgroundColor: md3.surfaceContainerHigh, borderRadius: 4, overflow: "hidden", marginBottom: 8 }}>
                              <div
                                style={{
                                  height: "100%",
                                  width: `${percentage}%`,
                                  backgroundColor: storeColor,
                                  borderRadius: 4,
                                  transition: "width 500ms ease",
                                }}
                              />
                            </div>
                            {/* 品目内訳 */}
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                              {storeData.items.slice(0, 4).map((itemData, itemIdx) => (
                                <div
                                  key={itemIdx}
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 4,
                                    padding: "4px 8px",
                                    backgroundColor: md3.surfaceContainerLow,
                                    borderRadius: 12,
                                    fontSize: 11,
                                    fontFamily: "'Zen Maru Gothic', sans-serif",
                                  }}
                                >
                                  <span style={{ color: md3.onSurfaceVariant }}>{itemData.name}</span>
                                  <span style={{ fontWeight: 600, color: md3.primary }}>{itemData.qty}</span>
                                </div>
                              ))}
                              {storeData.items.length > 4 && (
                                <div
                                  style={{
                                    padding: "4px 8px",
                                    backgroundColor: md3.surfaceContainerLow,
                                    borderRadius: 12,
                                    fontSize: 11,
                                    color: md3.onSurfaceVariant,
                                    fontFamily: "'Zen Maru Gothic', sans-serif",
                                  }}
                                >
                                  +{storeData.items.length - 4}品目
                                </div>
                              )}
                            </div>
                          </div>
                          {storeIdx < Math.min(transfersByStore.length, 6) - 1 && (
                            <div style={{ height: 1, backgroundColor: md3.outlineVariant }} />
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </MD3CardContent>
            </MD3Card>

            {/* 在庫少アラート */}
            <MD3Card variant="outlined">
              <MD3CardHeader>
                <MD3CardTitle style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <AlertTriangle size={20} color={md3.error} />
                  在庫少アラート
                  <MD3StatusBadge status={supplyStats.lowStock > 0 ? "warning" : "success"} label={`${supplyStats.lowStock}件`} size="small" />
                </MD3CardTitle>
              </MD3CardHeader>
              <MD3CardContent style={{ padding: 0 }}>
                {(() => {
                  const lowStockItems = supplies.filter((s) => s.is_active && (s.stock_quantity || 0) <= lowStockThreshold)
                  if (lowStockItems.length === 0) {
                    return (
                      <p style={{ textAlign: "center", padding: "24px 16px", color: md3.onSurfaceVariant, margin: 0, fontFamily: "'Zen Maru Gothic', sans-serif" }}>
                        在庫少の資材はありません
                      </p>
                    )
                  }
                  return lowStockItems.slice(0, 8).map((supply, i) => (
                    <div key={supply.id}>
                      <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 16px" }}>
                        <div>
                          <p style={{ fontSize: 14, fontWeight: 500, margin: 0, fontFamily: "'Zen Maru Gothic', sans-serif" }}>{supply.name}</p>
                          <p style={{ fontSize: 12, color: md3.onSurfaceVariant, margin: "2px 0 0 0", fontFamily: "'Zen Maru Gothic', sans-serif" }}>
                            {supply.specification || ""}
                          </p>
                        </div>
                        <MD3StatusBadge
                          status={(supply.stock_quantity || 0) === 0 ? "error" : "warning"}
                          label={`残${supply.stock_quantity || 0}`}
                        />
                      </div>
                      {i < Math.min(lowStockItems.length, 8) - 1 && (
                        <div style={{ height: 1, backgroundColor: md3.outlineVariant, margin: "0 16px" }} />
                      )}
                    </div>
                  ))
                })()}
              </MD3CardContent>
            </MD3Card>
          </div>

          {/* 資材在庫一覧（カード） */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <Boxes size={20} color={md3.primary} />
            <span style={{ fontSize: 16, fontWeight: 600, color: md3.onSurface }}>資材在庫一覧</span>
            <MD3StatusBadge status="neutral" label={`${supplies.filter(s => s.is_active).length}件`} size="small" />
          </div>
          {supplies.filter((s) => s.is_active).length === 0 ? (
            <div style={{ textAlign: "center", padding: 48, color: md3.onSurfaceVariant }}>資材データがありません</div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
              {supplies.filter((s) => s.is_active).map((supply) => {
                const stockQty = supply.stock_quantity || 0
                const stockValue = stockQty * (supply.unit_price || 0)
                const isLow = stockQty <= lowStockThreshold
                const isOut = stockQty === 0
                return (
                  <MD3Card
                    key={supply.id}
                    variant="outlined"
                    hoverable
                    style={{ borderColor: isOut ? md3.error : isLow ? md3.tertiary : undefined }}
                  >
                    <MD3CardContent style={{ padding: 16 }}>
                      <div style={{ fontSize: 15, fontWeight: 600, color: md3.onSurface, marginBottom: 4 }}>
                        {supply.name}
                      </div>
                      {supply.specification && (
                        <div style={{ fontSize: 12, color: md3.onSurfaceVariant, marginBottom: 8 }}>{supply.specification}</div>
                      )}
                      <div style={{
                        fontSize: 28,
                        fontWeight: 700,
                        color: isOut ? md3.error : isLow ? md3.tertiary : md3.primary,
                        marginBottom: 4,
                      }}>
                        {stockQty.toLocaleString()}
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 12, color: md3.onSurfaceVariant }}>
                          @¥{(supply.unit_price || 0).toLocaleString()}
                        </span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: md3.primary }}>
                          ¥{stockValue.toLocaleString()}
                        </span>
                      </div>
                      <div style={{ marginTop: 8 }}>
                        <MD3StatusBadge
                          status={isOut ? "error" : isLow ? "warning" : "success"}
                          label={isOut ? "在庫切れ" : isLow ? "残少" : "正常"}
                          size="small"
                        />
                      </div>
                    </MD3CardContent>
                  </MD3Card>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* Adjustment Dialog */}
      <MD3Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <MD3DialogHeader onClose={() => setDialogOpen(false)}>
          <MD3DialogTitle>在庫調整</MD3DialogTitle>
          <MD3DialogDescription>
            {selectedItem?.item?.name}（{selectedItem?.item?.item_code}）を調整します
          </MD3DialogDescription>
        </MD3DialogHeader>
        <MD3DialogBody>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <MD3Select
              label="調整種別"
              options={[
                { value: "increase", label: "増加" },
                { value: "decrease", label: "減少" },
                { value: "correction", label: "修正" },
              ]}
              value={adjustmentType}
              onChange={(e) => setAdjustmentType(e.target.value as AdjustmentType)}
              fullWidth
            />
            <MD3NumberField
              label="調整数"
              value={adjustmentAmount}
              onChange={setAdjustmentAmount}
              fullWidth
            />
            <MD3TextField label="理由（任意）" value={reason} onChange={(e) => setReason(e.target.value)} fullWidth />
          </div>
        </MD3DialogBody>
        <MD3DialogFooter>
          <MD3Button variant="text" onClick={() => setDialogOpen(false)}>
            キャンセル
          </MD3Button>
          <MD3Button onClick={handleConfirmAdjustment} disabled={!adjustmentAmount}>
            調整を反映
          </MD3Button>
        </MD3DialogFooter>
      </MD3Dialog>
    </MD3AppLayout>
  )
}
