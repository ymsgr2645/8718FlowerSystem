"use client"

import { useState, useEffect } from "react"
import { motion } from "motion/react"
import { md3 } from "@/lib/md3-theme"
import { Minus, Plus } from "lucide-react"

interface MD3QuantityStepperProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  disabled?: boolean
  size?: "small" | "medium" | "large"
  quickSteps?: number[] // 例: [10, 100] で +10, +100 ボタンを追加
  prefix?: string // 例: "¥" で ¥100 のように表示
}

export function MD3QuantityStepper({
  value,
  onChange,
  min = 0,
  max = 9999999,
  step = 1,
  disabled = false,
  size = "medium",
  quickSteps = [],
  prefix = "",
}: MD3QuantityStepperProps) {
  const [inputValue, setInputValue] = useState(String(value))

  // value が外部から変更された場合に同期
  useEffect(() => {
    setInputValue(String(value))
  }, [value])

  const sizes = {
    small: { height: 32, width: 36, numWidth: 48, fontSize: 14, iconSize: 16, quickPadding: 8 },
    medium: { height: 40, width: 40, numWidth: 56, fontSize: 18, iconSize: 20, quickPadding: 12 },
    large: { height: 48, width: 48, numWidth: 64, fontSize: 20, iconSize: 22, quickPadding: 16 },
  }

  const s = sizes[size]

  const handleChange = (delta: number) => {
    const next = Math.min(max, Math.max(min, value + delta))
    onChange(next)
    setInputValue(String(next))
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, "")
    setInputValue(val)
    const num = parseInt(val, 10)
    if (!isNaN(num)) {
      const clamped = Math.min(max, Math.max(min, num))
      onChange(clamped)
    } else if (val === "") {
      onChange(min)
    }
  }

  const handleBlur = () => {
    setInputValue(String(value))
  }

  const quickButtonStyle = (isPositive: boolean): React.CSSProperties => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: s.height,
    padding: `0 ${s.quickPadding}px`,
    border: "none",
    backgroundColor: isPositive ? md3.primaryContainer : md3.surfaceContainerHigh,
    color: isPositive ? md3.onPrimaryContainer : md3.onSurfaceVariant,
    cursor: disabled ? "not-allowed" : "pointer",
    transition: "all 150ms ease",
    borderRadius: 20,
    fontFamily: "'Zen Maru Gothic', sans-serif",
    fontSize: s.fontSize - 4,
    fontWeight: 500,
    opacity: disabled ? 0.5 : 1,
    whiteSpace: "nowrap",
  })

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      {/* Quick decrement buttons */}
      {quickSteps.map((qs) => (
        <motion.button
          key={`dec-${qs}`}
          type="button"
          onClick={() => handleChange(-qs)}
          disabled={disabled || value <= min}
          whileHover={disabled || value <= min ? undefined : { scale: 1.08 }}
          whileTap={disabled || value <= min ? undefined : { scale: 0.92 }}
          transition={{ duration: 0.15 }}
          style={quickButtonStyle(false)}
        >
          -{prefix}{qs}
        </motion.button>
      ))}

      {/* Main stepper */}
      <div style={{ display: "flex", alignItems: "center", height: s.height }}>
        {/* Minus button */}
        <motion.button
          type="button"
          onClick={() => handleChange(-step)}
          disabled={disabled || value <= min}
          whileHover={disabled || value <= min ? undefined : { backgroundColor: md3.surfaceContainerHighest }}
          whileTap={disabled || value <= min ? undefined : { scale: 0.9 }}
          transition={{ duration: 0.15 }}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: s.width,
            height: s.height,
            border: "none",
            borderRadius: "20px 0 0 20px",
            backgroundColor: md3.surfaceVariant,
            color: disabled || value <= min ? md3.outlineVariant : md3.onSurfaceVariant,
            cursor: disabled || value <= min ? "not-allowed" : "pointer",
          }}
        >
          <Minus size={s.iconSize} />
        </motion.button>

        {/* Number display */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: s.numWidth,
            height: s.height,
            backgroundColor: md3.background,
            borderTop: `1px solid ${md3.outlineVariant}`,
            borderBottom: `1px solid ${md3.outlineVariant}`,
          }}
        >
          {prefix && (
            <span
              style={{
                fontSize: s.fontSize - 4,
                color: md3.onSurfaceVariant,
                marginRight: 2,
              }}
            >
              {prefix}
            </span>
          )}
          <input
            type="text"
            inputMode="numeric"
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleBlur}
            disabled={disabled}
            style={{
              width: prefix ? s.numWidth - 20 : s.numWidth - 8,
              height: "100%",
              border: "none",
              backgroundColor: "transparent",
              textAlign: "center",
              fontSize: s.fontSize,
              fontWeight: 400,
              fontFamily: "'Zen Maru Gothic', sans-serif",
              color: md3.onSurface,
              outline: "none",
            }}
          />
        </div>

        {/* Plus button */}
        <motion.button
          type="button"
          onClick={() => handleChange(step)}
          disabled={disabled || value >= max}
          whileHover={disabled || value >= max ? undefined : { opacity: 0.85 }}
          whileTap={disabled || value >= max ? undefined : { scale: 0.9 }}
          transition={{ duration: 0.15 }}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: s.width,
            height: s.height,
            border: "none",
            borderRadius: "0 20px 20px 0",
            backgroundColor: disabled || value >= max ? md3.surfaceContainerHigh : md3.primary,
            color: disabled || value >= max ? md3.outlineVariant : md3.onPrimary,
            cursor: disabled || value >= max ? "not-allowed" : "pointer",
          }}
        >
          <Plus size={s.iconSize} />
        </motion.button>
      </div>

      {/* Quick increment buttons */}
      {quickSteps.map((qs) => (
        <motion.button
          key={`inc-${qs}`}
          type="button"
          onClick={() => handleChange(qs)}
          disabled={disabled || value >= max}
          whileHover={disabled || value >= max ? undefined : { scale: 1.08 }}
          whileTap={disabled || value >= max ? undefined : { scale: 0.92 }}
          transition={{ duration: 0.15 }}
          style={quickButtonStyle(true)}
        >
          +{prefix}{qs}
        </motion.button>
      ))}
    </div>
  )
}

// アイテムカード: 花情報 + 数量ステッパーを一体化
interface MD3ItemCardProps {
  name: string
  detail?: string
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  quickSteps?: number[]
}

export function MD3ItemCard({
  name,
  detail,
  value,
  onChange,
  min = 0,
  max = 9999,
  quickSteps = [10],
}: MD3ItemCardProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: 16,
        backgroundColor: md3.surface,
        borderRadius: 16,
        border: `1px solid ${md3.outlineVariant}`,
      }}
    >
      {/* 左: 花情報 */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
        <span
          style={{
            fontSize: 16,
            fontWeight: 400,
            fontFamily: "'Zen Maru Gothic', sans-serif",
            color: md3.onSurface,
          }}
        >
          {name}
        </span>
        {detail && (
          <span
            style={{
              fontSize: 13,
              fontWeight: 400,
              fontFamily: "'Zen Maru Gothic', sans-serif",
              color: md3.onSurfaceVariant,
            }}
          >
            {detail}
          </span>
        )}
      </div>

      {/* 右: 数量ステッパー */}
      <MD3QuantityStepper
        value={value}
        onChange={onChange}
        min={min}
        max={max}
        quickSteps={quickSteps}
      />
    </div>
  )
}
