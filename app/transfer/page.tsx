"use client"

import { useEffect, useMemo, useState } from "react"
import MD3AppLayout from "@/components/layout/MD3AppLayout"
import { MD3Card, MD3CardContent, MD3CardHeader, MD3CardTitle } from "@/components/md3/MD3Card"
import { MD3StatusBadge } from "@/components/md3/MD3Badge"
import { MD3Button } from "@/components/md3/MD3Button"
import { MD3Select } from "@/components/md3/MD3Select"
import { MD3NumberField } from "@/components/md3/MD3NumberField"
import { MD3TextField } from "@/components/md3/MD3TextField"
import {
  MD3Table,
  MD3TableHead,
  MD3TableBody,
  MD3TableRow,
  MD3TableHeaderCell,
  MD3TableCell,
} from "@/components/md3/MD3Table"
import { md3 } from "@/lib/md3-theme"
import { Truck, Package, Store as StoreIcon } from "lucide-react"
import { storesApi, itemsApi, transfersApi, Store, Item, Transfer } from "@/lib/api"

export default function TransferPage() {
  const [stores, setStores] = useState<Store[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [transfers, setTransfers] = useState<Transfer[]>([])

  const [selectedStore, setSelectedStore] = useState("")
  const [selectedItem, setSelectedItem] = useState("")
  const [quantity, setQuantity] = useState("")
  const [wholesalePrice, setWholesalePrice] = useState("")
  const [unitPrice, setUnitPrice] = useState("")
  const [transferDate, setTransferDate] = useState(new Date().toISOString().split("T")[0])

  useEffect(() => {
    const load = async () => {
      const [storesData, itemsData, transferData] = await Promise.all([
        storesApi.getAll(),
        itemsApi.getAll({ limit: 500 }),
        transfersApi.getAll({ limit: 200 }),
      ])
      setStores(storesData)
      setItems(itemsData)
      setTransfers(transferData)
    }
    load().catch(console.error)
  }, [])

  const storeMap = useMemo(() => new Map(stores.map((s) => [s.id, s])), [stores])
  const itemMap = useMemo(() => new Map(items.map((i) => [i.id, i])), [items])

  const selectedStoreData = stores.find((s) => String(s.id) === selectedStore)
  const isFranchiseStore = selectedStoreData?.operation_type === "franchise"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStore || !selectedItem || !quantity || !unitPrice) return
    await transfersApi.create({
      store_id: Number(selectedStore),
      item_id: Number(selectedItem),
      quantity: Number(quantity),
      unit_price: Number(unitPrice),
      wholesale_price: isFranchiseStore && wholesalePrice ? Number(wholesalePrice) : undefined,
      transferred_at: transferDate,
    })
    const transferData = await transfersApi.getAll({ limit: 200 })
    setTransfers(transferData)
    setSelectedStore("")
    setSelectedItem("")
    setQuantity("")
    setWholesalePrice("")
    setUnitPrice("")
    setTransferDate(new Date().toISOString().split("T")[0])
  }

  return (
    <MD3AppLayout title="持ち出し入力" subtitle="店舗別の持ち出し登録（仕切値・販売単価）">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 24 }}>
        <MD3Card variant="outlined">
          <MD3CardHeader>
            <MD3CardTitle style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Truck size={20} color={md3.primary} />
              持ち出し登録
            </MD3CardTitle>
          </MD3CardHeader>
          <MD3CardContent>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <MD3Select
                label="店舗"
                options={stores.map((s) => ({ value: String(s.id), label: s.name }))}
                placeholder="店舗を選択"
                value={selectedStore}
                onChange={(e) => setSelectedStore(e.target.value)}
                fullWidth
              />
              {selectedStoreData && (
                <MD3StatusBadge
                  status={selectedStoreData.operation_type === "headquarters" ? "info" : "success"}
                  label={selectedStoreData.operation_type === "headquarters" ? "直営" : "委託"}
                  size="small"
                />
              )}

              <MD3Select
                label="花"
                options={items.map((i) => ({ value: String(i.id), label: `${i.item_code} ${i.name}` }))}
                placeholder="花を選択"
                value={selectedItem}
                onChange={(e) => setSelectedItem(e.target.value)}
                fullWidth
              />

              <MD3NumberField
                label="数量"
                value={quantity}
                onChange={setQuantity}
                fullWidth
              />

              {isFranchiseStore && (
                <MD3NumberField
                  label="仕切値（委託店のみ）"
                  value={wholesalePrice}
                  onChange={setWholesalePrice}
                  fullWidth
                />
              )}

              <MD3NumberField
                label="販売単価"
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
            <MD3CardHeader>
              <MD3CardTitle style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Package size={20} color={md3.primary} />
                最近の持ち出し
              </MD3CardTitle>
            </MD3CardHeader>
            <MD3CardContent style={{ padding: 0 }}>
              <MD3Table>
                <MD3TableHead>
                  <MD3TableRow hoverable={false}>
                    <MD3TableHeaderCell>日付</MD3TableHeaderCell>
                    <MD3TableHeaderCell>店舗</MD3TableHeaderCell>
                    <MD3TableHeaderCell>花</MD3TableHeaderCell>
                    <MD3TableHeaderCell align="right">数量</MD3TableHeaderCell>
                    <MD3TableHeaderCell align="right">仕切値</MD3TableHeaderCell>
                    <MD3TableHeaderCell align="right">販売単価</MD3TableHeaderCell>
                  </MD3TableRow>
                </MD3TableHead>
                <MD3TableBody>
                  {transfers.length === 0 ? (
                    <MD3TableRow hoverable={false}>
                      <MD3TableCell colSpan={6}>
                        <div style={{ textAlign: "center", padding: "32px 16px", color: md3.onSurfaceVariant }}>
                          持ち出し履歴がありません
                        </div>
                      </MD3TableCell>
                    </MD3TableRow>
                  ) : (
                    transfers.map((t) => (
                      <MD3TableRow key={t.id}>
                        <MD3TableCell>{t.transferred_at}</MD3TableCell>
                        <MD3TableCell>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontWeight: 500 }}>{storeMap.get(t.store_id)?.name || t.store_id}</span>
                            <MD3StatusBadge
                              status={storeMap.get(t.store_id)?.operation_type === "headquarters" ? "info" : "success"}
                              label={storeMap.get(t.store_id)?.operation_type === "headquarters" ? "直営" : "委託"}
                              size="small"
                            />
                          </div>
                        </MD3TableCell>
                        <MD3TableCell>{itemMap.get(t.item_id)?.name || t.item_id}</MD3TableCell>
                        <MD3TableCell align="right">{t.quantity.toLocaleString()}</MD3TableCell>
                        <MD3TableCell align="right">
                          {t.wholesale_price ? `¥${Number(t.wholesale_price).toLocaleString()}` : "-"}
                        </MD3TableCell>
                        <MD3TableCell align="right">¥{Number(t.unit_price).toLocaleString()}</MD3TableCell>
                      </MD3TableRow>
                    ))
                  )}
                </MD3TableBody>
              </MD3Table>
            </MD3CardContent>
          </MD3Card>

          <MD3Card variant="outlined">
            <MD3CardHeader>
              <MD3CardTitle style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <StoreIcon size={20} color={md3.primary} />
                店舗別集計
              </MD3CardTitle>
            </MD3CardHeader>
            <MD3CardContent>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
                {stores.map((store) => {
                  const storeTransfers = transfers.filter((t) => t.store_id === store.id)
                  if (storeTransfers.length === 0) return null
                  const totalQuantity = storeTransfers.reduce((sum, t) => sum + t.quantity, 0)
                  return (
                    <div
                      key={store.id}
                      style={{
                        padding: 16,
                        borderRadius: 12,
                        backgroundColor: md3.surfaceContainerHigh,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                        <span style={{ fontSize: 14, fontWeight: 500 }}>{store.name}</span>
                        <MD3StatusBadge
                          status={store.operation_type === "headquarters" ? "info" : "success"}
                          label={store.operation_type === "headquarters" ? "直営" : "委託"}
                          size="small"
                        />
                      </div>
                      <p style={{ fontSize: 24, fontWeight: 600, color: md3.onSurface, margin: 0 }}>
                        {totalQuantity.toLocaleString()}
                      </p>
                      <p style={{ fontSize: 12, color: md3.onSurfaceVariant, margin: "4px 0 0 0" }}>
                        {storeTransfers.length}件の持ち出し
                      </p>
                    </div>
                  )
                })}
              </div>
            </MD3CardContent>
          </MD3Card>
        </div>
      </div>
    </MD3AppLayout>
  )
}
