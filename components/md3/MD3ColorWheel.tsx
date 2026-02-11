"use client"

import { useState } from "react"
import { md3 } from "@/lib/md3-theme"

interface MD3ColorWheelProps {
  value: string
  onChange: (color: string) => void
  size?: number
}

// Material Design 500系 — 視認性が高く互いに区別しやすい18色
const PALETTE = [
  "#E53935", "#D81B60", "#8E24AA", "#5E35B1",
  "#3949AB", "#1E88E5", "#039BE5", "#00ACC1",
  "#00897B", "#43A047", "#7CB342", "#C0CA33",
  "#FDD835", "#FFB300", "#FB8C00", "#F4511E",
  "#6D4C41", "#546E7A",
]

export function MD3ColorWheel({ value, onChange }: MD3ColorWheelProps) {
  const [customMode, setCustomMode] = useState(false)
  const [customHex, setCustomHex] = useState(value || "#E53935")

  const isCustom = !PALETTE.includes(value)

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {/* Palette grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 6 }}>
        {PALETTE.map((color) => {
          const selected = value === color
          return (
            <button
              key={color}
              type="button"
              onClick={() => {
                onChange(color)
                setCustomMode(false)
              }}
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                backgroundColor: color,
                border: selected ? "3px solid #fff" : "2px solid transparent",
                boxShadow: selected ? `0 0 0 2px ${color}` : "none",
                cursor: "pointer",
                transition: "transform 150ms ease, box-shadow 150ms ease",
                transform: selected ? "scale(1.15)" : "scale(1)",
                outline: "none",
              }}
              title={color}
            />
          )
        })}
      </div>

      {/* Selected preview + custom hex */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: "50%",
            backgroundColor: value,
            border: `1px solid ${md3.outlineVariant}`,
            flexShrink: 0,
          }}
        />
        {customMode || isCustom ? (
          <input
            type="text"
            value={customHex}
            onChange={(e) => {
              const v = e.target.value
              setCustomHex(v)
              if (/^#[0-9a-fA-F]{6}$/.test(v)) onChange(v)
            }}
            placeholder="#000000"
            maxLength={7}
            style={{
              fontFamily: "monospace",
              fontSize: 13,
              color: md3.onSurface,
              border: `1px solid ${md3.outlineVariant}`,
              borderRadius: 8,
              padding: "4px 8px",
              width: 90,
              outline: "none",
            }}
          />
        ) : (
          <span style={{ fontSize: 13, fontFamily: "monospace", color: md3.onSurfaceVariant }}>{value}</span>
        )}
        <button
          type="button"
          onClick={() => {
            setCustomMode(!customMode)
            setCustomHex(value)
          }}
          style={{
            fontSize: 11,
            color: md3.primary,
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "2px 4px",
            borderRadius: 4,
          }}
        >
          {customMode || isCustom ? "パレット" : "カスタム"}
        </button>
      </div>
    </div>
  )
}
