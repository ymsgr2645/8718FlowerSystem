"use client"

import { useState } from "react"
import { motion } from "motion/react"
import { md3, md3Shape } from "@/lib/md3-theme"

interface MD3SwitchProps {
  checked?: boolean
  defaultChecked?: boolean
  onChange?: (checked: boolean) => void
  disabled?: boolean
  label?: string
  size?: "default" | "small"
}

export function MD3Switch({
  checked: controlledChecked,
  defaultChecked = false,
  onChange,
  disabled = false,
  label,
  size = "default",
}: MD3SwitchProps) {
  const [internalChecked, setInternalChecked] = useState(defaultChecked)
  const isChecked = controlledChecked !== undefined ? controlledChecked : internalChecked

  const handleClick = () => {
    if (disabled) return
    const newValue = !isChecked
    if (controlledChecked === undefined) {
      setInternalChecked(newValue)
    }
    onChange?.(newValue)
  }

  const isSmall = size === "small"

  const trackW = isSmall ? 36 : 52
  const trackH = isSmall ? 20 : 32
  const thumbChecked = isSmall ? 14 : 24
  const thumbUnchecked = isSmall ? 10 : 16
  const thumbOffset = isSmall ? 3 : 4

  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 12 }}>
      <motion.div
        onClick={handleClick}
        animate={{
          backgroundColor: isChecked ? md3.primary : md3.surfaceContainerHighest,
        }}
        transition={{ duration: 0.2 }}
        whileHover={disabled ? undefined : { scale: 1.05 }}
        whileTap={disabled ? undefined : { scale: 0.95 }}
        style={{
          position: "relative",
          width: trackW,
          height: trackH,
          borderRadius: md3Shape.full,
          border: isChecked ? "none" : `${isSmall ? 1.5 : 2}px solid ${md3.outline}`,
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.38 : 1,
        }}
        role="switch"
        aria-checked={isChecked}
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e: React.KeyboardEvent) => {
          if (e.key === " " || e.key === "Enter") {
            e.preventDefault()
            handleClick()
          }
        }}
      >
        {/* Thumb */}
        <motion.div
          animate={{
            left: isChecked ? trackW - thumbChecked - thumbOffset : thumbOffset,
            width: isChecked ? thumbChecked : thumbUnchecked,
            height: isChecked ? thumbChecked : thumbUnchecked,
            backgroundColor: isChecked ? md3.onPrimary : md3.outline,
          }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          style={{
            position: "absolute",
            top: "50%",
            transform: "translateY(-50%)",
            borderRadius: md3Shape.full,
            boxShadow: isChecked ? "0 1px 2px rgba(0, 0, 0, 0.3)" : "none",
          }}
        />
      </motion.div>
      {label && (
        <span
          style={{
            fontSize: 14,
            color: disabled ? md3.onSurfaceVariant : md3.onSurface,
            fontFamily: "'Zen Maru Gothic', sans-serif",
            opacity: disabled ? 0.38 : 1,
          }}
        >
          {label}
        </span>
      )}
    </div>
  )
}
