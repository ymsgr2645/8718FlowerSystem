"use client"

import { useEffect, useState } from "react"
import MD3AppLayout from "@/components/layout/MD3AppLayout"
import { MD3Card, MD3CardContent, MD3CardHeader, MD3CardTitle } from "@/components/md3/MD3Card"
import {
  MD3Table, MD3TableHead, MD3TableBody, MD3TableRow,
  MD3TableHeaderCell, MD3TableCell, MD3TableEmpty,
} from "@/components/md3/MD3Table"
import { md3, md3Shape } from "@/lib/md3-theme"
import { storesApi, settingsApi, type Store, type Supplier } from "@/lib/api"
import { Building2, Truck } from "lucide-react"

export default function CustomersPage() {
  const [stores, setStores] = useState<Store[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [tab, setTab] = useState<"stores" | "suppliers">("stores")

  useEffect(() => {
    storesApi.getAll().then(setStores).catch(() => {})
    settingsApi.getSuppliers().then(setSuppliers).catch(() => {})
  }, [])

  const opTypeLabel = (t: string) => {
    const map: Record<string, string> = { headquarters: "直営", franchise: "FC" }
    return map[t] || t
  }
  const storeTypeLabel = (t: string) => {
    const map: Record<string, string> = { store: "店舗", online: "通販", consignment: "委託" }
    return map[t] || t
  }

  return (
    <MD3AppLayout title="取引先管理" subtitle="店舗・仕入先の一覧">
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {([
          { key: "stores" as const, label: "取引店舗", icon: <Building2 size={16} /> },
          { key: "suppliers" as const, label: "仕入先", icon: <Truck size={16} /> },
        ]).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "8px 20px", borderRadius: md3Shape.full,
              border: "none", cursor: "pointer", fontSize: 14,
              fontWeight: tab === t.key ? 600 : 400,
              fontFamily: "'Zen Maru Gothic', sans-serif",
              backgroundColor: tab === t.key ? md3.primaryContainer : md3.surfaceContainerLow,
              color: tab === t.key ? md3.onPrimaryContainer : md3.onSurfaceVariant,
              transition: "all 200ms ease",
            }}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab === "stores" && (
        <MD3Card>
          <MD3CardHeader>
            <MD3CardTitle>取引店舗一覧 ({stores.length}件)</MD3CardTitle>
          </MD3CardHeader>
          <MD3CardContent>
            <MD3Table>
              <MD3TableHead>
                <MD3TableRow>
                  <MD3TableHeaderCell>ID</MD3TableHeaderCell>
                  <MD3TableHeaderCell>店舗名</MD3TableHeaderCell>
                  <MD3TableHeaderCell>運営形態</MD3TableHeaderCell>
                  <MD3TableHeaderCell>種別</MD3TableHeaderCell>
                  <MD3TableHeaderCell>メール</MD3TableHeaderCell>
                  <MD3TableHeaderCell>状態</MD3TableHeaderCell>
                </MD3TableRow>
              </MD3TableHead>
              <MD3TableBody>
                {stores.length === 0 ? (
                  <MD3TableEmpty colSpan={6} title="店舗データがありません" />
                ) : (
                  stores.map((s) => (
                    <MD3TableRow key={s.id}>
                      <MD3TableCell>{s.id}</MD3TableCell>
                      <MD3TableCell>{s.name}</MD3TableCell>
                      <MD3TableCell>
                        <span style={{
                          padding: "2px 8px", borderRadius: md3Shape.full, fontSize: 11,
                          backgroundColor: s.operation_type === "headquarters" ? md3.primaryContainer : md3.tertiaryContainer,
                          color: s.operation_type === "headquarters" ? md3.onPrimaryContainer : md3.onTertiaryContainer,
                        }}>
                          {opTypeLabel(s.operation_type)}
                        </span>
                      </MD3TableCell>
                      <MD3TableCell>{storeTypeLabel(s.store_type)}</MD3TableCell>
                      <MD3TableCell>{s.email || "-"}</MD3TableCell>
                      <MD3TableCell>
                        <span style={{
                          padding: "2px 8px", borderRadius: md3Shape.full, fontSize: 11,
                          backgroundColor: s.is_active ? md3.secondaryContainer : md3.errorContainer,
                          color: s.is_active ? md3.onSecondaryContainer : md3.onErrorContainer,
                        }}>
                          {s.is_active ? "有効" : "無効"}
                        </span>
                      </MD3TableCell>
                    </MD3TableRow>
                  ))
                )}
              </MD3TableBody>
            </MD3Table>
          </MD3CardContent>
        </MD3Card>
      )}

      {tab === "suppliers" && (
        <MD3Card>
          <MD3CardHeader>
            <MD3CardTitle>仕入先一覧 ({suppliers.length}件)</MD3CardTitle>
          </MD3CardHeader>
          <MD3CardContent>
            <MD3Table>
              <MD3TableHead>
                <MD3TableRow>
                  <MD3TableHeaderCell>ID</MD3TableHeaderCell>
                  <MD3TableHeaderCell>仕入先名</MD3TableHeaderCell>
                  <MD3TableHeaderCell>メール</MD3TableHeaderCell>
                  <MD3TableHeaderCell>CSVエンコード</MD3TableHeaderCell>
                  <MD3TableHeaderCell>CSVフォーマット</MD3TableHeaderCell>
                  <MD3TableHeaderCell>状態</MD3TableHeaderCell>
                </MD3TableRow>
              </MD3TableHead>
              <MD3TableBody>
                {suppliers.length === 0 ? (
                  <MD3TableEmpty colSpan={6} title="仕入先データがありません" />
                ) : (
                  suppliers.map((s) => (
                    <MD3TableRow key={s.id}>
                      <MD3TableCell>{s.id}</MD3TableCell>
                      <MD3TableCell>{s.name}</MD3TableCell>
                      <MD3TableCell>{s.email || "-"}</MD3TableCell>
                      <MD3TableCell>{s.csv_encoding}</MD3TableCell>
                      <MD3TableCell>{s.csv_format || "standard"}</MD3TableCell>
                      <MD3TableCell>
                        <span style={{
                          padding: "2px 8px", borderRadius: md3Shape.full, fontSize: 11,
                          backgroundColor: s.is_active ? md3.secondaryContainer : md3.errorContainer,
                          color: s.is_active ? md3.onSecondaryContainer : md3.onErrorContainer,
                        }}>
                          {s.is_active ? "有効" : "無効"}
                        </span>
                      </MD3TableCell>
                    </MD3TableRow>
                  ))
                )}
              </MD3TableBody>
            </MD3Table>
          </MD3CardContent>
        </MD3Card>
      )}
    </MD3AppLayout>
  )
}
