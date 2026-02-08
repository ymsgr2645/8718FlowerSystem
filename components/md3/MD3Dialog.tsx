"use client"

import { ReactNode, CSSProperties, useState } from "react"
import { md3, md3Shape, md3Elevation } from "@/lib/md3-theme"
import { X } from "lucide-react"

interface MD3DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: ReactNode
  maxWidth?: number
}

export function MD3Dialog({ open, onOpenChange, children, maxWidth = 560 }: MD3DialogProps) {
  if (!open) return null

  const overlayStyles: CSSProperties = {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0, 0, 0, 0.32)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    opacity: 1,
  }

  const dialogStyles: CSSProperties = {
    backgroundColor: md3.surfaceContainerHigh,
    borderRadius: md3Shape.extraLarge,
    boxShadow: md3Elevation.level3,
    minWidth: 280,
    maxWidth: maxWidth,
    width: "calc(100% - 48px)",
    maxHeight: "calc(100% - 48px)",
    overflow: "hidden",
    transform: "scale(1)",
  }

  return (
    <div style={overlayStyles} onClick={() => onOpenChange(false)}>
      <div style={dialogStyles} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  )
}

interface MD3DialogHeaderProps {
  children: ReactNode
  onClose?: () => void
}

export function MD3DialogHeader({ children, onClose }: MD3DialogHeaderProps) {
  const [closeHovered, setCloseHovered] = useState(false)

  return (
    <div
      style={{
        padding: "24px 24px 16px 24px",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 16,
      }}
    >
      <div style={{ flex: 1 }}>{children}</div>
      {onClose && (
        <button
          onClick={onClose}
          onMouseEnter={() => setCloseHovered(true)}
          onMouseLeave={() => setCloseHovered(false)}
          style={{
            width: 40,
            height: 40,
            borderRadius: md3Shape.full,
            border: "none",
            backgroundColor: closeHovered ? "rgba(0, 0, 0, 0.08)" : "transparent",
            color: md3.onSurfaceVariant,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "background-color 200ms ease",
          }}
        >
          <X size={24} />
        </button>
      )}
    </div>
  )
}

interface MD3DialogTitleProps {
  children: ReactNode
}

export function MD3DialogTitle({ children }: MD3DialogTitleProps) {
  return (
    <h2
      style={{
        margin: 0,
        fontSize: 24,
        fontWeight: 400,
        color: md3.onSurface,
        fontFamily: "'Zen Maru Gothic', sans-serif",
        lineHeight: "32px",
      }}
    >
      {children}
    </h2>
  )
}

interface MD3DialogDescriptionProps {
  children: ReactNode
}

export function MD3DialogDescription({ children }: MD3DialogDescriptionProps) {
  return (
    <p
      style={{
        margin: "8px 0 0 0",
        fontSize: 14,
        color: md3.onSurfaceVariant,
        fontFamily: "'Zen Maru Gothic', sans-serif",
        lineHeight: "20px",
      }}
    >
      {children}
    </p>
  )
}

interface MD3DialogBodyProps {
  children: ReactNode
  style?: CSSProperties
}

export function MD3DialogBody({ children, style }: MD3DialogBodyProps) {
  return (
    <div
      style={{
        padding: "0 24px 24px 24px",
        color: md3.onSurfaceVariant,
        fontFamily: "'Zen Maru Gothic', sans-serif",
        fontSize: 14,
        lineHeight: "20px",
        overflowY: "auto",
        ...style,
      }}
    >
      {children}
    </div>
  )
}

interface MD3DialogFooterProps {
  children: ReactNode
}

export function MD3DialogFooter({ children }: MD3DialogFooterProps) {
  return (
    <div
      style={{
        padding: "0 24px 24px 24px",
        display: "flex",
        justifyContent: "flex-end",
        gap: 8,
      }}
    >
      {children}
    </div>
  )
}
