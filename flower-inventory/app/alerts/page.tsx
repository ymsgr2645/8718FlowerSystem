"use client"

import { useEffect, useState } from "react"
import MD3AppLayout from "@/components/layout/MD3AppLayout"
import { MD3Card, MD3CardHeader, MD3CardContent } from "@/components/md3/MD3Card"
import { MD3Button } from "@/components/md3/MD3Button"
import { MD3StatusBadge } from "@/components/md3/MD3Badge"
import { MD3TextField } from "@/components/md3/MD3TextField"
import { MD3Select } from "@/components/md3/MD3Select"
import {
  MD3Table,
  MD3TableHead,
  MD3TableBody,
  MD3TableRow,
  MD3TableHeaderCell,
  MD3TableCell,
} from "@/components/md3/MD3Table"
import { md3 } from "@/lib/md3-theme"
import { alertsApi, ErrorAlert } from "@/lib/api"
import { AlertTriangle } from "lucide-react"

const alertTypes = [
  { value: "csv_import", label: "CSV取込失敗" },
  { value: "pdf_generate", label: "PDF生成失敗" },
  { value: "email_send", label: "メール送信失敗" },
]

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<ErrorAlert[]>([])
  const [type, setType] = useState("csv_import")
  const [message, setMessage] = useState("")

  useEffect(() => {
    const load = async () => {
      const data = await alertsApi.getAll()
      setAlerts(data)
    }
    load().catch(console.error)
  }, [])

  const createAlert = async () => {
    if (!message) return
    await alertsApi.create({ type, message })
    const data = await alertsApi.getAll()
    setAlerts(data)
    setMessage("")
  }

  const resolve = async (id: number) => {
    await alertsApi.resolve(id)
    const data = await alertsApi.getAll()
    setAlerts(data)
  }

  return (
    <MD3AppLayout title="エラーアラート" subtitle="未対応アラートの確認と解決">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 24 }}>
        <MD3Card variant="outlined">
          <MD3CardHeader title="手動アラート登録" icon={<AlertTriangle size={20} />} />
          <MD3CardContent>
            <MD3Select label="種別" value={type} onChange={(e) => setType(e.target.value)} options={alertTypes} fullWidth />
            <div style={{ marginTop: 12 }}>
              <MD3TextField label="内容" value={message} onChange={(e) => setMessage(e.target.value)} fullWidth />
            </div>
            <div style={{ marginTop: 16 }}>
              <MD3Button variant="filled" onClick={createAlert} fullWidth>
                登録
              </MD3Button>
            </div>
          </MD3CardContent>
        </MD3Card>

        <MD3Card variant="outlined">
          <MD3CardHeader title="アラート一覧" />
          <MD3CardContent style={{ padding: 0 }}>
            <MD3Table>
              <MD3TableHead>
                <MD3TableRow hoverable={false}>
                  <MD3TableHeaderCell>日時</MD3TableHeaderCell>
                  <MD3TableHeaderCell>種別</MD3TableHeaderCell>
                  <MD3TableHeaderCell>内容</MD3TableHeaderCell>
                  <MD3TableHeaderCell>状態</MD3TableHeaderCell>
                  <MD3TableHeaderCell align="center">操作</MD3TableHeaderCell>
                </MD3TableRow>
              </MD3TableHead>
              <MD3TableBody>
                {alerts.length === 0 ? (
                  <MD3TableRow hoverable={false}>
                    <MD3TableCell colSpan={5}>
                      <div style={{ textAlign: "center", padding: 32, color: md3.onSurfaceVariant }}>
                        アラートがありません
                      </div>
                    </MD3TableCell>
                  </MD3TableRow>
                ) : (
                  alerts.map((a) => (
                    <MD3TableRow key={a.id}>
                      <MD3TableCell>{new Date(a.created_at).toLocaleString("ja-JP")}</MD3TableCell>
                      <MD3TableCell>{alertTypes.find((t) => t.value === a.type)?.label || a.type}</MD3TableCell>
                      <MD3TableCell>{a.message}</MD3TableCell>
                      <MD3TableCell>
                        <MD3StatusBadge status={a.status === "pending" ? "warning" : "success"} label={a.status === "pending" ? "未対応" : "解決済"} />
                      </MD3TableCell>
                      <MD3TableCell align="center">
                        {a.status === "pending" ? (
                          <MD3Button variant="outlined" size="small" onClick={() => resolve(a.id)}>
                            解決
                          </MD3Button>
                        ) : (
                          <span style={{ color: md3.onSurfaceVariant, fontSize: 12 }}>-</span>
                        )}
                      </MD3TableCell>
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
