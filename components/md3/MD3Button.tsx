"use client"

import { ReactNode, CSSProperties, ButtonHTMLAttributes, useState } from "react"
import { md3, md3Shape } from "@/lib/md3-theme"

interface MD3ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "filled" | "outlined" | "text" | "tonal" | "elevated"
  size?: "small" | "medium" | "large"
  children: ReactNode
  icon?: ReactNode
  fullWidth?: boolean
}

export function MD3Button({
  variant = "filled",
  size = "medium",
  children,
  icon,
  fullWidth = false,
  disabled = false,
  style,
  ...props
}: MD3ButtonProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isPressed, setIsPressed] = useState(false)

  const sizeConfig = {
    small: { height: 32, padding: icon ? "0 16px 0 12px" : "0 16px", fontSize: 12, gap: 6 },
    medium: { height: 40, padding: icon ? "0 24px 0 16px" : "0 24px", fontSize: 14, gap: 8 },
    large: { height: 48, padding: icon ? "0 28px 0 20px" : "0 28px", fontSize: 16, gap: 10 },
  }

  const currentSize = sizeConfig[size]

  const baseStyles: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: currentSize.gap,
    height: currentSize.height,
    padding: currentSize.padding,
    borderRadius: md3Shape.full,
    fontSize: currentSize.fontSize,
    fontWeight: 500,
    fontFamily: "'Zen Maru Gothic', sans-serif",
    cursor: disabled ? "not-allowed" : "pointer",
    transition: "all 200ms cubic-bezier(0.2, 0, 0, 1)",
    border: "none",
    outline: "none",
    width: fullWidth ? "100%" : "auto",
    opacity: disabled ? 0.38 : 1,
    transform: isPressed ? "scale(0.98)" : "scale(1)",
    ...style,
  }

  const getVariantStyles = (): CSSProperties => {
    switch (variant) {
      case "filled":
        return {
          backgroundColor: isHovered ? "#A8503A" : md3.primary,
          color: md3.onPrimary,
          boxShadow: isHovered ? "0 2px 4px rgba(0,0,0,0.2)" : "none",
        }
      case "outlined":
        return {
          backgroundColor: isHovered ? "rgba(192, 99, 74, 0.08)" : "transparent",
          color: md3.primary,
          border: `1px solid ${md3.outline}`,
        }
      case "text":
        return {
          backgroundColor: isHovered ? "rgba(192, 99, 74, 0.08)" : "transparent",
          color: md3.primary,
        }
      case "tonal":
        return {
          backgroundColor: isHovered ? "#C8E6C9" : md3.secondaryContainer,
          color: md3.onSecondaryContainer,
        }
      case "elevated":
        return {
          backgroundColor: isHovered ? md3.surfaceContainerHigh : md3.surfaceContainerLow,
          color: md3.primary,
          boxShadow: isHovered
            ? "0 2px 6px 2px rgba(0, 0, 0, 0.15)"
            : "0 1px 2px 0 rgba(0, 0, 0, 0.3), 0 1px 3px 1px rgba(0, 0, 0, 0.15)",
        }
      default:
        return {}
    }
  }

  return (
    <button
      style={{ ...baseStyles, ...getVariantStyles() }}
      disabled={disabled}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setIsPressed(false) }}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      {...props}
    >
      {icon && <span style={{ display: "flex" }}>{icon}</span>}
      {children}
    </button>
  )
}

// Icon Button
interface MD3IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "standard" | "filled" | "tonal" | "outlined"
  children: ReactNode
  size?: "small" | "medium" | "large"
}

export function MD3IconButton({
  variant = "standard",
  children,
  size = "medium",
  disabled = false,
  style,
  ...props
}: MD3IconButtonProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isPressed, setIsPressed] = useState(false)

  const sizes = {
    small: 32,
    medium: 40,
    large: 48,
  }

  const baseStyles: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: sizes[size],
    height: sizes[size],
    borderRadius: md3Shape.full,
    cursor: disabled ? "not-allowed" : "pointer",
    transition: "all 200ms cubic-bezier(0.2, 0, 0, 1)",
    border: "none",
    outline: "none",
    opacity: disabled ? 0.38 : 1,
    transform: isPressed ? "scale(0.92)" : "scale(1)",
    ...style,
  }

  const getVariantStyles = (): CSSProperties => {
    switch (variant) {
      case "standard":
        return {
          backgroundColor: isHovered ? "rgba(0, 0, 0, 0.08)" : "transparent",
          color: md3.onSurfaceVariant,
        }
      case "filled":
        return {
          backgroundColor: isHovered ? "#A8503A" : md3.primary,
          color: md3.onPrimary,
        }
      case "tonal":
        return {
          backgroundColor: isHovered ? "#C8E6C9" : md3.secondaryContainer,
          color: md3.onSecondaryContainer,
        }
      case "outlined":
        return {
          backgroundColor: isHovered ? "rgba(0, 0, 0, 0.08)" : "transparent",
          color: md3.onSurfaceVariant,
          border: `1px solid ${md3.outline}`,
        }
      default:
        return {}
    }
  }

  return (
    <button
      style={{ ...baseStyles, ...getVariantStyles() }}
      disabled={disabled}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setIsPressed(false) }}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      {...props}
    >
      {children}
    </button>
  )
}

// FAB (Floating Action Button)
interface MD3FABProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "surface" | "primary" | "secondary" | "tertiary"
  size?: "small" | "medium" | "large"
  icon: ReactNode
  label?: string
}

export function MD3FAB({
  variant = "primary",
  size = "medium",
  icon,
  label,
  style,
  ...props
}: MD3FABProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isPressed, setIsPressed] = useState(false)

  const sizes = {
    small: { size: 40, iconSize: 24, padding: 8 },
    medium: { size: 56, iconSize: 24, padding: 16 },
    large: { size: 96, iconSize: 36, padding: 30 },
  }

  const getVariantStyles = (): CSSProperties => {
    switch (variant) {
      case "surface":
        return {
          backgroundColor: isHovered ? md3.surfaceContainerHighest : md3.surfaceContainerHigh,
          color: md3.primary,
        }
      case "primary":
        return {
          backgroundColor: isHovered ? "#E8BDB2" : md3.primaryContainer,
          color: md3.onPrimaryContainer,
        }
      case "secondary":
        return {
          backgroundColor: isHovered ? "#C8E6C9" : md3.secondaryContainer,
          color: md3.onSecondaryContainer,
        }
      case "tertiary":
        return {
          backgroundColor: isHovered ? "#FFCA80" : md3.tertiaryContainer,
          color: md3.onTertiaryContainer,
        }
      default:
        return {}
    }
  }

  const isExtended = !!label

  return (
    <button
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        height: sizes[size].size,
        width: isExtended ? "auto" : sizes[size].size,
        padding: isExtended ? "0 20px" : sizes[size].padding,
        borderRadius: md3Shape.large,
        border: "none",
        cursor: "pointer",
        fontFamily: "'Zen Maru Gothic', sans-serif",
        fontSize: 14,
        fontWeight: 500,
        boxShadow: isHovered
          ? "0 4px 8px 3px rgba(0, 0, 0, 0.15), 0 1px 3px rgba(0, 0, 0, 0.3)"
          : "0 1px 3px 0 rgba(0, 0, 0, 0.3), 0 4px 8px 3px rgba(0, 0, 0, 0.15)",
        transition: "all 200ms cubic-bezier(0.2, 0, 0, 1)",
        transform: isPressed ? "scale(0.95)" : "scale(1)",
        ...getVariantStyles(),
        ...style,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setIsPressed(false) }}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      {...props}
    >
      {icon}
      {label && <span>{label}</span>}
    </button>
  )
}
