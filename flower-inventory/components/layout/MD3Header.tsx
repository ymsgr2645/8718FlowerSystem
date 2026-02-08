"use client"

import { ReactNode } from "react"
import { md3, md3Shape } from "@/lib/md3-theme"
import { Search, Bell, User } from "lucide-react"
import { MD3Badge } from "@/components/md3/MD3Badge"
import { MD3IconButton } from "@/components/md3/MD3Button"

interface MD3HeaderProps {
  title?: string
  subtitle?: string
  actions?: ReactNode
}

export default function MD3Header({ title, subtitle, actions }: MD3HeaderProps) {
  return (
    <header
      style={{
        height: 64,
        padding: "0 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: md3.surface,
        borderBottom: `1px solid ${md3.outlineVariant}`,
        fontFamily: "'Zen Maru Gothic', sans-serif",
      }}
    >
      <div>
        {title && (
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 400, color: md3.onSurface }}>
            {title}
          </h1>
        )}
        {subtitle && (
          <p style={{ margin: 0, fontSize: 12, color: md3.onSurfaceVariant }}>
            {subtitle}
          </p>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            height: 40,
            padding: "0 16px",
            backgroundColor: md3.surfaceContainerHigh,
            borderRadius: md3Shape.full,
            marginRight: 8,
          }}
        >
          <Search size={20} color={md3.onSurfaceVariant} />
          <input
            type="text"
            placeholder="検索..."
            style={{
              border: "none",
              outline: "none",
              backgroundColor: "transparent",
              fontSize: 14,
              color: md3.onSurface,
              fontFamily: "'Zen Maru Gothic', sans-serif",
              width: 200,
            }}
          />
        </div>

        {actions}

        <MD3Badge count={3} color="error">
          <MD3IconButton variant="standard">
            <Bell size={24} />
          </MD3IconButton>
        </MD3Badge>

        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: md3Shape.full,
            backgroundColor: md3.primaryContainer,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginLeft: 8,
            cursor: "pointer",
          }}
        >
          <User size={20} color={md3.onPrimaryContainer} />
        </div>
      </div>
    </header>
  )
}
