"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Papa from "papaparse"
import * as XLSX from "xlsx"
import MD3AppLayout from "@/components/layout/MD3AppLayout"
import { MD3Card, MD3CardHeader, MD3CardContent, MD3CardTitle } from "@/components/md3/MD3Card"
import { MD3Button } from "@/components/md3/MD3Button"
import { MD3Select } from "@/components/md3/MD3Select"
import { MD3TextField } from "@/components/md3/MD3TextField"
import { MD3StatusBadge } from "@/components/md3/MD3Badge"
import { MD3ItemAutocomplete } from "@/components/md3/MD3ItemAutocomplete"
import { MD3QuantityStepper } from "@/components/md3/MD3QuantityStepper"
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
import { itemsApi, inventoryApi, settingsApi, suppliesApi, Item, Supplier, Arrival, Supply } from "@/lib/api"
import { Upload, FileSpreadsheet, Printer, Check, AlertCircle, Flower2, Boxes, Plus } from "lucide-react"

type CSVRow = string[]
type TabType = "flower" | "supplies"

export default function ArrivalsPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabType>("flower")

  // Flower state
  const [items, setItems] = useState<Item[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [arrivals, setArrivals] = useState<Arrival[]>([])
  const [selectedSupplier, setSelectedSupplier] = useState<string>("")
  const [arrivedDate, setArrivedDate] = useState(new Date().toISOString().split("T")[0])
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)
  const [manualQuantity, setManualQuantity] = useState(10)
  const [manualPrice, setManualPrice] = useState(0)
  const [csvData, setCsvData] = useState<CSVRow[]>([])
  const [headers, setHeaders] = useState<string[]>([])
  const [mapping, setMapping] = useState({
    item_code_col: 0,
    quantity_col: 1,
    price_col: 2,
  })
  const [isDragging, setIsDragging] = useState(false)

  // Supplies state
  const [supplies, setSupplies] = useState<Supply[]>([])
  const [stockInputs, setStockInputs] = useState<Record<number, number>>({})
  const [addingStockId, setAddingStockId] = useState<number | null>(null)

  // Common state
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null)

  useEffect(() => {
    const load = async () => {
      const [itemsData, supplierData, arrivalData, suppliesData] = await Promise.all([
        itemsApi.getAll({ limit: 200 }),
        settingsApi.getSuppliers(),
        inventoryApi.getArrivals({ limit: 200 }),
        suppliesApi.getAll(),
      ])
      setItems(itemsData)
      setSuppliers(supplierData)
      setArrivals(arrivalData)
      setSupplies(suppliesData)
    }
    load().catch(console.error)
  }, [])

  const itemByCode = useMemo(() => {
    const map = new Map<string, Item>()
    items.forEach((item) => map.set(item.item_code, item))
    return map
  }, [items])

  // Flower handlers
  const handleFileUpload = (file: File) => {
    const fileName = file.name.toLowerCase()
    if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer)
          const workbook = XLSX.read(data, { type: "array" })
          const firstSheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[firstSheetName]
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as CSVRow[]
          if (jsonData.length > 0) {
            setHeaders(jsonData[0].map(String))
            setCsvData(jsonData.slice(1).filter((row) => row.length > 0))
            setMessage({ type: "info", text: `${file.name} を読み込みました（${jsonData.length - 1}行）` })
          }
        } catch {
          setMessage({ type: "error", text: "ファイルの読み込みに失敗しました" })
        }
      }
      reader.readAsArrayBuffer(file)
    } else if (fileName.endsWith(".csv")) {
      Papa.parse(file, {
        complete: (results) => {
          const data = results.data as CSVRow[]
          if (data.length > 0) {
            setHeaders(data[0].map(String))
            setCsvData(data.slice(1).filter((row) => row.length > 0))
            setMessage({ type: "info", text: `${file.name} を読み込みました（${data.length - 1}行）` })
          }
        },
        skipEmptyLines: true,
      })
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileUpload(file)
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFileUpload(file)
  }

  const submitManual = async () => {
    if (!selectedItem || manualQuantity <= 0) return
    setLoading(true)
    try {
      await inventoryApi.createArrival({
        item_id: selectedItem.id,
        supplier_id: selectedSupplier ? Number(selectedSupplier) : undefined,
        quantity: manualQuantity,
        wholesale_price: manualPrice > 0 ? manualPrice : undefined,
        source_type: "manual",
        arrived_at: new Date(arrivedDate).toISOString(),
      })
      setMessage({ type: "success", text: "入荷を登録しました" })
      const arrivalData = await inventoryApi.getArrivals({ limit: 200 })
      setArrivals(arrivalData)
      setSelectedItem(null)
      setManualQuantity(10)
      setManualPrice(0)
    } catch {
      setMessage({ type: "error", text: "入荷登録に失敗しました" })
    } finally {
      setLoading(false)
    }
  }

  const importArrivals = async () => {
    if (csvData.length === 0) return
    setLoading(true)
    setMessage(null)
    let success = 0
    let skipped = 0
    for (const row of csvData) {
      const code = row[mapping.item_code_col]?.toString().trim()
      const qty = Number(row[mapping.quantity_col])
      const price = Number(row[mapping.price_col])
      const item = code ? itemByCode.get(code) : undefined
      if (!item || !qty) {
        skipped += 1
        continue
      }
      try {
        await inventoryApi.createArrival({
          item_id: item.id,
          supplier_id: selectedSupplier ? Number(selectedSupplier) : undefined,
          quantity: qty,
          wholesale_price: Number.isFinite(price) ? price : undefined,
          source_type: "csv",
          arrived_at: new Date(arrivedDate).toISOString(),
        })
        success += 1
      } catch {
        skipped += 1
      }
    }
    setCsvData([])
    setHeaders([])
    setLoading(false)

    if (success > 0) {
      router.push(`/bucket-paper?date=${arrivedDate}&auto=true`)
    } else {
      setMessage({ type: "error", text: `入荷登録: ${success}件 / スキップ: ${skipped}件` })
    }
  }

  // Supply handlers
  const handleAddStock = async (supplyId: number) => {
    const qty = stockInputs[supplyId] || 0
    if (qty <= 0) return

    setAddingStockId(supplyId)
    try {
      await suppliesApi.addStock(supplyId, qty)
      const suppliesData = await suppliesApi.getAll()
      setSupplies(suppliesData)
      setStockInputs((prev) => ({ ...prev, [supplyId]: 0 }))
      setMessage({ type: "success", text: "入庫を登録しました" })
    } catch {
      setMessage({ type: "error", text: "入庫登録に失敗しました" })
    } finally {
      setAddingStockId(null)
    }
  }

  return (
    <MD3AppLayout title="入荷管理" subtitle="花の入荷・資材の入庫を一元管理">
      {/* Tab Navigation */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        <button
          onClick={() => setActiveTab("flower")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "12px 24px",
            borderRadius: 100,
            border: "none",
            backgroundColor: activeTab === "flower" ? md3.primaryContainer : md3.surfaceContainerHigh,
            color: activeTab === "flower" ? md3.onPrimaryContainer : md3.onSurface,
            fontFamily: "'Zen Maru Gothic', sans-serif",
            fontSize: 14,
            fontWeight: activeTab === "flower" ? 600 : 400,
            cursor: "pointer",
            transition: "all 200ms ease",
          }}
        >
          <Flower2 size={18} />
          花の入荷
        </button>
        <button
          onClick={() => setActiveTab("supplies")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "12px 24px",
            borderRadius: 100,
            border: "none",
            backgroundColor: activeTab === "supplies" ? md3.primaryContainer : md3.surfaceContainerHigh,
            color: activeTab === "supplies" ? md3.onPrimaryContainer : md3.onSurface,
            fontFamily: "'Zen Maru Gothic', sans-serif",
            fontSize: 14,
            fontWeight: activeTab === "supplies" ? 600 : 400,
            cursor: "pointer",
            transition: "all 200ms ease",
          }}
        >
          <Boxes size={18} />
          資材入庫
        </button>
      </div>

      {/* Message */}
      {message && (
        <div
          style={{
            padding: "12px 16px",
            marginBottom: 24,
            backgroundColor:
              message.type === "success"
                ? md3.secondaryContainer
                : message.type === "error"
                ? md3.errorContainer
                : md3.tertiaryContainer,
            color:
              message.type === "success"
                ? md3.onSecondaryContainer
                : message.type === "error"
                ? md3.onErrorContainer
                : md3.onTertiaryContainer,
            borderRadius: 12,
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontFamily: "'Zen Maru Gothic', sans-serif",
          }}
        >
          {message.type === "success" ? <Check size={20} /> : message.type === "error" ? <AlertCircle size={20} /> : null}
          {message.text}
        </div>
      )}

      {/* Flower Tab */}
      {activeTab === "flower" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, alignItems: "start" }}>
          <MD3Card variant="outlined" hoverable={false}>
            <MD3CardHeader title="入荷（手入力）" />
            <MD3CardContent>
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <MD3ItemAutocomplete
                  label="花を検索"
                  placeholder="花名やコードで検索..."
                  items={items.map((item) => ({
                    id: item.id,
                    name: item.name,
                    code: item.item_code,
                    category: item.category || undefined,
                  }))}
                  value={
                    selectedItem
                      ? {
                          id: selectedItem.id,
                          name: selectedItem.name,
                          code: selectedItem.item_code,
                          category: selectedItem.category || undefined,
                        }
                      : null
                  }
                  onChange={(item) => {
                    if (item) {
                      const found = items.find((i) => i.id === item.id)
                      setSelectedItem(found || null)
                    } else {
                      setSelectedItem(null)
                    }
                  }}
                  fullWidth
                />

                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <label style={{ fontSize: 12, fontWeight: 500, color: md3.onSurfaceVariant, fontFamily: "'Zen Maru Gothic', sans-serif" }}>
                    数量
                  </label>
                  <MD3QuantityStepper value={manualQuantity} onChange={setManualQuantity} min={1} max={9999} quickSteps={[10, 100]} />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <label style={{ fontSize: 12, fontWeight: 500, color: md3.onSurfaceVariant, fontFamily: "'Zen Maru Gothic', sans-serif" }}>
                    仕入単価
                  </label>
                  <MD3QuantityStepper value={manualPrice} onChange={setManualPrice} min={0} max={999999} quickSteps={[10, 50, 100]} prefix="¥" />
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "16px 20px",
                    backgroundColor: md3.primaryContainer,
                    borderRadius: 12,
                  }}
                >
                  <span style={{ fontSize: 14, fontWeight: 500, color: md3.onPrimaryContainer, fontFamily: "'Zen Maru Gothic', sans-serif" }}>
                    合計金額
                  </span>
                  <span style={{ fontSize: 24, fontWeight: 600, color: md3.onPrimaryContainer, fontFamily: "'Zen Maru Gothic', sans-serif" }}>
                    ¥{(manualQuantity * manualPrice).toLocaleString()}
                  </span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <MD3Select
                    label="仕入先（任意）"
                    value={selectedSupplier}
                    onChange={(e) => setSelectedSupplier(e.target.value)}
                    options={suppliers.map((s) => ({ value: String(s.id), label: s.name }))}
                    placeholder="仕入先を選択"
                    fullWidth
                  />
                  <MD3TextField label="入荷日" type="date" value={arrivedDate} onChange={(e) => setArrivedDate(e.target.value)} fullWidth />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <MD3Button variant="filled" onClick={submitManual} disabled={loading || !selectedItem || manualQuantity <= 0} size="large">
                    入荷登録
                  </MD3Button>
                </div>
              </div>
            </MD3CardContent>
          </MD3Card>

          <MD3Card variant="outlined" hoverable={false}>
            <MD3CardHeader title="CSV / Excel 取り込み" />
            <MD3CardContent>
              <div
                style={{
                  padding: 36,
                  backgroundColor: isDragging ? md3.primaryContainer : md3.surfaceContainerLow,
                  borderRadius: 12,
                  border: `3px dashed ${isDragging ? md3.primary : md3.outlineVariant}`,
                  transition: "all 200ms ease",
                  transform: isDragging ? "scale(1.01)" : "scale(1)",
                  textAlign: "center",
                }}
                onDrop={handleDrop}
                onDragOver={(e) => {
                  e.preventDefault()
                  setIsDragging(true)
                }}
                onDragEnter={(e) => {
                  e.preventDefault()
                  setIsDragging(true)
                }}
                onDragLeave={(e) => {
                  e.preventDefault()
                  setIsDragging(false)
                }}
              >
                <FileSpreadsheet size={56} color={md3.primary} style={{ marginBottom: 16 }} />
                <p style={{ fontSize: 16, fontWeight: 500, color: md3.onSurface, marginBottom: 12 }}>
                  CSV / Excel をドラッグ & ドロップ
                </p>
                <label>
                  <MD3Button variant="filled" icon={<Upload size={18} />}>
                    ファイル選択
                  </MD3Button>
                  <input type="file" accept=".csv,.xlsx,.xls" onChange={handleFileInput} style={{ display: "none" }} />
                </label>
              </div>

              {headers.length > 0 && (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginTop: 16 }}>
                    <MD3Select
                      label="花コード列"
                      value={mapping.item_code_col.toString()}
                      onChange={(e) => setMapping({ ...mapping, item_code_col: parseInt(e.target.value) })}
                      options={headers.map((header, idx) => ({ value: idx.toString(), label: `${idx + 1}: ${header}` }))}
                      fullWidth
                    />
                    <MD3Select
                      label="数量列"
                      value={mapping.quantity_col.toString()}
                      onChange={(e) => setMapping({ ...mapping, quantity_col: parseInt(e.target.value) })}
                      options={headers.map((header, idx) => ({ value: idx.toString(), label: `${idx + 1}: ${header}` }))}
                      fullWidth
                    />
                    <MD3Select
                      label="単価列"
                      value={mapping.price_col.toString()}
                      onChange={(e) => setMapping({ ...mapping, price_col: parseInt(e.target.value) })}
                      options={headers.map((header, idx) => ({ value: idx.toString(), label: `${idx + 1}: ${header}` }))}
                      fullWidth
                    />
                  </div>

                  <div style={{ marginTop: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <p style={{ fontSize: 14, color: md3.onSurfaceVariant, margin: 0 }}>{csvData.length} 行を取り込みます</p>
                    <MD3Button variant="filled" onClick={importArrivals} disabled={loading}>
                      取り込み実行
                    </MD3Button>
                  </div>
                </>
              )}
            </MD3CardContent>
          </MD3Card>
          </div>

          <MD3Card variant="outlined" hoverable={false}>
            <MD3CardHeader title="入荷履歴" />
            <MD3CardContent style={{ padding: 0 }}>
              <MD3Table>
                <MD3TableHead>
                  <MD3TableRow hoverable={false}>
                    <MD3TableHeaderCell>ID</MD3TableHeaderCell>
                    <MD3TableHeaderCell>入荷日</MD3TableHeaderCell>
                    <MD3TableHeaderCell>花</MD3TableHeaderCell>
                    <MD3TableHeaderCell align="right">数量</MD3TableHeaderCell>
                    <MD3TableHeaderCell align="right">単価</MD3TableHeaderCell>
                    <MD3TableHeaderCell>種別</MD3TableHeaderCell>
                  </MD3TableRow>
                </MD3TableHead>
                <MD3TableBody>
                  {arrivals.length === 0 ? (
                    <MD3TableEmpty colSpan={6} title="入荷履歴がありません" />
                  ) : (
                    arrivals.map((arrival) => {
                      const item = items.find((i) => i.id === arrival.item_id)
                      return (
                        <MD3TableRow key={arrival.id}>
                          <MD3TableCell>
                            <span style={{ fontFamily: "monospace", fontSize: 12, color: md3.onSurfaceVariant }}>{arrival.display_id || "-"}</span>
                          </MD3TableCell>
                          <MD3TableCell>{new Date(arrival.arrived_at).toLocaleDateString("ja-JP")}</MD3TableCell>
                          <MD3TableCell>{item ? `${item.item_code} ${item.name}` : arrival.item_id}</MD3TableCell>
                          <MD3TableCell align="right">{arrival.quantity.toLocaleString()}</MD3TableCell>
                          <MD3TableCell align="right">
                            {arrival.wholesale_price ? `¥${Number(arrival.wholesale_price).toLocaleString()}` : "-"}
                          </MD3TableCell>
                          <MD3TableCell>
                            <MD3StatusBadge status="neutral" label={arrival.source_type || "manual"} size="small" />
                          </MD3TableCell>
                        </MD3TableRow>
                      )
                    })
                  )}
                </MD3TableBody>
              </MD3Table>
            </MD3CardContent>
          </MD3Card>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <Link href={`/bucket-paper?date=${arrivedDate}`}>
              <MD3Button variant="outlined" icon={<Printer size={18} />}>
                カップ印刷へ
              </MD3Button>
            </Link>
          </div>
        </div>
      )}

      {/* Supplies Tab */}
      {activeTab === "supplies" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <MD3Card variant="outlined">
            <MD3CardHeader>
              <MD3CardTitle style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Plus size={20} color={md3.primary} />
                資材入庫
                <MD3StatusBadge status="neutral" label={`${supplies.filter((s) => s.is_active).length}品目`} size="small" />
              </MD3CardTitle>
            </MD3CardHeader>
            <MD3CardContent style={{ padding: 0 }}>
              <MD3Table>
                <MD3TableHead>
                  <MD3TableRow hoverable={false}>
                    <MD3TableHeaderCell>資材名</MD3TableHeaderCell>
                    <MD3TableHeaderCell>規格</MD3TableHeaderCell>
                    <MD3TableHeaderCell align="right">単価</MD3TableHeaderCell>
                    <MD3TableHeaderCell align="right">現在庫</MD3TableHeaderCell>
                    <MD3TableHeaderCell align="center">入庫数</MD3TableHeaderCell>
                    <MD3TableHeaderCell align="center">操作</MD3TableHeaderCell>
                  </MD3TableRow>
                </MD3TableHead>
                <MD3TableBody>
                  {supplies.filter((s) => s.is_active).length === 0 ? (
                    <MD3TableEmpty colSpan={6} title="資材がありません" />
                  ) : (
                    supplies
                      .filter((s) => s.is_active)
                      .map((supply) => {
                        const stockQty = supply.stock_quantity || 0
                        const isLow = stockQty <= 5
                        const isOut = stockQty === 0
                        const inputQty = stockInputs[supply.id] || 0
                        return (
                          <MD3TableRow key={supply.id}>
                            <MD3TableCell highlight>{supply.name}</MD3TableCell>
                            <MD3TableCell>
                              <span style={{ fontSize: 13, color: md3.onSurfaceVariant }}>{supply.specification || "-"}</span>
                            </MD3TableCell>
                            <MD3TableCell align="right">¥{(supply.unit_price || 0).toLocaleString()}</MD3TableCell>
                            <MD3TableCell align="right">
                              <MD3StatusBadge
                                status={isOut ? "error" : isLow ? "warning" : "success"}
                                label={`${stockQty}`}
                                size="small"
                              />
                            </MD3TableCell>
                            <MD3TableCell align="center">
                              <MD3QuantityStepper
                                value={inputQty}
                                onChange={(v) =>
                                  setStockInputs((prev) => ({
                                    ...prev,
                                    [supply.id]: v,
                                  }))
                                }
                                min={0}
                                max={9999}
                                size="small"
                                quickSteps={[10, 100]}
                              />
                            </MD3TableCell>
                            <MD3TableCell align="center">
                              <MD3Button
                                variant="filled"
                                size="small"
                                onClick={() => handleAddStock(supply.id)}
                                disabled={addingStockId === supply.id || inputQty <= 0}
                                icon={<Plus size={16} />}
                              >
                                {addingStockId === supply.id ? "..." : "入庫"}
                              </MD3Button>
                            </MD3TableCell>
                          </MD3TableRow>
                        )
                      })
                  )}
                </MD3TableBody>
              </MD3Table>
            </MD3CardContent>
          </MD3Card>
        </div>
      )}
    </MD3AppLayout>
  )
}
