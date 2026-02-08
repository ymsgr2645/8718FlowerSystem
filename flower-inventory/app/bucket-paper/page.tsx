"use client"

import { useState, useEffect, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { md3 } from "@/lib/md3-theme"
import { MD3Card, MD3CardContent } from "@/components/md3/MD3Card"
import { MD3Button } from "@/components/md3/MD3Button"
import { MD3TextField } from "@/components/md3/MD3TextField"
import { MD3StatusBadge } from "@/components/md3/MD3Badge"
import { ArrowLeft, Printer, Edit3, Check } from "lucide-react"
import { inventoryApi, storesApi, Arrival, Store, itemsApi, settingsApi, Supplier } from "@/lib/api"

interface ArrivalView extends Arrival {
  item_name?: string
  variety?: string
  origin?: string
  grade?: string
  size?: string
  supplier_name?: string
}

// テンプレートに合わせた店舗順序
const STORE_ORDER = [
  "２４条", "24条",
  "豊平",
  "月寒",
  "新琴似",
  "発寒",
  "琴似",
  "北野",
  "南郷",
  "中央",
  "手稲",
  "山の手",
  "通信販売",
  "大曲",
  "澄川",
]

export default function BucketPaperPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const dateParam = searchParams.get("date")
  const autoParam = searchParams.get("auto")

  const [arrivals, setArrivals] = useState<ArrivalView[]>([])
  const [stores, setStores] = useState<Store[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [selectedDate, setSelectedDate] = useState(dateParam || new Date().toISOString().split("T")[0])
  const [loading, setLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(autoParam === "true")

  useEffect(() => {
    const loadData = async () => {
      const [storesData, suppliersData] = await Promise.all([
        storesApi.getAll(),
        settingsApi.getSuppliers(),
      ])
      // テンプレートの店舗順にソート
      const sortedStores = storesData.sort((a, b) => {
        const aIdx = STORE_ORDER.findIndex(name => a.name.includes(name) || name.includes(a.name))
        const bIdx = STORE_ORDER.findIndex(name => b.name.includes(name) || name.includes(b.name))
        if (aIdx === -1 && bIdx === -1) return 0
        if (aIdx === -1) return 1
        if (bIdx === -1) return -1
        return aIdx - bIdx
      })
      setStores(sortedStores)
      setSuppliers(suppliersData)
    }
    loadData().catch(console.error)
  }, [])

  useEffect(() => {
    const loadArrivals = async () => {
      setLoading(true)
      const [arrivalData, items] = await Promise.all([
        inventoryApi.getArrivals({ date_from: selectedDate, date_to: selectedDate, limit: 500 }),
        itemsApi.getAll({ limit: 500 }),
      ])
      const itemMap = new Map(items.map((i) => [i.id, i]))
      const supplierMap = new Map(suppliers.map((s) => [s.id, s.name]))

      setArrivals(arrivalData.map((a) => {
        const item = itemMap.get(a.item_id)
        return {
          ...a,
          item_name: item?.name,
          variety: item?.variety,
          origin: item?.origin,
          supplier_name: a.supplier_id ? supplierMap.get(a.supplier_id) : undefined,
        }
      }))
      setLoading(false)
    }
    if (suppliers.length > 0) {
      loadArrivals().catch(console.error)
    }
  }, [selectedDate, suppliers])

  // 自動遷移後、データが読み込まれたら印刷ダイアログを表示
  useEffect(() => {
    if (autoParam === "true" && arrivals.length > 0 && !loading) {
      const timer = setTimeout(() => {
        window.print()
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [autoParam, arrivals, loading])

  const handlePrint = useCallback(() => window.print(), [])

  // 2アイテムずつのペアを作成（A4横2分割用）
  const itemPairs: [ArrivalView, ArrivalView | null][] = []
  for (let i = 0; i < arrivals.length; i += 2) {
    itemPairs.push([arrivals[i], arrivals[i + 1] || null])
  }

  return (
    <>
      {/* 画面表示用 */}
      <div className="screen-only" style={{ padding: 24, backgroundColor: md3.surface, minHeight: "100vh" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }}>
          <Link
            href="/arrivals"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              color: md3.onSurfaceVariant,
              textDecoration: "none",
              fontSize: 14,
              fontFamily: "'Zen Maru Gothic', sans-serif",
            }}
          >
            <ArrowLeft size={20} />
            入荷管理に戻る
          </Link>

          {showSuccess && (
            <div
              style={{
                padding: "16px 20px",
                backgroundColor: md3.secondaryContainer,
                color: md3.onSecondaryContainer,
                borderRadius: 12,
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <Check size={24} />
              <div>
                <div style={{ fontWeight: 600 }}>CSV取込完了</div>
                <div style={{ fontSize: 14, marginTop: 4 }}>
                  {arrivals.length}件の入荷データが登録されました。印刷ダイアログが自動で開きます。
                </div>
              </div>
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 600, color: md3.onSurface, margin: 0 }}>カップ印刷</h1>
              <p style={{ marginTop: 8, fontSize: 14, color: md3.onSurfaceVariant }}>
                A4 横、2分割で印刷します（テンプレート形式）
              </p>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <Link href={`/transfer-entry?date=${selectedDate}`}>
                <MD3Button variant="outlined" icon={<Edit3 size={18} />}>
                  持ち出し入力
                </MD3Button>
              </Link>
              <MD3Button variant="filled" icon={<Printer size={18} />} onClick={handlePrint}>
                印刷
              </MD3Button>
            </div>
          </div>

          <MD3Card variant="outlined" hoverable={false}>
            <MD3CardContent>
              <div style={{ display: "flex", gap: 16, alignItems: "flex-end" }}>
                <div style={{ flex: 1 }}>
                  <MD3TextField
                    label="入荷日"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    fullWidth
                  />
                </div>
                <div>
                  <MD3StatusBadge status={arrivals.length > 0 ? "success" : "neutral"} label={`${arrivals.length}件`} />
                </div>
              </div>
            </MD3CardContent>
          </MD3Card>

          {/* プレビュー */}
          <div style={{ fontSize: 14, fontWeight: 600, color: md3.onSurfaceVariant }}>印刷プレビュー</div>

          {loading ? (
            <div style={{ textAlign: "center", padding: 48, color: md3.onSurfaceVariant }}>読み込み中...</div>
          ) : arrivals.length === 0 ? (
            <div style={{ textAlign: "center", padding: 48, color: md3.onSurfaceVariant }}>
              入荷データがありません
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              {itemPairs.map((pair, idx) => (
                <div
                  key={idx}
                  style={{
                    border: `1px solid ${md3.outlineVariant}`,
                    borderRadius: 8,
                    overflow: "hidden",
                    backgroundColor: "#fff",
                    aspectRatio: "297 / 210", // A4横比率
                  }}
                >
                  <div style={{ display: "flex", height: "100%" }}>
                    <BucketItemPreview arrival={pair[0]} stores={stores} itemNumber={idx * 2 + 1} selectedDate={selectedDate} />
                    {pair[1] ? (
                      <BucketItemPreview arrival={pair[1]} stores={stores} itemNumber={idx * 2 + 2} selectedDate={selectedDate} />
                    ) : (
                      <div style={{ flex: 1, borderLeft: `1px solid ${md3.outlineVariant}` }} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 印刷用スタイル */}
      <style jsx global>{`
        @media print {
          .screen-only {
            display: none !important;
          }
          .print-only {
            display: block !important;
          }
          .page-break {
            page-break-after: always;
          }
          @page {
            size: A4 landscape;
            margin: 3mm;
          }
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            margin: 0;
            padding: 0;
          }
        }
      `}</style>

      {/* 印刷用レイアウト */}
      <div className="print-only" style={{ display: "none" }}>
        {itemPairs.map((pair, idx) => (
          <div
            key={idx}
            className={idx < itemPairs.length - 1 ? "page-break" : ""}
            style={{
              width: "100%",
              height: "100vh",
              display: "flex",
              fontFamily: "'Zen Maru Gothic', 'Hiragino Kaku Gothic ProN', 'Meiryo', sans-serif",
            }}
          >
            <PrintBucketItem arrival={pair[0]} stores={stores} itemNumber={idx * 2 + 1} selectedDate={selectedDate} />
            {pair[1] ? (
              <PrintBucketItem arrival={pair[1]} stores={stores} itemNumber={idx * 2 + 2} selectedDate={selectedDate} />
            ) : (
              <div style={{ flex: 1, borderLeft: "1px solid #000" }} />
            )}
          </div>
        ))}
      </div>
    </>
  )
}

// プレビュー用コンポーネント
function BucketItemPreview({ arrival, stores, itemNumber, selectedDate }: {
  arrival: ArrivalView
  stores: Store[]
  itemNumber: number
  selectedDate: string
}) {
  return (
    <div style={{ flex: 1, padding: 12, borderLeft: itemNumber % 2 === 0 ? `1px solid ${md3.outlineVariant}` : "none", fontSize: 10 }}>
      {/* ヘッダー */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <div style={{ color: md3.error, fontWeight: 700, fontSize: 11 }}>先に記入してから取る事！！</div>
        <div style={{ fontWeight: 700, fontSize: 14 }}>{itemNumber}</div>
      </div>

      {/* 商品情報 */}
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 6 }}>
        <tbody>
          <tr>
            <td style={{ border: `1px solid ${md3.outline}`, padding: "2px 4px", width: "25%", backgroundColor: md3.surfaceContainerHigh, fontWeight: 600 }}>仕入先</td>
            <td style={{ border: `1px solid ${md3.outline}`, padding: "2px 4px", width: "25%", backgroundColor: md3.surfaceContainerHigh, fontWeight: 600 }}>仕入日</td>
            <td style={{ border: `1px solid ${md3.outline}`, padding: "2px 4px", width: "25%", backgroundColor: md3.surfaceContainerHigh, fontWeight: 600 }}>本数</td>
            <td style={{ border: `1px solid ${md3.outline}`, padding: "2px 4px", width: "25%", backgroundColor: md3.surfaceContainerHigh, fontWeight: 600 }}>仕入値</td>
          </tr>
          <tr>
            <td style={{ border: `1px solid ${md3.outline}`, padding: "2px 4px" }}>{arrival.supplier_name || ""}</td>
            <td style={{ border: `1px solid ${md3.outline}`, padding: "2px 4px" }}>{selectedDate}</td>
            <td style={{ border: `1px solid ${md3.outline}`, padding: "2px 4px" }}>{arrival.quantity}</td>
            <td style={{ border: `1px solid ${md3.outline}`, padding: "2px 4px" }}>¥{Number(arrival.wholesale_price || 0).toLocaleString()}</td>
          </tr>
        </tbody>
      </table>

      {/* 詳細情報 */}
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 6 }}>
        <tbody>
          <tr>
            <td style={{ border: `1px solid ${md3.outline}`, padding: "2px 4px", width: "33%", backgroundColor: md3.surfaceContainerHigh, fontWeight: 600 }}>種類</td>
            <td style={{ border: `1px solid ${md3.outline}`, padding: "2px 4px", width: "33%", backgroundColor: md3.surfaceContainerHigh, fontWeight: 600 }}>品種</td>
            <td style={{ border: `1px solid ${md3.outline}`, padding: "2px 4px", width: "34%", backgroundColor: md3.surfaceContainerHigh, fontWeight: 600 }}>色</td>
          </tr>
          <tr>
            <td style={{ border: `1px solid ${md3.outline}`, padding: "2px 4px", fontWeight: 700, fontSize: 12 }}>{arrival.item_name || ""}</td>
            <td style={{ border: `1px solid ${md3.outline}`, padding: "2px 4px" }}>{arrival.variety || ""}</td>
            <td style={{ border: `1px solid ${md3.outline}`, padding: "2px 4px" }}>{arrival.origin || ""}</td>
          </tr>
        </tbody>
      </table>

      {/* 店舗欄 */}
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <tbody>
          {stores.map((store, idx) => (
            <tr key={store.id}>
              <td style={{ border: `1px solid ${md3.outline}`, padding: "1px 4px", width: "30%", fontSize: 9 }}>{store.name}</td>
              <td style={{ border: `1px solid ${md3.outline}`, padding: "1px 4px", height: 14 }}></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// 印刷用コンポーネント
function PrintBucketItem({ arrival, stores, itemNumber, selectedDate }: {
  arrival: ArrivalView
  stores: Store[]
  itemNumber: number
  selectedDate: string
}) {
  return (
    <div style={{ flex: 1, padding: "4mm", borderLeft: itemNumber % 2 === 0 ? "1px solid #000" : "none", fontSize: "9pt" }}>
      {/* ヘッダー */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3mm" }}>
        <div style={{ color: "#c00", fontWeight: 700, fontSize: "10pt" }}>先に記入してから取る事！！</div>
        <div style={{ fontWeight: 700, fontSize: "14pt" }}>{itemNumber}</div>
      </div>

      {/* 商品情報 */}
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "2mm" }}>
        <tbody>
          <tr>
            <td style={{ border: "1px solid #000", padding: "1mm 2mm", width: "25%", backgroundColor: "#f0f0f0", fontWeight: 600 }}>仕入先</td>
            <td style={{ border: "1px solid #000", padding: "1mm 2mm", width: "25%", backgroundColor: "#f0f0f0", fontWeight: 600 }}>仕入日</td>
            <td style={{ border: "1px solid #000", padding: "1mm 2mm", width: "25%", backgroundColor: "#f0f0f0", fontWeight: 600 }}>本数</td>
            <td style={{ border: "1px solid #000", padding: "1mm 2mm", width: "25%", backgroundColor: "#f0f0f0", fontWeight: 600 }}>仕入値</td>
          </tr>
          <tr>
            <td style={{ border: "1px solid #000", padding: "1mm 2mm" }}>{arrival.supplier_name || ""}</td>
            <td style={{ border: "1px solid #000", padding: "1mm 2mm" }}>{selectedDate}</td>
            <td style={{ border: "1px solid #000", padding: "1mm 2mm" }}>{arrival.quantity}</td>
            <td style={{ border: "1px solid #000", padding: "1mm 2mm" }}>¥{Number(arrival.wholesale_price || 0).toLocaleString()}</td>
          </tr>
        </tbody>
      </table>

      {/* 詳細情報 */}
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "2mm" }}>
        <tbody>
          <tr>
            <td style={{ border: "1px solid #000", padding: "1mm 2mm", width: "33%", backgroundColor: "#f0f0f0", fontWeight: 600 }}>種類</td>
            <td style={{ border: "1px solid #000", padding: "1mm 2mm", width: "33%", backgroundColor: "#f0f0f0", fontWeight: 600 }}>品種</td>
            <td style={{ border: "1px solid #000", padding: "1mm 2mm", width: "34%", backgroundColor: "#f0f0f0", fontWeight: 600 }}>色</td>
          </tr>
          <tr>
            <td style={{ border: "1px solid #000", padding: "1mm 2mm", fontWeight: 700, fontSize: "11pt" }}>{arrival.item_name || ""}</td>
            <td style={{ border: "1px solid #000", padding: "1mm 2mm" }}>{arrival.variety || ""}</td>
            <td style={{ border: "1px solid #000", padding: "1mm 2mm" }}>{arrival.origin || ""}</td>
          </tr>
        </tbody>
      </table>

      {/* 店舗欄 */}
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <tbody>
          {stores.map((store) => (
            <tr key={store.id}>
              <td style={{ border: "1px solid #000", padding: "1mm 2mm", width: "35%", fontSize: "8pt" }}>{store.name}</td>
              <td style={{ border: "1px solid #000", padding: "1mm 2mm", height: "5mm" }}></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
