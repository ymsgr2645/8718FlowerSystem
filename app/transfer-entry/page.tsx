"use client"

import { useEffect, useState, useMemo, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import MD3AppLayout from "@/components/layout/MD3AppLayout"
import { MD3Card, MD3CardContent, MD3CardHeader, MD3CardTitle } from "@/components/md3/MD3Card"
import { MD3Button } from "@/components/md3/MD3Button"
import { MD3Select } from "@/components/md3/MD3Select"
import { MD3TextField } from "@/components/md3/MD3TextField"
import { MD3StatusBadge } from "@/components/md3/MD3Badge"
import { md3 } from "@/lib/md3-theme"
import { ArrowLeft, Save, Plus, Minus, Check, AlertCircle } from "lucide-react"
import { storesApi, inventoryApi, transfersApi, itemsApi, Store, Arrival, Item } from "@/lib/api"

interface ArrivalView extends Arrival {
  item_name?: string
}

interface EntryItem {
  arrival: ArrivalView
  quantities: Record<number, number> // store_id -> quantity
}

export default function TransferEntryPage() {
  const searchParams = useSearchParams()
  const dateParam = searchParams.get("date")

  const [stores, setStores] = useState<Store[]>([])
  const [arrivals, setArrivals] = useState<ArrivalView[]>([])
  const [selectedDate, setSelectedDate] = useState(dateParam || new Date().toISOString().split("T")[0])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  // Track quantities for each arrival and store
  const [entryData, setEntryData] = useState<Map<number, Record<number, number>>>(new Map())

  // Track which item/store is active for quick entry
  const [activeArrival, setActiveArrival] = useState<number | null>(null)
  const [activeStore, setActiveStore] = useState<number | null>(null)

  useEffect(() => {
    const loadStores = async () => {
      const data = await storesApi.getAll()
      setStores(data.filter((s) => s.store_type !== "consignment"))
    }
    loadStores().catch(console.error)
  }, [])

  useEffect(() => {
    const loadArrivals = async () => {
      setLoading(true)
      const [arrivalData, items] = await Promise.all([
        inventoryApi.getArrivals({ date_from: selectedDate, date_to: selectedDate, limit: 500 }),
        itemsApi.getAll({ limit: 500 }),
      ])
      const itemMap = new Map(items.map((i) => [i.id, i.name]))
      setArrivals(arrivalData.map((a) => ({ ...a, item_name: itemMap.get(a.item_id) })))
      // Initialize entry data
      const initialData = new Map<number, Record<number, number>>()
      arrivalData.forEach((a) => {
        initialData.set(a.id, {})
      })
      setEntryData(initialData)
      setLoading(false)
    }
    loadArrivals().catch(console.error)
  }, [selectedDate])

  const getQuantity = useCallback(
    (arrivalId: number, storeId: number) => {
      return entryData.get(arrivalId)?.[storeId] || 0
    },
    [entryData]
  )

  const setQuantity = useCallback((arrivalId: number, storeId: number, value: number) => {
    setEntryData((prev) => {
      const newData = new Map(prev)
      const arrivalEntry = { ...(newData.get(arrivalId) || {}) }
      arrivalEntry[storeId] = Math.max(0, value)
      newData.set(arrivalId, arrivalEntry)
      return newData
    })
  }, [])

  const adjustQuantity = useCallback(
    (delta: number) => {
      if (activeArrival === null || activeStore === null) return
      const current = getQuantity(activeArrival, activeStore)
      setQuantity(activeArrival, activeStore, current + delta)
    },
    [activeArrival, activeStore, getQuantity, setQuantity]
  )

  const handleCellClick = (arrivalId: number, storeId: number) => {
    setActiveArrival(arrivalId)
    setActiveStore(storeId)
  }

  const handleManualInput = (arrivalId: number, storeId: number, value: string) => {
    const num = parseInt(value, 10)
    if (!isNaN(num)) {
      setQuantity(arrivalId, storeId, num)
    } else if (value === "") {
      setQuantity(arrivalId, storeId, 0)
    }
  }

  const getTotalForArrival = (arrivalId: number) => {
    const entry = entryData.get(arrivalId)
    if (!entry) return 0
    return Object.values(entry).reduce((sum, qty) => sum + qty, 0)
  }

  const handleSaveAll = async () => {
    setSaving(true)
    setMessage(null)
    let success = 0
    let errors = 0

    for (const [arrivalId, storeQuantities] of entryData.entries()) {
      const arrival = arrivals.find((a) => a.id === arrivalId)
      if (!arrival) continue

      for (const [storeId, quantity] of Object.entries(storeQuantities)) {
        if (quantity <= 0) continue
        try {
          await transfersApi.create({
            store_id: Number(storeId),
            item_id: arrival.item_id,
            quantity: quantity,
            unit_price: Number(arrival.wholesale_price || 0),
            wholesale_price: Number(arrival.wholesale_price || 0),
            transferred_at: selectedDate,
          })
          success++
        } catch {
          errors++
        }
      }
    }

    if (errors === 0) {
      setMessage({ type: "success", text: `${success}件の持ち出しを登録しました` })
    } else {
      setMessage({ type: "error", text: `登録: ${success}件 / エラー: ${errors}件` })
    }
    setSaving(false)
  }

  const activeQuantity = activeArrival !== null && activeStore !== null ? getQuantity(activeArrival, activeStore) : 0
  const activeArrivalData = arrivals.find((a) => a.id === activeArrival)
  const activeStoreData = stores.find((s) => s.id === activeStore)

  return (
    <MD3AppLayout title="花持ち出し" subtitle="カップ印刷から数量を入力">
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <Link
          href="/bucket-paper"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            color: md3.onSurfaceVariant,
            textDecoration: "none",
            fontSize: 14,
          }}
        >
          <ArrowLeft size={20} />
          カップ印刷に戻る
        </Link>

        {message && (
          <div
            style={{
              padding: "12px 16px",
              backgroundColor: message.type === "success" ? md3.secondaryContainer : md3.errorContainer,
              color: message.type === "success" ? md3.onSecondaryContainer : md3.onErrorContainer,
              borderRadius: 12,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            {message.type === "success" ? <Check size={20} /> : <AlertCircle size={20} />}
            {message.text}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 24 }}>
          {/* Main entry area */}
          <MD3Card variant="outlined" hoverable={false}>
            <MD3CardHeader>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <MD3CardTitle>入荷アイテム</MD3CardTitle>
                <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                  <MD3TextField
                    label="入荷日"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    style={{ width: 180 }}
                  />
                  <MD3StatusBadge status={arrivals.length > 0 ? "success" : "neutral"} label={`${arrivals.length}件`} />
                </div>
              </div>
            </MD3CardHeader>
            <MD3CardContent style={{ padding: 0, overflow: "auto" }}>
              {loading ? (
                <div style={{ textAlign: "center", padding: 48, color: md3.onSurfaceVariant }}>読み込み中...</div>
              ) : arrivals.length === 0 ? (
                <div style={{ textAlign: "center", padding: 48, color: md3.onSurfaceVariant }}>
                  入荷データがありません
                </div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ backgroundColor: md3.surfaceContainerHigh }}>
                      <th
                        style={{
                          padding: "12px 16px",
                          textAlign: "left",
                          fontWeight: 600,
                          color: md3.onSurface,
                          borderBottom: `1px solid ${md3.outlineVariant}`,
                          position: "sticky",
                          left: 0,
                          backgroundColor: md3.surfaceContainerHigh,
                          minWidth: 150,
                        }}
                      >
                        商品
                      </th>
                      {stores.map((store) => (
                        <th
                          key={store.id}
                          style={{
                            padding: "8px 4px",
                            textAlign: "center",
                            fontWeight: 500,
                            color: md3.onSurfaceVariant,
                            borderBottom: `1px solid ${md3.outlineVariant}`,
                            fontSize: 11,
                            minWidth: 60,
                          }}
                        >
                          {store.name.replace("店", "")}
                        </th>
                      ))}
                      <th
                        style={{
                          padding: "8px 12px",
                          textAlign: "right",
                          fontWeight: 600,
                          color: md3.onSurface,
                          borderBottom: `1px solid ${md3.outlineVariant}`,
                          minWidth: 60,
                        }}
                      >
                        合計
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {arrivals.map((arrival) => (
                      <tr key={arrival.id}>
                        <td
                          style={{
                            padding: "8px 16px",
                            fontWeight: 500,
                            color: md3.onSurface,
                            borderBottom: `1px solid ${md3.outlineVariant}`,
                            position: "sticky",
                            left: 0,
                            backgroundColor: md3.surface,
                          }}
                        >
                          <div>{arrival.item_name || "商品"}</div>
                          <div style={{ fontSize: 11, color: md3.onSurfaceVariant }}>
                            数量: {arrival.quantity} / ¥{Number(arrival.wholesale_price || 0).toLocaleString()}
                          </div>
                        </td>
                        {stores.map((store) => {
                          const qty = getQuantity(arrival.id, store.id)
                          const isActive = activeArrival === arrival.id && activeStore === store.id
                          return (
                            <td
                              key={store.id}
                              onClick={() => handleCellClick(arrival.id, store.id)}
                              style={{
                                padding: 4,
                                textAlign: "center",
                                borderBottom: `1px solid ${md3.outlineVariant}`,
                                cursor: "pointer",
                              }}
                            >
                              <input
                                type="text"
                                value={qty || ""}
                                onChange={(e) => handleManualInput(arrival.id, store.id, e.target.value)}
                                style={{
                                  width: "100%",
                                  padding: "8px 4px",
                                  textAlign: "center",
                                  border: isActive ? `2px solid ${md3.primary}` : `1px solid ${md3.outlineVariant}`,
                                  borderRadius: 8,
                                  backgroundColor: isActive ? md3.primaryContainer : qty > 0 ? md3.secondaryContainer : "transparent",
                                  color: isActive ? md3.onPrimaryContainer : md3.onSurface,
                                  fontSize: 14,
                                  fontWeight: qty > 0 ? 600 : 400,
                                  outline: "none",
                                }}
                                placeholder="-"
                              />
                            </td>
                          )
                        })}
                        <td
                          style={{
                            padding: "8px 12px",
                            textAlign: "right",
                            fontWeight: 600,
                            color: md3.primary,
                            borderBottom: `1px solid ${md3.outlineVariant}`,
                          }}
                        >
                          {getTotalForArrival(arrival.id) || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </MD3CardContent>
          </MD3Card>

          {/* Quick entry panel */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <MD3Card variant="filled" hoverable={false}>
              <MD3CardContent>
                <div style={{ textAlign: "center", marginBottom: 16 }}>
                  <div style={{ fontSize: 12, color: md3.onSurfaceVariant, marginBottom: 4 }}>
                    {activeArrivalData ? activeArrivalData.item_name : "アイテムを選択"}
                  </div>
                  <div style={{ fontSize: 12, color: md3.onSurfaceVariant }}>
                    {activeStoreData ? activeStoreData.name : "店舗を選択"}
                  </div>
                </div>

                {/* Large quantity display */}
                <div
                  style={{
                    fontSize: 64,
                    fontWeight: 700,
                    textAlign: "center",
                    color: md3.onSurface,
                    padding: "24px 0",
                    backgroundColor: md3.surfaceContainerLow,
                    borderRadius: 16,
                    marginBottom: 16,
                    fontFamily: "monospace",
                  }}
                >
                  {activeQuantity}
                </div>

                {/* +100 / -100 buttons */}
                <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                  <button
                    onClick={() => adjustQuantity(-100)}
                    disabled={activeArrival === null || activeStore === null}
                    style={{
                      flex: 1,
                      padding: "16px 0",
                      fontSize: 20,
                      fontWeight: 600,
                      backgroundColor: md3.errorContainer,
                      color: md3.onErrorContainer,
                      border: "none",
                      borderRadius: 12,
                      cursor: activeArrival === null ? "not-allowed" : "pointer",
                      opacity: activeArrival === null ? 0.5 : 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 4,
                    }}
                  >
                    <Minus size={20} />
                    100
                  </button>
                  <button
                    onClick={() => adjustQuantity(100)}
                    disabled={activeArrival === null || activeStore === null}
                    style={{
                      flex: 1,
                      padding: "16px 0",
                      fontSize: 20,
                      fontWeight: 600,
                      backgroundColor: md3.primaryContainer,
                      color: md3.onPrimaryContainer,
                      border: "none",
                      borderRadius: 12,
                      cursor: activeArrival === null ? "not-allowed" : "pointer",
                      opacity: activeArrival === null ? 0.5 : 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 4,
                    }}
                  >
                    <Plus size={20} />
                    100
                  </button>
                </div>

                {/* +10 / -10 buttons */}
                <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                  <button
                    onClick={() => adjustQuantity(-10)}
                    disabled={activeArrival === null || activeStore === null}
                    style={{
                      flex: 1,
                      padding: "16px 0",
                      fontSize: 20,
                      fontWeight: 600,
                      backgroundColor: md3.tertiaryContainer,
                      color: md3.onTertiaryContainer,
                      border: "none",
                      borderRadius: 12,
                      cursor: activeArrival === null ? "not-allowed" : "pointer",
                      opacity: activeArrival === null ? 0.5 : 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 4,
                    }}
                  >
                    <Minus size={20} />
                    10
                  </button>
                  <button
                    onClick={() => adjustQuantity(10)}
                    disabled={activeArrival === null || activeStore === null}
                    style={{
                      flex: 1,
                      padding: "16px 0",
                      fontSize: 20,
                      fontWeight: 600,
                      backgroundColor: md3.secondaryContainer,
                      color: md3.onSecondaryContainer,
                      border: "none",
                      borderRadius: 12,
                      cursor: activeArrival === null ? "not-allowed" : "pointer",
                      opacity: activeArrival === null ? 0.5 : 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 4,
                    }}
                  >
                    <Plus size={20} />
                    10
                  </button>
                </div>

                {/* +1 / -1 buttons */}
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => adjustQuantity(-1)}
                    disabled={activeArrival === null || activeStore === null}
                    style={{
                      flex: 1,
                      padding: "12px 0",
                      fontSize: 16,
                      fontWeight: 500,
                      backgroundColor: md3.surfaceContainerHigh,
                      color: md3.onSurface,
                      border: "none",
                      borderRadius: 12,
                      cursor: activeArrival === null ? "not-allowed" : "pointer",
                      opacity: activeArrival === null ? 0.5 : 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 4,
                    }}
                  >
                    <Minus size={16} />1
                  </button>
                  <button
                    onClick={() => adjustQuantity(1)}
                    disabled={activeArrival === null || activeStore === null}
                    style={{
                      flex: 1,
                      padding: "12px 0",
                      fontSize: 16,
                      fontWeight: 500,
                      backgroundColor: md3.surfaceContainerHigh,
                      color: md3.onSurface,
                      border: "none",
                      borderRadius: 12,
                      cursor: activeArrival === null ? "not-allowed" : "pointer",
                      opacity: activeArrival === null ? 0.5 : 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 4,
                    }}
                  >
                    <Plus size={16} />1
                  </button>
                </div>
              </MD3CardContent>
            </MD3Card>

            <MD3Button variant="filled" icon={<Save size={18} />} onClick={handleSaveAll} disabled={saving} fullWidth>
              {saving ? "保存中..." : "全て保存"}
            </MD3Button>
          </div>
        </div>
      </div>
    </MD3AppLayout>
  )
}
