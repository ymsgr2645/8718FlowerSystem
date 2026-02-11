/**
 * 8718 Flower System - ロール定義
 *
 * admin   : 管理者（全機能 — ヘッダーに表示）
 * boss    : オーナー（経営管理 + 業務）
 * manager : マネージャー（業務管理）
 * staff   : スタッフ（基本業務のみ）
 */

export type UserRole = "admin" | "boss" | "manager" | "staff"

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "ADMIN",
  boss: "Boss",
  manager: "Manager",
  staff: "Staff",
}

const ROLE_ORDER: Record<UserRole, number> = {
  admin: 3,
  boss: 2,
  manager: 1,
  staff: 0,
}

/** ロール階層チェック: userRole が minRole 以上か */
export function hasMinRole(userRole: UserRole, minRole: UserRole): boolean {
  return ROLE_ORDER[userRole] >= ROLE_ORDER[minRole]
}

/** ADMIN専用 */
export const ADMIN_PATHS = ["/settings", "/admin"]

/** ミドルウェア用フォールバック（マトリクスが無い場合） */
export function canAccessPath(role: UserRole, pathname: string): boolean {
  if (role === "admin") return true
  if (ADMIN_PATHS.some((p) => pathname.startsWith(p))) return false
  return true
}

export function getDefaultPath(role: UserRole): string {
  return "/dashboard"
}

/** クライアント側: localStorageからロール取得 */
export function getRoleFromStorage(): UserRole {
  if (typeof window === "undefined") return "staff"
  try {
    const user = localStorage.getItem("8718_user")
    if (!user) return "staff"
    const parsed = JSON.parse(user)
    if (["admin", "boss", "manager", "staff"].includes(parsed.role)) {
      return parsed.role as UserRole
    }
    return "staff"
  } catch {
    return "staff"
  }
}

// ─── 権限マトリクス連携 ───

interface PermissionRow {
  feature: string
  boss: boolean
  manager: boolean
  staff: boolean
}

const PERM_STORAGE_KEY = "8718_permissions_matrix"

/** パス → 機能名のマッピング */
const PATH_TO_FEATURE: Record<string, string> = {
  "/dashboard": "ダッシュボード閲覧",
  "/arrivals": "入荷管理",
  "/bucket-paper": "カップ印刷",
  "/transfer-entry": "花持ち出し入力",
  "/supply-transfers": "資材持ち出し入力",
  "/warehouse": "倉庫在庫閲覧",
  "/disposals": "廃棄・ロス登録",
  "/expenses": "経費入力",
  "/invoice": "売上請求書",
  "/analytics": "分析・レポート",
  "/settings": "マスタ管理",
  "/admin/permissions": "ユーザー管理",
  "/system-settings": "システム設定",
}

/** localStorageから権限マトリクスを読み込み */
export function getPermissionsMatrix(): PermissionRow[] | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(PERM_STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

/** 機能名ベースで権限チェック */
export function isFeatureAllowed(role: UserRole, featureName: string): boolean {
  if (role === "admin") return true
  const matrix = getPermissionsMatrix()
  if (!matrix) return true // マトリクス未設定 → 全許可
  const row = matrix.find((r) => r.feature === featureName)
  if (!row) return true
  if (role === "boss") return row.boss
  if (role === "manager") return row.manager
  if (role === "staff") return row.staff
  return false
}

/** パスベースで権限チェック（クライアント側） */
export function isPathAllowedByMatrix(role: UserRole, pathname: string): boolean {
  if (role === "admin") return true
  // admin専用パスは管理セクション
  if (ADMIN_PATHS.some((p) => pathname.startsWith(p))) return false

  // 完全一致チェック
  const exactFeature = PATH_TO_FEATURE[pathname]
  if (exactFeature) return isFeatureAllowed(role, exactFeature)

  // プレフィックス一致（/admin/csv-import/xxx など）
  for (const [path, feature] of Object.entries(PATH_TO_FEATURE)) {
    if (pathname.startsWith(path + "/") || pathname === path) {
      return isFeatureAllowed(role, feature)
    }
  }

  return true
}

/** 権限マトリクスをCookieに同期（ミドルウェア用） */
export function syncPermissionsToCookie(matrix: PermissionRow[]) {
  const compact: Record<string, string[]> = { boss: [], manager: [], staff: [] }
  for (const row of matrix) {
    const path = Object.entries(PATH_TO_FEATURE).find(([, f]) => f === row.feature)?.[0]
    if (!path) continue
    if (row.boss) compact.boss.push(path)
    if (row.manager) compact.manager.push(path)
    if (row.staff) compact.staff.push(path)
  }
  document.cookie = `8718_perms=${encodeURIComponent(JSON.stringify(compact))}; path=/; max-age=86400`
}
