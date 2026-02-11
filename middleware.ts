/**
 * 8718 Flower System - Middleware
 * ロールベースのアクセス制御
 */

import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const ADMIN_PATHS = ["/settings", "/admin"]

function parseAuthCookie(value: string): { email: string; role: string } | null {
  try {
    return JSON.parse(decodeURIComponent(value))
  } catch {
    return null
  }
}

function parsePermsCookie(value: string): Record<string, string[]> | null {
  try {
    return JSON.parse(decodeURIComponent(value))
  } catch {
    return null
  }
}

function canAccess(role: string, pathname: string, perms: Record<string, string[]> | null): boolean {
  if (role === "admin") return true
  if (ADMIN_PATHS.some((p) => pathname.startsWith(p))) return false

  if (!perms) return true

  const allowedPaths = perms[role]
  if (!allowedPaths) return true

  for (const p of allowedPaths) {
    if (pathname === p || pathname.startsWith(p + "/")) return true
  }

  const allPaths = [...new Set([
    ...(perms.boss || []),
    ...(perms.manager || []),
    ...(perms.staff || []),
  ])]
  const isControlledPath = allPaths.some((p) => pathname === p || pathname.startsWith(p + "/"))
  if (!isControlledPath) return true

  return false
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const authCookie = req.cookies.get("8718_auth")
  const isLoggedIn = !!authCookie?.value

  const publicPaths = ["/login", "/api/auth"]
  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path))

  if (pathname === "/login" && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  if (!isPublicPath && !isLoggedIn) {
    const protectedPrefixes = [
      "/dashboard", "/arrivals", "/warehouse", "/inventory", "/supplies",
      "/transfer", "/invoice", "/expenses", "/disposals", "/alerts",
      "/analytics", "/settings", "/admin", "/bucket-paper",
      "/supply-transfers", "/store", "/system-settings",
    ]
    if (pathname === "/" || protectedPrefixes.some((p) => pathname.startsWith(p))) {
      return NextResponse.redirect(new URL("/login", req.url))
    }
  }

  // ロールベースのアクセス制御（権限マトリクス対応）
  if (isLoggedIn && authCookie?.value) {
    const auth = parseAuthCookie(authCookie.value)
    if (auth) {
      const permsCookie = req.cookies.get("8718_perms")
      const perms = permsCookie?.value ? parsePermsCookie(permsCookie.value) : null
      if (!canAccess(auth.role, pathname, perms)) {
        return NextResponse.redirect(new URL("/dashboard", req.url))
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/",
    "/dashboard/:path*",
    "/arrivals/:path*",
    "/warehouse/:path*",
    "/inventory/:path*",
    "/supplies/:path*",
    "/transfer/:path*",
    "/transfer-entry/:path*",
    "/invoice/:path*",
    "/expenses/:path*",
    "/disposals/:path*",
    "/alerts/:path*",
    "/analytics/:path*",
    "/settings/:path*",
    "/admin/:path*",
    "/bucket-paper/:path*",
    "/supply-transfers/:path*",
    "/store/:path*",
    "/system-settings/:path*",
    "/login",
  ],
}
