"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Bell, ChevronDown } from "lucide-react"

interface HeaderProps {
  title?: string
  subtitle?: string
}

export default function Header({ title, subtitle }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 h-16 bg-white border-b border-border flex items-center justify-between px-6">
      {/* Page Title */}
      <div>
        {title && (
          <h1 className="text-xl font-bold text-foreground">{title}</h1>
        )}
        {subtitle && (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        {/* Store Selector */}
        <Button variant="outline" size="sm" className="gap-2">
          <span className="text-sm">🏪 全店舗</span>
          <ChevronDown className="size-4" />
        </Button>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="size-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
        </Button>

        {/* User Avatar */}
        <div className="flex items-center gap-2">
          <Avatar className="w-9 h-9 bg-primary">
            <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
              社
            </AvatarFallback>
          </Avatar>
          <div className="hidden md:block">
            <p className="text-sm font-medium text-foreground">社長</p>
            <Badge variant="secondary" className="text-xs">BOSS</Badge>
          </div>
        </div>
      </div>
    </header>
  )
}
