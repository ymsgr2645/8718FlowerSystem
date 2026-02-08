"use client"

import { SelectHTMLAttributes, CSSProperties, useState } from "react"
import { md3, md3Shape } from "@/lib/md3-theme"
import { ChevronDown } from "lucide-react"

interface MD3SelectOption {
  value: string
  label: string
}

interface MD3SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "style"> {
  variant?: "filled" | "outlined"
  label?: string
  options: MD3SelectOption[]
  placeholder?: string
  supportingText?: string
  error?: boolean
  errorText?: string
  fullWidth?: boolean
}

export function MD3Select({
  variant = "outlined",
  label,
  options,
  supportingText,
  error = false,
  errorText,
  fullWidth = false,
  disabled = false,
  placeholder,
  ...props
}: MD3SelectProps) {
  const [focused, setFocused] = useState(false)

  const containerStyles: CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    width: fullWidth ? "100%" : "auto",
  }

  const selectContainerStyles: CSSProperties = {
    position: "relative",
    display: "flex",
    alignItems: "center",
  }

  const getSelectStyles = (): CSSProperties => {
    const base: CSSProperties = {
      width: "100%",
      height: 56,
      padding: "16px 48px 16px 16px",
      fontSize: 16,
      fontFamily: "'Zen Maru Gothic', sans-serif",
      color: md3.onSurface,
      backgroundColor: variant === "filled" ? md3.surfaceContainerHighest : "transparent",
      border: variant === "outlined"
        ? `1px solid ${error ? md3.error : focused ? md3.primary : md3.outline}`
        : "none",
      borderBottom: variant === "filled"
        ? `1px solid ${error ? md3.error : focused ? md3.primary : md3.onSurfaceVariant}`
        : undefined,
      borderRadius: variant === "outlined" ? md3Shape.extraSmall : `${md3Shape.extraSmall} ${md3Shape.extraSmall} 0 0`,
      outline: "none",
      cursor: disabled ? "not-allowed" : "pointer",
      appearance: "none",
      transition: "all 200ms ease",
      opacity: disabled ? 0.38 : 1,
    }

    if (variant === "outlined" && focused) {
      base.border = `2px solid ${error ? md3.error : md3.primary}`
    }

    return base
  }

  const labelStyles: CSSProperties = {
    fontSize: 12,
    fontWeight: 500,
    color: error ? md3.error : focused ? md3.primary : md3.onSurfaceVariant,
    fontFamily: "'Zen Maru Gothic', sans-serif",
    marginBottom: 4,
  }

  const iconStyles: CSSProperties = {
    position: "absolute",
    right: 12,
    pointerEvents: "none",
    color: md3.onSurfaceVariant,
    transition: "transform 200ms ease",
    transform: focused ? "rotate(180deg)" : "rotate(0deg)",
  }

  return (
    <div style={containerStyles}>
      {label && <label style={labelStyles}>{label}</label>}
      <div style={selectContainerStyles}>
        <select
          style={getSelectStyles()}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          disabled={disabled}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown size={20} style={iconStyles} />
      </div>
      {(supportingText || errorText) && (
        <span style={{
          fontSize: 12,
          color: error ? md3.error : md3.onSurfaceVariant,
          fontFamily: "'Zen Maru Gothic', sans-serif",
          marginTop: 4,
          paddingLeft: 16,
        }}>
          {error ? errorText : supportingText}
        </span>
      )}
    </div>
  )
}
