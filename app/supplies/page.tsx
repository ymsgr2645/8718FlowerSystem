"use client"

import { useEffect, useMemo, useState } from "react"
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
import { suppliesApi, storesApi, Supply, SupplyTransfer, Store } from "@/lib/api"
import { Boxes, ClipboardList } from "lucide-react"

export default function SuppliesPage() {
  const [supplies, setSupplies] = useState<Supply[]>([])
  const [stores, setStores] = useState<Store[]>([])
  const [transfers, setTransfers] = useState<SupplyTransfer[]>([])
  const [selectedSupply, setSelectedSupply] = useState("")
  const [selectedStore, setSelectedStore] = useState("")
  const [quantity, setQuantity] = useState("")
  const [unitPrice, setUnitPrice] = useState("")
  const [transferDate, setTransferDate] = useState(new Date().toISOString().split("T")[0])

  useEffect(() => {
    const load = async () => {
      const [suppliesData, storesData, transferData] = await Promise.all([
        suppliesApi.getAll(),
        storesApi.getAll(),
        suppliesApi.getTransfers(),
      ])
      setSupplies(suppliesData)
      setStores(storesData)
      setTransfers(transferData)
    }
    load().catch(console.error)
  }, [])

  const supplyMap = useMemo(() => new Map(supplies.map((s) => [s.id, s])), [supplies])
  const storeMap = useMemo(() => new Map(stores.map((s) => [s.id, s])), [stores])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSupply || !selectedStore || !quantity || !unitPrice) return
    await suppliesApi.createTransfer({
      store_id: Number(selectedStore),
      supply_id: Number(selectedSupply),
      quantity: Number(quantity),
      unit_price: Number(unitPrice),
      transferred_at: transferDate,
    })
    const transferData = await suppliesApi.getTransfers()
    setTransfers(transferData)
    setSelectedSupply("")
    setSelectedStore("")
    setQuantity("")
    setUnitPrice("")
    setTransferDate(new Date().toISOString().split("T")[0])
  }

  const summary = useMemo(() => {
    const totals = new Map<number, { qty: number; amount: number }>()
    transfers.forEach((t) => {
      const current = totals.get(t.supply_id) || { qty: 0, amount: 0 }
      current.qty += t.quantity
      current.amount += Number(t.unit_price) * t.quantity
      totals.set(t.supply_id, current)
    })
    return Array.from(totals.entries()).map(([id, v]) => ({
      id,
      supply: supplyMap.get(id),
      qty: v.qty,
      amount: v.amount,
    }))
  }, [transfers, supplyMap])

  return (
    <MD3AppLayout title="資材在庫" subtitle="資材の持ち出し記録と集計">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 24 }}>
        <MD3Card variant="outlined">
          <MD3CardHeader title="資材持ち出し入力" icon={<ClipboardList size={20} />} />
          <MD3CardContent>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <MD3Select
                label="資材"
                value={selectedSupply}
                onChange={(e) => setSelectedSupply(e.target.value)}
                options={supplies.map((s) => ({ value: String(s.id), label: s.name }))}
                placeholder="資材を選択"
                fullWidth
              />
              <MD3Select
                label="店舗"
                value={selectedStore}
                onChange={(e) => setSelectedStore(e.target.value)}
                options={stores.map((s) => ({ value: String(s.id), label: s.name }))}
                placeholder="店舗を選択"
                fullWidth
              />
              <MD3NumberField
                label="数量"
                value={quantity}
                onChange={setQuantity}
                fullWidth
              />
              <MD3NumberField
                label="単価"
                value={unitPrice}
                onChange={setUnitPrice}
                fullWidth
              />
              <MD3TextField
                label="持ち出し日"
                type="date"
                value={transferDate}
                onChange={(e) => setTransferDate(e.target.value)}
                fullWidth
              />
              <MD3Button type="submit" fullWidth>
                登録
              </MD3Button>
            </form>
          </MD3CardContent>
        </MD3Card>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <MD3Card variant="outlined">
            <MD3CardHeader title="資材別 集計" icon={<Boxes size={20} />} />
            <MD3CardContent style={{ padding: 0 }}>
              <MD3Table>
                <MD3TableHead>
                  <MD3TableRow hoverable={false}>
                    <MD3TableHeaderCell>資材</MD3TableHeaderCell>
                    <MD3TableHeaderCell align="right">数量</MD3TableHeaderCell>
                    <MD3TableHeaderCell align="right">金額</MD3TableHeaderCell>
                  </MD3TableRow>
                </MD3TableHead>
                <MD3TableBody>
                  {summary.length === 0 ? (
                    <MD3TableRow hoverable={false}>
                      <MD3TableCell colSpan={3}>
                        <div style={{ textAlign: "center", padding: "24px 16px", color: md3.onSurfaceVariant }}>
                          集計データがありません
                        </div>
                      </MD3TableCell>
                    </MD3TableRow>
                  ) : (
                    summary.map((s) => (
                      <MD3TableRow key={s.id}>
                        <MD3TableCell highlight>{s.supply?.name || s.id}</MD3TableCell>
                        <MD3TableCell align="right">{s.qty.toLocaleString()}</MD3TableCell>
                        <MD3TableCell align="right">¥{s.amount.toLocaleString()}</MD3TableCell>
                      </MD3TableRow>
                    ))
                  )}
                </MD3TableBody>
              </MD3Table>
            </MD3CardContent>
          </MD3Card>

          <MD3Card variant="outlined">
            <MD3CardHeader title="最近の持ち出し" />
            <MD3CardContent style={{ padding: 0 }}>
              <MD3Table>
                <MD3TableHead>
                  <MD3TableRow hoverable={false}>
                    <MD3TableHeaderCell>日付</MD3TableHeaderCell>
                    <MD3TableHeaderCell>資材</MD3TableHeaderCell>
                    <MD3TableHeaderCell>店舗</MD3TableHeaderCell>
                    <MD3TableHeaderCell align="right">数量</MD3TableHeaderCell>
                    <MD3TableHeaderCell align="right">単価</MD3TableHeaderCell>
                  </MD3TableRow>
                </MD3TableHead>
                <MD3TableBody>
                  {transfers.length === 0 ? (
                    <MD3TableRow hoverable={false}>
                      <MD3TableCell colSpan={5}>
                        <div style={{ textAlign: "center", padding: "24px 16px", color: md3.onSurfaceVariant }}>
                          持ち出し履歴がありません
                        </div>
                      </MD3TableCell>
                    </MD3TableRow>
                  ) : (
                    transfers.slice(0, 50).map((t) => (
                      <MD3TableRow key={t.id}>
                        <MD3TableCell>{t.transferred_at}</MD3TableCell>
                        <MD3TableCell>{supplyMap.get(t.supply_id)?.name || t.supply_id}</MD3TableCell>
                        <MD3TableCell>{storeMap.get(t.store_id)?.name || t.store_id}</MD3TableCell>
                        <MD3TableCell align="right">{t.quantity}</MD3TableCell>
                        <MD3TableCell align="right">¥{Number(t.unit_price).toLocaleString()}</MD3TableCell>
                      </MD3TableRow>
                    ))
                  )}
                </MD3TableBody>
              </MD3Table>
            </MD3CardContent>
          </MD3Card>
        </div>
      </div>
    </MD3AppLayout>
  )
}
