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
  MD3Table,
  MD3TableHead,
  MD3TableBody,
  MD3TableRow,
  MD3TableHeaderCell,
  MD3TableCell,
} from "@/components/md3/MD3Table"
import {
  MD3Dialog,
  MD3DialogHeader,
  MD3DialogTitle,
  MD3DialogDescription,
  MD3DialogBody,
  MD3DialogFooter,
} from "@/components/md3/MD3Dialog"
import { md3 } from "@/lib/md3-theme"
import { Package, Search, AlertTriangle, Settings } from "lucide-react"
import { inventoryApi, itemsApi, Inventory, Item } from "@/lib/api"

type AdjustmentType = "increase" | "decrease" | "correction"

interface InventoryView extends Inventory {
  item?: Item
}

export default function InventoryPage() {
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

  useEffect(() => {
    const load = async () => {
      const [itemsData, inventoryData, alerts] = await Promise.all([
        itemsApi.getAll({ limit: 500 }),
        inventoryApi.getAll(),
        inventoryApi.getLongTermAlerts(),
      ])
      const map = new Map(itemsData.map((i) => [i.id, i]))
      setItems(itemsData)
      setInventory(inventoryData.map((inv) => ({ ...inv, item: map.get(inv.item_id) })))
      setLongTermAlerts(alerts)
    }
    load().catch(console.error)
  }, [])

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
    return [{ value: "", label: "すべてのカテゴリ" }, ...Array.from(set).map((c) => ({ value: c, label: c }))]
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

  return (
    <MD3AppLayout title="花の在庫" subtitle="入荷後の在庫・長期在庫アラート・在庫調整">
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
                options={categoryOptions}
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                fullWidth
              />
            </div>
          </div>
        </MD3CardContent>
      </MD3Card>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24 }}>
        <MD3Card variant="outlined">
          <MD3CardHeader>
            <MD3CardTitle style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Package size={20} color={md3.primary} />
              在庫一覧
              <MD3StatusBadge status="neutral" label={`${filteredInventory.length}件`} size="small" />
            </MD3CardTitle>
          </MD3CardHeader>
          <MD3CardContent style={{ padding: 0 }}>
            <div style={{ overflowX: "auto" }}>
              <MD3Table>
                <MD3TableHead>
                  <MD3TableRow hoverable={false}>
                    <MD3TableHeaderCell>コード</MD3TableHeaderCell>
                    <MD3TableHeaderCell>花</MD3TableHeaderCell>
                    <MD3TableHeaderCell>カテゴリ</MD3TableHeaderCell>
                    <MD3TableHeaderCell align="right">在庫数</MD3TableHeaderCell>
                    <MD3TableHeaderCell align="right">単価</MD3TableHeaderCell>
                    <MD3TableHeaderCell>更新日</MD3TableHeaderCell>
                    <MD3TableHeaderCell align="center">操作</MD3TableHeaderCell>
                  </MD3TableRow>
                </MD3TableHead>
                <MD3TableBody>
                  {filteredInventory.length === 0 ? (
                    <MD3TableRow hoverable={false}>
                      <MD3TableCell colSpan={7}>
                        <div style={{ textAlign: "center", padding: "32px 16px", color: md3.onSurfaceVariant }}>
                          在庫データがありません
                        </div>
                      </MD3TableCell>
                    </MD3TableRow>
                  ) : (
                    filteredInventory.map((inv) => (
                      <MD3TableRow key={inv.id}>
                        <MD3TableCell>
                          <span style={{ fontFamily: "monospace" }}>{inv.item?.item_code || "-"}</span>
                        </MD3TableCell>
                        <MD3TableCell highlight>{inv.item?.name || "花"}</MD3TableCell>
                        <MD3TableCell>
                          <MD3StatusBadge status="neutral" label={inv.item?.category || "-"} size="small" />
                        </MD3TableCell>
                        <MD3TableCell align="right">
                          <span style={{ fontWeight: 500 }}>{inv.quantity.toLocaleString()}</span>
                        </MD3TableCell>
                        <MD3TableCell align="right">
                          {inv.unit_price ? `¥${Number(inv.unit_price).toLocaleString()}` : "-"}
                        </MD3TableCell>
                        <MD3TableCell>
                          <span style={{ fontSize: 12, color: md3.onSurfaceVariant }}>
                            {inv.updated_at ? new Date(inv.updated_at).toLocaleString("ja-JP") : "-"}
                          </span>
                        </MD3TableCell>
                        <MD3TableCell align="center">
                          <MD3Button variant="outlined" onClick={() => handleAdjustInventory(inv)} icon={<Settings size={16} />}>
                            調整
                          </MD3Button>
                        </MD3TableCell>
                      </MD3TableRow>
                    ))
                  )}
                </MD3TableBody>
              </MD3Table>
            </div>
          </MD3CardContent>
        </MD3Card>

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
              longTermAlerts.map((alert, i) => (
                <div key={alert.item_id}>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 16px" }}>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 500, margin: 0 }}>{alert.item_name}</p>
                      <p style={{ fontSize: 12, color: md3.onSurfaceVariant, margin: "2px 0 0 0" }}>
                        {alert.item_code} / 在庫 {alert.quantity}
                      </p>
                    </div>
                    <MD3StatusBadge status="warning" label={`${alert.days_in_stock}日`} />
                  </div>
                  {i < longTermAlerts.length - 1 && (
                    <div style={{ height: 1, backgroundColor: md3.outlineVariant, margin: "0 16px" }} />
                  )}
                </div>
              ))
            )}
          </MD3CardContent>
        </MD3Card>
      </div>

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
