"use client"

import { ReactNode, CSSProperties } from "react"
import { motion, AnimatePresence } from "motion/react"
import { md3, md3Shape, md3Elevation } from "@/lib/md3-theme"
import { X } from "lucide-react"

interface MD3DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: ReactNode
  maxWidth?: number
}

export function MD3Dialog({ open, onOpenChange, children, maxWidth = 560 }: MD3DialogProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.32)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => onOpenChange(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            style={{
              backgroundColor: md3.surfaceContainerHigh,
              borderRadius: md3Shape.extraLarge,
              boxShadow: md3Elevation.level3,
              minWidth: 280,
              maxWidth: maxWidth,
              width: "calc(100% - 48px)",
              maxHeight: "calc(100% - 48px)",
              overflow: "hidden",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

interface MD3DialogHeaderProps {
  children: ReactNode
  onClose?: () => void
}

export function MD3DialogHeader({ children, onClose }: MD3DialogHeaderProps) {
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
        <motion.button
          whileHover={{ backgroundColor: "rgba(0, 0, 0, 0.08)" }}
          whileTap={{ scale: 0.9 }}
          onClick={onClose}
          style={{
            width: 40,
            height: 40,
            borderRadius: md3Shape.full,
            border: "none",
            backgroundColor: "transparent",
            color: md3.onSurfaceVariant,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <X size={24} />
        </motion.button>
      )}
    </div>
  )
}

export function MD3DialogTitle({ children }: { children: ReactNode }) {
  return (
    <h2 style={{ margin: 0, fontSize: 24, fontWeight: 400, color: md3.onSurface, fontFamily: "'Zen Maru Gothic', sans-serif", lineHeight: "32px" }}>
      {children}
    </h2>
  )
}

export function MD3DialogDescription({ children }: { children: ReactNode }) {
  return (
    <p style={{ margin: "8px 0 0 0", fontSize: 14, color: md3.onSurfaceVariant, fontFamily: "'Zen Maru Gothic', sans-serif", lineHeight: "20px" }}>
      {children}
    </p>
  )
}

export function MD3DialogBody({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div style={{ padding: "0 24px 24px 24px", color: md3.onSurfaceVariant, fontFamily: "'Zen Maru Gothic', sans-serif", fontSize: 14, lineHeight: "20px", overflowY: "auto", ...style }}>
      {children}
    </div>
  )
}

export function MD3DialogFooter({ children }: { children: ReactNode }) {
  return (
    <div style={{ padding: "0 24px 24px 24px", display: "flex", justifyContent: "flex-end", gap: 8 }}>
      {children}
    </div>
  )
}
