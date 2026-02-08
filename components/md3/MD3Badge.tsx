"use client"

import { ReactNode, CSSProperties } from "react"
import { md3, md3Shape } from "@/lib/md3-theme"

// Badge (small indicator)
interface MD3BadgeProps {
  count?: number
  children?: ReactNode
  color?: "primary" | "secondary" | "tertiary" | "error"
  showZero?: boolean
  max?: number
}

export function MD3Badge({
  count,
  children,
  color = "error",
  showZero = false,
  max = 99,
}: MD3BadgeProps) {
  const showBadge = showZero || (count !== undefined && count > 0)
  const displayCount = count !== undefined && count > max ? `${max}+` : count

  const colorStyles: Record<string, CSSProperties> = {
    primary: { backgroundColor: md3.primary, color: md3.onPrimary },
    secondary: { backgroundColor: md3.secondary, color: md3.onSecondary },
    tertiary: { backgroundColor: md3.tertiary, color: md3.onTertiary },
    error: { backgroundColor: md3.error, color: md3.onError },
  }

  return (
    <div style={{ position: "relative", display: "inline-flex" }}>
      {children}
      {showBadge && (
        <span
          style={{
            position: "absolute",
            top: -4,
            right: -4,
            minWidth: count !== undefined ? 16 : 8,
            height: count !== undefined ? 16 : 8,
            padding: count !== undefined ? "0 4px" : 0,
            borderRadius: md3Shape.full,
            fontSize: 11,
            fontWeight: 500,
            fontFamily: "'Zen Maru Gothic', sans-serif",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            ...colorStyles[color],
          }}
        >
          {count !== undefined && displayCount}
        </span>
      )}
    </div>
  )
}

// Chip (larger, interactive)
interface MD3ChipProps {
  label: string
  variant?: "assist" | "filter" | "input" | "suggestion"
  selected?: boolean
  icon?: ReactNode
  trailingIcon?: ReactNode
  onClick?: () => void
  onDelete?: () => void
  disabled?: boolean
}

export function MD3Chip({
  label,
  variant = "assist",
  selected = false,
  icon,
  trailingIcon,
  onClick,
  onDelete,
  disabled = false,
}: MD3ChipProps) {
  const getStyles = (): CSSProperties => {
    const base: CSSProperties = {
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      height: 32,
      padding: icon ? "0 12px 0 8px" : "0 12px",
      borderRadius: md3Shape.small,
      fontSize: 14,
      fontWeight: 500,
      fontFamily: "'Zen Maru Gothic', sans-serif",
      cursor: disabled ? "not-allowed" : onClick ? "pointer" : "default",
      border: "none",
      outline: "none",
      transition: "all 200ms ease",
      opacity: disabled ? 0.38 : 1,
    }

    if (variant === "filter" || variant === "input") {
      if (selected) {
        return {
          ...base,
          backgroundColor: md3.secondaryContainer,
          color: md3.onSecondaryContainer,
        }
      }
      return {
        ...base,
        backgroundColor: "transparent",
        color: md3.onSurfaceVariant,
        border: `1px solid ${md3.outline}`,
      }
    }

    // assist, suggestion
    return {
      ...base,
      backgroundColor: "transparent",
      color: md3.onSurfaceVariant,
      border: `1px solid ${md3.outline}`,
    }
  }

  return (
    <button style={getStyles()} onClick={onClick} disabled={disabled}>
      {icon && <span style={{ display: "flex" }}>{icon}</span>}
      <span>{label}</span>
      {trailingIcon && (
        <span
          style={{ display: "flex", cursor: "pointer" }}
          onClick={(e) => {
            e.stopPropagation()
            onDelete?.()
          }}
        >
          {trailingIcon}
        </span>
      )}
    </button>
  )
}

// Status Badge (for inventory system)
// Material 3原則: 状態を示すバッジは適切なセマンティックカラーを使用
interface MD3StatusBadgeProps {
  status: "success" | "warning" | "error" | "info" | "neutral"
  label: string
  size?: "small" | "medium"
}

export function MD3StatusBadge({
  status,
  label,
  size = "medium",
}: MD3StatusBadgeProps) {
  // Material 3カラーシステムに準拠:
  // - success: Secondary (グリーン) - ポジティブな結果
  // - warning: Tertiary (ウォームブラウン) - 注意が必要
  // - error: Error - エラー、問題
  // - info: Primary - 情報、主要アクション
  // - neutral: Surface - 中立的な情報
  const statusStyles: Record<string, CSSProperties> = {
    success: {
      backgroundColor: md3.secondaryContainer,
      color: md3.onSecondaryContainer,
    },
    warning: {
      backgroundColor: md3.tertiaryContainer,
      color: md3.onTertiaryContainer,
    },
    error: {
      backgroundColor: md3.errorContainer,
      color: md3.onErrorContainer,
    },
    info: {
      backgroundColor: md3.primaryContainer,
      color: md3.onPrimaryContainer,
    },
    neutral: {
      backgroundColor: md3.surfaceContainerHigh,
      color: md3.onSurfaceVariant,
    },
  }

  const sizeStyles = {
    small: { padding: "2px 8px", fontSize: 11 },
    medium: { padding: "4px 12px", fontSize: 12 },
  }

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        borderRadius: md3Shape.full,
        fontWeight: 500,
        fontFamily: "'Zen Maru Gothic', sans-serif",
        ...statusStyles[status],
        ...sizeStyles[size],
      }}
    >
      {label}
    </span>
  )
}
