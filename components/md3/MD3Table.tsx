"use client"

import { ReactNode, CSSProperties } from "react"
import { md3 } from "@/lib/md3-theme"

// Table Container
interface MD3TableProps {
  children: ReactNode
  style?: CSSProperties
}

export function MD3Table({ children, style }: MD3TableProps) {
  return (
    <div
      style={{
        width: "100%",
        overflow: "auto",
        ...style,
      }}
    >
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontFamily: "'Zen Maru Gothic', sans-serif",
        }}
      >
        {children}
      </table>
    </div>
  )
}

// Table Head
interface MD3TableHeadProps {
  children: ReactNode
}

export function MD3TableHead({ children }: MD3TableHeadProps) {
  return (
    <thead
      style={{
        backgroundColor: md3.surfaceContainerLow,
      }}
    >
      {children}
    </thead>
  )
}

// Table Body
interface MD3TableBodyProps {
  children: ReactNode
}

export function MD3TableBody({ children }: MD3TableBodyProps) {
  return <tbody>{children}</tbody>
}

// Table Row
interface MD3TableRowProps {
  children: ReactNode
  onClick?: () => void
  selected?: boolean
  hoverable?: boolean
}

export function MD3TableRow({
  children,
  onClick,
  selected = false,
  hoverable = true,
}: MD3TableRowProps) {
  return (
    <tr
      onClick={onClick}
      style={{
        backgroundColor: selected ? md3.primaryContainer : "transparent",
        borderBottom: `1px solid ${md3.outlineVariant}`,
        cursor: onClick ? "pointer" : "default",
        transition: "background-color 200ms ease",
      }}
      onMouseEnter={(e) => {
        if (hoverable && !selected) {
          e.currentTarget.style.backgroundColor = md3.surfaceContainerLow
        }
      }}
      onMouseLeave={(e) => {
        if (!selected) {
          e.currentTarget.style.backgroundColor = "transparent"
        }
      }}
    >
      {children}
    </tr>
  )
}

// Table Header Cell
interface MD3TableHeaderCellProps {
  children: ReactNode
  align?: "left" | "center" | "right"
  width?: string | number
  sortable?: boolean
  sorted?: "asc" | "desc" | null
  onSort?: () => void
}

export function MD3TableHeaderCell({
  children,
  align = "left",
  width,
  sortable = false,
  sorted = null,
  onSort,
}: MD3TableHeaderCellProps) {
  return (
    <th
      onClick={sortable ? onSort : undefined}
      style={{
        padding: "12px 16px",
        textAlign: align,
        fontSize: 12,
        fontWeight: 500,
        color: md3.onSurfaceVariant,
        width,
        cursor: sortable ? "pointer" : "default",
        userSelect: "none",
        whiteSpace: "nowrap",
      }}
    >
      <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
        {children}
        {sortable && sorted && (
          <span style={{ fontSize: 10 }}>
            {sorted === "asc" ? "▲" : "▼"}
          </span>
        )}
      </span>
    </th>
  )
}

// Table Cell
interface MD3TableCellProps {
  children: ReactNode
  align?: "left" | "center" | "right"
  highlight?: boolean
  colSpan?: number
}

export function MD3TableCell({
  children,
  align = "left",
  highlight = false,
  colSpan,
}: MD3TableCellProps) {
  return (
    <td
      colSpan={colSpan}
      style={{
        padding: "12px 16px",
        textAlign: align,
        fontSize: 14,
        color: highlight ? md3.primary : md3.onSurface,
        fontWeight: highlight ? 500 : 400,
      }}
    >
      {children}
    </td>
  )
}

// Empty State
interface MD3TableEmptyProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
  colSpan: number
}

export function MD3TableEmpty({
  icon,
  title,
  description,
  action,
  colSpan,
}: MD3TableEmptyProps) {
  return (
    <tr>
      <td colSpan={colSpan}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "48px 24px",
            textAlign: "center",
          }}
        >
          {icon && (
            <div style={{ color: md3.onSurfaceVariant, marginBottom: 16 }}>
              {icon}
            </div>
          )}
          <h3
            style={{
              margin: 0,
              fontSize: 16,
              fontWeight: 500,
              color: md3.onSurface,
              fontFamily: "'Zen Maru Gothic', sans-serif",
            }}
          >
            {title}
          </h3>
          {description && (
            <p
              style={{
                margin: "8px 0 0 0",
                fontSize: 14,
                color: md3.onSurfaceVariant,
                fontFamily: "'Zen Maru Gothic', sans-serif",
              }}
            >
              {description}
            </p>
          )}
          {action && <div style={{ marginTop: 16 }}>{action}</div>}
        </div>
      </td>
    </tr>
  )
}
