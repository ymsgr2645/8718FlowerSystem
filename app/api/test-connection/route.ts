import { NextResponse } from "next/server"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export async function GET() {
  try {
    const res = await fetch(`${API_BASE_URL}/health`)
    if (!res.ok) {
      return NextResponse.json({ ok: false, status: res.status }, { status: 500 })
    }
    const data = await res.json()
    return NextResponse.json({ ok: true, data })
  } catch (error) {
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 })
  }
}
