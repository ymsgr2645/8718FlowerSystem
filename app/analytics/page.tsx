"use client"

import { useEffect, useState } from "react"
import MD3AppLayout from "@/components/layout/MD3AppLayout"
import { MD3Card, MD3CardHeader, MD3CardContent } from "@/components/md3/MD3Card"
import { MD3Select } from "@/components/md3/MD3Select"
import {
  MD3Table, MD3TableHead, MD3TableBody, MD3TableRow,
  MD3TableHeaderCell, MD3TableCell,
} from "@/components/md3/MD3Table"
import { md3 } from "@/lib/md3-theme"
import {
  analyticsApi, paymentsApi, storesApi,
  SupplierSummary, StoreSummary, DailyComparison, PaymentConfirmation, Store,
} from "@/lib/api"
import {
  BarChart3, TrendingUp, Building2, Truck, Receipt, ArrowUpRight, ArrowDownRight,
} from "lucide-react"

type Tab = "supplier" | "store" | "comparison" | "pl" | "payment"

const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: "supplier", label: "仕入先別", icon: <Truck size={16} /> },
  { key: "store", label: "店舗別", icon: <Building2 size={16} /> },
  { key: "comparison", label: "仕入・納品比較", icon: <BarChart3 size={16} /> },
  { key: "pl", label: "月間報告書", icon: <TrendingUp size={16} /> },
  { key: "payment", label: "入金確認", icon: <Receipt size={16} /> },
]

const expenseCategoryLabels: Record<string, string> = {
  jftd: "JFTD発注金", yupack: "ゆうパック送料", eneos: "エネオス",
  ntt: "NTT電話代", freight: "運賃", electric: "電気", water: "水道",
  gas: "ガス", common_fee: "共益費", other: "その他",
}

function formatYen(n: number): string {
  return `¥${Math.round(n).toLocaleString()}`
}

export default function AnalyticsPage() {
  const now = new Date()
  const [tab, setTab] = useState<Tab>("supplier")
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [stores, setStores] = useState<Store[]>([])
  const [plStoreId, setPlStoreId] = useState<string>("")

  // Data states
  const [suppliers, setSuppliers] = useState<SupplierSummary[]>([])
  const [supplierTotal, setSupplierTotal] = useState(0)
  const [storeSummary, setStoreSummary] = useState<StoreSummary[]>([])
  const [storeTotals, setStoreTotals] = useState({ delivery: 0, purchase: 0, margin: 0 })
  const [daily, setDaily] = useState<DailyComparison[]>([])
  const [compTotals, setCompTotals] = useState({ purchase: 0, delivery: 0, diff: 0 })
  const [periodTotals, setPeriodTotals] = useState<Record<string, { purchase: number; delivery: number }>>({})
  const [pl, setPl] = useState<{
    summary: Record<string, number>;
    expenses_by_category: Record<string, number>;
    store_breakdown: { store_id: number; store_name: string; revenue: number; quantity: number }[];
  } | null>(null)
  const [payments, setPayments] = useState<PaymentConfirmation[]>([])
  const [payTotals, setPayTotals] = useState({ billed: 0, paid: 0, diff: 0 })

  useEffect(() => {
    storesApi.getAll().then(setStores).catch(() => {})
  }, [])

  useEffect(() => {
    const load = async () => {
      try {
        if (tab === "supplier") {
          const data = await analyticsApi.getSupplierSummary(year, month)
          setSuppliers(data.suppliers)
          setSupplierTotal(data.grand_total)
        } else if (tab === "store") {
          const data = await analyticsApi.getStoreSummary(year, month)
          setStoreSummary(data.stores)
          setStoreTotals({ delivery: data.total_delivery, purchase: data.total_purchase, margin: data.total_margin })
        } else if (tab === "comparison") {
          const data = await analyticsApi.getPurchaseDeliveryComparison(year, month)
          setDaily(data.daily)
          setCompTotals({ purchase: data.total_purchase, delivery: data.total_delivery, diff: data.total_difference })
          setPeriodTotals(data.period_totals)
        } else if (tab === "pl") {
          const sid = plStoreId ? Number(plStoreId) : undefined
          const data = await analyticsApi.getMonthlyPL(year, month, sid)
          setPl({ summary: data.summary as unknown as Record<string, number>, expenses_by_category: data.expenses_by_category, store_breakdown: data.store_breakdown })
        } else if (tab === "payment") {
          const data = await paymentsApi.getConfirmation(year, month)
          setPayments(data.items)
          setPayTotals({ billed: data.total_billed, paid: data.total_paid, diff: data.total_difference })
        }
      } catch (e) {
        // silently handle - data may be empty
      }
    }
    load()
  }, [tab, year, month, plStoreId])

  const yearOptions = Array.from({ length: 5 }, (_, i) => {
    const y = now.getFullYear() - 2 + i
    return { value: String(y), label: `${y}年` }
  })
  const monthOptions = Array.from({ length: 12 }, (_, i) => ({
    value: String(i + 1), label: `${i + 1}月`,
  }))

  return (
    <MD3AppLayout title="分析・レポート" subtitle="仕入先別集計、店舗別集計、月間報告書">
      <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 4, background: md3.surfaceContainerLow, borderRadius: 12, padding: 4 }}>
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer",
                background: tab === t.key ? md3.primaryContainer : "transparent",
                color: tab === t.key ? md3.onPrimaryContainer : md3.onSurfaceVariant,
                fontWeight: tab === t.key ? 600 : 400, fontSize: 14, transition: "all 0.2s",
              }}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
          <MD3Select label="年" value={String(year)} onChange={(e) => setYear(Number(e.target.value))} options={yearOptions} />
          <MD3Select label="月" value={String(month)} onChange={(e) => setMonth(Number(e.target.value))} options={monthOptions} />
        </div>
      </div>

      {tab === "supplier" && (
        <MD3Card>
          <MD3CardHeader title="仕入先別 仕入金額" subtitle={`${year}年${month}月`} icon={<Truck size={20} />} />
          <MD3CardContent>
            <MD3Table>
              <MD3TableHead>
                <MD3TableRow>
                  <MD3TableHeaderCell>仕入先</MD3TableHeaderCell>
                  <MD3TableHeaderCell align="right">入荷回数</MD3TableHeaderCell>
                  <MD3TableHeaderCell align="right">数量</MD3TableHeaderCell>
                  <MD3TableHeaderCell align="right">仕入金額</MD3TableHeaderCell>
                </MD3TableRow>
              </MD3TableHead>
              <MD3TableBody>
                {suppliers.filter(s => s.arrival_count > 0).length === 0 ? (
                  <MD3TableRow><MD3TableCell colSpan={4}>データなし</MD3TableCell></MD3TableRow>
                ) : (
                  suppliers.filter(s => s.arrival_count > 0).map(s => (
                    <MD3TableRow key={s.supplier_id}>
                      <MD3TableCell>{s.supplier_name}</MD3TableCell>
                      <MD3TableCell align="right">{s.arrival_count}回</MD3TableCell>
                      <MD3TableCell align="right">{s.total_quantity.toLocaleString()}</MD3TableCell>
                      <MD3TableCell align="right" style={{ fontWeight: 600 }}>{formatYen(s.total_amount)}</MD3TableCell>
                    </MD3TableRow>
                  ))
                )}
                {suppliers.filter(s => s.arrival_count > 0).length > 0 && (
                  <MD3TableRow>
                    <MD3TableCell style={{ fontWeight: 700 }}>合計</MD3TableCell>
                    <MD3TableCell />
                    <MD3TableCell />
                    <MD3TableCell align="right" style={{ fontWeight: 700, color: md3.primary }}>{formatYen(supplierTotal)}</MD3TableCell>
                  </MD3TableRow>
                )}
              </MD3TableBody>
            </MD3Table>
          </MD3CardContent>
        </MD3Card>
      )}

      {tab === "store" && (
        <MD3Card>
          <MD3CardHeader title="店舗別 納品集計" subtitle={`${year}年${month}月`} icon={<Building2 size={20} />} />
          <MD3CardContent>
            <MD3Table>
              <MD3TableHead>
                <MD3TableRow>
                  <MD3TableHeaderCell>店舗</MD3TableHeaderCell>
                  <MD3TableHeaderCell>区分</MD3TableHeaderCell>
                  <MD3TableHeaderCell align="right">持出回数</MD3TableHeaderCell>
                  <MD3TableHeaderCell align="right">数量</MD3TableHeaderCell>
                  <MD3TableHeaderCell align="right">納品金額</MD3TableHeaderCell>
                  <MD3TableHeaderCell align="right">仕入金額</MD3TableHeaderCell>
                  <MD3TableHeaderCell align="right">差額</MD3TableHeaderCell>
                </MD3TableRow>
              </MD3TableHead>
              <MD3TableBody>
                {storeSummary.filter(s => s.transfer_count > 0).length === 0 ? (
                  <MD3TableRow><MD3TableCell colSpan={7}>データなし</MD3TableCell></MD3TableRow>
                ) : (
                  storeSummary.filter(s => s.transfer_count > 0).map(s => (
                    <MD3TableRow key={s.store_id}>
                      <MD3TableCell>{s.store_name}</MD3TableCell>
                      <MD3TableCell>
                        <span style={{
                          padding: "2px 8px", borderRadius: 6, fontSize: 12,
                          background: s.operation_type === "headquarters" ? md3.primaryContainer : md3.tertiaryContainer,
                          color: s.operation_type === "headquarters" ? md3.onPrimaryContainer : md3.onTertiaryContainer,
                        }}>
                          {s.operation_type === "headquarters" ? "直営" : "委託"}
                        </span>
                      </MD3TableCell>
                      <MD3TableCell align="right">{s.transfer_count}回</MD3TableCell>
                      <MD3TableCell align="right">{s.total_quantity.toLocaleString()}</MD3TableCell>
                      <MD3TableCell align="right">{formatYen(s.delivery_amount)}</MD3TableCell>
                      <MD3TableCell align="right">{formatYen(s.purchase_amount)}</MD3TableCell>
                      <MD3TableCell align="right" style={{ color: s.margin >= 0 ? md3.primary : md3.error, fontWeight: 600 }}>
                        {formatYen(s.margin)}
                      </MD3TableCell>
                    </MD3TableRow>
                  ))
                )}
                {storeSummary.filter(s => s.transfer_count > 0).length > 0 && (
                  <MD3TableRow>
                    <MD3TableCell style={{ fontWeight: 700 }}>合計</MD3TableCell>
                    <MD3TableCell /><MD3TableCell /><MD3TableCell />
                    <MD3TableCell align="right" style={{ fontWeight: 700 }}>{formatYen(storeTotals.delivery)}</MD3TableCell>
                    <MD3TableCell align="right" style={{ fontWeight: 700 }}>{formatYen(storeTotals.purchase)}</MD3TableCell>
                    <MD3TableCell align="right" style={{ fontWeight: 700, color: storeTotals.margin >= 0 ? md3.primary : md3.error }}>
                      {formatYen(storeTotals.margin)}
                    </MD3TableCell>
                  </MD3TableRow>
                )}
              </MD3TableBody>
            </MD3Table>
          </MD3CardContent>
        </MD3Card>
      )}

      {tab === "comparison" && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
            {(["1-10", "11-20", "21-end"] as const).map(period => {
              const pt = periodTotals[period] || { purchase: 0, delivery: 0 }
              const label = period === "1-10" ? "1〜10日" : period === "11-20" ? "11〜20日" : "21〜末日"
              return (
                <MD3Card key={period}>
                  <MD3CardContent>
                    <div style={{ fontSize: 13, color: md3.onSurfaceVariant, marginBottom: 8 }}>{label}</div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <div>
                        <div style={{ fontSize: 11, color: md3.onSurfaceVariant }}>仕入</div>
                        <div style={{ fontWeight: 600 }}>{formatYen(pt.purchase)}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: md3.onSurfaceVariant }}>納品</div>
                        <div style={{ fontWeight: 600 }}>{formatYen(pt.delivery)}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: md3.onSurfaceVariant }}>差額</div>
                        <div style={{ fontWeight: 600, color: pt.delivery - pt.purchase >= 0 ? md3.primary : md3.error }}>
                          {formatYen(pt.delivery - pt.purchase)}
                        </div>
                      </div>
                    </div>
                  </MD3CardContent>
                </MD3Card>
              )
            })}
          </div>
          <MD3Card>
            <MD3CardHeader title="仕入・納品 日別比較" subtitle={`${year}年${month}月`} icon={<BarChart3 size={20} />} />
            <MD3CardContent>
              <MD3Table>
                <MD3TableHead>
                  <MD3TableRow>
                    <MD3TableHeaderCell>日付</MD3TableHeaderCell>
                    <MD3TableHeaderCell align="right">仕入金額</MD3TableHeaderCell>
                    <MD3TableHeaderCell align="right">仕入数量</MD3TableHeaderCell>
                    <MD3TableHeaderCell align="right">納品金額</MD3TableHeaderCell>
                    <MD3TableHeaderCell align="right">納品数量</MD3TableHeaderCell>
                    <MD3TableHeaderCell align="right">差額</MD3TableHeaderCell>
                  </MD3TableRow>
                </MD3TableHead>
                <MD3TableBody>
                  {daily.length === 0 ? (
                    <MD3TableRow><MD3TableCell colSpan={6}>データなし</MD3TableCell></MD3TableRow>
                  ) : (
                    daily.map(d => (
                      <MD3TableRow key={d.date}>
                        <MD3TableCell>{d.date}</MD3TableCell>
                        <MD3TableCell align="right">{formatYen(d.purchase_amount)}</MD3TableCell>
                        <MD3TableCell align="right">{d.purchase_quantity.toLocaleString()}</MD3TableCell>
                        <MD3TableCell align="right">{formatYen(d.delivery_amount)}</MD3TableCell>
                        <MD3TableCell align="right">{d.delivery_quantity.toLocaleString()}</MD3TableCell>
                        <MD3TableCell align="right" style={{
                          fontWeight: 600,
                          color: d.difference >= 0 ? md3.primary : md3.error,
                        }}>
                          {d.difference >= 0 ? <ArrowUpRight size={14} style={{ display: "inline" }} /> : <ArrowDownRight size={14} style={{ display: "inline" }} />}
                          {formatYen(Math.abs(d.difference))}
                        </MD3TableCell>
                      </MD3TableRow>
                    ))
                  )}
                  {daily.length > 0 && (
                    <MD3TableRow>
                      <MD3TableCell style={{ fontWeight: 700 }}>月合計</MD3TableCell>
                      <MD3TableCell align="right" style={{ fontWeight: 700 }}>{formatYen(compTotals.purchase)}</MD3TableCell>
                      <MD3TableCell />
                      <MD3TableCell align="right" style={{ fontWeight: 700 }}>{formatYen(compTotals.delivery)}</MD3TableCell>
                      <MD3TableCell />
                      <MD3TableCell align="right" style={{ fontWeight: 700, color: compTotals.diff >= 0 ? md3.primary : md3.error }}>
                        {formatYen(compTotals.diff)}
                      </MD3TableCell>
                    </MD3TableRow>
                  )}
                </MD3TableBody>
              </MD3Table>
            </MD3CardContent>
          </MD3Card>
        </>
      )}

      {tab === "pl" && (
        <>
          <div style={{ marginBottom: 16 }}>
            <MD3Select
              label="店舗フィルター"
              value={plStoreId}
              onChange={(e) => setPlStoreId(e.target.value)}
              options={[
                { value: "", label: "全店舗" },
                ...stores.map(s => ({ value: String(s.id), label: s.name })),
              ]}
            />
          </div>
          {pl && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
                {[
                  { label: "売上（納品金額）", value: pl.summary.total_revenue, color: md3.primary },
                  { label: "売上原価", value: pl.summary.total_cost, color: md3.onSurfaceVariant },
                  { label: "粗利益", value: pl.summary.gross_profit, color: pl.summary.gross_profit >= 0 ? md3.primary : md3.error },
                  { label: "粗利率", value: pl.summary.gross_margin, suffix: "%", color: md3.tertiary },
                  { label: "経費合計", value: pl.summary.total_expenses, color: md3.error },
                  { label: "営業利益", value: pl.summary.operating_profit, color: pl.summary.operating_profit >= 0 ? md3.primary : md3.error },
                ].map((item, i) => (
                  <MD3Card key={i}>
                    <MD3CardContent>
                      <div style={{ fontSize: 13, color: md3.onSurfaceVariant, marginBottom: 4 }}>{item.label}</div>
                      <div style={{ fontSize: 24, fontWeight: 700, color: item.color }}>
                        {item.suffix ? `${item.value}${item.suffix}` : formatYen(item.value)}
                      </div>
                    </MD3CardContent>
                  </MD3Card>
                ))}
              </div>

              {Object.keys(pl.expenses_by_category).length > 0 && (
                <MD3Card>
                  <MD3CardHeader title="経費内訳" icon={<Receipt size={20} />} />
                  <MD3CardContent>
                    <MD3Table>
                      <MD3TableHead>
                        <MD3TableRow>
                          <MD3TableHeaderCell>カテゴリ</MD3TableHeaderCell>
                          <MD3TableHeaderCell align="right">金額</MD3TableHeaderCell>
                        </MD3TableRow>
                      </MD3TableHead>
                      <MD3TableBody>
                        {Object.entries(pl.expenses_by_category).map(([cat, amount]) => (
                          <MD3TableRow key={cat}>
                            <MD3TableCell>{expenseCategoryLabels[cat] || cat}</MD3TableCell>
                            <MD3TableCell align="right">{formatYen(amount)}</MD3TableCell>
                          </MD3TableRow>
                        ))}
                      </MD3TableBody>
                    </MD3Table>
                  </MD3CardContent>
                </MD3Card>
              )}

              {pl.store_breakdown.length > 0 && (
                <MD3Card>
                  <MD3CardHeader title="店舗別売上" icon={<Building2 size={20} />} />
                  <MD3CardContent>
                    <MD3Table>
                      <MD3TableHead>
                        <MD3TableRow>
                          <MD3TableHeaderCell>店舗</MD3TableHeaderCell>
                          <MD3TableHeaderCell align="right">数量</MD3TableHeaderCell>
                          <MD3TableHeaderCell align="right">売上金額</MD3TableHeaderCell>
                        </MD3TableRow>
                      </MD3TableHead>
                      <MD3TableBody>
                        {pl.store_breakdown.map(s => (
                          <MD3TableRow key={s.store_id}>
                            <MD3TableCell>{s.store_name}</MD3TableCell>
                            <MD3TableCell align="right">{s.quantity.toLocaleString()}</MD3TableCell>
                            <MD3TableCell align="right" style={{ fontWeight: 600 }}>{formatYen(s.revenue)}</MD3TableCell>
                          </MD3TableRow>
                        ))}
                      </MD3TableBody>
                    </MD3Table>
                  </MD3CardContent>
                </MD3Card>
              )}
            </div>
          )}
        </>
      )}

      {tab === "payment" && (
        <MD3Card>
          <MD3CardHeader title="入金確認票" subtitle={`${year}年${month}月 請求分`} icon={<Receipt size={20} />} />
          <MD3CardContent>
            <MD3Table>
              <MD3TableHead>
                <MD3TableRow>
                  <MD3TableHeaderCell>請求書No.</MD3TableHeaderCell>
                  <MD3TableHeaderCell>店舗</MD3TableHeaderCell>
                  <MD3TableHeaderCell>期間</MD3TableHeaderCell>
                  <MD3TableHeaderCell align="right">請求金額</MD3TableHeaderCell>
                  <MD3TableHeaderCell align="right">入金金額</MD3TableHeaderCell>
                  <MD3TableHeaderCell align="right">差額</MD3TableHeaderCell>
                  <MD3TableHeaderCell>ステータス</MD3TableHeaderCell>
                </MD3TableRow>
              </MD3TableHead>
              <MD3TableBody>
                {payments.length === 0 ? (
                  <MD3TableRow><MD3TableCell colSpan={7}>データなし</MD3TableCell></MD3TableRow>
                ) : (
                  payments.map(p => (
                    <MD3TableRow key={p.invoice_id}>
                      <MD3TableCell>{p.invoice_number}</MD3TableCell>
                      <MD3TableCell>{p.store_name}</MD3TableCell>
                      <MD3TableCell style={{ fontSize: 13 }}>{p.period}</MD3TableCell>
                      <MD3TableCell align="right">{formatYen(p.billed_amount)}</MD3TableCell>
                      <MD3TableCell align="right">{formatYen(p.paid_amount)}</MD3TableCell>
                      <MD3TableCell align="right" style={{
                        fontWeight: 600,
                        color: p.difference === 0 ? md3.primary : md3.error,
                      }}>
                        {formatYen(p.difference)}
                      </MD3TableCell>
                      <MD3TableCell>
                        <span style={{
                          padding: "2px 8px", borderRadius: 6, fontSize: 12,
                          background: p.status === "paid" ? md3.primaryContainer : md3.errorContainer,
                          color: p.status === "paid" ? md3.onPrimaryContainer : md3.onErrorContainer,
                        }}>
                          {p.status === "paid" ? "入金済" : p.status === "sent" ? "送付済" : "下書き"}
                        </span>
                      </MD3TableCell>
                    </MD3TableRow>
                  ))
                )}
                {payments.length > 0 && (
                  <MD3TableRow>
                    <MD3TableCell style={{ fontWeight: 700 }}>合計</MD3TableCell>
                    <MD3TableCell /><MD3TableCell />
                    <MD3TableCell align="right" style={{ fontWeight: 700 }}>{formatYen(payTotals.billed)}</MD3TableCell>
                    <MD3TableCell align="right" style={{ fontWeight: 700 }}>{formatYen(payTotals.paid)}</MD3TableCell>
                    <MD3TableCell align="right" style={{ fontWeight: 700, color: payTotals.diff === 0 ? md3.primary : md3.error }}>
                      {formatYen(payTotals.diff)}
                    </MD3TableCell>
                    <MD3TableCell />
                  </MD3TableRow>
                )}
              </MD3TableBody>
            </MD3Table>
          </MD3CardContent>
        </MD3Card>
      )}
    </MD3AppLayout>
  )
}
