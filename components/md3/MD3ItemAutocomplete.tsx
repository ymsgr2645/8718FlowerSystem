"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { md3, md3Shape, md3Elevation } from "@/lib/md3-theme"
import { Search, X, Check } from "lucide-react"

interface AutocompleteItem {
  id: number
  name: string
  code?: string
  category?: string
}

interface MD3ItemAutocompleteProps {
  label?: string
  placeholder?: string
  items: AutocompleteItem[]
  value: AutocompleteItem | null
  onChange: (item: AutocompleteItem | null) => void
  fullWidth?: boolean
  disabled?: boolean
}

export function MD3ItemAutocomplete({
  label,
  placeholder = "商品を検索...",
  items,
  value,
  onChange,
  fullWidth = false,
  disabled = false,
}: MD3ItemAutocompleteProps) {
  const [query, setQuery] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [focused, setFocused] = useState(false)
  const [highlightIndex, setHighlightIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const filteredItems = useMemo(() => {
    if (!query.trim()) return items.slice(0, 50)
    const q = query.toLowerCase()
    return items
      .filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          (item.code && item.code.toLowerCase().includes(q)) ||
          (item.category && item.category.toLowerCase().includes(q))
      )
      .slice(0, 50)
  }, [items, query])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    setHighlightIndex(0)
  }, [filteredItems])

  useEffect(() => {
    if (isOpen && listRef.current) {
      const highlighted = listRef.current.children[highlightIndex] as HTMLElement
      if (highlighted) {
        highlighted.scrollIntoView({ block: "nearest" })
      }
    }
  }, [highlightIndex, isOpen])

  const handleSelect = (item: AutocompleteItem) => {
    onChange(item)
    setQuery("")
    setIsOpen(false)
    inputRef.current?.blur()
  }

  const handleClear = () => {
    onChange(null)
    setQuery("")
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setIsOpen(true)
      }
      return
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        setHighlightIndex((i) => Math.min(i + 1, filteredItems.length - 1))
        break
      case "ArrowUp":
        e.preventDefault()
        setHighlightIndex((i) => Math.max(i - 1, 0))
        break
      case "Enter":
        e.preventDefault()
        if (filteredItems[highlightIndex]) {
          handleSelect(filteredItems[highlightIndex])
        }
        break
      case "Escape":
        setIsOpen(false)
        break
    }
  }

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        width: fullWidth ? "100%" : 320,
      }}
    >
      {label && (
        <label
          style={{
            display: "block",
            fontSize: 12,
            fontWeight: 500,
            color: md3.onSurfaceVariant,
            marginBottom: 6,
            fontFamily: "'Zen Maru Gothic', sans-serif",
          }}
        >
          {label}
        </label>
      )}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "0 12px",
          height: 48,
          backgroundColor: md3.surfaceContainerHigh,
          borderRadius: md3Shape.medium,
          border: `1px solid ${focused ? md3.primary : md3.outline}`,
          transition: "border-color 150ms ease",
        }}
      >
        <Search size={18} color={md3.onSurfaceVariant} />

        {value ? (
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span
              style={{
                flex: 1,
                fontSize: 14,
                fontFamily: "'Zen Maru Gothic', sans-serif",
                color: md3.onSurface,
                fontWeight: 500,
              }}
            >
              {value.code && (
                <span style={{ color: md3.primary, marginRight: 8 }}>{value.code}</span>
              )}
              {value.name}
            </span>
            <button
              type="button"
              onClick={handleClear}
              disabled={disabled}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 24,
                height: 24,
                borderRadius: "50%",
                border: "none",
                backgroundColor: md3.surfaceContainerHighest,
                color: md3.onSurfaceVariant,
                cursor: disabled ? "not-allowed" : "pointer",
              }}
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setIsOpen(true)
            }}
            onFocus={() => {
              setFocused(true)
              setIsOpen(true)
            }}
            onBlur={() => setFocused(false)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            style={{
              flex: 1,
              border: "none",
              backgroundColor: "transparent",
              fontSize: 14,
              fontFamily: "'Zen Maru Gothic', sans-serif",
              color: md3.onSurface,
              outline: "none",
            }}
          />
        )}
      </div>

      {/* Dropdown */}
      {isOpen && !value && (
        <div
          ref={listRef}
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            marginTop: 4,
            maxHeight: 300,
            overflowY: "auto",
            backgroundColor: md3.surfaceContainerLow,
            borderRadius: md3Shape.medium,
            boxShadow: md3Elevation.level2,
            zIndex: 1000,
          }}
        >
          {filteredItems.length === 0 ? (
            <div
              style={{
                padding: 16,
                textAlign: "center",
                color: md3.onSurfaceVariant,
                fontSize: 14,
                fontFamily: "'Zen Maru Gothic', sans-serif",
              }}
            >
              該当する商品がありません
            </div>
          ) : (
            filteredItems.map((item, index) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item)}
                onMouseEnter={() => setHighlightIndex(index)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  width: "100%",
                  padding: "12px 16px",
                  border: "none",
                  backgroundColor: index === highlightIndex ? md3.primaryContainer : "transparent",
                  color: index === highlightIndex ? md3.onPrimaryContainer : md3.onSurface,
                  textAlign: "left",
                  cursor: "pointer",
                  transition: "background-color 100ms ease",
                  fontFamily: "'Zen Maru Gothic', sans-serif",
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {item.code && (
                      <span
                        style={{
                          fontSize: 12,
                          fontFamily: "monospace",
                          color: index === highlightIndex ? md3.primary : md3.primary,
                          backgroundColor: index === highlightIndex ? md3.surface : md3.primaryContainer,
                          padding: "2px 6px",
                          borderRadius: 4,
                        }}
                      >
                        {item.code}
                      </span>
                    )}
                    <span style={{ fontSize: 14, fontWeight: 500 }}>{item.name}</span>
                  </div>
                  {item.category && (
                    <span
                      style={{
                        fontSize: 12,
                        color: index === highlightIndex ? md3.onPrimaryContainer : md3.onSurfaceVariant,
                        marginTop: 2,
                        display: "block",
                      }}
                    >
                      {item.category}
                    </span>
                  )}
                </div>
                {index === highlightIndex && <Check size={18} color={md3.primary} />}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
