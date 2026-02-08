"use client"

import { MD3Button } from "@/components/md3/MD3Button"
import { MD3TextField } from "@/components/md3/MD3TextField"
import { md3 } from "@/lib/md3-theme"

interface MD3NumberFieldProps {
  label?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  supportingText?: string
  fullWidth?: boolean
  stepOptions?: number[]
  min?: number
  max?: number
}

export function MD3NumberField({
  label,
  value,
  onChange,
  placeholder,
  supportingText,
  fullWidth = false,
  stepOptions = [10, -10, 100, -100],
  min,
  max,
}: MD3NumberFieldProps) {
  const handleInputChange = (next: string) => {
    if (next === "" || /^-?\d+(\.\d+)?$/.test(next)) {
      onChange(next)
    }
  }

  const applyStep = (delta: number) => {
    const base = value === "" ? 0 : Number(value)
    if (Number.isNaN(base)) {
      onChange(String(delta))
      return
    }
    let nextValue = base + delta
    if (min !== undefined) nextValue = Math.max(min, nextValue)
    if (max !== undefined) nextValue = Math.min(max, nextValue)
    onChange(String(nextValue))
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, width: fullWidth ? "100%" : "auto" }}>
      <MD3TextField
        label={label}
        type="text"
        inputMode="decimal"
        value={value}
        onChange={(e) => handleInputChange(e.target.value)}
        placeholder={placeholder}
        supportingText={supportingText}
        fullWidth={fullWidth}
      />
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {stepOptions.map((step) => (
          <MD3Button
            key={step}
            variant="outlined"
            size="small"
            onClick={() => applyStep(step)}
            style={{ color: step < 0 ? md3.error : md3.primary }}
          >
            {step > 0 ? `+${step}` : step}
          </MD3Button>
        ))}
      </div>
    </div>
  )
}
