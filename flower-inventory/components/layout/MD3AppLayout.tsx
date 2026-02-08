"use client"

import { ReactNode } from "react"
import MD3Sidebar, { DRAWER_WIDTH } from "./MD3Sidebar"
import MD3Header from "./MD3Header"
import { md3 } from "@/lib/md3-theme"

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
          style={{
            flex: 1,
            padding: 24,
            backgroundColor: md3.surface,
          }}
        >
          {children}
        </main>
      </div>
    </div>
  )
}
