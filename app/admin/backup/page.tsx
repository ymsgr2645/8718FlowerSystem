"use client"

import { useState, useEffect } from "react"
import MD3AppLayout from "@/components/layout/MD3AppLayout"
import { MD3Card, MD3CardContent, MD3CardHeader, MD3CardTitle } from "@/components/md3/MD3Card"
import { MD3Button } from "@/components/md3/MD3Button"
import {
  MD3Table, MD3TableHead, MD3TableBody, MD3TableRow,
  MD3TableHeaderCell, MD3TableCell, MD3TableEmpty,
} from "@/components/md3/MD3Table"
import { md3, md3Shape } from "@/lib/md3-theme"
import { Database, Download, Clock, Trash2 } from "lucide-react"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
const STORAGE_KEY = "8718_backup_history"

interface BackupRecord {
  id: string
  type: "db" | "csv"
  timestamp: string
  filename: string
  status: "success" | "failed"
}

function loadHistory(): BackupRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveHistory(records: BackupRecord[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
}

function addRecord(type: "db" | "csv", filename: string, status: "success" | "failed"): BackupRecord[] {
  const history = loadHistory()
  const record: BackupRecord = {
    id: crypto.randomUUID(),
    type,
    timestamp: new Date().toISOString(),
    filename,
    status,
  }
  const updated = [record, ...history].slice(0, 50)
  saveHistory(updated)
  return updated
}

export default function BackupPage() {
  const [status, setStatus] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState<BackupRecord[]>([])

  useEffect(() => {
    setHistory(loadHistory())
  }, [])

  const handleExport = async () => {
    setLoading(true)
    setStatus(null)
    const filename = `8718_backup_${new Date().toISOString().slice(0, 10)}.db`
    try {
      const res = await fetch(`${API_BASE}/api/backup/export`)
      if (!res.ok) throw new Error("Export failed")
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
      setStatus("データベースのエクスポートが完了しました")
      setHistory(addRecord("db", filename, "success"))
    } catch {
      setStatus("エクスポートに失敗しました。バックエンドが起動していることを確認してください。")
      setHistory(addRecord("db", filename, "failed"))
    } finally {
      setLoading(false)
    }
  }

  const handleExportCSV = async () => {
    setLoading(true)
    setStatus(null)
    const filename = `8718_data_${new Date().toISOString().slice(0, 10)}.zip`
    try {
      const res = await fetch(`${API_BASE}/api/backup/export-csv`)
      if (!res.ok) throw new Error("Export failed")
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
      setStatus("CSVエクスポートが完了しました")
      setHistory(addRecord("csv", filename, "success"))
    } catch {
      setStatus("CSVエクスポートに失敗しました。バックエンドが起動していることを確認してください。")
      setHistory(addRecord("csv", filename, "failed"))
    } finally {
      setLoading(false)
    }
  }

  const handleClearHistory = () => {
    saveHistory([])
    setHistory([])
  }

  const formatTimestamp = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleString("ja-JP", {
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit",
    })
  }

  return (
    <MD3AppLayout title="バックアップ" subtitle="データのエクスポート・インポート">
      {status && (
        <div style={{
          padding: "12px 20px", marginBottom: 20,
          borderRadius: md3Shape.medium,
          backgroundColor: status.includes("失敗") ? md3.errorContainer : md3.secondaryContainer,
          color: status.includes("失敗") ? md3.onErrorContainer : md3.onSecondaryContainer,
          fontFamily: "'Zen Maru Gothic', sans-serif",
          fontSize: 14,
        }}>
          {status}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20, marginBottom: 24 }}>
        <MD3Card>
          <MD3CardHeader>
            <MD3CardTitle>データベースバックアップ</MD3CardTitle>
          </MD3CardHeader>
          <MD3CardContent>
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{
                width: 56, height: 56, borderRadius: "50%",
                backgroundColor: md3.primaryContainer, display: "inline-flex",
                alignItems: "center", justifyContent: "center", marginBottom: 16,
              }}>
                <Database size={28} color={md3.onPrimaryContainer} />
              </div>
              <p style={{ color: md3.onSurfaceVariant, fontSize: 13, marginBottom: 20 }}>
                SQLiteデータベース全体をダウンロードします。<br />
                全テーブルのデータが含まれます。
              </p>
              <MD3Button variant="filled" onClick={handleExport} disabled={loading}>
                <Download size={16} /> {loading ? "処理中..." : "DBエクスポート"}
              </MD3Button>
            </div>
          </MD3CardContent>
        </MD3Card>

        <MD3Card>
          <MD3CardHeader>
            <MD3CardTitle>CSVエクスポート</MD3CardTitle>
          </MD3CardHeader>
          <MD3CardContent>
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{
                width: 56, height: 56, borderRadius: "50%",
                backgroundColor: md3.secondaryContainer, display: "inline-flex",
                alignItems: "center", justifyContent: "center", marginBottom: 16,
              }}>
                <Download size={28} color={md3.onSecondaryContainer} />
              </div>
              <p style={{ color: md3.onSurfaceVariant, fontSize: 13, marginBottom: 20 }}>
                各テーブルのデータをCSV形式で<br />
                ZIPファイルとしてダウンロードします。
              </p>
              <MD3Button variant="tonal" onClick={handleExportCSV} disabled={loading}>
                <Download size={16} /> {loading ? "処理中..." : "CSVエクスポート"}
              </MD3Button>
            </div>
          </MD3CardContent>
        </MD3Card>

        <MD3Card>
          <MD3CardHeader>
            <MD3CardTitle>バックアップ情報</MD3CardTitle>
          </MD3CardHeader>
          <MD3CardContent>
            <div style={{ padding: "12px 0" }}>
              {[
                { label: "データベース種別", value: "SQLite (Phase 1)" },
                { label: "保存場所", value: "backend/8718flower.db" },
                { label: "現在の日時", value: new Date().toLocaleString("ja-JP") },
              ].map((info) => (
                <div key={info.label} style={{
                  display: "flex", justifyContent: "space-between",
                  padding: "8px 0", borderBottom: `1px solid ${md3.outlineVariant}`,
                }}>
                  <span style={{ color: md3.onSurfaceVariant, fontSize: 13 }}>{info.label}</span>
                  <span style={{ color: md3.onSurface, fontSize: 13, fontWeight: 500 }}>{info.value}</span>
                </div>
              ))}
              <p style={{
                marginTop: 16, fontSize: 12, color: md3.onSurfaceVariant,
                fontFamily: "'Zen Maru Gothic', sans-serif",
              }}>
                ※ 定期的にバックアップを取ることをお勧めします。<br />
                Phase 2でクラウドバックアップに移行予定です。
              </p>
            </div>
          </MD3CardContent>
        </MD3Card>
      </div>

      {/* バックアップ履歴 */}
      <MD3Card>
        <MD3CardHeader>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
            <MD3CardTitle style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Clock size={20} color={md3.primary} />
              バックアップ履歴
            </MD3CardTitle>
            {history.length > 0 && (
              <MD3Button variant="text" onClick={handleClearHistory} style={{ fontSize: 12 }}>
                <Trash2 size={14} /> 履歴をクリア
              </MD3Button>
            )}
          </div>
        </MD3CardHeader>
        <MD3CardContent>
          <MD3Table>
            <MD3TableHead>
              <MD3TableRow>
                <MD3TableHeaderCell>日時</MD3TableHeaderCell>
                <MD3TableHeaderCell>種別</MD3TableHeaderCell>
                <MD3TableHeaderCell>ファイル名</MD3TableHeaderCell>
                <MD3TableHeaderCell>結果</MD3TableHeaderCell>
              </MD3TableRow>
            </MD3TableHead>
            <MD3TableBody>
              {history.length === 0 ? (
                <MD3TableEmpty colSpan={4} title="バックアップ履歴がありません" />
              ) : (
                history.map((r) => (
                  <MD3TableRow key={r.id}>
                    <MD3TableCell>{formatTimestamp(r.timestamp)}</MD3TableCell>
                    <MD3TableCell>
                      <span style={{
                        padding: "2px 8px", borderRadius: md3Shape.full, fontSize: 11,
                        backgroundColor: r.type === "db" ? md3.primaryContainer : md3.secondaryContainer,
                        color: r.type === "db" ? md3.onPrimaryContainer : md3.onSecondaryContainer,
                      }}>
                        {r.type === "db" ? "DB" : "CSV"}
                      </span>
                    </MD3TableCell>
                    <MD3TableCell>{r.filename}</MD3TableCell>
                    <MD3TableCell>
                      <span style={{
                        padding: "2px 8px", borderRadius: md3Shape.full, fontSize: 11,
                        backgroundColor: r.status === "success" ? md3.secondaryContainer : md3.errorContainer,
                        color: r.status === "success" ? md3.onSecondaryContainer : md3.onErrorContainer,
                      }}>
                        {r.status === "success" ? "成功" : "失敗"}
                      </span>
                    </MD3TableCell>
                  </MD3TableRow>
                ))
              )}
            </MD3TableBody>
          </MD3Table>
        </MD3CardContent>
      </MD3Card>
    </MD3AppLayout>
  )
}
