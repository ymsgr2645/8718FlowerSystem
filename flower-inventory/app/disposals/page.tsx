"use client"

import { useEffect, useState } from "react"
import MD3AppLayout from "@/components/layout/MD3AppLayout"
import { MD3Card, MD3CardHeader, MD3CardContent } from "@/components/md3/MD3Card"
import { MD3Button } from "@/components/md3/MD3Button"
import { MD3Select } from "@/components/md3/MD3Select"
import { MD3TextField } from "@/components/md3/MD3TextField"
import { MD3NumberField } from "@/components/md3/MD3NumberField"
import {
  MD3Table,
  MD3TableHead,
  MD3TableBody,
  MD3TableRow,
  MD3TableHeaderCell,
  MD3TableCell,
} from "@/components/md3/MD3Table"
import { md3 } from "@/lib/md3-theme"
import { inventoryApi, itemsApi, Disposal, Item } from "@/lib/api"
import { Trash2 } from "lucide-react"

const reasons = [
  { value: "damage", label: "痛み・枯れ" },
  { value: "expired", label: "期限切れ" },
  { value: "lost", label: "紛失・不明" },
  { value: "other", label: "その他" },
]

export default function DisposalsPage() {
  const [items, setItems] = useState<Item[]>([])
  const [disposals, setDisposals] = useState<Disposal[]>([])
  const [itemId, setItemId] = useState("")
  const [quantity, setQuantity] = useState("")
  const [reason, setReason] = useState("damage")
  const [note, setNote] = useState("")

  useEffect(() => {
    const load = async () => {
      const [itemsData, disposalsData] = await Promise.all([
        itemsApi.getAll({ limit: 500 }),
        inventoryApi.getDisposals({ limit: 200 }),
      ])
      setItems(itemsData)
      setDisposals(disposalsData)
    }
    load().catch(console.error)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!itemId || !quantity) return
    await inventoryApi.createDisposal({
      item_id: Number(itemId),
      quantity: Number(quantity),
      reason,
      note: note || undefined,
    })
    const disposalsData = await inventoryApi.getDisposals({ limit: 200 })
    setDisposals(disposalsData)
    setItemId("")
    setQuantity("")
    setNote("")
  }

  return (
    <MD3AppLayout title="廃棄・ロス" subtitle="在庫から自動減算されます">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 24 }}>
        <MD3Card variant="outlined">
          <MD3CardHeader title="廃棄・ロス登録" icon={<Trash2 size={20} />} />
          <MD3CardContent>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <MD3Select
                label="商品"
                value={itemId}
                onChange={(e) => setItemId(e.target.value)}
                options={items.map((i) => ({ value: String(i.id), label: `${i.item_code} ${i.name}` }))}
                placeholder="商品を選択"
                fullWidth
              />
              <MD3NumberField label="数量" value={quantity} onChange={setQuantity} fullWidth />
              <MD3Select label="理由" value={reason} onChange={(e) => setReason(e.target.value)} options={reasons} fullWidth />
              <MD3TextField label="備考" value={note} onChange={(e) => setNote(e.target.value)} fullWidth />
              <MD3Button type="submit" fullWidth>
                登録
              </MD3Button>
            </form>
          </MD3CardContent>
        </MD3Card>

        <MD3Card variant="outlined">
          <MD3CardHeader title="廃棄・ロス一覧" />
          <MD3CardContent style={{ padding: 0 }}>
            <MD3Table>
              <MD3TableHead>
                <MD3TableRow hoverable={false}>
                  <MD3TableHeaderCell>日付</MD3TableHeaderCell>
                  <MD3TableHeaderCell>商品</MD3TableHeaderCell>
                  <MD3TableHeaderCell>理由</MD3TableHeaderCell>
                  <MD3TableHeaderCell align="right">数量</MD3TableHeaderCell>
                </MD3TableRow>
              </MD3TableHead>
              <MD3TableBody>
                {disposals.length === 0 ? (
                  <MD3TableRow hoverable={false}>
                    <MD3TableCell colSpan={4}>
                      <div style={{ textAlign: "center", padding: 32, color: md3.onSurfaceVariant }}>
                        廃棄・ロスがありません
                      </div>
                    </MD3TableCell>
                  </MD3TableRow>
                ) : (
                  disposals.map((d) => (
                    <MD3TableRow key={d.id}>
                      <MD3TableCell>{new Date(d.disposed_at).toLocaleDateString("ja-JP")}</MD3TableCell>
                      <MD3TableCell>{items.find((i) => i.id === d.item_id)?.name || d.item_id}</MD3TableCell>
                      <MD3TableCell>{reasons.find((r) => r.value === d.reason)?.label || d.reason}</MD3TableCell>
                      <MD3TableCell align="right">{d.quantity}</MD3TableCell>
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
