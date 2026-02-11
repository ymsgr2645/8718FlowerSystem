"use client"

import { ReactNode, CSSProperties, ButtonHTMLAttributes } from "react"
import { motion } from "motion/react"
import { md3, md3Shape } from "@/lib/md3-theme"

interface MD3ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "filled" | "outlined" | "text" | "tonal" | "elevated"
  size?: "small" | "medium" | "large"
  children: ReactNode
  icon?: ReactNode
  fullWidth?: boolean
}

const variantStyles = {
  filled: {
    base: { backgroundColor: md3.primary, color: md3.onPrimary, border: "none", boxShadow: "none" },
    hover: { backgroundColor: "#A8503A", boxShadow: "0 2px 4px rgba(0,0,0,0.2)" },
  },
  outlined: {
    base: { backgroundColor: "transparent", color: md3.primary, border: `1px solid ${md3.outline}` },
    hover: { backgroundColor: "rgba(192, 99, 74, 0.08)" },
  },
  text: {
    base: { backgroundColor: "transparent", color: md3.primary, border: "none" },
    hover: { backgroundColor: "rgba(192, 99, 74, 0.08)" },
  },
  tonal: {
    base: { backgroundColor: md3.secondaryContainer, color: md3.onSecondaryContainer, border: "none" },
    hover: { backgroundColor: "#C8E6C9" },
  },
  elevated: {
    base: {
      backgroundColor: md3.surfaceContainerLow,
      color: md3.primary,
      border: "none",
      boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.3), 0 1px 3px 1px rgba(0, 0, 0, 0.15)",
    },
    hover: {
      backgroundColor: md3.surfaceContainerHigh,
      boxShadow: "0 2px 6px 2px rgba(0, 0, 0, 0.15)",
    },
  },
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
  const sizeConfig = {
    small: { height: 32, padding: icon ? "0 16px 0 12px" : "0 16px", fontSize: 12, gap: 6 },
    medium: { height: 40, padding: icon ? "0 24px 0 16px" : "0 24px", fontSize: 14, gap: 8 },
    large: { height: 48, padding: icon ? "0 28px 0 20px" : "0 28px", fontSize: 16, gap: 10 },
  }

  const currentSize = sizeConfig[size]
  const vs = variantStyles[variant]

  return (
    <motion.button
      whileHover={disabled ? undefined : vs.hover}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      transition={{ duration: 0.15 }}
      style={{
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
        width: fullWidth ? "100%" : "auto",
        opacity: disabled ? 0.38 : 1,
        outline: "none",
        ...vs.base,
        ...style,
      }}
      disabled={disabled}
      {...(props as object)}
    >
      {icon && <span style={{ display: "flex" }}>{icon}</span>}
      {children}
    </motion.button>
  )
}

// Icon Button
interface MD3IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "standard" | "filled" | "tonal" | "outlined"
  children: ReactNode
  size?: "small" | "medium" | "large"
}

const iconVariantStyles = {
  standard: {
    base: { backgroundColor: "transparent", color: md3.onSurfaceVariant, border: "none" },
    hover: { backgroundColor: "rgba(0, 0, 0, 0.08)" },
  },
  filled: {
    base: { backgroundColor: md3.primary, color: md3.onPrimary, border: "none" },
    hover: { backgroundColor: "#A8503A" },
  },
  tonal: {
    base: { backgroundColor: md3.secondaryContainer, color: md3.onSecondaryContainer, border: "none" },
    hover: { backgroundColor: "#C8E6C9" },
  },
  outlined: {
    base: { backgroundColor: "transparent", color: md3.onSurfaceVariant, border: `1px solid ${md3.outline}` },
    hover: { backgroundColor: "rgba(0, 0, 0, 0.08)" },
  },
}

export function MD3IconButton({
  variant = "standard",
  children,
  size = "medium",
  disabled = false,
  style,
  ...props
}: MD3IconButtonProps) {
  const sizes = { small: 32, medium: 40, large: 48 }
  const vs = iconVariantStyles[variant]

  return (
    <motion.button
      whileHover={disabled ? undefined : vs.hover}
      whileTap={disabled ? undefined : { scale: 0.88 }}
      transition={{ duration: 0.15 }}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: sizes[size],
        height: sizes[size],
        borderRadius: md3Shape.full,
        cursor: disabled ? "not-allowed" : "pointer",
        outline: "none",
        opacity: disabled ? 0.38 : 1,
        ...vs.base,
        ...style,
      }}
      disabled={disabled}
      {...(props as object)}
    >
      {children}
    </motion.button>
  )
}

// FAB
interface MD3FABProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "surface" | "primary" | "secondary" | "tertiary"
  size?: "small" | "medium" | "large"
  icon: ReactNode
  label?: string
}

const fabVariantStyles = {
  surface: {
    base: { backgroundColor: md3.surfaceContainerHigh, color: md3.primary },
    hover: { backgroundColor: md3.surfaceContainerHighest },
  },
  primary: {
    base: { backgroundColor: md3.primaryContainer, color: md3.onPrimaryContainer },
    hover: { backgroundColor: "#E8BDB2" },
  },
  secondary: {
    base: { backgroundColor: md3.secondaryContainer, color: md3.onSecondaryContainer },
    hover: { backgroundColor: "#C8E6C9" },
  },
  tertiary: {
    base: { backgroundColor: md3.tertiaryContainer, color: md3.onTertiaryContainer },
    hover: { backgroundColor: "#FFCA80" },
  },
}

export function MD3FAB({ variant = "primary", size = "medium", icon, label, style, ...props }: MD3FABProps) {
  const sizes = { small: { size: 40, padding: 8 }, medium: { size: 56, padding: 16 }, large: { size: 96, padding: 30 } }
  const vs = fabVariantStyles[variant]
  const isExtended = !!label

  return (
    <motion.button
      whileHover={{ ...vs.hover, boxShadow: "0 4px 8px 3px rgba(0,0,0,0.15), 0 1px 3px rgba(0,0,0,0.3)" }}
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.15 }}
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
        boxShadow: "0 1px 3px 0 rgba(0,0,0,0.3), 0 4px 8px 3px rgba(0,0,0,0.15)",
        ...vs.base,
        ...style,
      }}
      {...(props as object)}
    >
      {icon}
      {label && <span>{label}</span>}
    </motion.button>
  )
}
