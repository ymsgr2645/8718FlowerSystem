"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { md3, md3Shape, md3StateLayer } from "@/lib/md3-theme"
import {
  LayoutDashboard,
  Warehouse,
  Package,
  Truck,
  FileText,
  BarChart3,
  Settings,
  Users,
  Shield,
  Database,
  Flower2,
} from "lucide-react"
import { useState } from "react"

const DRAWER_WIDTH = 280

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
  adminOnly?: boolean
}

const mainNavItems: NavItem[] = [
  { label: "ダッシュボード", href: "/dashboard", icon: <LayoutDashboard size={20} /> },
  { label: "本部倉庫", href: "/warehouse", icon: <Warehouse size={20} /> },
  { label: "在庫管理", href: "/inventory", icon: <Package size={20} /> },
  { label: "持ち出し", href: "/transfer", icon: <Truck size={20} /> },
  { label: "請求書", href: "/invoice", icon: <FileText size={20} /> },
  { label: "集計", href: "/analytics", icon: <BarChart3 size={20} /> },
]

const adminNavItems: NavItem[] = [
  { label: "ユーザー管理", href: "/admin/users", icon: <Users size={20} />, adminOnly: true },
  { label: "権限設定", href: "/admin/permissions", icon: <Shield size={20} />, adminOnly: true },
  { label: "バックアップ", href: "/admin/backup", icon: <Database size={20} />, adminOnly: true },
]

interface MD3SidebarProps {
  isAdmin?: boolean
}

export function MD3Sidebar({ isAdmin = true }: MD3SidebarProps) {
  const pathname = usePathname()
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard" || pathname === "/"
    }
    return pathname.startsWith(href)
  }

  const getItemStyle = (href: string, isHovered: boolean) => {
    const active = isActive(href)

    return {
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "12px 16px",
      borderRadius: md3Shape.full,
      fontSize: 14,
      fontWeight: active ? 600 : 500,
      fontFamily: "'Zen Maru Gothic', sans-serif",
      textDecoration: "none",
      transition: "all 200ms ease",
      backgroundColor: active
        ? md3.secondaryContainer
        : isHovered
        ? `rgba(0, 0, 0, ${md3StateLayer.hover})`
        : "transparent",
      color: active ? md3.onSecondaryContainer : md3.onSurfaceVariant,
      cursor: "pointer",
    }
  }

  return (
    <aside
      style={{
        position: "fixed",
        left: 0,
        top: 0,
        height: "100vh",
        width: DRAWER_WIDTH,
        backgroundColor: md3.surfaceContainerLow,
        display: "flex",
        flexDirection: "column",
        fontFamily: "'Zen Maru Gothic', sans-serif",
        zIndex: 100,
      }}
    >
      {/* Logo */}
      <div style={{ padding: 20, display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            width: 48,
            height: 48,
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
              fontSize: 20,
              fontWeight: 700,
              color: md3.onSurface,
              margin: 0,
              lineHeight: 1.2,
            }}
          >
            8718
          </h1>
          <p
            style={{
              fontSize: 11,
              color: md3.onSurfaceVariant,
              margin: 0,
              letterSpacing: 1,
            }}
          >
            FLOWER SYSTEM
          </p>
        </div>
      </div>

      <div style={{ height: 1, backgroundColor: md3.outlineVariant, margin: "0 16px" }} />

      {/* Main Navigation */}
      <nav style={{ flex: 1, padding: "8px 12px", overflowY: "auto" }}>
        <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {mainNavItems.map((item) => (
            <li key={item.href} style={{ marginBottom: 4 }}>
              <Link
                href={item.href}
                style={getItemStyle(item.href, hoveredItem === item.href)}
                onMouseEnter={() => setHoveredItem(item.href)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <span style={{ display: "flex", color: isActive(item.href) ? md3.onSecondaryContainer : md3.onSurfaceVariant }}>
                  {item.icon}
                </span>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Admin Section */}
      {isAdmin && (
        <>
          <div style={{ height: 1, backgroundColor: md3.outlineVariant, margin: "0 16px" }} />
          <div style={{ padding: "8px 12px" }}>
            <p
              style={{
                padding: "8px 16px",
                fontSize: 11,
                fontWeight: 600,
                color: md3.onSurfaceVariant,
                letterSpacing: 0.5,
                margin: 0,
              }}
            >
              管理
            </p>
            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {adminNavItems.map((item) => (
                <li key={item.href} style={{ marginBottom: 4 }}>
                  <Link
                    href={item.href}
                    style={getItemStyle(item.href, hoveredItem === item.href)}
                    onMouseEnter={() => setHoveredItem(item.href)}
                    onMouseLeave={() => setHoveredItem(null)}
                  >
                    <span style={{ display: "flex", color: isActive(item.href) ? md3.onSecondaryContainer : md3.onSurfaceVariant }}>
                      {item.icon}
                    </span>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}

      <div style={{ height: 1, backgroundColor: md3.outlineVariant, margin: "0 16px" }} />

      {/* Settings */}
      <div style={{ padding: 12 }}>
        <Link
          href="/settings"
          style={getItemStyle("/settings", hoveredItem === "/settings")}
          onMouseEnter={() => setHoveredItem("/settings")}
          onMouseLeave={() => setHoveredItem(null)}
        >
          <span style={{ display: "flex", color: isActive("/settings") ? md3.onSecondaryContainer : md3.onSurfaceVariant }}>
            <Settings size={20} />
          </span>
          設定
        </Link>
      </div>
    </aside>
  )
}
