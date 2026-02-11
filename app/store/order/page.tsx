"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import MD3AppLayout from "@/components/layout/MD3AppLayout"
import { MD3Card, MD3CardContent, MD3CardHeader, MD3CardTitle } from "@/components/md3/MD3Card"
import { MD3Button } from "@/components/md3/MD3Button"
import { MD3Select } from "@/components/md3/MD3Select"
import { MD3NumberField } from "@/components/md3/MD3NumberField"
import {
  MD3Table, MD3TableHead, MD3TableBody, MD3TableRow,
  MD3TableHeaderCell, MD3TableCell, MD3TableEmpty,
} from "@/components/md3/MD3Table"
import { md3, md3Shape } from "@/lib/md3-theme"
import {
  storesApi, itemsApi, inventoryApi, transfersApi,
  type Store, type Item, type Inventory,
} from "@/lib/api"
import { Plus, Trash2, Send, ArrowLeft } from "lucide-react"

interface OrderLine {
  id: string
  item_id: number
  item_name: string
  quantity: number
  unit_price: number
  stock: number
}

export default function StoreOrderPage() {
  const router = useRouter()
  const [stores, setStores] = useState<Store[]>([])
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null)
  const [items, setItems] = useState<Item[]>([])
  const [inventory, setInventory] = useState<Inventory[]>([])
  const [lines, setLines] = useState<OrderLine[]>([])
  const [selectedItemId, setSelectedItemId] = useState("")
  const [addQty, setAddQty] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    storesApi.getAll().then((s) => {
      const active = s.filter((st) => st.is_active)
      setStores(active)
      const saved = localStorage.getItem("8718_store_id")
      if (saved && active.some((st) => st.id === Number(saved))) {
        setSelectedStoreId(Number(saved))
      } else if (active.length > 0) {
        setSelectedStoreId(active[0].id)
      }
    }).catch(() => {})
    itemsApi.getAll({ is_active: true }).then(setItems).catch(() => {})
    inventoryApi.getAll().then(setInventory).catch(() => {})
  }, [])

  const getStock = (itemId: number) => inventory.find((inv) => inv.item_id === itemId)?.quantity || 0
  const getPrice = (itemId: number) => {
    const inv = inventory.find((i) => i.item_id === itemId)
    if (inv?.unit_price) return inv.unit_price
    return items.find((i) => i.id === itemId)?.default_unit_price || 0
  }

  const handleAdd = () => {
    const itemId = Number(selectedItemId)
    if (!itemId) return
    const item = items.find((i) => i.id === itemId)
    if (!item) return
    if (lines.some((l) => l.item_id === itemId)) {
      setLines(lines.map((l) =>
        l.item_id === itemId ? { ...l, quantity: l.quantity + addQty } : l
      ))
    } else {
      setLines([...lines, {
        id: crypto.randomUUID(),
        item_id: itemId,
        item_name: item.name + (item.variety ? ` (${item.variety})` : ""),
        quantity: addQty,
        unit_price: getPrice(itemId),
        stock: getStock(itemId),
      }])
    }
    setSelectedItemId("")
    setAddQty(1)
  }

  const handleRemove = (id: string) => {
    setLines(lines.filter((l) => l.id !== id))
  }

  const handleSubmit = async () => {
    if (!selectedStoreId || lines.length === 0) return
    setSubmitting(true)
    try {
      const now = new Date().toISOString()
      for (const line of lines) {
        await transfersApi.create({
          store_id: selectedStoreId,
          item_id: line.item_id,
          quantity: line.quantity,
          unit_price: line.unit_price,
          transferred_at: now,
        })
      }
      setSuccess(true)
      setLines([])
    } catch {
      alert("持ち出し登録に失敗しました")
    } finally {
      setSubmitting(false)
    }
  }

  const total = lines.reduce((sum, l) => sum + l.quantity * l.unit_price, 0)

  if (success) {
    return (
      <MD3AppLayout title="持ち出し完了" subtitle="店舗ポータル">
        <MD3Card>
          <MD3CardContent>
            <div style={{ textAlign: "center", padding: 40 }}>
              <div style={{
                width: 64, height: 64, borderRadius: "50%",
                backgroundColor: md3.secondaryContainer, display: "inline-flex",
                alignItems: "center", justifyContent: "center", marginBottom: 16,
              }}>
                <Send size={28} color={md3.onSecondaryContainer} />
              </div>
              <h2 style={{ margin: "0 0 8px", color: md3.onSurface, fontFamily: "'Zen Maru Gothic', sans-serif" }}>
                持ち出し登録が完了しました
              </h2>
              <p style={{ color: md3.onSurfaceVariant, marginBottom: 24 }}>
                データは正常に保存されました。
              </p>
              <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                <MD3Button variant="filled" onClick={() => { setSuccess(false) }}>続けて入力</MD3Button>
                <MD3Button variant="outlined" onClick={() => router.push("/store")}>ダッシュボードへ</MD3Button>
              </div>
            </div>
          </MD3CardContent>
        </MD3Card>
      </MD3AppLayout>
    )
  }

  return (
    <MD3AppLayout title="花持ち出し入力" subtitle="店舗ポータル">
      <MD3Button variant="text" onClick={() => router.push("/store")} style={{ marginBottom: 16 }}>
        <ArrowLeft size={16} /> ダッシュボードへ戻る
      </MD3Button>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
        <MD3Select
          label="店舗"
          value={selectedStoreId ? String(selectedStoreId) : ""}
          onChange={(e) => {
            setSelectedStoreId(Number(e.target.value))
            localStorage.setItem("8718_store_id", e.target.value)
          }}
          options={stores.map((s) => ({ value: String(s.id), label: s.name }))}
        />
        <div />
      </div>

      <MD3Card style={{ marginBottom: 20 }}>
        <MD3CardHeader>
          <MD3CardTitle>花を追加</MD3CardTitle>
        </MD3CardHeader>
        <MD3CardContent>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
            <div style={{ flex: 2, minWidth: 200 }}>
              <MD3Select
                label="花を選択"
                value={selectedItemId}
                onChange={(e) => setSelectedItemId(e.target.value)}
                options={items.map((i) => ({
                  value: String(i.id),
                  label: `${i.name}${i.variety ? ` (${i.variety})` : ""} [在庫: ${getStock(i.id)}]`,
                }))}
              />
            </div>
            <div style={{ flex: 1, minWidth: 100 }}>
              <MD3NumberField label="数量" value={String(addQty)} onChange={(v) => setAddQty(Number(v) || 1)} min={1} />
            </div>
            <MD3Button variant="tonal" onClick={handleAdd} disabled={!selectedItemId}>
              <Plus size={16} /> 追加
            </MD3Button>
          </div>
        </MD3CardContent>
      </MD3Card>

      <MD3Card>
        <MD3CardHeader style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <MD3CardTitle>持ち出し明細 ({lines.length}件)</MD3CardTitle>
          {lines.length > 0 && (
            <span style={{
              fontSize: 18, fontWeight: 700, color: md3.primary,
              fontFamily: "'Zen Maru Gothic', sans-serif",
            }}>
              合計: ¥{total.toLocaleString()}
            </span>
          )}
        </MD3CardHeader>
        <MD3CardContent>
          <MD3Table>
            <MD3TableHead>
              <MD3TableRow>
                <MD3TableHeaderCell>花名</MD3TableHeaderCell>
                <MD3TableHeaderCell>在庫</MD3TableHeaderCell>
                <MD3TableHeaderCell>数量</MD3TableHeaderCell>
                <MD3TableHeaderCell>単価</MD3TableHeaderCell>
                <MD3TableHeaderCell>小計</MD3TableHeaderCell>
                <MD3TableHeaderCell>操作</MD3TableHeaderCell>
              </MD3TableRow>
            </MD3TableHead>
            <MD3TableBody>
              {lines.length === 0 ? (
                <MD3TableEmpty colSpan={6} title="花を追加してください" />
              ) : (
                lines.map((line) => (
                  <MD3TableRow key={line.id}>
                    <MD3TableCell>{line.item_name}</MD3TableCell>
                    <MD3TableCell>{line.stock}</MD3TableCell>
                    <MD3TableCell>{line.quantity}</MD3TableCell>
                    <MD3TableCell>¥{line.unit_price.toLocaleString()}</MD3TableCell>
                    <MD3TableCell highlight>¥{(line.quantity * line.unit_price).toLocaleString()}</MD3TableCell>
                    <MD3TableCell>
                      <button
                        onClick={() => handleRemove(line.id)}
                        style={{
                          border: "none", background: "none", cursor: "pointer",
                          color: md3.error, padding: 4, borderRadius: md3Shape.small,
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </MD3TableCell>
                  </MD3TableRow>
                ))
              )}
            </MD3TableBody>
          </MD3Table>

          {lines.length > 0 && (
            <div style={{ marginTop: 20, display: "flex", justifyContent: "flex-end" }}>
              <MD3Button variant="filled" onClick={handleSubmit} disabled={submitting}>
                <Send size={16} /> {submitting ? "登録中..." : "持ち出し登録"}
              </MD3Button>
            </div>
          )}
        </MD3CardContent>
      </MD3Card>
    </MD3AppLayout>
  )
}
