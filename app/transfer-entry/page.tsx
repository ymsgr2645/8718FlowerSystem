"use client"

import { Suspense, useEffect, useState, useMemo, useCallback, useRef, Fragment } from "react"
import { useSearchParams } from "next/navigation"
import MD3AppLayout from "@/components/layout/MD3AppLayout"
import { MD3Card, MD3CardContent, MD3CardHeader, MD3CardTitle } from "@/components/md3/MD3Card"
import { MD3Button } from "@/components/md3/MD3Button"
import { MD3StatusBadge } from "@/components/md3/MD3Badge"
import { md3 } from "@/lib/md3-theme"
import { Save, Check, AlertCircle, Trash2 } from "lucide-react"
import { storesApi, inventoryApi, transfersApi, type Store, type Arrival } from "@/lib/api"
import SupplyTransferTab from "./SupplyTransferTab"

const disposalReasons = [
  { value: "damage", label: "痛み・枯れ" },
  { value: "lost", label: "紛失・不明" },
  { value: "other", label: "その他" },
]

export default function TransferEntryPage() {
  return (
    <Suspense fallback={<MD3AppLayout title="持出入力"><div style={{ padding: "2rem", textAlign: "center" }}>読み込み中...</div></MD3AppLayout>}>
      <TransferEntryContent />
    </Suspense>
  )
}

function TransferEntryContent() {
  const searchParams = useSearchParams()
  const dateParam = searchParams.get("date")

  const [activeTab, setActiveTab] = useState<"flower" | "supply">("flower")
  const [stores, setStores] = useState<Store[]>([])
  const [arrivals, setArrivals] = useState<Arrival[]>([])
  const [selectedDate, setSelectedDate] = useState(dateParam || new Date().toISOString().split("T")[0])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  // Track quantities for each arrival and store
  const [entryData, setEntryData] = useState<Map<number, Record<number, number>>>(new Map())

  // Track adjusted unit prices per arrival (overrides wholesale_price)
  const [adjustedPrices, setAdjustedPrices] = useState<Map<number, number>>(new Map())
  const [editingPriceId, setEditingPriceId] = useState<number | null>(null)
  const [confirmedPriceId, setConfirmedPriceId] = useState<number | null>(null)
  const priceInputRefs = useRef<Map<number, HTMLInputElement>>(new Map())

  // 単価変更履歴（item_id -> 履歴配列）
  const [priceHistoryMap, setPriceHistoryMap] = useState<Map<number, Array<{ id: number; new_price: number; changed_at: string }>>>(new Map())

  // Track which item/store is active for quick entry
  const [activeArrival, setActiveArrival] = useState<number | null>(null)
  const [activeStore, setActiveStore] = useState<number | null>(null)

  // Track locked (confirmed) rows
  const [lockedRows, setLockedRows] = useState<Set<number>>(new Set())

  // 廃棄・ロスデータ: arrivalId -> { quantity, reason }
  const [disposalData, setDisposalData] = useState<Map<number, { quantity: number; reason: string }>>(new Map())
  // 理由選択ダイアログ
  const [reasonDialog, setReasonDialog] = useState<{ arrivalId: number; tempQty: number } | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    const [storeData, arrivalData, latestPrices] = await Promise.all([
      storesApi.getAll(),
      inventoryApi.getArrivals({ limit: 1000 }),
      transfersApi.getLatestPrices(),
    ])
    setStores(
      storeData
        .sort((a, b) => (a.sort_order ?? 99) - (b.sort_order ?? 99))
    )
    setArrivals(arrivalData)
    const initialData = new Map<number, Record<number, number>>()
    arrivalData.forEach((a) => {
      initialData.set(a.id, {})
    })
    setEntryData(initialData)
    const priceMap = new Map<number, number>()
    arrivalData.forEach((a) => {
      // 保存済み単価があればそれを優先、なければ入荷時の仕切値
      const saved = latestPrices[String(a.item_id)]
      priceMap.set(a.id, saved ?? Number(a.wholesale_price || 0))
    })
    setAdjustedPrices(priceMap)
    setActiveArrival(null)
    setActiveStore(null)
    setLockedRows(new Set())
    setLoading(false)
    // 全アイテムの単価変更履歴を取得
    const uniqueItemIds = [...new Set(arrivalData.map((a) => a.item_id))]
    const histMap = new Map<number, Array<{ id: number; new_price: number; changed_at: string }>>()
    await Promise.all(
      uniqueItemIds.map(async (itemId) => {
        try {
          const hist = await transfersApi.getPriceChanges(itemId)
          if (hist.length > 0) histMap.set(itemId, hist)
        } catch { /* ignore */ }
      })
    )
    setPriceHistoryMap(histMap)
  }, [])

  useEffect(() => {
    loadData().catch(console.error)
  }, [loadData])

  const getPrice = useCallback(
    (arrivalId: number) => adjustedPrices.get(arrivalId) ?? 0,
    [adjustedPrices]
  )

  const setPrice = useCallback((arrivalId: number, value: number) => {
    setAdjustedPrices((prev) => {
      const next = new Map(prev)
      next.set(arrivalId, Math.max(0, value))
      return next
    })
  }, [])

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

  const visibleArrivals = useMemo(
    () => arrivals.filter((a) => (a.remaining_quantity ?? 0) > 0),
    [arrivals]
  )

  const groupedArrivals = useMemo(() => {
    const groups = new Map<string, Arrival[]>()
    for (const a of arrivals) {
      const dateKey = a.arrived_at ? a.arrived_at.split("T")[0] : "unknown"
      if (!groups.has(dateKey)) groups.set(dateKey, [])
      groups.get(dateKey)!.push(a)
    }
    // 各日付グループ内で在庫あり→在庫なしの順にソート
    for (const [, group] of groups) {
      group.sort((a, b) => {
        const aStock = a.remaining_quantity ?? 0
        const bStock = b.remaining_quantity ?? 0
        if (aStock > 0 && bStock <= 0) return -1
        if (aStock <= 0 && bStock > 0) return 1
        return 0
      })
    }
    return Array.from(groups.entries()).sort(([a], [b]) => b.localeCompare(a))
  }, [arrivals])

  // 画面の表示順と一致するフラットなID配列（Enter移動に使用）
  const renderedArrivalIds = useMemo(
    () => groupedArrivals.flatMap(([, dateArrivals]) => dateArrivals.map((a) => a.id)),
    [groupedArrivals]
  )

  // Ref map for cell inputs: "arrivalId-storeId" -> HTMLInputElement
  const cellRefs = useRef<Map<string, HTMLInputElement>>(new Map())
  const cellKey = (arrivalId: number, storeId: number) => `${arrivalId}-${storeId}`

  const handleCellClick = (arrivalId: number, storeId: number) => {
    setActiveArrival(arrivalId)
    setActiveStore(storeId)
  }

  const lockRow = useCallback((arrivalId: number) => {
    setLockedRows((prev) => {
      const next = new Set(prev)
      next.add(arrivalId)
      return next
    })
  }, [])

  const unlockRow = useCallback((arrivalId: number) => {
    setLockedRows((prev) => {
      const next = new Set(prev)
      next.delete(arrivalId)
      return next
    })
  }, [])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, arrivalId: number, storeId: number) => {
      // ASDF quick adjust: A=+100, S=+10, D=-10, F=-100
      const quickKeys: Record<string, number> = { a: 100, s: 10, d: -10, f: -100 }
      if (quickKeys[e.key] !== undefined) {
        e.preventDefault()
        if (lockedRows.has(arrivalId)) return
        const current = getQuantity(arrivalId, storeId)
        setQuantity(arrivalId, storeId, current + quickKeys[e.key])
        return
      }

      // Enter = lock current row and move to next row (画面表示順)
      if (e.key === "Enter" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        // 超過時はロックしない
        const arrival = arrivals.find((a) => a.id === arrivalId)
        const total = getTotalForArrival(arrivalId) + getDisposalQty(arrivalId)
        const limit = arrival ? (arrival.remaining_quantity ?? Number(arrival.quantity)) : 0
        if (total > limit) return
        lockRow(arrivalId)
        // Move focus to next unlocked row (renderedArrivalIds = 画面表示順)
        const rowIdx = renderedArrivalIds.indexOf(arrivalId)
        for (let i = rowIdx + 1; i < renderedArrivalIds.length; i++) {
          if (!lockedRows.has(renderedArrivalIds[i])) {
            const nextId = renderedArrivalIds[i]
            const firstStore = stores[0]?.id
            if (firstStore) {
              setActiveArrival(nextId)
              setActiveStore(firstStore)
              const ref = cellRefs.current.get(cellKey(nextId, firstStore))
              if (ref) { ref.focus(); ref.select() }
            }
            return
          }
        }
        // All rows locked - blur
        ;(e.target as HTMLElement).blur()
        return
      }

      // Arrow key / Tab navigation
      const navKeys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Tab"]
      if (!navKeys.includes(e.key)) return

      e.preventDefault()
      const arrivalIds = renderedArrivalIds
      const storeIds = stores.map((s) => s.id)
      const rowIdx = arrivalIds.indexOf(arrivalId)
      const colIdx = storeIds.indexOf(storeId)

      let nextRow = rowIdx
      let nextCol = colIdx

      switch (e.key) {
        case "ArrowUp":
          nextRow = Math.max(0, rowIdx - 1)
          break
        case "ArrowDown":
          nextRow = Math.min(arrivalIds.length - 1, rowIdx + 1)
          break
        case "ArrowLeft":
          nextCol = Math.max(0, colIdx - 1)
          break
        case "ArrowRight":
        case "Tab":
          if (colIdx < storeIds.length - 1) {
            nextCol = colIdx + 1
          } else if (rowIdx < arrivalIds.length - 1) {
            nextRow = rowIdx + 1
            nextCol = 0
          }
          break
      }

      const nextArrivalId = arrivalIds[nextRow]
      const nextStoreId = storeIds[nextCol]
      setActiveArrival(nextArrivalId)
      setActiveStore(nextStoreId)

      const ref = cellRefs.current.get(cellKey(nextArrivalId, nextStoreId))
      if (ref) {
        ref.focus()
        ref.select()
      }
    },
    [renderedArrivalIds, stores, getQuantity, setQuantity, lockedRows, lockRow]
  )

  // 全角数字→半角数字に正規化
  const toHalfWidth = (s: string) => s.replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xFEE0))

  const handleManualInput = (arrivalId: number, storeId: number, value: string) => {
    const normalized = toHalfWidth(value)
    const num = parseInt(normalized, 10)
    if (!isNaN(num)) {
      setQuantity(arrivalId, storeId, num)
    } else if (normalized === "") {
      setQuantity(arrivalId, storeId, 0)
    }
  }

  const getTotalForArrival = (arrivalId: number) => {
    const entry = entryData.get(arrivalId)
    if (!entry) return 0
    return Object.values(entry).reduce((sum, qty) => sum + qty, 0)
  }

  const getDisposalQty = useCallback(
    (arrivalId: number) => disposalData.get(arrivalId)?.quantity || 0,
    [disposalData]
  )

  const setDisposalQty = useCallback((arrivalId: number, qty: number) => {
    if (qty <= 0) {
      setDisposalData((prev) => {
        const next = new Map(prev)
        next.delete(arrivalId)
        return next
      })
    } else {
      // 数量だけ設定。理由は後でダイアログで設定する
      setDisposalData((prev) => {
        const next = new Map(prev)
        const existing = next.get(arrivalId)
        next.set(arrivalId, { quantity: qty, reason: existing?.reason || "" })
        return next
      })
    }
  }, [])

  const hasOverflow = visibleArrivals.some((a) => getTotalForArrival(a.id) + getDisposalQty(a.id) > (a.remaining_quantity ?? Number(a.quantity)))
  const hasAnyEntry = visibleArrivals.some((a) => getTotalForArrival(a.id) > 0 || getDisposalQty(a.id) > 0)

  const handleClearAll = () => {
    const initialData = new Map<number, Record<number, number>>()
    arrivals.forEach((a) => {
      initialData.set(a.id, {})
    })
    setEntryData(initialData)
    setDisposalData(new Map())
    setActiveArrival(null)
    setActiveStore(null)
  }

  const handleSaveAll = async () => {
    if (hasOverflow) return
    setSaving(true)
    setMessage(null)
    let transferCount = 0
    let errors = 0
    const errorDetails: string[] = []

    for (const [arrivalId, storeQuantities] of entryData.entries()) {
      const arrival = arrivals.find((a) => a.id === arrivalId)
      if (!arrival) continue

      for (const [storeId, quantity] of Object.entries(storeQuantities)) {
        if (quantity <= 0) continue
        try {
          await transfersApi.create({
            store_id: Number(storeId),
            item_id: arrival.item_id,
            arrival_id: arrival.id,
            quantity: quantity,
            unit_price: getPrice(arrivalId),
            wholesale_price: Number(arrival.wholesale_price || 0),
            transferred_at: selectedDate,
          })
          transferCount++
        } catch (e) {
          errors++
          const storeName = stores.find((s) => s.id === Number(storeId))?.name || storeId
          errorDetails.push(`${arrival.item_name || "花"}→${storeName}`)
        }
      }
    }

    // 廃棄・ロスの登録
    let disposalCount = 0
    for (const [arrivalId, d] of disposalData.entries()) {
      if (d.quantity <= 0 || !d.reason) continue
      const arrival = arrivals.find((a) => a.id === arrivalId)
      if (!arrival) continue
      try {
        await inventoryApi.createDisposal({
          item_id: arrival.item_id,
          arrival_id: arrival.id,
          quantity: d.quantity,
          reason: d.reason,
        })
        disposalCount++
      } catch {
        errors++
        errorDetails.push(`廃棄: ${arrival.item_name || "花"}`)
      }
    }

    const totalOps = transferCount + disposalCount
    if (errors === 0) {
      const parts: string[] = []
      if (transferCount > 0) parts.push(`持出${transferCount}件`)
      if (disposalCount > 0) parts.push(`廃棄${disposalCount}件`)
      setMessage({ type: "success", text: `${parts.join("・")}の登録完了` })
    } else {
      setMessage({ type: "error", text: `成功: ${totalOps}件 / エラー: ${errors}件 (${errorDetails.join(", ")})` })
    }
    setSaving(false)
    // 保存後にデータを再取得して在庫を最新化
    if (transferCount > 0) {
      await loadData()
    }
  }

  // Ctrl+Enter で全体保存
  const handleSaveAllRef = useRef(handleSaveAll)
  handleSaveAllRef.current = handleSaveAll
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && hasAnyEntry && !hasOverflow && !saving) {
        e.preventDefault()
        handleSaveAllRef.current()
      }
    }
    window.addEventListener("keydown", handleGlobalKeyDown)
    return () => window.removeEventListener("keydown", handleGlobalKeyDown)
  }, [hasAnyEntry, hasOverflow, saving])

  return (
    <MD3AppLayout title="持ち出し" subtitle="花・資材の持ち出し登録">
      <div style={{ display: "flex", flexDirection: "column", gap: 24, minWidth: 0, overflow: "hidden" }}>
        {/* タブ切り替え */}
        <div style={{ display: "flex", gap: 0, borderBottom: `2px solid ${md3.outlineVariant}` }}>
          {([
            { key: "flower" as const, label: "花" },
            { key: "supply" as const, label: "資材" },
          ]).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: "12px 24px",
                fontSize: 15,
                fontWeight: activeTab === tab.key ? 700 : 400,
                color: activeTab === tab.key ? md3.primary : md3.onSurfaceVariant,
                backgroundColor: "transparent",
                border: "none",
                borderBottom: activeTab === tab.key ? `3px solid ${md3.primary}` : "3px solid transparent",
                cursor: "pointer",
                marginBottom: -2,
                transition: "all 150ms ease",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "supply" && <SupplyTransferTab />}

        {activeTab === "flower" && (
        <>

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

        {/* キーバインドガイド */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          padding: "8px 16px",
          backgroundColor: md3.surfaceContainerLow,
          borderRadius: 12,
          fontSize: 13,
          color: md3.onSurfaceVariant,
        }}>
          <span style={{ fontWeight: 600, color: md3.onSurface }}>キーバインド</span>
          {[
            { key: "A", label: "+100", color: md3.primary },
            { key: "S", label: "+10", color: md3.secondary },
            { key: "D", label: "-10", color: md3.tertiary },
            { key: "F", label: "-100", color: md3.error },
          ].map((k) => (
            <span key={k.key} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              <kbd style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 24,
                height: 24,
                backgroundColor: md3.surfaceContainerHighest,
                border: `1px solid ${md3.outlineVariant}`,
                borderRadius: 6,
                fontWeight: 700,
                fontSize: 13,
                color: k.color,
                fontFamily: "inherit",
              }}>{k.key}</kbd>
              <span style={{ color: k.color, fontWeight: 600 }}>{k.label}</span>
            </span>
          ))}
          <span style={{ opacity: 0.7 }}>矢印/Tabで移動</span>
          <span style={{ opacity: 0.7 }}>Enterで行確定</span>
          <span style={{ opacity: 0.7 }}>Ctrl+Enterで保存</span>
        </div>

        <div style={{ width: "100%", overflowX: "auto" }}>
        <MD3Card variant="outlined" hoverable={false} style={{ padding: 0 }}>
            <MD3CardHeader style={{ padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <MD3CardTitle>在庫アイテム</MD3CardTitle>
                <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                  <span style={{ fontSize: 13, color: md3.onSurfaceVariant }}>
                    持出日: {new Date(selectedDate + "T00:00:00").toLocaleDateString("ja-JP", { month: "long", day: "numeric" })}
                  </span>
                  <MD3StatusBadge status={visibleArrivals.length > 0 ? "success" : "neutral"} label={`${visibleArrivals.length}件`} />
                  <span style={{ fontSize: 13, color: md3.onSurfaceVariant }}>
                    {groupedArrivals.length}日分
                  </span>
                </div>
              </div>
            </MD3CardHeader>
            <MD3CardContent style={{ padding: 0, overflow: "auto" }}>
              {loading ? (
                <div style={{ textAlign: "center", padding: 48, color: md3.onSurfaceVariant }}>読み込み中...</div>
              ) : arrivals.length === 0 ? (
                <div style={{ textAlign: "center", padding: 48, color: md3.onSurfaceVariant }}>
                  在庫のあるアイテムがありません
                </div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 16 }}>
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
                        花
                      </th>
                      {stores.map((store) => (
                        <th
                          key={store.id}
                          style={{
                            padding: "10px 6px",
                            textAlign: "center",
                            fontWeight: 600,
                            color: md3.onSurfaceVariant,
                            borderBottom: `1px solid ${md3.outlineVariant}`,
                            fontSize: 14,
                            minWidth: 70,
                          }}
                        >
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                            {store.color && <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: store.color, flexShrink: 0 }} />}
                            {store.name.replace("店", "")}
                          </span>
                        </th>
                      ))}
                      <th
                        style={{
                          padding: "10px 6px",
                          textAlign: "center",
                          fontWeight: 600,
                          color: md3.error,
                          borderBottom: `1px solid ${md3.outlineVariant}`,
                          backgroundColor: md3.errorContainer + "40",
                          minWidth: 70,
                          fontSize: 14,
                        }}
                      >
                        廃棄/ロス
                      </th>
                      <th
                        style={{
                          padding: "10px 6px",
                          textAlign: "center",
                          fontWeight: 600,
                          color: md3.onSurface,
                          borderBottom: `1px solid ${md3.outlineVariant}`,
                          backgroundColor: md3.surfaceContainerHighest,
                          minWidth: 70,
                          fontSize: 14,
                        }}
                      >
                        計
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupedArrivals.map(([dateKey, dateArrivals]) => (
                      <Fragment key={dateKey}>
                        <tr>
                          <td
                            colSpan={stores.length + 3}
                            style={{
                              padding: "10px 16px",
                              backgroundColor: md3.primaryContainer,
                              color: md3.onPrimaryContainer,
                              fontWeight: 700,
                              fontSize: 13,
                              borderBottom: `1px solid ${md3.outlineVariant}`,
                              letterSpacing: "0.02em",
                            }}
                          >
                            {dateKey !== "unknown"
                              ? new Date(dateKey + "T00:00:00").toLocaleDateString("ja-JP", {
                                  month: "long",
                                  day: "numeric",
                                  weekday: "short",
                                })
                              : "日付不明"
                            }
                            {" "}入荷
                            <span style={{ fontWeight: 400, marginLeft: 8, fontSize: 12 }}>
                              {dateArrivals.length}件
                            </span>
                          </td>
                        </tr>
                        {dateArrivals.map((arrival) => {
                      const totalAssigned = getTotalForArrival(arrival.id)
                      const disposalQty = getDisposalQty(arrival.id)
                      const stockLimit = arrival.remaining_quantity ?? Number(arrival.quantity)
                      const remaining = stockLimit - totalAssigned - disposalQty
                      const isOver = remaining < 0
                      const currentPrice = getPrice(arrival.id)
                      const originalPrice = Number(arrival.wholesale_price || 0)
                      const priceChanged = currentPrice !== originalPrice
                      const isLocked = lockedRows.has(arrival.id)
                      const isSoldOut = (arrival.remaining_quantity ?? 0) <= 0
                      return (
                      <tr
                        key={arrival.id}
                        style={{
                          backgroundColor: isSoldOut ? md3.surfaceContainerHighest : isLocked ? md3.surfaceContainerHigh : isOver ? md3.errorContainer + "30" : undefined,
                          opacity: isSoldOut ? 0.45 : isLocked ? 0.6 : 1,
                          transition: "all 200ms ease",
                        }}
                        onDoubleClick={() => { if (isLocked) unlockRow(arrival.id) }}
                      >
                        <td
                          style={{
                            padding: "8px 16px",
                            fontWeight: 500,
                            color: isOver ? md3.error : md3.onSurface,
                            borderBottom: `1px solid ${isOver ? md3.error : md3.outlineVariant}`,
                            position: "sticky",
                            left: 0,
                            backgroundColor: isSoldOut ? md3.surfaceContainerHighest : isLocked ? md3.surfaceContainerHigh : isOver ? md3.errorContainer : md3.surface,
                            cursor: isLocked ? "pointer" : undefined,
                          }}
                          onDoubleClick={() => { if (isLocked) unlockRow(arrival.id) }}
                        >
                          {/* 行1: 花名 + 品種 + 色 */}
                          <div style={{ fontSize: 15, lineHeight: 1.3, whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 6 }}>
                            {isLocked && <Check size={16} color={md3.primary} />}
                            <span style={{ fontWeight: 700 }}>{arrival.item_name || "花"}</span>
                            {arrival.item_variety && (
                              <span style={{ fontWeight: 400, fontSize: 12, color: md3.onSurfaceVariant }}>{arrival.item_variety}</span>
                            )}
                            {arrival.color && (
                              <span style={{ fontSize: 11, fontWeight: 400, color: md3.onSurfaceVariant }}>{arrival.color}</span>
                            )}
                            {isLocked && <span style={{ fontSize: 11, color: md3.onSurfaceVariant, fontWeight: 400 }}>ダブルクリックで解除</span>}
                          </div>

                          {/* 行2: 仕入先 + 等級/階級/長さ/輪数 */}
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3, fontSize: 12, color: md3.onSurfaceVariant, whiteSpace: "nowrap", fontWeight: 400 }}>
                            {arrival.supplier_name && (
                              <span>{arrival.supplier_name}</span>
                            )}
                            {arrival.grade && <span>{arrival.grade}</span>}
                            {arrival.grade_class && <span>{arrival.grade_class}</span>}
                            {arrival.stem_length && <span>{arrival.stem_length}cm</span>}
                            {arrival.bloom_count && <span>{arrival.bloom_count}輪</span>}
                            <span style={{ color: md3.outline }}>×{arrival.quantity}本</span>
                          </div>

                          {/* 行3: 倉庫在庫 + 単価 */}
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6, whiteSpace: "nowrap" }}>
                            <span style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                              padding: "3px 8px",
                              borderRadius: 6,
                              fontWeight: 700,
                              fontSize: 14,
                              backgroundColor: remaining <= 0 ? md3.errorContainer : remaining <= 5 ? md3.tertiaryContainer : md3.secondaryContainer,
                              color: remaining <= 0 ? md3.error : remaining <= 5 ? md3.onTertiaryContainer : md3.onSecondaryContainer,
                            }}>
                              在庫 {remaining}
                            </span>
                            {editingPriceId === arrival.id ? (
                              <span style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 2,
                                padding: "2px 6px",
                                borderRadius: 6,
                                border: `2px solid #e67e22`,
                              }}>
                                <span style={{ color: "#e67e22", fontWeight: 600, fontSize: 13 }}>¥</span>
                                <input
                                  ref={(el) => { if (el) priceInputRefs.current.set(arrival.id, el) }}
                                  type="text"
                                  value={currentPrice || ""}
                                  onChange={(e) => {
                                    const normalized = toHalfWidth(e.target.value)
                                    const v = parseInt(normalized, 10)
                                    if (!isNaN(v)) setPrice(arrival.id, v)
                                    else if (normalized === "") setPrice(arrival.id, 0)
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      e.preventDefault()
                                      e.stopPropagation()
                                      const newPrice = getPrice(arrival.id)
                                      setEditingPriceId(null)
                                      // 同じ値段なら履歴に保存しない
                                      const lastHist = priceHistoryMap.get(arrival.item_id)?.[0]
                                      const prevPrice = lastHist ? lastHist.new_price : originalPrice
                                      if (newPrice !== prevPrice) {
                                        transfersApi.createPriceChange({
                                          item_id: arrival.item_id,
                                          old_price: originalPrice,
                                          new_price: newPrice,
                                        }).then((res: unknown) => {
                                          const r = res as { id: number; new_price: number; changed_at: string }
                                          setPriceHistoryMap((prev) => {
                                            const next = new Map(prev)
                                            const existing = next.get(arrival.item_id) || []
                                            next.set(arrival.item_id, [r, ...existing])
                                            return next
                                          })
                                        }).catch(() => {})
                                        setConfirmedPriceId(arrival.id)
                                        setTimeout(() => setConfirmedPriceId(null), 1500)
                                      }
                                    } else if (e.key === "Escape") {
                                      setEditingPriceId(null)
                                    }
                                  }}
                                  onBlur={() => setEditingPriceId(null)}
                                  autoFocus
                                  style={{
                                    width: 64,
                                    border: "none",
                                    background: "transparent",
                                    fontSize: 16,
                                    fontWeight: 700,
                                    color: "#e67e22",
                                    textAlign: "right",
                                    outline: "none",
                                    padding: "2px 0",
                                  }}
                                />
                              </span>
                            ) : (
                              <span
                                onClick={() => {
                                  setEditingPriceId(arrival.id)
                                  setTimeout(() => {
                                    const ref = priceInputRefs.current.get(arrival.id)
                                    if (ref) { ref.focus(); ref.select() }
                                  }, 50)
                                }}
                                style={{
                                  cursor: "pointer",
                                  fontSize: 14,
                                  fontWeight: 600,
                                  color: confirmedPriceId === arrival.id ? "#27ae60" : "#e67e22",
                                  transition: "color 0.4s",
                                }}
                              >
                                @¥{currentPrice.toLocaleString()}
                              </span>
                            )}
                          </div>
                          {/* 単価変更履歴（常時表示・横フロー、元値→変更履歴→最新） */}
                          {(priceHistoryMap.get(arrival.item_id)?.length ?? 0) > 0 && (() => {
                            const hist = priceHistoryMap.get(arrival.item_id)!.slice(0, 6).slice().reverse()
                            // 元値（仕入値）が履歴の最古と異なる場合、先頭に追加
                            const oldestInHist = hist[0]?.new_price
                            const showOriginal = originalPrice > 0 && oldestInHist !== originalPrice
                            return (
                              <div style={{ marginTop: 3, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 3, fontSize: 11, color: md3.onSurfaceVariant }}>
                                {showOriginal && (() => {
                                  const arrivedDt = arrival.arrived_at ? new Date(arrival.arrived_at).toLocaleString("ja-JP", { month: "short", day: "numeric" }) + " 入荷時" : "入荷時"
                                  return (
                                    <>
                                      <span
                                        style={{ color: md3.outline, fontWeight: 400, textDecoration: "line-through", position: "relative", cursor: "help" }}
                                        onMouseEnter={(ev) => {
                                          const el = ev.currentTarget
                                          const tip = document.createElement("div")
                                          tip.className = "_price-tip"
                                          tip.textContent = arrivedDt
                                          Object.assign(tip.style, {
                                            position: "absolute", left: "0", bottom: "100%",
                                            marginBottom: "4px", padding: "3px 8px",
                                            background: md3.inverseSurface, color: md3.inverseOnSurface,
                                            borderRadius: "6px", fontSize: "10px", whiteSpace: "nowrap",
                                            zIndex: "100", pointerEvents: "none",
                                          })
                                          el.appendChild(tip)
                                        }}
                                        onMouseLeave={(ev) => { ev.currentTarget.querySelector("._price-tip")?.remove() }}
                                      >
                                        ¥{Math.round(originalPrice).toLocaleString()}
                                      </span>
                                      <span style={{ color: md3.outline }}>→</span>
                                    </>
                                  )
                                })()}
                                {hist.map((h, i) => {
                                  const isLatest = i === hist.length - 1
                                  const dt = h.changed_at ? new Date(h.changed_at).toLocaleString("ja-JP", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : ""
                                  return (
                                    <Fragment key={h.id}>
                                      {i > 0 && <span style={{ color: md3.outline }}>→</span>}
                                      <span
                                        style={{
                                          color: isLatest ? md3.onSurface : md3.outline,
                                          fontWeight: isLatest ? 600 : 400,
                                          textDecoration: isLatest ? "none" : "line-through",
                                          position: "relative",
                                          cursor: isLatest ? undefined : "help",
                                        }}
                                        {...(!isLatest && dt ? {
                                          onMouseEnter: (ev: React.MouseEvent<HTMLSpanElement>) => {
                                            const el = ev.currentTarget
                                            const tip = document.createElement("div")
                                            tip.className = "_price-tip"
                                            tip.textContent = dt
                                            Object.assign(tip.style, {
                                              position: "absolute", left: "0", bottom: "100%",
                                              marginBottom: "4px", padding: "3px 8px",
                                              background: md3.inverseSurface, color: md3.inverseOnSurface,
                                              borderRadius: "6px", fontSize: "10px", whiteSpace: "nowrap",
                                              zIndex: "100", pointerEvents: "none",
                                            })
                                            el.appendChild(tip)
                                          },
                                          onMouseLeave: (ev: React.MouseEvent<HTMLSpanElement>) => {
                                            ev.currentTarget.querySelector("._price-tip")?.remove()
                                          },
                                        } : {})}
                                      >
                                        ¥{Math.round(h.new_price).toLocaleString()}
                                      </span>
                                    </Fragment>
                                  )
                                })}
                              </div>
                            )
                          })()}

                          {/* 行3: 持出時の計算式（入力がある場合のみ） */}
                          {(totalAssigned + disposalQty) > 0 && (
                            <div style={{ marginTop: 4, fontSize: 12, color: md3.onSurfaceVariant, whiteSpace: "nowrap" }}>
                              {stockLimit} − {totalAssigned}{disposalQty > 0 ? ` − 廃棄${disposalQty}` : ""} = {remaining}
                              <span style={{ marginLeft: 8, color: md3.primary, fontWeight: 600 }}>
                                ¥{(totalAssigned * currentPrice).toLocaleString()}
                              </span>
                            </div>
                          )}
                          {isOver && (
                            <div style={{ fontSize: 13, fontWeight: 700, color: md3.error, marginTop: 3 }}>
                              {totalAssigned + disposalQty - stockLimit}本 超過
                            </div>
                          )}
                        </td>
                        {stores.map((store) => {
                          const qty = getQuantity(arrival.id, store.id)
                          const isActive = activeArrival === arrival.id && activeStore === store.id
                          return (
                            <td
                              key={store.id}
                              onClick={() => { if (!isLocked && !isSoldOut) handleCellClick(arrival.id, store.id) }}
                              style={{
                                padding: 4,
                                textAlign: "center",
                                borderBottom: `1px solid ${md3.outlineVariant}`,
                                cursor: isLocked || isSoldOut ? "default" : "pointer",
                              }}
                            >
                              <input
                                ref={(el) => {
                                  if (el) cellRefs.current.set(cellKey(arrival.id, store.id), el)
                                }}
                                type="text"
                                value={qty || ""}
                                readOnly={isLocked || isSoldOut}
                                tabIndex={isLocked || isSoldOut ? -1 : 0}
                                onChange={(e) => { if (!isLocked && !isSoldOut) handleManualInput(arrival.id, store.id, e.target.value) }}
                                onKeyDown={(e) => handleKeyDown(e, arrival.id, store.id)}
                                onFocus={(e) => {
                                  if (isLocked || isSoldOut) { e.target.blur(); return }
                                  handleCellClick(arrival.id, store.id)
                                  const val = e.target.value
                                  e.target.value = ""
                                  e.target.value = val
                                }}
                                style={{
                                  width: "100%",
                                  padding: "10px 4px",
                                  textAlign: "center",
                                  border: isActive ? `2px solid ${md3.primary}` : `1px solid ${md3.outlineVariant}`,
                                  borderRadius: 8,
                                  backgroundColor: isActive ? md3.primaryContainer : qty > 0 ? md3.secondaryContainer : "transparent",
                                  color: isActive ? md3.onPrimaryContainer : md3.onSurface,
                                  fontSize: 18,
                                  fontWeight: qty > 0 ? 700 : 400,
                                  outline: "none",
                                }}
                                placeholder="-"
                              />
                            </td>
                          )
                        })}
                        {/* 廃棄/ロス セル */}
                        <td
                          style={{
                            padding: 4,
                            textAlign: "center",
                            borderBottom: `1px solid ${md3.outlineVariant}`,
                            backgroundColor: disposalQty > 0 ? md3.errorContainer + "30" : undefined,
                          }}
                        >
                          {isSoldOut ? null : (
                            <input
                              type="text"
                              value={disposalQty || ""}
                              readOnly={isLocked}
                              tabIndex={isLocked ? -1 : 0}
                              onChange={(e) => {
                                if (isLocked) return
                                const normalized = toHalfWidth(e.target.value)
                                const num = parseInt(normalized, 10)
                                if (!isNaN(num)) setDisposalQty(arrival.id, num)
                                else if (normalized === "") setDisposalQty(arrival.id, 0)
                              }}
                              onBlur={() => {
                                // 数量が入っていて理由が未選択なら理由ダイアログ表示
                                const d = disposalData.get(arrival.id)
                                if (d && d.quantity > 0 && !d.reason) {
                                  setReasonDialog({ arrivalId: arrival.id, tempQty: d.quantity })
                                }
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  const d = disposalData.get(arrival.id)
                                  if (d && d.quantity > 0 && !d.reason) {
                                    setReasonDialog({ arrivalId: arrival.id, tempQty: d.quantity })
                                  }
                                }
                              }}
                              style={{
                                width: "100%",
                                padding: "10px 4px",
                                textAlign: "center",
                                border: `1px solid ${md3.outlineVariant}`,
                                borderRadius: 8,
                                backgroundColor: disposalQty > 0 ? md3.errorContainer : "transparent",
                                color: disposalQty > 0 ? md3.error : md3.onSurface,
                                fontSize: 18,
                                fontWeight: disposalQty > 0 ? 700 : 400,
                                outline: "none",
                              }}
                              placeholder="-"
                            />
                          )}
                          {disposalQty > 0 && disposalData.get(arrival.id)?.reason && (
                            <div style={{ fontSize: 10, color: md3.error, marginTop: 2 }}>
                              {disposalReasons.find((r) => r.value === disposalData.get(arrival.id)?.reason)?.label}
                            </div>
                          )}
                        </td>
                        {/* 計 セル */}
                        <td
                          style={{
                            padding: "10px 6px",
                            textAlign: "center",
                            fontWeight: 700,
                            color: isOver ? md3.error : (totalAssigned + disposalQty) > 0 ? md3.primary : md3.onSurfaceVariant,
                            borderBottom: `1px solid ${isOver ? md3.error : md3.outlineVariant}`,
                            backgroundColor: md3.surfaceContainerHighest,
                            fontSize: 18,
                            minWidth: 70,
                          }}
                        >
                          {isLocked ? (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                              <Check size={16} />
                              {totalAssigned + disposalQty}
                            </span>
                          ) : (
                            (totalAssigned + disposalQty) || "-"
                          )}
                        </td>
                      </tr>
                      )
                        })}
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              )}
            </MD3CardContent>
          </MD3Card>
        </div>

        {hasAnyEntry && (
          <MD3Card variant="filled" hoverable={false} style={{ padding: "20px 24px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 20, alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 12, color: md3.onSurfaceVariant, marginBottom: 4 }}>持出合計</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: md3.primary }}>
                  {visibleArrivals.reduce((sum, a) => sum + getTotalForArrival(a.id), 0)}
                  <span style={{ fontSize: 14, fontWeight: 500, marginLeft: 2 }}>本</span>
                  {visibleArrivals.reduce((sum, a) => sum + getDisposalQty(a.id), 0) > 0 && (
                    <span style={{ fontSize: 13, fontWeight: 500, color: md3.error, marginLeft: 8 }}>
                      +廃棄{visibleArrivals.reduce((sum, a) => sum + getDisposalQty(a.id), 0)}
                    </span>
                  )}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: md3.onSurfaceVariant, marginBottom: 4 }}>金額合計</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: md3.primary }}>
                  ¥{visibleArrivals.reduce((sum, a) => sum + getTotalForArrival(a.id) * getPrice(a.id), 0).toLocaleString()}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: md3.onSurfaceVariant, marginBottom: 4 }}>店舗数</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: md3.onSurface }}>
                  {new Set(visibleArrivals.flatMap((a) => {
                    const entry = entryData.get(a.id)
                    return entry ? Object.entries(entry).filter(([, q]) => q > 0).map(([s]) => s) : []
                  })).size}
                  <span style={{ fontSize: 14, fontWeight: 500, marginLeft: 2 }}>店</span>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <MD3Button variant="filled" icon={<Save size={18} />} onClick={handleSaveAll} disabled={saving || hasOverflow}>
                  {saving ? "保存中..." : hasOverflow ? "数量超過あり" : "全て保存"}
                </MD3Button>
                <MD3Button variant="outlined" icon={<Trash2 size={18} />} onClick={handleClearAll}>
                  クリア
                </MD3Button>
              </div>
            </div>
          </MD3Card>
        )}
        {!hasAnyEntry && (
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <MD3Button variant="filled" icon={<Save size={18} />} onClick={handleSaveAll} disabled={true}>
              全て保存
            </MD3Button>
          </div>
        )}
      </>
      )}
      </div>

      {/* 廃棄/ロス理由選択ダイアログ */}
      {reasonDialog && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setReasonDialog(null)}
        >
          <div
            style={{
              backgroundColor: md3.surfaceContainerHigh,
              borderRadius: 16,
              padding: 24,
              minWidth: 320,
              boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: 18, fontWeight: 700, color: md3.onSurface, marginBottom: 8 }}>
              廃棄・ロスの理由
            </div>
            <div style={{ fontSize: 13, color: md3.onSurfaceVariant, marginBottom: 20 }}>
              {arrivals.find((a) => a.id === reasonDialog.arrivalId)?.item_name} × {reasonDialog.tempQty}本
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {disposalReasons.map((r) => (
                <button
                  key={r.value}
                  onClick={() => {
                    setDisposalData((prev) => {
                      const next = new Map(prev)
                      const existing = next.get(reasonDialog.arrivalId)
                      if (existing) {
                        next.set(reasonDialog.arrivalId, { ...existing, reason: r.value })
                      }
                      return next
                    })
                    setReasonDialog(null)
                  }}
                  style={{
                    padding: "12px 20px",
                    borderRadius: 12,
                    border: `1px solid ${md3.outlineVariant}`,
                    backgroundColor: md3.surface,
                    color: md3.onSurface,
                    fontSize: 15,
                    fontWeight: 500,
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 150ms ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = md3.secondaryContainer
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = md3.surface
                  }}
                >
                  {r.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => {
                // キャンセル→数量もクリア
                setDisposalQty(reasonDialog.arrivalId, 0)
                setReasonDialog(null)
              }}
              style={{
                marginTop: 12,
                padding: "8px 16px",
                border: "none",
                backgroundColor: "transparent",
                color: md3.onSurfaceVariant,
                fontSize: 13,
                cursor: "pointer",
                width: "100%",
                textAlign: "center",
              }}
            >
              キャンセル
            </button>
          </div>
        </div>
      )}
    </MD3AppLayout>
  )
}
