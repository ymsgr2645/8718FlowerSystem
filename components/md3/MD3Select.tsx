"use client"

import { CSSProperties, useCallback } from "react"
import { motion } from "motion/react"
import { md3, md3Shape } from "@/lib/md3-theme"

interface MD3SelectOption {
  value: string
  label: string
}

interface MD3SelectProps {
  variant?: "filled" | "outlined"
  label?: string
  options: MD3SelectOption[]
  value?: string
  onChange?: (e: { target: { value: string } }) => void
  placeholder?: string
  supportingText?: string
  error?: boolean
  errorText?: string
  fullWidth?: boolean
  disabled?: boolean
}

export function MD3Select({
  label,
  options,
  value = "",
  onChange,
  placeholder,
  supportingText,
  error = false,
  errorText,
  fullWidth = false,
  disabled = false,
}: MD3SelectProps) {
  const handleSelect = useCallback(
    (optionValue: string) => {
      if (disabled) return
      onChange?.({ target: { value: optionValue } })
    },
    [disabled, onChange]
  )

  const containerStyles: CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    width: fullWidth ? "100%" : "auto",
  }

  const labelStyles: CSSProperties = {
    fontSize: 12,
    fontWeight: 500,
    color: error ? md3.error : md3.onSurfaceVariant,
    fontFamily: "'Zen Maru Gothic', sans-serif",
  }

  const chipContainerStyles: CSSProperties = {
    display: "flex",
    flexWrap: "wrap",
    gap: 6,
    opacity: disabled ? 0.38 : 1,
  }

  return (
    <div style={containerStyles}>
      {label && <label style={labelStyles}>{label}</label>}
      <div style={chipContainerStyles}>
        {placeholder && !value && options.length > 0 && (
          <span
            style={{
              padding: "6px 14px",
              fontSize: 13,
              color: md3.onSurfaceVariant,
              fontFamily: "'Zen Maru Gothic', sans-serif",
              fontStyle: "italic",
            }}
          >
            {placeholder}
          </span>
        )}
        {options.map((option) => {
          const isSelected = option.value === value
          return (
            <motion.button
              key={option.value}
              type="button"
              onClick={() => handleSelect(option.value)}
              disabled={disabled}
              whileHover={disabled ? undefined : {
                backgroundColor: isSelected ? md3.primaryContainer : md3.surfaceContainerHigh,
                borderColor: isSelected ? md3.primary : md3.outline,
              }}
              whileTap={disabled ? undefined : { scale: 0.95 }}
              transition={{ duration: 0.15 }}
              style={{
                padding: "6px 14px",
                borderRadius: md3Shape.full,
                border: isSelected
                  ? `1.5px solid ${md3.primary}`
                  : `1px solid ${md3.outlineVariant}`,
                backgroundColor: isSelected
                  ? md3.primaryContainer
                  : md3.surfaceContainerLow,
                color: isSelected ? md3.onPrimaryContainer : md3.onSurface,
                fontSize: 13,
                fontWeight: isSelected ? 600 : 400,
                fontFamily: "'Zen Maru Gothic', sans-serif",
                cursor: disabled ? "not-allowed" : "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {option.label}
            </motion.button>
          )
        })}
      </div>
      {(supportingText || errorText) && (
        <span
          style={{
            fontSize: 12,
            color: error ? md3.error : md3.onSurfaceVariant,
            fontFamily: "'Zen Maru Gothic', sans-serif",
            paddingLeft: 4,
          }}
        >
          {error ? errorText : supportingText}
        </span>
      )}
    </div>
  )
}
