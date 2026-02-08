"use client"

import { ReactNode, CSSProperties, useState } from "react"
import { md3, md3Elevation, md3Shape } from "@/lib/md3-theme"

interface MD3CardProps {
  variant?: "elevated" | "filled" | "outlined"
  children: ReactNode
  className?: string
  style?: CSSProperties
  onClick?: () => void
  hoverable?: boolean
}

export function MD3Card({
  variant = "elevated",
  children,
  className = "",
  style,
  onClick,
  hoverable = true,
}: MD3CardProps) {
  const [isHovered, setIsHovered] = useState(false)

  const getVariantStyles = (): CSSProperties => {
    switch (variant) {
      case "elevated":
        return {
          backgroundColor: isHovered && hoverable ? md3.surfaceContainer : md3.surfaceContainerLow,
          boxShadow: isHovered && hoverable ? md3Elevation.level2 : md3Elevation.level1,
          border: "none",
        }
      case "filled":
        return {
          backgroundColor: isHovered && hoverable ? md3.surfaceContainerHigh : md3.surfaceContainerHighest,
          boxShadow: "none",
          border: "none",
        }
      case "outlined":
        return {
          backgroundColor: isHovered && hoverable ? md3.surfaceContainerLowest : md3.surface,
          boxShadow: "none",
          border: `1px solid ${isHovered && hoverable ? md3.outline : md3.outlineVariant}`,
        }
      default:
        return {}
    }
  }

  return (
    <div
      className={className}
      style={{
        borderRadius: md3Shape.medium,
        padding: 16,
        fontFamily: "'Zen Maru Gothic', sans-serif",
        transition: "all 200ms cubic-bezier(0.2, 0, 0, 1)",
        cursor: onClick ? "pointer" : "default",
        ...getVariantStyles(),
        ...style,
      }}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
    </div>
  )
}

// Card Header
interface MD3CardHeaderProps {
  children?: ReactNode
  title?: string
  subtitle?: string
  icon?: ReactNode
  action?: ReactNode
  style?: CSSProperties
}

export function MD3CardHeader({ children, title, subtitle, icon, action, style }: MD3CardHeaderProps) {
  // If using the simple children pattern
  if (children && !title) {
    return (
      <div
        style={{
          marginBottom: 16,
          ...style,
        }}
      >
        {children}
      </div>
    )
  }

  // If using the title/icon/action pattern
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 16,
        ...style,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {icon && (
          <span style={{ display: "flex", color: md3.onSurfaceVariant }}>
            {icon}
          </span>
        )}
        <div>
          <h3
            style={{
              margin: 0,
              fontSize: 18,
              lineHeight: "24px",
              fontWeight: 500,
              color: md3.onSurface,
              fontFamily: "'Zen Maru Gothic', sans-serif",
            }}
          >
            {title}
          </h3>
          {subtitle && (
            <p
              style={{
                margin: "4px 0 0 0",
                fontSize: 14,
                lineHeight: "20px",
                color: md3.onSurfaceVariant,
                fontFamily: "'Zen Maru Gothic', sans-serif",
              }}
            >
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}

// Card Title
interface MD3CardTitleProps {
  children: ReactNode
  style?: CSSProperties
}

export function MD3CardTitle({ children, style }: MD3CardTitleProps) {
  return (
    <h3
      style={{
        margin: 0,
        fontSize: 18,
        lineHeight: "24px",
        fontWeight: 500,
        color: md3.onSurface,
        fontFamily: "'Zen Maru Gothic', sans-serif",
        ...style,
      }}
    >
      {children}
    </h3>
  )
}

// Card Subtitle
interface MD3CardSubtitleProps {
  children: ReactNode
  style?: CSSProperties
}

export function MD3CardSubtitle({ children, style }: MD3CardSubtitleProps) {
  return (
    <p
      style={{
        margin: "4px 0 0 0",
        fontSize: 14,
        lineHeight: "20px",
        color: md3.onSurfaceVariant,
        fontFamily: "'Zen Maru Gothic', sans-serif",
        ...style,
      }}
    >
      {children}
    </p>
  )
}

// Card Content
interface MD3CardContentProps {
  children: ReactNode
  style?: CSSProperties
}

export function MD3CardContent({ children, style }: MD3CardContentProps) {
  return (
    <div
      style={{
        color: md3.onSurface,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

// Card Actions
interface MD3CardActionsProps {
  children: ReactNode
  style?: CSSProperties
}

export function MD3CardActions({ children, style }: MD3CardActionsProps) {
  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        marginTop: 16,
        justifyContent: "flex-end",
        ...style,
      }}
    >
      {children}
    </div>
  )
}
