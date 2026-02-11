"use client"

import { useEffect, useState } from "react"
import MD3AppLayout from "@/components/layout/MD3AppLayout"
import { MD3Card, MD3CardHeader, MD3CardContent } from "@/components/md3/MD3Card"
import { MD3Button } from "@/components/md3/MD3Button"
import { MD3Select } from "@/components/md3/MD3Select"
import { MD3StatusBadge } from "@/components/md3/MD3Badge"
import { MD3NumberField } from "@/components/md3/MD3NumberField"
import {
  MD3Table,
  MD3TableHead,
  MD3TableBody,
  MD3TableRow,
  MD3TableHeaderCell,
  MD3TableCell,
} from "@/components/md3/MD3Table"
import { MD3Dialog, MD3DialogHeader, MD3DialogTitle, MD3DialogBody, MD3DialogFooter } from "@/components/md3/MD3Dialog"
import { MD3TextField } from "@/components/md3/MD3TextField"
import { md3 } from "@/lib/md3-theme"
import { invoicesApi, storesApi, Invoice, InvoiceDetail, Store } from "@/lib/api"
import { FileText, Plus, Eye, Download, Printer } from "lucide-react"
import * as XLSX from "xlsx"

type InvoiceFormData = {
  store_id: string
  invoice_type: "flower" | "supply"
  period_start: string
  period_end: string
  prev_invoice_amount: string
  prev_payment_amount: string
  carryover_amount: string
}

const invoiceTypes = [
  { value: "flower", label: "花の請求書" },
  { value: "supply", label: "資材請求書" },
]

function getInvoiceTypeBadge(type: string) {
  switch (type) {
    case "flower":
      return <MD3StatusBadge status="success" label="花" size="small" />
    case "supply":
      return <MD3StatusBadge status="info" label="資材" size="small" />
    default:
      return <MD3StatusBadge status="neutral" label={type} size="small" />
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case "paid":
      return <MD3StatusBadge status="success" label="入金済" size="small" />
    case "sent":
      return <MD3StatusBadge status="info" label="送付済" size="small" />
    case "draft":
      return <MD3StatusBadge status="neutral" label="下書き" size="small" />
    default:
      return <MD3StatusBadge status="neutral" label={status} size="small" />
  }
}

function formatCurrency(amount: number): string {
  return `¥${amount.toLocaleString()}`
}

export default function InvoicePage() {
  const [stores, setStores] = useState<Store[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [previewOpen, setPreviewOpen] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceDetail | null>(null)
  const [formData, setFormData] = useState<InvoiceFormData>({
    store_id: "",
    invoice_type: "flower",
    period_start: "",
    period_end: "",
    prev_invoice_amount: "",
    prev_payment_amount: "",
    carryover_amount: "",
  })

  useEffect(() => {
    const load = async () => {
      const [storesData, invoicesData] = await Promise.all([storesApi.getAll(), invoicesApi.getAll({ limit: 200 })])
      setStores(storesData)
      setInvoices(invoicesData)
    }
    load().catch(console.error)
  }, [])

  const handleInputChange = (field: keyof InvoiceFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handlePreview = async (invoice: Invoice) => {
    const detail = await invoicesApi.getById(invoice.id)
    setSelectedInvoice(detail)
    setPreviewOpen(true)
  }

  const handleCreateInvoice = async () => {
    if (!formData.store_id || !formData.period_start || !formData.period_end) return
    await invoicesApi.generate({
      store_id: Number(formData.store_id),
      invoice_type: formData.invoice_type,
      period_start: formData.period_start,
      period_end: formData.period_end,
      prev_invoice_amount: formData.prev_invoice_amount ? Number(formData.prev_invoice_amount) : 0,
      prev_payment_amount: formData.prev_payment_amount ? Number(formData.prev_payment_amount) : 0,
      carryover_amount: formData.carryover_amount ? Number(formData.carryover_amount) : 0,
    })
    const invoicesData = await invoicesApi.getAll({ limit: 200 })
    setInvoices(invoicesData)
  }

  const exportCsv = async (invoiceId: number) => {
    const detail = await invoicesApi.getById(invoiceId)
    const rows = detail.items.map((item) => ({
      item_name: item.item_name,
      quantity: item.quantity,
      unit_price: item.unit_price,
      subtotal: item.subtotal,
      tax_rate: item.tax_rate,
      transferred_at: item.transferred_at || "",
    }))
    const escape = (value: string | number) => {
      const v = String(value)
      if (v.includes(",") || v.includes("\"") || v.includes("\n")) {
        return `"${v.replace(/\"/g, "\"\"")}"`
      }
      return v
    }
    const header = "item_name,quantity,unit_price,subtotal,tax_rate,transferred_at"
    const body = rows
      .map((r) =>
        [r.item_name, r.quantity, r.unit_price, r.subtotal, r.tax_rate, r.transferred_at].map(escape).join(",")
      )
      .join("\n")
    const csv = `${header}\n${body}`
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `invoice-${detail.invoice_number}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const exportExcel = async (invoiceId: number) => {
    const detail = await invoicesApi.getById(invoiceId)
    const rows = detail.items.map((item) => ({
      花名: item.item_name,
      数量: item.quantity,
      単価: item.unit_price,
      小計: item.subtotal,
      税率: item.tax_rate,
      日付: item.transferred_at || "",
    }))
    const worksheet = XLSX.utils.json_to_sheet(rows)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Invoice")
    XLSX.writeFile(workbook, `invoice-${detail.invoice_number}.xlsx`)
  }

  return (
    <MD3AppLayout title="売上請求書" subtitle="花・資材の請求書を作成 / 出力">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 24 }}>
        <MD3Card>
          <MD3CardHeader title="請求書作成" icon={<Plus size={20} />} />
          <MD3CardContent>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <MD3Select
                label="店舗"
                options={stores.map((s) => ({ value: String(s.id), label: s.name }))}
                placeholder="店舗を選択"
                value={formData.store_id}
                onChange={(e) => handleInputChange("store_id", e.target.value)}
              />

              <MD3Select
                label="請求書種別"
                options={invoiceTypes}
                value={formData.invoice_type}
                onChange={(e) => handleInputChange("invoice_type", e.target.value)}
              />

              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: md3.onSurfaceVariant, marginBottom: 8, display: "block" }}>
                  期間
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <MD3TextField
                    label="開始"
                    type="date"
                    value={formData.period_start}
                    onChange={(e) => handleInputChange("period_start", e.target.value)}
                    fullWidth
                  />
                  <MD3TextField
                    label="終了"
                    type="date"
                    value={formData.period_end}
                    onChange={(e) => handleInputChange("period_end", e.target.value)}
                    fullWidth
                  />
                </div>
              </div>

              <MD3NumberField
                label="前回請求残"
                value={formData.prev_invoice_amount}
                onChange={(v) => handleInputChange("prev_invoice_amount", v)}
                fullWidth
              />
              <MD3NumberField
                label="前回入金"
                value={formData.prev_payment_amount}
                onChange={(v) => handleInputChange("prev_payment_amount", v)}
                fullWidth
              />
              <MD3NumberField
                label="繰越"
                value={formData.carryover_amount}
                onChange={(v) => handleInputChange("carryover_amount", v)}
                fullWidth
              />

              <MD3Button variant="filled" onClick={handleCreateInvoice} fullWidth>
                <FileText size={18} style={{ marginRight: 8 }} />
                請求書を生成
              </MD3Button>
            </div>
          </MD3CardContent>
        </MD3Card>

        <MD3Card>
          <MD3CardHeader title="請求書一覧" icon={<FileText size={20} />} />
          <MD3CardContent style={{ padding: 0 }}>
            <div style={{ overflowX: "auto" }}>
              <MD3Table>
                <MD3TableHead>
                  <MD3TableRow hoverable={false}>
                    <MD3TableHeaderCell>請求書番号</MD3TableHeaderCell>
                    <MD3TableHeaderCell>店舗</MD3TableHeaderCell>
                    <MD3TableHeaderCell>種別</MD3TableHeaderCell>
                    <MD3TableHeaderCell>期間</MD3TableHeaderCell>
                    <MD3TableHeaderCell align="right">合計</MD3TableHeaderCell>
                    <MD3TableHeaderCell>ステータス</MD3TableHeaderCell>
                    <MD3TableHeaderCell align="center">出力</MD3TableHeaderCell>
                  </MD3TableRow>
                </MD3TableHead>
                <MD3TableBody>
                  {invoices.map((invoice) => (
                    <MD3TableRow key={invoice.id}>
                      <MD3TableCell>
                        <span style={{ fontFamily: "monospace", fontSize: 13 }}>{invoice.invoice_number}</span>
                      </MD3TableCell>
                      <MD3TableCell>{stores.find((s) => s.id === invoice.store_id)?.name || invoice.store_id}</MD3TableCell>
                      <MD3TableCell>{getInvoiceTypeBadge(invoice.invoice_type)}</MD3TableCell>
                      <MD3TableCell>
                        <span style={{ fontSize: 13 }}>
                          {invoice.period_start}
                          <br />
                          <span style={{ color: md3.onSurfaceVariant }}>~ {invoice.period_end}</span>
                        </span>
                      </MD3TableCell>
                      <MD3TableCell align="right" highlight>
                        {formatCurrency(Number(invoice.total_amount))}
                      </MD3TableCell>
                      <MD3TableCell>{getStatusBadge(invoice.status)}</MD3TableCell>
                      <MD3TableCell align="center">
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                          <MD3Button variant="text" size="small" onClick={() => handlePreview(invoice)} title="プレビュー">
                            <Eye size={16} />
                          </MD3Button>
                          <MD3Button variant="text" size="small" title="CSV" onClick={() => exportCsv(invoice.id)}>
                            <Download size={16} />
                          </MD3Button>
                          <MD3Button variant="text" size="small" title="Excel" onClick={() => exportExcel(invoice.id)}>
                            <Download size={16} />
                          </MD3Button>
                          <MD3Button
                            variant="text"
                            size="small"
                            title="PDF"
                            onClick={() => window.open(`/api/invoice-pdf?id=${invoice.id}`, "_blank")}
                          >
                            <Printer size={16} />
                          </MD3Button>
                        </div>
                      </MD3TableCell>
                    </MD3TableRow>
                  ))}
                  {invoices.length === 0 && (
                    <MD3TableRow hoverable={false}>
                      <MD3TableCell colSpan={7}>
                        <div style={{ textAlign: "center", padding: 48, color: md3.onSurfaceVariant }}>
                          請求書がありません
                        </div>
                      </MD3TableCell>
                    </MD3TableRow>
                  )}
                </MD3TableBody>
              </MD3Table>
            </div>
          </MD3CardContent>
        </MD3Card>
      </div>

      <MD3Dialog open={previewOpen} onOpenChange={setPreviewOpen} maxWidth={900}>
        <MD3DialogHeader>
          <MD3DialogTitle>請求書プレビュー</MD3DialogTitle>
        </MD3DialogHeader>
        <MD3DialogBody style={{ maxHeight: "70vh", overflowY: "auto" }}>
          {selectedInvoice && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div>
                  <h2 style={{ margin: 0 }}>請求書</h2>
                  <p style={{ margin: "4px 0" }}>請求書番号: {selectedInvoice.invoice_number}</p>
                  <p style={{ margin: "4px 0" }}>
                    期間: {selectedInvoice.period_start} ~ {selectedInvoice.period_end}
                  </p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ margin: "4px 0", fontWeight: 700 }}>株式会社 8718フラワー</p>
                </div>
              </div>

              <MD3Table>
                <MD3TableHead>
                  <MD3TableRow hoverable={false}>
                    <MD3TableHeaderCell>花</MD3TableHeaderCell>
                    <MD3TableHeaderCell align="right">数量</MD3TableHeaderCell>
                    <MD3TableHeaderCell align="right">単価</MD3TableHeaderCell>
                    <MD3TableHeaderCell align="right">小計</MD3TableHeaderCell>
                  </MD3TableRow>
                </MD3TableHead>
                <MD3TableBody>
                  {selectedInvoice.items.map((item) => (
                    <MD3TableRow key={item.id}>
                      <MD3TableCell>{item.item_name}</MD3TableCell>
                      <MD3TableCell align="right">{item.quantity}</MD3TableCell>
                      <MD3TableCell align="right">{formatCurrency(Number(item.unit_price))}</MD3TableCell>
                      <MD3TableCell align="right">{formatCurrency(Number(item.subtotal))}</MD3TableCell>
                    </MD3TableRow>
                  ))}
                </MD3TableBody>
              </MD3Table>

              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <div style={{ width: 260 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>合計</span>
                    <span>{formatCurrency(Number(selectedInvoice.total_amount))}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </MD3DialogBody>
        <MD3DialogFooter>
          <MD3Button variant="outlined" onClick={() => setPreviewOpen(false)}>
            閉じる
          </MD3Button>
        </MD3DialogFooter>
      </MD3Dialog>
    </MD3AppLayout>
  )
}
