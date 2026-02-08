"use client"

import { useEffect, useMemo, useState } from "react"
import MD3AppLayout from "@/components/layout/MD3AppLayout"
import { MD3Card, MD3CardContent, MD3CardHeader, MD3CardTitle } from "@/components/md3/MD3Card"
import { MD3StatusBadge } from "@/components/md3/MD3Badge"
import { MD3Button } from "@/components/md3/MD3Button"
import { MD3QuantityStepper } from "@/components/md3/MD3QuantityStepper"
import {
  MD3Table,
  MD3TableHead,
  MD3TableBody,
  MD3TableRow,
  MD3TableHeaderCell,
  MD3TableCell,
} from "@/components/md3/MD3Table"
import { md3 } from "@/lib/md3-theme"
import { AlertTriangle, Boxes, Send, History } from "lucide-react"
import { suppliesApi, storesApi, Supply, SupplyTransfer, Store } from "@/lib/api"

// 資材カード用のState
interface SupplyCardState {
  selectedStore: number | null
  quantity: number
  date: string
}

export default function SupplyTransfersPage() {
  const [supplies, setSupplies] = useState<Supply[]>([])
  const [stores, setStores] = useState<Store[]>([])
  const [transfers, setTransfers] = useState<SupplyTransfer[]>([])
  const [cardStates, setCardStates] = useState<Record<number, SupplyCardState>>({})
  const [submittingId, setSubmittingId] = useState<number | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const today = new Date().toISOString().split("T")[0]

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

  const getCardState = (supplyId: number): SupplyCardState => {
    return cardStates[supplyId] || { selectedStore: null, quantity: 1, date: today }
  }

  const updateCardState = (supplyId: number, updates: Partial<SupplyCardState>) => {
    setCardStates((prev) => ({
      ...prev,
      [supplyId]: { ...getCardState(supplyId), ...updates },
    }))
  }

  const handleStoreClick = (supplyId: number, storeId: number) => {
    const current = getCardState(supplyId)
    if (current.selectedStore === storeId) {
      updateCardState(supplyId, { selectedStore: null })
    } else {
      updateCardState(supplyId, { selectedStore: storeId, quantity: 1 })
    }
  }

  const handleConfirm = async (supply: Supply) => {
    const state = getCardState(supply.id)
    if (!state.selectedStore || state.quantity <= 0) return

    // 在庫チェック（フロントエンド側）
    const currentStock = supply.stock_quantity || 0
    if (state.quantity > currentStock) {
      setErrorMessage(`在庫不足: ${supply.name}の在庫は${currentStock}個です`)
      setTimeout(() => setErrorMessage(null), 4000)
      return
    }

    setSubmittingId(supply.id)
    setErrorMessage(null)
    try {
      await suppliesApi.createTransfer({
        store_id: state.selectedStore,
        supply_id: supply.id,
        quantity: state.quantity,
        unit_price: supply.unit_price || 0,
        transferred_at: state.date,
      })
      const [transferData, suppliesData] = await Promise.all([
        suppliesApi.getTransfers(),
        suppliesApi.getAll(),
      ])
      setTransfers(transferData)
      setSupplies(suppliesData)
      updateCardState(supply.id, { selectedStore: null, quantity: 1 })
    } catch (error) {
      const msg = error instanceof Error ? error.message : "エラーが発生しました"
      setErrorMessage(msg)
      setTimeout(() => setErrorMessage(null), 4000)
    } finally {
      setSubmittingId(null)
    }
  }

  // 最近の持ち出し（資材別）
  const recentBySupply = useMemo(() => {
    const map = new Map<number, SupplyTransfer[]>()
    transfers.forEach((t) => {
      const list = map.get(t.supply_id) || []
      list.push(t)
      map.set(t.supply_id, list)
    })
    return map
  }, [transfers])

  return (
    <MD3AppLayout title="資材持ち出し" subtitle="店舗への資材持ち出し登録">
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24 }}>
        {/* 左: 資材カードリスト */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* エラーメッセージ */}
          {errorMessage && (
            <div
              style={{
                padding: "12px 20px",
                backgroundColor: md3.errorContainer,
                color: md3.onErrorContainer,
                borderRadius: 12,
                fontSize: 14,
                fontWeight: 500,
                fontFamily: "'Zen Maru Gothic', sans-serif",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <AlertTriangle size={18} />
              {errorMessage}
            </div>
          )}

          {supplies.filter((s) => s.is_active).map((supply) => {
            const state = getCardState(supply.id)
            const recentTransfers = recentBySupply.get(supply.id)?.slice(0, 3) || []
            const isSubmitting = submittingId === supply.id
            const currentStock = supply.stock_quantity || 0

            return (
              <div
                key={supply.id}
                style={{
                  backgroundColor: md3.surface,
                  borderRadius: 16,
                  border: `1px solid ${state.selectedStore ? md3.primary : md3.outlineVariant}`,
                  overflow: "hidden",
                  transition: "all 200ms ease",
                }}
              >
                {/* ヘッダー: 資材情報 + 在庫数 */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "16px 20px",
                    backgroundColor: state.selectedStore ? md3.primaryContainer : md3.surfaceContainerLow,
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div
                        style={{
                          fontSize: 17,
                          fontWeight: 600,
                          color: state.selectedStore ? md3.onPrimaryContainer : md3.onSurface,
                          fontFamily: "'Zen Maru Gothic', sans-serif",
                        }}
                      >
                        {supply.name}
                      </div>
                      {/* 現在庫バッジ */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          padding: "4px 12px",
                          borderRadius: 16,
                          backgroundColor: currentStock > 0 ? md3.tertiaryContainer : md3.errorContainer,
                          color: currentStock > 0 ? md3.onTertiaryContainer : md3.onErrorContainer,
                          fontSize: 14,
                          fontWeight: 600,
                          fontFamily: "'Zen Maru Gothic', sans-serif",
                        }}
                      >
                        在庫: {currentStock}
                      </div>
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        color: state.selectedStore ? md3.onPrimaryContainer : md3.onSurfaceVariant,
                        fontFamily: "'Zen Maru Gothic', sans-serif",
                        marginTop: 4,
                      }}
                    >
                      {supply.specification && `${supply.specification} · `}
                      <span style={{ fontWeight: 500 }}>¥{(supply.unit_price || 0).toLocaleString()}</span>
                    </div>
                  </div>

                  {/* 持ち出し日 */}
                  <input
                    type="date"
                    value={state.date}
                    onChange={(e) => updateCardState(supply.id, { date: e.target.value })}
                    style={{
                      padding: "8px 12px",
                      borderRadius: 8,
                      border: `1px solid ${md3.outlineVariant}`,
                      backgroundColor: md3.surface,
                      fontSize: 14,
                      fontFamily: "'Zen Maru Gothic', sans-serif",
                      color: md3.onSurface,
                    }}
                  />
                </div>

                {/* 店舗ボタン */}
                <div style={{ padding: "12px 20px", display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {stores.map((store) => {
                    const isSelected = state.selectedStore === store.id
                    return (
                      <button
                        key={store.id}
                        onClick={() => handleStoreClick(supply.id, store.id)}
                        style={{
                          padding: "8px 16px",
                          borderRadius: 20,
                          border: isSelected ? "none" : `1px solid ${md3.outlineVariant}`,
                          backgroundColor: isSelected ? md3.primary : md3.surface,
                          color: isSelected ? md3.onPrimary : md3.onSurface,
                          fontSize: 14,
                          fontWeight: isSelected ? 600 : 400,
                          fontFamily: "'Zen Maru Gothic', sans-serif",
                          cursor: "pointer",
                          transition: "all 150ms ease",
                        }}
                      >
                        {store.name}
                      </button>
                    )
                  })}
                </div>

                {/* 数量入力・確定（店舗選択時のみ表示） */}
                {state.selectedStore && (() => {
                  const isOverStock = state.quantity > currentStock
                  return (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "16px 20px",
                        backgroundColor: isOverStock ? md3.errorContainer : md3.primaryContainer,
                        borderTop: `1px solid ${isOverStock ? md3.error : md3.primary}`,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <span
                          style={{
                            fontSize: 14,
                            fontWeight: 500,
                            color: isOverStock ? md3.onErrorContainer : md3.onPrimaryContainer,
                            fontFamily: "'Zen Maru Gothic', sans-serif",
                          }}
                        >
                          {storeMap.get(state.selectedStore)?.name} へ
                        </span>
                        <MD3QuantityStepper
                          value={state.quantity}
                          onChange={(qty) => updateCardState(supply.id, { quantity: qty })}
                          min={1}
                          max={9999}
                          quickSteps={[10]}
                          size="small"
                        />
                        <span
                          style={{
                            fontSize: 16,
                            fontWeight: 600,
                            color: isOverStock ? md3.onErrorContainer : md3.onPrimaryContainer,
                            fontFamily: "'Zen Maru Gothic', sans-serif",
                          }}
                        >
                          ¥{((supply.unit_price || 0) * state.quantity).toLocaleString()}
                        </span>
                        {isOverStock && (
                          <span
                            style={{
                              fontSize: 13,
                              fontWeight: 600,
                              color: md3.error,
                              fontFamily: "'Zen Maru Gothic', sans-serif",
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            <AlertTriangle size={16} />
                            在庫不足（残{currentStock}個）
                          </span>
                        )}
                      </div>
                      <MD3Button
                        variant="filled"
                        onClick={() => handleConfirm(supply)}
                        disabled={isSubmitting || isOverStock}
                        icon={<Send size={16} />}
                      >
                        {isSubmitting ? "登録中..." : isOverStock ? "在庫不足" : "持ち出し確定"}
                      </MD3Button>
                    </div>
                  )
                })()}

                {/* 最近の履歴（小さく表示） */}
                {recentTransfers.length > 0 && (
                  <div
                    style={{
                      padding: "8px 20px 12px",
                      borderTop: `1px solid ${md3.outlineVariant}`,
                      display: "flex",
                      gap: 12,
                      flexWrap: "wrap",
                    }}
                  >
                    {recentTransfers.map((t) => (
                      <span
                        key={t.id}
                        style={{
                          fontSize: 12,
                          color: md3.onSurfaceVariant,
                          fontFamily: "'Zen Maru Gothic', sans-serif",
                        }}
                      >
                        {t.transferred_at.slice(5)} {storeMap.get(t.store_id)?.name} ×{t.quantity}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* 右: 集計・履歴パネル */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* 資材別 累計集計 */}
          <MD3Card variant="outlined">
            <MD3CardHeader>
              <MD3CardTitle style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Boxes size={20} color={md3.primary} />
                資材別 集計（累計）
              </MD3CardTitle>
            </MD3CardHeader>
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
                  {(() => {
                    const totals = new Map<number, { qty: number; amount: number }>()
                    transfers.forEach((t) => {
                      const current = totals.get(t.supply_id) || { qty: 0, amount: 0 }
                      current.qty += t.quantity
                      current.amount += Number(t.unit_price) * t.quantity
                      totals.set(t.supply_id, current)
                    })
                    const summary = Array.from(totals.entries()).map(([id, v]) => ({
                      id,
                      supply: supplyMap.get(id),
                      qty: v.qty,
                      amount: v.amount,
                    }))
                    if (summary.length === 0) {
                      return (
                        <MD3TableRow hoverable={false}>
                          <MD3TableCell colSpan={3}>
                            <div style={{ textAlign: "center", padding: "24px 16px", color: md3.onSurfaceVariant }}>
                              データなし
                            </div>
                          </MD3TableCell>
                        </MD3TableRow>
                      )
                    }
                    return summary.map((s) => (
                      <MD3TableRow key={s.id}>
                        <MD3TableCell highlight>{s.supply?.name || s.id}</MD3TableCell>
                        <MD3TableCell align="right">
                          <span style={{ fontWeight: 600, color: md3.primary }}>{s.qty.toLocaleString()}</span>
                        </MD3TableCell>
                        <MD3TableCell align="right">¥{s.amount.toLocaleString()}</MD3TableCell>
                      </MD3TableRow>
                    ))
                  })()}
                </MD3TableBody>
              </MD3Table>
            </MD3CardContent>
          </MD3Card>

          {/* 最近の持ち出し */}
          <MD3Card variant="outlined">
            <MD3CardHeader>
              <MD3CardTitle style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <History size={20} color={md3.primary} />
                最近の持ち出し
                <MD3StatusBadge status="neutral" label={`${transfers.length}件`} size="small" />
              </MD3CardTitle>
            </MD3CardHeader>
            <MD3CardContent style={{ padding: 0 }}>
              <MD3Table>
                <MD3TableHead>
                  <MD3TableRow hoverable={false}>
                    <MD3TableHeaderCell>日付</MD3TableHeaderCell>
                    <MD3TableHeaderCell>資材</MD3TableHeaderCell>
                    <MD3TableHeaderCell>店舗</MD3TableHeaderCell>
                    <MD3TableHeaderCell align="right">数量</MD3TableHeaderCell>
                  </MD3TableRow>
                </MD3TableHead>
                <MD3TableBody>
                  {transfers.length === 0 ? (
                    <MD3TableRow hoverable={false}>
                      <MD3TableCell colSpan={4}>
                        <div style={{ textAlign: "center", padding: "24px 16px", color: md3.onSurfaceVariant }}>
                          履歴なし
                        </div>
                      </MD3TableCell>
                    </MD3TableRow>
                  ) : (
                    transfers.slice(0, 20).map((t) => (
                      <MD3TableRow key={t.id}>
                        <MD3TableCell>
                          <span style={{ fontSize: 13 }}>{t.transferred_at.slice(5)}</span>
                        </MD3TableCell>
                        <MD3TableCell highlight>{supplyMap.get(t.supply_id)?.name || t.supply_id}</MD3TableCell>
                        <MD3TableCell>{storeMap.get(t.store_id)?.name || t.store_id}</MD3TableCell>
                        <MD3TableCell align="right">
                          <span style={{ fontWeight: 500 }}>{t.quantity}</span>
                        </MD3TableCell>
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
