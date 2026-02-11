"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import MD3AppLayout from "@/components/layout/MD3AppLayout"
import { MD3Card, MD3CardContent, MD3CardHeader, MD3CardTitle } from "@/components/md3/MD3Card"
import { MD3Button } from "@/components/md3/MD3Button"
import { MD3Select } from "@/components/md3/MD3Select"
import { MD3TextField } from "@/components/md3/MD3TextField"
import {
  MD3Table, MD3TableHead, MD3TableBody, MD3TableRow,
  MD3TableHeaderCell, MD3TableCell, MD3TableEmpty,
} from "@/components/md3/MD3Table"
import { md3 } from "@/lib/md3-theme"
import { storesApi, transfersApi, itemsApi, type Store, type Transfer, type Item } from "@/lib/api"
import { ArrowLeft, Search } from "lucide-react"

export default function StoreHistoryPage() {
  const router = useRouter()
  const [stores, setStores] = useState<Store[]>([])
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null)
  const [transfers, setTransfers] = useState<Transfer[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(false)

  const now = new Date()
  const [dateFrom, setDateFrom] = useState(
    new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
  )
  const [dateTo, setDateTo] = useState(now.toISOString().slice(0, 10))

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
    itemsApi.getAll().then(setItems).catch(() => {})
  }, [])

  useEffect(() => {
    if (!selectedStoreId) return
    localStorage.setItem("8718_store_id", String(selectedStoreId))
    fetchData()
  }, [selectedStoreId])

  const fetchData = () => {
    if (!selectedStoreId) return
    setLoading(true)
    transfersApi.getByStore(selectedStoreId, dateFrom, dateTo)
      .then(setTransfers)
      .catch(() => setTransfers([]))
      .finally(() => setLoading(false))
  }

  const itemName = (id: number) => items.find((i) => i.id === id)?.name || `ID:${id}`
  const total = transfers.reduce((sum, t) => sum + t.quantity * t.unit_price, 0)
  const totalQty = transfers.reduce((sum, t) => sum + t.quantity, 0)

  return (
    <MD3AppLayout title="持ち出し履歴" subtitle="店舗ポータル">
      <MD3Button variant="text" onClick={() => router.push("/store")} style={{ marginBottom: 16 }}>
        <ArrowLeft size={16} /> ダッシュボードへ戻る
      </MD3Button>

      <MD3Card style={{ marginBottom: 20 }}>
        <MD3CardContent>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
            <div style={{ minWidth: 180 }}>
              <MD3Select
                label="店舗"
                value={selectedStoreId ? String(selectedStoreId) : ""}
                onChange={(e) => setSelectedStoreId(Number(e.target.value))}
                options={stores.map((s) => ({ value: String(s.id), label: s.name }))}
              />
            </div>
            <MD3TextField label="開始日" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            <MD3TextField label="終了日" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            <MD3Button variant="tonal" onClick={fetchData}>
              <Search size={16} /> 検索
            </MD3Button>
          </div>
        </MD3CardContent>
      </MD3Card>

      <div style={{
        display: "flex", gap: 16, marginBottom: 16,
        fontSize: 14, color: md3.onSurfaceVariant,
        fontFamily: "'Zen Maru Gothic', sans-serif",
      }}>
        <span>件数: <strong style={{ color: md3.onSurface }}>{transfers.length}件</strong></span>
        <span>総数量: <strong style={{ color: md3.onSurface }}>{totalQty}本</strong></span>
        <span>合計金額: <strong style={{ color: md3.primary }}>¥{total.toLocaleString()}</strong></span>
      </div>

      <MD3Card>
        <MD3CardHeader>
          <MD3CardTitle>
            {stores.find((s) => s.id === selectedStoreId)?.name || "店舗"} の持ち出し履歴
          </MD3CardTitle>
        </MD3CardHeader>
        <MD3CardContent>
          {loading ? (
            <p style={{ textAlign: "center", color: md3.onSurfaceVariant, padding: 32 }}>読み込み中...</p>
          ) : (
            <MD3Table>
              <MD3TableHead>
                <MD3TableRow>
                  <MD3TableHeaderCell>日付</MD3TableHeaderCell>
                  <MD3TableHeaderCell>花名</MD3TableHeaderCell>
                  <MD3TableHeaderCell>数量</MD3TableHeaderCell>
                  <MD3TableHeaderCell>単価</MD3TableHeaderCell>
                  <MD3TableHeaderCell>小計</MD3TableHeaderCell>
                </MD3TableRow>
              </MD3TableHead>
              <MD3TableBody>
                {transfers.length === 0 ? (
                  <MD3TableEmpty colSpan={5} title="該当する持ち出しデータがありません" />
                ) : (
                  transfers.map((t) => (
                    <MD3TableRow key={t.id}>
                      <MD3TableCell>
                        {new Date(t.transferred_at).toLocaleDateString("ja-JP")}
                      </MD3TableCell>
                      <MD3TableCell>{itemName(t.item_id)}</MD3TableCell>
                      <MD3TableCell>{t.quantity}</MD3TableCell>
                      <MD3TableCell>¥{t.unit_price.toLocaleString()}</MD3TableCell>
                      <MD3TableCell highlight>
                        ¥{(t.quantity * t.unit_price).toLocaleString()}
                      </MD3TableCell>
                    </MD3TableRow>
                  ))
                )}
              </MD3TableBody>
            </MD3Table>
          )}
        </MD3CardContent>
      </MD3Card>
    </MD3AppLayout>
  )
}
