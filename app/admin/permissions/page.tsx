"use client"

import { useEffect, useState } from "react"
import MD3AppLayout from "@/components/layout/MD3AppLayout"
import { MD3Card, MD3CardContent, MD3CardHeader, MD3CardTitle } from "@/components/md3/MD3Card"
import { MD3Button } from "@/components/md3/MD3Button"
import { MD3Table, MD3TableHeaderCell, MD3TableCell, MD3TableRow } from "@/components/md3/MD3Table"
import { md3, md3Shape } from "@/lib/md3-theme"
import { syncPermissionsToCookie } from "@/lib/roles"
import { storesApi, type Store } from "@/lib/api"
import { Shield, Users, Save, RotateCcw } from "lucide-react"

interface UserData {
  id: number
  email: string
  display_name: string
  role: string
  store_id: number | null
  is_active: boolean
}

type RoleKey = "boss" | "manager" | "staff"

interface PermissionRow {
  feature: string
  boss: boolean
  manager: boolean
  staff: boolean
}

const DEFAULT_PERMISSIONS: PermissionRow[] = [
  { feature: "ダッシュボード閲覧", boss: true, manager: true, staff: true },
  { feature: "入荷管理", boss: true, manager: true, staff: true },
  { feature: "カップ印刷", boss: true, manager: true, staff: false },
  { feature: "花持ち出し入力", boss: true, manager: true, staff: false },
  { feature: "資材持ち出し入力", boss: true, manager: true, staff: false },
  { feature: "倉庫在庫閲覧", boss: true, manager: true, staff: true },
  { feature: "廃棄・ロス登録", boss: true, manager: true, staff: false },
  { feature: "経費入力", boss: true, manager: true, staff: false },
  { feature: "売上請求書", boss: true, manager: false, staff: false },
  { feature: "分析・レポート", boss: true, manager: false, staff: false },
  { feature: "マスタ管理", boss: true, manager: false, staff: false },
  { feature: "ユーザー管理", boss: true, manager: false, staff: false },
  { feature: "システム設定", boss: true, manager: false, staff: false },
]

const STORAGE_KEY = "8718_permissions_matrix"

function loadPermissions(): PermissionRow[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_PERMISSIONS.map((p) => ({ ...p }))
    return JSON.parse(raw)
  } catch {
    return DEFAULT_PERMISSIONS.map((p) => ({ ...p }))
  }
}

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onChange}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: 44,
        height: 24,
        borderRadius: 12,
        border: checked ? "none" : `2px solid ${md3.outline}`,
        backgroundColor: checked ? md3.primary : hovered ? md3.surfaceContainerHighest : md3.surfaceContainerHigh,
        cursor: "pointer",
        position: "relative",
        transition: "all 200ms ease",
        padding: 0,
      }}
    >
      <span
        style={{
          display: "block",
          width: checked ? 18 : 14,
          height: checked ? 18 : 14,
          borderRadius: "50%",
          backgroundColor: checked ? md3.onPrimary : md3.outline,
          position: "absolute",
          top: "50%",
          left: checked ? "calc(100% - 21px)" : "3px",
          transform: "translateY(-50%)",
          transition: "all 200ms ease",
        }}
      />
    </button>
  )
}

export default function PermissionsPage() {
  const [users, setUsers] = useState<UserData[]>([])
  const [stores, setStores] = useState<Store[]>([])
  const [tab, setTab] = useState<"users" | "matrix">("matrix")
  const [permissions, setPermissions] = useState<PermissionRow[]>([])
  const [saved, setSaved] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    storesApi.getAll().then((storeData) => {
      setStores(storeData)
      setUsers([
        { id: 1, email: "admin@8718.jp", display_name: "管理者", role: "admin", store_id: null, is_active: true },
        { id: 2, email: "hanaichiya@8718.jp", display_name: "花市屋", role: "boss", store_id: null, is_active: true },
        { id: 3, email: "410@8718.jp", display_name: "本部管理", role: "manager", store_id: null, is_active: true },
        ...storeData.map((s: Store, i: number) => ({
          id: 10 + i,
          email: s.email || `${s.name}@8718.jp`,
          display_name: s.name,
          role: "staff",
          store_id: s.id,
          is_active: s.is_active,
        })),
      ])
    }).catch(() => {})
    setPermissions(loadPermissions())
  }, [])

  const handleToggle = (featureIndex: number, role: RoleKey) => {
    setPermissions((prev) =>
      prev.map((row, i) =>
        i === featureIndex ? { ...row, [role]: !row[role] } : row
      )
    )
    setHasChanges(true)
    setSaved(false)
  }

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(permissions))
    syncPermissionsToCookie(permissions)
    setSaved(true)
    setHasChanges(false)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleReset = () => {
    const defaults = DEFAULT_PERMISSIONS.map((p) => ({ ...p }))
    setPermissions(defaults)
    setHasChanges(true)
    setSaved(false)
  }

  const roleBadge = (role: string) => {
    const config: Record<string, { bg: string; color: string; label: string }> = {
      admin: { bg: md3.errorContainer, color: md3.onErrorContainer, label: "Admin" },
      boss: { bg: md3.primaryContainer, color: md3.onPrimaryContainer, label: "Boss" },
      manager: { bg: md3.secondaryContainer, color: md3.onSecondaryContainer, label: "Manager" },
      staff: { bg: md3.surfaceContainerHigh, color: md3.onSurface, label: "Staff" },
    }
    const c = config[role] || { bg: md3.surfaceContainerHigh, color: md3.onSurface, label: role }
    return (
      <span style={{
        padding: "2px 10px",
        borderRadius: md3Shape.full,
        fontSize: 12,
        fontWeight: 500,
        backgroundColor: c.bg,
        color: c.color,
        fontFamily: "'Zen Maru Gothic', sans-serif",
      }}>
        {c.label}
      </span>
    )
  }

  return (
    <MD3AppLayout title="権限設定" subtitle="ユーザーロールとアクセス権限の管理">
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {([
          { key: "matrix" as const, label: "権限マトリクス", icon: <Shield size={16} /> },
          { key: "users" as const, label: "ユーザー管理", icon: <Users size={16} /> },
        ]).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 20px",
              borderRadius: md3Shape.full,
              border: "none",
              cursor: "pointer",
              fontSize: 14,
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

      {tab === "users" && (
        <MD3Card>
          <MD3CardHeader style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <MD3CardTitle>ユーザー一覧</MD3CardTitle>
          </MD3CardHeader>
          <MD3CardContent>
            <MD3Table>
              <thead>
                <MD3TableRow>
                  <MD3TableHeaderCell>名前</MD3TableHeaderCell>
                  <MD3TableHeaderCell>メール</MD3TableHeaderCell>
                  <MD3TableHeaderCell>ロール</MD3TableHeaderCell>
                  <MD3TableHeaderCell>所属店舗</MD3TableHeaderCell>
                  <MD3TableHeaderCell>状態</MD3TableHeaderCell>
                </MD3TableRow>
              </thead>
              <tbody>
                {users.map((u) => (
                  <MD3TableRow key={u.id}>
                    <MD3TableCell highlight>{u.display_name}</MD3TableCell>
                    <MD3TableCell><span style={{ fontSize: 13, fontFamily: "monospace" }}>{u.email}</span></MD3TableCell>
                    <MD3TableCell>{roleBadge(u.role)}</MD3TableCell>
                    <MD3TableCell>{stores.find((s) => s.id === u.store_id)?.name || "全店舗"}</MD3TableCell>
                    <MD3TableCell>
                      <span style={{
                        padding: "2px 8px",
                        borderRadius: md3Shape.full,
                        fontSize: 11,
                        backgroundColor: u.is_active ? md3.secondaryContainer : md3.errorContainer,
                        color: u.is_active ? md3.onSecondaryContainer : md3.onErrorContainer,
                      }}>
                        {u.is_active ? "有効" : "無効"}
                      </span>
                    </MD3TableCell>
                  </MD3TableRow>
                ))}
              </tbody>
            </MD3Table>
          </MD3CardContent>
        </MD3Card>
      )}

      {tab === "matrix" && (
        <MD3Card>
          <MD3CardHeader>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
              <MD3CardTitle>機能別アクセス権限</MD3CardTitle>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {saved && (
                  <span style={{
                    fontSize: 13, color: md3.primary, fontWeight: 500,
                    fontFamily: "'Zen Maru Gothic', sans-serif",
                  }}>
                    保存しました
                  </span>
                )}
                <MD3Button variant="text" onClick={handleReset}>
                  <RotateCcw size={14} /> デフォルトに戻す
                </MD3Button>
                <MD3Button variant="filled" onClick={handleSave} disabled={!hasChanges}>
                  <Save size={16} /> 保存
                </MD3Button>
              </div>
            </div>
          </MD3CardHeader>
          <MD3CardContent>
            <MD3Table>
              <thead>
                <MD3TableRow>
                  <MD3TableHeaderCell>機能</MD3TableHeaderCell>
                  <MD3TableHeaderCell align="center">Boss</MD3TableHeaderCell>
                  <MD3TableHeaderCell align="center">Manager</MD3TableHeaderCell>
                  <MD3TableHeaderCell align="center">Staff</MD3TableHeaderCell>
                </MD3TableRow>
              </thead>
              <tbody>
                {permissions.map((p, idx) => (
                  <MD3TableRow key={p.feature}>
                    <MD3TableCell highlight>{p.feature}</MD3TableCell>
                    {(["boss", "manager", "staff"] as const).map((role) => (
                      <MD3TableCell key={role} align="center">
                        <ToggleSwitch
                          checked={p[role]}
                          onChange={() => handleToggle(idx, role)}
                        />
                      </MD3TableCell>
                    ))}
                  </MD3TableRow>
                ))}
              </tbody>
            </MD3Table>
            <p style={{
              marginTop: 16,
              fontSize: 12,
              color: md3.onSurfaceVariant,
              fontFamily: "'Zen Maru Gothic', sans-serif",
            }}>
              ※ 変更後は「保存」ボタンを押してください。Adminは全機能にアクセスできます。
            </p>
          </MD3CardContent>
        </MD3Card>
      )}
    </MD3AppLayout>
  )
}
