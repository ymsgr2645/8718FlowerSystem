"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
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

const DRAWER_WIDTH = 240

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
  adminOnly?: boolean
}

const mainNavItems: NavItem[] = [
  { label: "ダッシュボード", href: "/dashboard", icon: <LayoutDashboard className="size-5" /> },
  { label: "本部倉庫", href: "/warehouse", icon: <Warehouse className="size-5" /> },
  { label: "在庫管理", href: "/inventory", icon: <Package className="size-5" /> },
  { label: "持ち出し", href: "/transfer", icon: <Truck className="size-5" /> },
  { label: "請求書", href: "/invoice", icon: <FileText className="size-5" /> },
  { label: "集計", href: "/analytics", icon: <BarChart3 className="size-5" /> },
]

const adminNavItems: NavItem[] = [
  { label: "ユーザー管理", href: "/admin/users", icon: <Users className="size-5" />, adminOnly: true },
  { label: "権限設定", href: "/admin/permissions", icon: <Shield className="size-5" />, adminOnly: true },
  { label: "バックアップ", href: "/admin/backup", icon: <Database className="size-5" />, adminOnly: true },
]

interface SidebarProps {
  isAdmin?: boolean
}

export default function Sidebar({ isAdmin = true }: SidebarProps) {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard" || pathname === "/"
    }
    return pathname.startsWith(href)
  }

  return (
    <aside
      className="fixed left-0 top-0 h-screen bg-white border-r border-border flex flex-col"
      style={{ width: DRAWER_WIDTH }}
    >
      {/* Logo */}
      <div className="p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
          <Flower2 className="size-5 text-white" strokeWidth={1.5} />
        </div>
        <div>
          <h1 className="text-lg font-bold text-foreground leading-tight">8718</h1>
          <p className="text-xs text-muted-foreground">FLOWER SYSTEM</p>
        </div>
      </div>

      <div className="h-px bg-border mx-4" />

      {/* Main Navigation */}
      <nav className="flex-1 py-2 px-3">
        <ul className="space-y-1">
          {mainNavItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive(item.href)
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                {item.icon}
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Admin Section */}
      {isAdmin && (
        <>
          <div className="h-px bg-border mx-4" />
          <div className="py-2 px-3">
            <p className="px-3 text-xs font-medium text-muted-foreground mb-1">管理</p>
            <ul className="space-y-1">
              {adminNavItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                      isActive(item.href)
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}

      <div className="h-px bg-border mx-4" />

      {/* Settings */}
      <div className="p-3">
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
            pathname === "/settings"
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-accent hover:text-foreground"
          )}
        >
          <Settings className="size-5" />
          設定
        </Link>
      </div>
    </aside>
  )
}
