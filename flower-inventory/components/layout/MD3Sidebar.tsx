"use client"

import { useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { md3, md3Shape } from "@/lib/md3-theme"
import {
  LayoutDashboard,
  Package,
  Truck,
  FileText,
  Settings,
  Flower2,
  LogOut,
  ClipboardList,
  AlertTriangle,
  Boxes,
  Warehouse,
  Edit3,
  Users,
  Shield,
  Database,
  Store,
  ShoppingBag,
  Send,
  PaintBucket,
} from "lucide-react"

export const DRAWER_WIDTH = 280

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
}

const mainNavItems: NavItem[] = [
  { label: "ダッシュボード", href: "/dashboard", icon: <LayoutDashboard size={22} /> },
  { label: "入荷管理", href: "/arrivals", icon: <Warehouse size={22} /> },
  { label: "カップ印刷", href: "/bucket-paper", icon: <PaintBucket size={22} /> },
  { label: "花持ち出し", href: "/transfer-entry", icon: <Edit3 size={22} /> },
  { label: "資材持ち出し", href: "/supply-transfers", icon: <Send size={22} /> },
  { label: "倉庫在庫", href: "/warehouse", icon: <Boxes size={22} /> },
  { label: "持ち出し履歴", href: "/transfer", icon: <Truck size={22} /> },
  { label: "売上請求書", href: "/invoice", icon: <FileText size={22} /> },
  { label: "経費入力", href: "/expenses", icon: <ClipboardList size={22} /> },
  { label: "廃棄・ロス", href: "/disposals", icon: <Package size={22} /> },
  { label: "エラーアラート", href: "/alerts", icon: <AlertTriangle size={22} /> },
]

const adminNavItems: NavItem[] = [
  { label: "マスタ管理", href: "/settings", icon: <Database size={22} /> },
  { label: "権限設定", href: "/admin/permissions", icon: <Shield size={22} /> },
]

const settingsNavItem: NavItem = {
  label: "設定",
  href: "/system-settings",
  icon: <Settings size={22} />,
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
  const [logoutHovered, setLogoutHovered] = useState(false)

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard" || pathname === "/"
    return pathname.startsWith(href)
  }

  const handleLogout = () => {
    document.cookie = "8718_auth=; path=/; max-age=0"
    localStorage.removeItem("8718_user")
    router.push("/login")
  }

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
        {mainNavItems.map((item) => (
          <NavItemLink key={item.href} item={item} isActive={isActive(item.href)} />
        ))}

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
      </nav>

      <div style={{ height: 1, backgroundColor: md3.outlineVariant, margin: "0 20px" }} />

      <div style={{ padding: "8px 0 12px 0" }}>
        <NavItemLink item={settingsNavItem} isActive={isActive(settingsNavItem.href)} />
        <button
          onClick={handleLogout}
          onMouseEnter={() => setLogoutHovered(true)}
          onMouseLeave={() => setLogoutHovered(false)}
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
            backgroundColor: logoutHovered ? "rgba(186, 26, 26, 0.08)" : "transparent",
            fontFamily: "'Zen Maru Gothic', sans-serif",
            fontSize: 14,
            fontWeight: 400,
            color: md3.error,
            cursor: "pointer",
            transition: "all 200ms cubic-bezier(0.2, 0, 0, 1)",
            transform: logoutHovered ? "translateX(4px)" : "translateX(0)",
          }}
        >
          <LogOut size={22} />
          <span>ログアウト</span>
        </button>
      </div>
    </aside>
  )
}
