"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "motion/react"
import { md3, md3Shape } from "@/lib/md3-theme"
import { getRoleFromStorage, isFeatureAllowed, type UserRole } from "@/lib/roles"
import {
  LayoutDashboard,
  FileText,
  Settings,
  Flower2,
  LogOut,
  ClipboardList,
  AlertTriangle,
  Boxes,
  Warehouse,
  Truck,
  Shield,
  Database,
  Store,
  Send,
  PaintBucket,
  HardDrive,
  BookOpen,
  GripVertical,
} from "lucide-react"

export const DRAWER_WIDTH = 280

const STORAGE_KEY = "8718_sidebar_order"

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
  featureKey?: string
}

const DEFAULT_MAIN_NAV: NavItem[] = [
  { label: "ダッシュボード", href: "/dashboard", icon: <LayoutDashboard size={22} />, featureKey: "ダッシュボード閲覧" },
  { label: "入荷管理", href: "/arrivals", icon: <Truck size={22} />, featureKey: "入荷管理" },
  { label: "カップ印刷", href: "/bucket-paper", icon: <PaintBucket size={22} />, featureKey: "カップ印刷" },
  { label: "持ち出し", href: "/transfer-entry", icon: <Send size={22} />, featureKey: "花持ち出し入力" },
  { label: "倉庫在庫", href: "/warehouse", icon: <Warehouse size={22} />, featureKey: "倉庫在庫閲覧" },
  { label: "請求書発行", href: "/invoice", icon: <FileText size={22} />, featureKey: "売上請求書" },
  { label: "経費入力", href: "/expenses", icon: <ClipboardList size={22} />, featureKey: "経費入力" },
  { label: "エラーアラート", href: "/alerts", icon: <AlertTriangle size={22} /> },
  { label: "分析・レポート", href: "/analytics", icon: <Flower2 size={22} />, featureKey: "分析・レポート" },
]

const adminNavItems: NavItem[] = [
  { label: "マスタ管理", href: "/settings", icon: <Database size={22} /> },
  { label: "花カタログ", href: "/admin/flower-catalog", icon: <BookOpen size={22} /> },
  { label: "権限設定", href: "/admin/permissions", icon: <Shield size={22} /> },
  { label: "バックアップ", href: "/admin/backup", icon: <HardDrive size={22} /> },
  { label: "店舗ポータル", href: "/store", icon: <Store size={22} /> },
]

const settingsNavItem: NavItem = {
  label: "設定",
  href: "/system-settings",
  icon: <Settings size={22} />,
}

function loadSavedOrder(): string[] | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) return JSON.parse(saved)
  } catch { /* ignore */ }
  return null
}

function saveOrder(hrefs: string[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(hrefs))
  } catch { /* ignore */ }
}

function reorderByHrefs(items: NavItem[], savedHrefs: string[]): NavItem[] {
  const itemMap = new Map(items.map((item) => [item.href, item]))
  const ordered: NavItem[] = []
  for (const href of savedHrefs) {
    const item = itemMap.get(href)
    if (item) {
      ordered.push(item)
      itemMap.delete(href)
    }
  }
  // 新しく追加されたアイテムは末尾に
  for (const item of itemMap.values()) {
    ordered.push(item)
  }
  return ordered
}

function DraggableNavItem({
  item,
  isActive,
  index,
  shortcutKey,
  dragIndex,
  dropIndex,
  onDragStart,
  onDragOver,
  onDragEnd,
  onDrop,
}: {
  item: NavItem
  isActive: boolean
  index: number
  shortcutKey?: number
  dragIndex: number | null
  dropIndex: number | null
  onDragStart: (i: number) => void
  onDragOver: (e: React.DragEvent, i: number) => void
  onDragEnd: () => void
  onDrop: (e: React.DragEvent) => void
}) {
  const [isHovered, setIsHovered] = useState(false)
  const isDragging = dragIndex === index
  const isDropTarget = dropIndex === index && dragIndex !== index

  return (
    <div
      draggable
      onDragStart={() => onDragStart(index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDragEnd={onDragEnd}
      onDrop={onDrop}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        opacity: isDragging ? 0.4 : 1,
        transition: "opacity 150ms ease",
      }}
    >
      {isDropTarget && (
        <div style={{
          height: 2,
          backgroundColor: md3.primary,
          margin: "0 24px",
          borderRadius: 1,
        }} />
      )}
      <Link
        href={item.href}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 16px",
          marginLeft: 12,
          marginRight: 12,
          marginBottom: 4,
          borderRadius: 20,
          textDecoration: "none",
          fontFamily: "'Zen Maru Gothic', sans-serif",
          fontSize: 14,
          fontWeight: isActive ? 600 : 400,
          transition: "all 200ms cubic-bezier(0.2, 0, 0, 1)",
          backgroundColor: isActive
            ? md3.primaryContainer
            : isHovered
            ? "rgba(192, 99, 74, 0.08)"
            : "transparent",
          color: isActive ? md3.onPrimaryContainer : md3.onSurfaceVariant,
          transform: isHovered && !isActive ? "translateX(4px)" : "translateX(0)",
          cursor: "grab",
        }}
        onClick={(e) => {
          // ドラッグ中はナビゲーションしない
          if (isDragging) e.preventDefault()
        }}
      >
        <span
          style={{
            display: "flex",
            color: isHovered ? md3.outline : "transparent",
            transition: "color 150ms ease",
            marginLeft: -4,
            cursor: "grab",
          }}
        >
          <GripVertical size={14} />
        </span>
        <span style={{ display: "flex", color: isActive ? md3.onPrimaryContainer : md3.onSurfaceVariant }}>
          {item.icon}
        </span>
        <span style={{ flex: 1 }}>{item.label}</span>
        {shortcutKey && (
          <span
            style={{
              fontSize: 10,
              fontWeight: 500,
              color: isHovered ? md3.outline : "transparent",
              backgroundColor: isHovered ? md3.surfaceContainerHighest : "transparent",
              borderRadius: 4,
              padding: "1px 5px",
              fontFamily: "monospace",
              transition: "all 150ms ease",
            }}
          >
            {shortcutKey}
          </span>
        )}
      </Link>
    </div>
  )
}

function NavItemLink({ item, isActive }: { item: NavItem; isActive: boolean }) {
  const [isHovered, setIsHovered] = useState(false)
  return (
    <Link
      href={item.href}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 16px",
        marginLeft: 12,
        marginRight: 12,
        marginBottom: 4,
        borderRadius: 20,
        textDecoration: "none",
        fontFamily: "'Zen Maru Gothic', sans-serif",
        fontSize: 14,
        fontWeight: isActive ? 600 : 400,
        transition: "all 200ms cubic-bezier(0.2, 0, 0, 1)",
        backgroundColor: isActive
          ? md3.primaryContainer
          : isHovered
          ? "rgba(192, 99, 74, 0.08)"
          : "transparent",
        color: isActive ? md3.onPrimaryContainer : md3.onSurfaceVariant,
        transform: isHovered && !isActive ? "translateX(4px)" : "translateX(0)",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <span style={{ display: "flex", color: isActive ? md3.onPrimaryContainer : md3.onSurfaceVariant }}>
        {item.icon}
      </span>
      <span>{item.label}</span>
    </Link>
  )
}

export default function MD3Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [role, setRole] = useState<UserRole>("staff")
  const [mainNavItems, setMainNavItems] = useState<NavItem[]>(DEFAULT_MAIN_NAV)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dropIndex, setDropIndex] = useState<number | null>(null)

  useEffect(() => {
    setRole(getRoleFromStorage())
    const savedOrder = loadSavedOrder()
    if (savedOrder) {
      setMainNavItems(reorderByHrefs(DEFAULT_MAIN_NAV, savedOrder))
    }
  }, [])

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard" || pathname === "/"
    return pathname.startsWith(href)
  }

  const handleLogout = () => {
    document.cookie = "8718_auth=; path=/; max-age=0"
    localStorage.removeItem("8718_user")
    router.push("/login")
  }

  const handleDragStart = useCallback((index: number) => {
    setDragIndex(index)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault()
    setDropIndex(index)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    if (dragIndex === null || dropIndex === null || dragIndex === dropIndex) {
      setDragIndex(null)
      setDropIndex(null)
      return
    }
    setMainNavItems((prev) => {
      const next = [...prev]
      const [removed] = next.splice(dragIndex, 1)
      next.splice(dropIndex > dragIndex ? dropIndex - 1 : dropIndex, 0, removed)
      saveOrder(next.map((item) => item.href))
      return next
    })
    setDragIndex(null)
    setDropIndex(null)
  }, [dragIndex, dropIndex])

  const handleDragEnd = useCallback(() => {
    setDragIndex(null)
    setDropIndex(null)
  }, [])

  const visibleMainItems = mainNavItems.filter((item) => {
    if (!item.featureKey) return true
    return isFeatureAllowed(role, item.featureKey)
  })

  // 数字キー 1-9 でナビゲーション（View Transition付き）
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // input/textarea/contenteditable 内では無効
      const tag = (e.target as HTMLElement).tagName
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement).isContentEditable) return
      // 修飾キーとの組み合わせは無視
      if (e.ctrlKey || e.metaKey || e.altKey) return

      const num = parseInt(e.key)
      if (num >= 1 && num <= 9 && num <= visibleMainItems.length) {
        e.preventDefault()
        const href = visibleMainItems[num - 1].href
        const doc = document as Document & { startViewTransition?: (cb: () => void) => void }
        if (doc.startViewTransition) {
          doc.startViewTransition(() => router.push(href))
        } else {
          router.push(href)
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [visibleMainItems, router])

  const showAdmin = role === "admin"

  return (
    <aside
      style={{
        position: "fixed",
        left: 0,
        top: 0,
        height: "100vh",
        width: DRAWER_WIDTH,
        backgroundColor: md3.surface,
        display: "flex",
        flexDirection: "column",
        borderRight: `1px solid ${md3.outlineVariant}`,
        fontFamily: "'Zen Maru Gothic', sans-serif",
      }}
    >
      <div style={{ padding: "20px 20px 16px 20px", display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: md3Shape.medium,
            backgroundColor: md3.primary,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Flower2 size={24} color={md3.onPrimary} strokeWidth={1.5} />
        </div>
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: 22,
              fontWeight: 700,
              color: md3.onSurface,
              fontFamily: "'Abhaya Libre', serif",
              letterSpacing: 1,
              lineHeight: 1.2,
            }}
          >
            8718
          </h1>
          <p
            style={{
              margin: 0,
              fontSize: 10,
              color: md3.onSurfaceVariant,
              fontFamily: "'IBM Plex Sans JP', sans-serif",
              letterSpacing: 0.5,
              textTransform: "uppercase",
            }}
          >
            FLOWER SYSTEM
          </p>
        </div>
      </div>

      <div style={{ height: 1, backgroundColor: md3.outlineVariant, margin: "0 20px" }} />

      <nav style={{ flex: 1, paddingTop: 8, overflowY: "auto" }}>
        {visibleMainItems.map((item, index) => (
          <DraggableNavItem
            key={item.href}
            item={item}
            isActive={isActive(item.href)}
            index={index}
            shortcutKey={index < 9 ? index + 1 : undefined}
            dragIndex={dragIndex}
            dropIndex={dropIndex}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            onDrop={handleDrop}
          />
        ))}

        {showAdmin && (
          <>
            <div style={{ height: 1, backgroundColor: md3.outlineVariant, margin: "12px 12px" }} />
            <p
              style={{
                padding: "8px 16px",
                marginLeft: 12,
                fontSize: 11,
                fontWeight: 600,
                color: md3.onSurfaceVariant,
                letterSpacing: 0.5,
                margin: 0,
              }}
            >
              管理
            </p>
            {adminNavItems.map((item) => (
              <NavItemLink key={item.href} item={item} isActive={isActive(item.href)} />
            ))}
          </>
        )}
      </nav>

      <div style={{ height: 1, backgroundColor: md3.outlineVariant, margin: "0 20px" }} />

      <div style={{ padding: "8px 0 12px 0" }}>
        <NavItemLink item={settingsNavItem} isActive={isActive(settingsNavItem.href)} />
        <motion.button
          onClick={handleLogout}
          whileHover={{ backgroundColor: "rgba(186, 26, 26, 0.08)", x: 4 }}
          whileTap={{ scale: 0.97 }}
          transition={{ duration: 0.2 }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            width: "calc(100% - 24px)",
            padding: "10px 16px",
            marginLeft: 12,
            marginRight: 12,
            borderRadius: 20,
            border: "none",
            backgroundColor: "transparent",
            fontFamily: "'Zen Maru Gothic', sans-serif",
            fontSize: 14,
            fontWeight: 400,
            color: md3.error,
            cursor: "pointer",
          }}
        >
          <LogOut size={22} />
          <span>ログアウト</span>
        </motion.button>
      </div>
    </aside>
  )
}
