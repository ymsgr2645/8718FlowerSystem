/**
 * 8718 Flower System - Middleware
 * Phase 1: ローカル簡易認証（Cookie）
 */

import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

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
      "/dashboard",
      "/arrivals",
      "/warehouse",
      "/inventory",
      "/supplies",
      "/transfer",
      "/invoice",
      "/expenses",
      "/disposals",
      "/alerts",
      "/settings",
      "/admin",
    ]
    if (pathname === "/" || protectedPrefixes.some((p) => pathname.startsWith(p))) {
      return NextResponse.redirect(new URL("/login", req.url))
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
    "/invoice/:path*",
    "/expenses/:path*",
    "/disposals/:path*",
    "/alerts/:path*",
    "/settings/:path*",
    "/admin/:path*",
    "/login",
  ],
}
