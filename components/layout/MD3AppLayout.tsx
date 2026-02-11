"use client"

import { ReactNode, useEffect, useState, useRef } from "react"
import { usePathname, useRouter } from "next/navigation"
import MD3Sidebar, { DRAWER_WIDTH } from "./MD3Sidebar"
import MD3Header from "./MD3Header"
import { md3 } from "@/lib/md3-theme"
import { getRoleFromStorage, isPathAllowedByMatrix } from "@/lib/roles"

interface MD3AppLayoutProps {
  children: ReactNode
  title?: string
  subtitle?: string
  headerActions?: ReactNode
  isAdmin?: boolean
}

export default function MD3AppLayout({
  children,
  title,
  subtitle,
  headerActions,
  isAdmin = true,
}: MD3AppLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [allowed, setAllowed] = useState(true)

  useEffect(() => {
    const role = getRoleFromStorage()
    if (!isPathAllowedByMatrix(role, pathname)) {
      setAllowed(false)
      router.replace("/dashboard")
    }
  }, [pathname, router])

  // ページ遷移時にフェードインをリトリガー
  const contentRef = useRef<HTMLElement>(null)
  const prevPath = useRef(pathname)

  useEffect(() => {
    if (prevPath.current !== pathname && contentRef.current) {
      contentRef.current.classList.remove("page-content-enter")
      // force reflow
      void contentRef.current.offsetHeight
      contentRef.current.classList.add("page-content-enter")
      prevPath.current = pathname
    }
  }, [pathname])

  if (!allowed) return null

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: md3.surface,
        fontFamily: "'Zen Maru Gothic', sans-serif",
      }}
    >
      {/* Sidebar */}
      <MD3Sidebar />

      {/* Main Content */}
      <div
        style={{
          marginLeft: DRAWER_WIDTH,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <MD3Header title={title} subtitle={subtitle} actions={headerActions} />

        {/* Content Area */}
        <main
          ref={contentRef}
          className="page-content-enter"
          style={{
            flex: 1,
            padding: 24,
            backgroundColor: md3.surface,
            viewTransitionName: "page-content",
          }}
        >
          {children}
        </main>
      </div>
    </div>
  )
}
