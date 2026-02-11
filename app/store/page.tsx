"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import MD3AppLayout from "@/components/layout/MD3AppLayout"
import { MD3Card, MD3CardContent, MD3CardHeader, MD3CardTitle } from "@/components/md3/MD3Card"
import { MD3Button } from "@/components/md3/MD3Button"
import { MD3Select } from "@/components/md3/MD3Select"
import {
  MD3Table,
  MD3TableHead,
  MD3TableBody,
  MD3TableRow,
  MD3TableHeaderCell,
  MD3TableCell,
  MD3TableEmpty,
} from "@/components/md3/MD3Table"
import { md3 } from "@/lib/md3-theme"
import { storesApi, transfersApi, itemsApi, type Store, type Transfer, type Item } from "@/lib/api"
import { ShoppingBag, Clock, TrendingUp, Flower2 } from "lucide-react"

export default function StoreDashboard() {
  const router = useRouter()
  const [stores, setStores] = useState<Store[]>([])
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null)
  const [transfers, setTransfers] = useState<Transfer[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    storesApi.getAll().then((s) => {
      const franchise = s.filter((st) => st.is_active)
      setStores(franchise)
      const saved = localStorage.getItem("8718_store_id")
      if (saved && franchise.some((st) => st.id === Number(saved))) {
        setSelectedStoreId(Number(saved))
      } else if (franchise.length > 0) {
        setSelectedStoreId(franchise[0].id)
      }
    }).catch(() => {})
    itemsApi.getAll().then(setItems).catch(() => {})
  }, [])

  useEffect(() => {
    if (!selectedStoreId) return
    localStorage.setItem("8718_store_id", String(selectedStoreId))
    setLoading(true)
    const today = new Date().toISOString().slice(0, 10)
    transfersApi.getByStore(selectedStoreId, today, today)
      .then(setTransfers)
      .catch(() => setTransfers([]))
      .finally(() => setLoading(false))
  }, [selectedStoreId])

  const storeName = stores.find((s) => s.id === selectedStoreId)?.name || "店舗"
  const itemName = (id: number) => items.find((i) => i.id === id)?.name || `ID:${id}`
  const todayTotal = transfers.reduce((sum, t) => sum + t.quantity * t.unit_price, 0)
  const todayCount = transfers.length
  const todayQty = transfers.reduce((sum, t) => sum + t.quantity, 0)

  return (
    <MD3AppLayout title={`${storeName} ダッシュボード`} subtitle="店舗ポータル">
      <div style={{ marginBottom: 20 }}>
        <MD3Select
          label="店舗を選択"
          value={selectedStoreId ? String(selectedStoreId) : ""}
          onChange={(e) => setSelectedStoreId(Number(e.target.value))}
          options={stores.map((s) => ({ value: String(s.id), label: s.name }))}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
        {[
          { label: "本日の持ち出し件数", value: `${todayCount}件`, icon: <ShoppingBag size={20} />, color: md3.primary },
          { label: "本日の持ち出し本数", value: `${todayQty}本`, icon: <Flower2 size={20} />, color: md3.secondary },
          { label: "本日の金額合計", value: `¥${todayTotal.toLocaleString()}`, icon: <TrendingUp size={20} />, color: md3.tertiary },
        ].map((card) => (
          <MD3Card key={card.label}>
            <MD3CardContent>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 12,
                  backgroundColor: `${card.color}20`, display: "flex",
                  alignItems: "center", justifyContent: "center", color: card.color,
                }}>{card.icon}</div>
                <div>
                  <div style={{ fontSize: 12, color: md3.onSurfaceVariant }}>{card.label}</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: md3.onSurface }}>{card.value}</div>
                </div>
              </div>
            </MD3CardContent>
          </MD3Card>
        ))}
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
        <MD3Button variant="filled" onClick={() => router.push("/store/order")}>
          <Flower2 size={16} /> 花を持ち出す
        </MD3Button>
        <MD3Button variant="outlined" onClick={() => router.push("/store/history")}>
          <Clock size={16} /> 持ち出し履歴
        </MD3Button>
      </div>

      <MD3Card>
        <MD3CardHeader>
          <MD3CardTitle>本日の持ち出し一覧</MD3CardTitle>
        </MD3CardHeader>
        <MD3CardContent>
          {loading ? (
            <p style={{ textAlign: "center", color: md3.onSurfaceVariant, padding: 32 }}>読み込み中...</p>
          ) : (
            <MD3Table>
              <MD3TableHead>
                <MD3TableRow>
                  <MD3TableHeaderCell>花名</MD3TableHeaderCell>
                  <MD3TableHeaderCell>数量</MD3TableHeaderCell>
                  <MD3TableHeaderCell>単価</MD3TableHeaderCell>
                  <MD3TableHeaderCell>小計</MD3TableHeaderCell>
                  <MD3TableHeaderCell>時刻</MD3TableHeaderCell>
                </MD3TableRow>
              </MD3TableHead>
              <MD3TableBody>
                {transfers.length === 0 ? (
                  <MD3TableEmpty colSpan={5} title="本日の持ち出しデータはありません" />
                ) : (
                  transfers.map((t) => (
                    <MD3TableRow key={t.id}>
                      <MD3TableCell>{itemName(t.item_id)}</MD3TableCell>
                      <MD3TableCell>{t.quantity}</MD3TableCell>
                      <MD3TableCell>¥{t.unit_price.toLocaleString()}</MD3TableCell>
                      <MD3TableCell highlight>¥{(t.quantity * t.unit_price).toLocaleString()}</MD3TableCell>
                      <MD3TableCell>{new Date(t.transferred_at).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}</MD3TableCell>
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
