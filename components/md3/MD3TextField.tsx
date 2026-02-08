"use client"

import { InputHTMLAttributes, CSSProperties, useState } from "react"
import { md3, md3Shape } from "@/lib/md3-theme"

interface MD3TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "style"> {
  variant?: "filled" | "outlined"
  label?: string
  supportingText?: string
  error?: boolean
  errorText?: string
  leadingIcon?: React.ReactNode
  trailingIcon?: React.ReactNode
  fullWidth?: boolean
}

export function MD3TextField({
  variant = "outlined",
  label,
  supportingText,
  error = false,
  errorText,
  leadingIcon,
  trailingIcon,
  fullWidth = false,
  disabled = false,
  ...props
}: MD3TextFieldProps) {
  const [focused, setFocused] = useState(false)

  const containerStyles: CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    width: fullWidth ? "100%" : "auto",
  }

  const inputContainerStyles: CSSProperties = {
    position: "relative",
    display: "flex",
    alignItems: "center",
    gap: 12,
  }

  const getInputStyles = (): CSSProperties => {
    const base: CSSProperties = {
      width: "100%",
      height: 56,
      padding: leadingIcon ? "16px 16px 16px 48px" : "16px",
      paddingRight: trailingIcon ? 48 : 16,
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

  const supportingTextStyles: CSSProperties = {
    fontSize: 12,
    color: error ? md3.error : md3.onSurfaceVariant,
    fontFamily: "'Zen Maru Gothic', sans-serif",
    marginTop: 4,
    paddingLeft: 16,
  }

  const iconStyles: CSSProperties = {
    position: "absolute",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: error ? md3.error : md3.onSurfaceVariant,
  }

  return (
    <div style={containerStyles}>
      {label && <label style={labelStyles}>{label}</label>}
      <div style={inputContainerStyles}>
        {leadingIcon && (
          <span style={{ ...iconStyles, left: 12 }}>{leadingIcon}</span>
        )}
        <input
          style={getInputStyles()}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          disabled={disabled}
          {...props}
        />
        {trailingIcon && (
          <span style={{ ...iconStyles, right: 12 }}>{trailingIcon}</span>
        )}
      </div>
      {(supportingText || errorText) && (
        <span style={supportingTextStyles}>
          {error ? errorText : supportingText}
        </span>
      )}
    </div>
  )
}

// TextArea variant
interface MD3TextAreaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "style"> {
  variant?: "filled" | "outlined"
  label?: string
  supportingText?: string
  error?: boolean
  errorText?: string
  fullWidth?: boolean
}

export function MD3TextArea({
  variant = "outlined",
  label,
  supportingText,
  error = false,
  errorText,
  fullWidth = false,
  disabled = false,
  rows = 4,
  ...props
}: MD3TextAreaProps) {
  const [focused, setFocused] = useState(false)

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, width: fullWidth ? "100%" : "auto" }}>
      {label && (
        <label style={{
          fontSize: 12,
          fontWeight: 500,
          color: error ? md3.error : focused ? md3.primary : md3.onSurfaceVariant,
          fontFamily: "'Zen Maru Gothic', sans-serif",
          marginBottom: 4,
        }}>
          {label}
        </label>
      )}
      <textarea
        style={{
          width: "100%",
          padding: 16,
          fontSize: 16,
          fontFamily: "'Zen Maru Gothic', sans-serif",
          color: md3.onSurface,
          backgroundColor: variant === "filled" ? md3.surfaceContainerHighest : "transparent",
          border: variant === "outlined"
            ? `${focused ? 2 : 1}px solid ${error ? md3.error : focused ? md3.primary : md3.outline}`
            : "none",
          borderBottom: variant === "filled"
            ? `1px solid ${error ? md3.error : focused ? md3.primary : md3.onSurfaceVariant}`
            : undefined,
          borderRadius: variant === "outlined" ? md3Shape.extraSmall : `${md3Shape.extraSmall} ${md3Shape.extraSmall} 0 0`,
          outline: "none",
          resize: "vertical",
          opacity: disabled ? 0.38 : 1,
        }}
        rows={rows}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        disabled={disabled}
        {...props}
      />
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
