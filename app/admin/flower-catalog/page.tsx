"use client"

import { useEffect, useState } from "react"
import MD3AppLayout from "@/components/layout/MD3AppLayout"
import { MD3Card, MD3CardContent, MD3CardHeader, MD3CardTitle } from "@/components/md3/MD3Card"
import { MD3TextField } from "@/components/md3/MD3TextField"
import {
  MD3Table, MD3TableHead, MD3TableBody, MD3TableRow,
  MD3TableHeaderCell, MD3TableCell, MD3TableEmpty,
} from "@/components/md3/MD3Table"
import { md3, md3Shape } from "@/lib/md3-theme"
import { itemsApi, inventoryApi, type Item, type Inventory } from "@/lib/api"
import { Search } from "lucide-react"

export default function FlowerCatalogPage() {
  const [items, setItems] = useState<Item[]>([])
  const [inventory, setInventory] = useState<Inventory[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      itemsApi.getAll(),
      inventoryApi.getAll(),
    ]).then(([itemData, invData]) => {
      setItems(itemData)
      setInventory(invData)
    }).catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const getStock = (itemId: number) => inventory.find((inv) => inv.item_id === itemId)?.quantity || 0
  const getPrice = (itemId: number) => {
    const inv = inventory.find((i) => i.item_id === itemId)
    if (inv?.unit_price) return inv.unit_price
    return items.find((i) => i.id === itemId)?.default_unit_price || 0
  }

  const filtered = items.filter((item) => {
    const q = search.toLowerCase()
    if (!q) return true
    return (
      item.name.toLowerCase().includes(q) ||
      (item.variety || "").toLowerCase().includes(q) ||
      (item.category || "").toLowerCase().includes(q) ||
      item.item_code.toLowerCase().includes(q)
    )
  })

  const categories = [...new Set(items.map((i) => i.category).filter(Boolean))]

  return (
    <MD3AppLayout title="花カタログ" subtitle="花一覧と在庫状況">
      <div style={{ display: "flex", gap: 16, marginBottom: 20, alignItems: "flex-end" }}>
        <div style={{ flex: 1, maxWidth: 400 }}>
          <MD3TextField
            label="花を検索"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            fullWidth
          />
        </div>
        <div style={{ fontSize: 14, color: md3.onSurfaceVariant, paddingBottom: 8 }}>
          {filtered.length} / {items.length} 件
        </div>
      </div>

      {loading ? (
        <p style={{ textAlign: "center", color: md3.onSurfaceVariant, padding: 48 }}>読み込み中...</p>
      ) : (
        <MD3Card>
          <MD3CardHeader>
            <MD3CardTitle>花一覧</MD3CardTitle>
          </MD3CardHeader>
          <MD3CardContent>
            <MD3Table>
              <MD3TableHead>
                <MD3TableRow>
                  <MD3TableHeaderCell>コード</MD3TableHeaderCell>
                  <MD3TableHeaderCell>花名</MD3TableHeaderCell>
                  <MD3TableHeaderCell>品種</MD3TableHeaderCell>
                  <MD3TableHeaderCell>カテゴリ</MD3TableHeaderCell>
                  <MD3TableHeaderCell>在庫</MD3TableHeaderCell>
                  <MD3TableHeaderCell>単価</MD3TableHeaderCell>
                  <MD3TableHeaderCell>状態</MD3TableHeaderCell>
                </MD3TableRow>
              </MD3TableHead>
              <MD3TableBody>
                {filtered.length === 0 ? (
                  <MD3TableEmpty colSpan={7} title="該当する花がありません" />
                ) : (
                  filtered.map((item) => {
                    const stock = getStock(item.id)
                    const price = getPrice(item.id)
                    return (
                      <MD3TableRow key={item.id}>
                        <MD3TableCell>{item.item_code}</MD3TableCell>
                        <MD3TableCell>{item.name}</MD3TableCell>
                        <MD3TableCell>{item.variety || "-"}</MD3TableCell>
                        <MD3TableCell>
                          {item.category ? (
                            <span style={{
                              padding: "2px 8px", borderRadius: md3Shape.full, fontSize: 11,
                              backgroundColor: md3.surfaceContainerHigh, color: md3.onSurfaceVariant,
                            }}>
                              {item.category}
                            </span>
                          ) : "-"}
                        </MD3TableCell>
                        <MD3TableCell>
                          <span style={{
                            fontWeight: 600,
                            color: stock <= 0 ? md3.error : stock < 10 ? md3.tertiary : md3.onSurface,
                          }}>
                            {stock}
                          </span>
                        </MD3TableCell>
                        <MD3TableCell>
                          {price > 0 ? `¥${price.toLocaleString()}` : "-"}
                        </MD3TableCell>
                        <MD3TableCell>
                          <span style={{
                            padding: "2px 8px", borderRadius: md3Shape.full, fontSize: 11,
                            backgroundColor: item.is_active ? md3.secondaryContainer : md3.errorContainer,
                            color: item.is_active ? md3.onSecondaryContainer : md3.onErrorContainer,
                          }}>
                            {item.is_active ? "有効" : "無効"}
                          </span>
                        </MD3TableCell>
                      </MD3TableRow>
                    )
                  })
                )}
              </MD3TableBody>
            </MD3Table>
          </MD3CardContent>
        </MD3Card>
      )}
    </MD3AppLayout>
  )
}
