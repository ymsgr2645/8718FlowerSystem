"use client"

import { CSSProperties, useState } from "react"
import { md3, md3Shape } from "@/lib/md3-theme"

interface MD3SwitchProps {
  checked?: boolean
  defaultChecked?: boolean
  onChange?: (checked: boolean) => void
  disabled?: boolean
  label?: string
}

export function MD3Switch({
  checked: controlledChecked,
  defaultChecked = false,
  onChange,
  disabled = false,
  label,
}: MD3SwitchProps) {
  const [internalChecked, setInternalChecked] = useState(defaultChecked)
  const isChecked = controlledChecked !== undefined ? controlledChecked : internalChecked
  const [isHovered, setIsHovered] = useState(false)
  const [isPressed, setIsPressed] = useState(false)

  const handleClick = () => {
    if (disabled) return
    const newValue = !isChecked
    if (controlledChecked === undefined) {
      setInternalChecked(newValue)
    }
    onChange?.(newValue)
  }

  const trackStyles: CSSProperties = {
    position: "relative",
    width: 52,
    height: 32,
    borderRadius: md3Shape.full,
    backgroundColor: isChecked ? md3.primary : md3.surfaceContainerHighest,
    border: isChecked ? "none" : `2px solid ${md3.outline}`,
    cursor: disabled ? "not-allowed" : "pointer",
    transition: "all 200ms cubic-bezier(0.2, 0, 0, 1)",
    opacity: disabled ? 0.38 : 1,
  }

  const thumbStyles: CSSProperties = {
    position: "absolute",
    top: "50%",
    left: isChecked ? "calc(100% - 28px)" : "4px",
    transform: "translateY(-50%)",
    width: isChecked ? 24 : isPressed ? 28 : isHovered ? 24 : 16,
    height: isChecked ? 24 : isPressed ? 28 : isHovered ? 24 : 16,
    borderRadius: md3Shape.full,
    backgroundColor: isChecked ? md3.onPrimary : md3.outline,
    transition: "all 200ms cubic-bezier(0.2, 0, 0, 1)",
    boxShadow: isChecked
      ? "0 1px 3px rgba(0, 0, 0, 0.3)"
      : "none",
  }

  const stateLayerStyles: CSSProperties = {
    position: "absolute",
    top: "50%",
    left: isChecked ? "calc(100% - 28px)" : "4px",
    transform: "translate(-12px, -50%)",
    width: 40,
    height: 40,
    borderRadius: md3Shape.full,
    backgroundColor: isChecked ? md3.primary : md3.onSurface,
    opacity: isHovered ? 0.08 : isPressed ? 0.12 : 0,
    transition: "opacity 200ms ease",
    pointerEvents: "none",
  }

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 12,
      }}
    >
      <div
        style={trackStyles}
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false)
          setIsPressed(false)
        }}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        role="switch"
        aria-checked={isChecked}
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if (e.key === " " || e.key === "Enter") {
            e.preventDefault()
            handleClick()
          }
        }}
      >
        <div style={stateLayerStyles} />
        <div style={thumbStyles} />
      </div>
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
