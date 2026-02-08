"use client"

import { useEffect, useState } from "react"
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
import { expensesApi, storesApi, Expense, Store } from "@/lib/api"
import { ClipboardList } from "lucide-react"

const categories = [
  { value: "jftd", label: "JFTD発注金" },
  { value: "yupack", label: "ゆうパック送料" },
  { value: "eneos", label: "エネオス（ガソリン代）" },
  { value: "ntt", label: "NTT東日本（電話代）" },
  { value: "freight", label: "運賃（ブランディア/太田等）" },
  { value: "electric", label: "電気" },
  { value: "water", label: "水道" },
  { value: "gas", label: "ガス" },
  { value: "common_fee", label: "共益費" },
  { value: "other", label: "その他" },
]

const billingMethods = [
  { value: "invoice", label: "請求書" },
  { value: "transfer", label: "振込" },
]

export default function ExpensesPage() {
  const [stores, setStores] = useState<Store[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [storeId, setStoreId] = useState("")
  const [category, setCategory] = useState("jftd")
  const [yearMonth, setYearMonth] = useState(new Date().toISOString().slice(0, 7))
  const [amount, setAmount] = useState("")
  const [billingMethod, setBillingMethod] = useState("invoice")
  const [invoiceNo, setInvoiceNo] = useState("")
  const [note, setNote] = useState("")

  useEffect(() => {
    const load = async () => {
      const [storesData, expensesData] = await Promise.all([storesApi.getAll(), expensesApi.getAll()])
      setStores(storesData)
      setExpenses(expensesData)
    }
    load().catch(console.error)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!storeId || !amount) return
    await expensesApi.create({
      store_id: Number(storeId),
      category,
      year_month: yearMonth,
      amount: Number(amount),
      billing_method: billingMethod,
      invoice_no: invoiceNo || undefined,
      note: note || undefined,
    })
    const data = await expensesApi.getAll()
    setExpenses(data)
    setAmount("")
    setInvoiceNo("")
    setNote("")
  }

  return (
    <MD3AppLayout title="経費入力" subtitle="月次の経費を記録します">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 24 }}>
        <MD3Card variant="outlined">
          <MD3CardHeader title="経費登録" icon={<ClipboardList size={20} />} />
          <MD3CardContent>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <MD3Select
                label="店舗"
                value={storeId}
                onChange={(e) => setStoreId(e.target.value)}
                options={stores.map((s) => ({ value: String(s.id), label: s.name }))}
                placeholder="店舗を選択"
                fullWidth
              />
              <MD3Select label="カテゴリ" value={category} onChange={(e) => setCategory(e.target.value)} options={categories} fullWidth />
              <MD3TextField label="対象月" type="month" value={yearMonth} onChange={(e) => setYearMonth(e.target.value)} fullWidth />
              <MD3NumberField label="金額" value={amount} onChange={setAmount} fullWidth />
              <MD3Select label="支払方法" value={billingMethod} onChange={(e) => setBillingMethod(e.target.value)} options={billingMethods} fullWidth />
              <MD3TextField label="請求書番号（任意）" value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} fullWidth />
              <MD3TextField label="備考" value={note} onChange={(e) => setNote(e.target.value)} fullWidth />
              <MD3Button type="submit" fullWidth>
                登録
              </MD3Button>
            </form>
          </MD3CardContent>
        </MD3Card>

        <MD3Card variant="outlined">
          <MD3CardHeader title="経費一覧" />
          <MD3CardContent style={{ padding: 0 }}>
            <MD3Table>
              <MD3TableHead>
                <MD3TableRow hoverable={false}>
                  <MD3TableHeaderCell>月</MD3TableHeaderCell>
                  <MD3TableHeaderCell>店舗</MD3TableHeaderCell>
                  <MD3TableHeaderCell>カテゴリ</MD3TableHeaderCell>
                  <MD3TableHeaderCell align="right">金額</MD3TableHeaderCell>
                  <MD3TableHeaderCell>支払方法</MD3TableHeaderCell>
                </MD3TableRow>
              </MD3TableHead>
              <MD3TableBody>
                {expenses.length === 0 ? (
                  <MD3TableRow hoverable={false}>
                    <MD3TableCell colSpan={5}>
                      <div style={{ textAlign: "center", padding: 32, color: md3.onSurfaceVariant }}>経費がありません</div>
                    </MD3TableCell>
                  </MD3TableRow>
                ) : (
                  expenses.map((exp) => (
                    <MD3TableRow key={exp.id}>
                      <MD3TableCell>{exp.year_month}</MD3TableCell>
                      <MD3TableCell>{stores.find((s) => s.id === exp.store_id)?.name || exp.store_id}</MD3TableCell>
                      <MD3TableCell>{categories.find((c) => c.value === exp.category)?.label || exp.category}</MD3TableCell>
                      <MD3TableCell align="right">¥{Number(exp.amount).toLocaleString()}</MD3TableCell>
                      <MD3TableCell>{billingMethods.find((b) => b.value === exp.billing_method)?.label || exp.billing_method}</MD3TableCell>
                    </MD3TableRow>
                  ))
                )}
              </MD3TableBody>
            </MD3Table>
          </MD3CardContent>
        </MD3Card>
      </div>
    </MD3AppLayout>
  )
}
