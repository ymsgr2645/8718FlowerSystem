"use client"

import Sidebar from "./Sidebar"
import Header from "./Header"

const DRAWER_WIDTH = 240

interface AppLayoutProps {
  children: React.ReactNode
  title?: string
  subtitle?: string
  isAdmin?: boolean
}

export default function AppLayout({
  children,
  title,
  subtitle,
  isAdmin = true,
}: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <Sidebar isAdmin={isAdmin} />

      {/* Main Content */}
      <div
        className="min-h-screen flex flex-col"
        style={{ marginLeft: DRAWER_WIDTH }}
      >
        {/* Header */}
        <Header title={title} subtitle={subtitle} />

        {/* Content Area */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
