"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Flower2 } from "lucide-react"

const md3 = {
  primary: "#C0634A",
  onPrimary: "#FFFFFF",
  primaryContainer: "#FFDAD1",
  onPrimaryContainer: "#3B0907",
  surface: "#FFFFFF",
  onSurface: "#1C1B1F",
  onSurfaceVariant: "#534341",
  outline: "#857371",
  outlineVariant: "#D8C2BF",
  background: "#FFFBFF",
}

function setAuthCookie(email: string, role: string) {
  const authData = JSON.stringify({ email, role, timestamp: Date.now() })
  document.cookie = `8718_auth=${encodeURIComponent(authData)}; path=/; max-age=86400`
}

const QUICK_LOGINS = [
  { role: "admin", label: "ADMIN", email: "admin@8718.jp", desc: "全機能アクセス", color: "#C0634A" },
  { role: "boss", label: "Boss", email: "boss@8718.jp", desc: "経営管理+業務", color: "#1565C0" },
  { role: "manager", label: "Manager", email: "manager@8718.jp", desc: "業務管理", color: "#2E7D32" },
  { role: "staff", label: "Staff", email: "staff@8718.jp", desc: "基本業務のみ", color: "#616161" },
]

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const doLogin = (loginEmail: string, role: string) => {
    setAuthCookie(loginEmail, role)
    localStorage.setItem("8718_user", JSON.stringify({ email: loginEmail, role }))
    router.push("/dashboard")
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    let role = "staff"
    if (email === "admin@8718.jp") {
      role = "admin"
    } else if (email === "boss@8718.jp" || email === "hanaichiya@8718.jp") {
      role = "boss"
    } else if (email.includes("manager")) {
      role = "manager"
    }

    setTimeout(() => doLogin(email, role), 300)
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "'Zen Maru Gothic', sans-serif" }}>
      <div
        style={{
          width: "58%",
          backgroundColor: md3.primary,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
        }}
      >
        <Flower2 size={64} color={md3.onPrimary} strokeWidth={1.5} />
        <h1
          style={{
            color: md3.onPrimary,
            fontFamily: "'Abhaya Libre', serif",
            fontSize: 84,
            fontWeight: 600,
            letterSpacing: 8,
            margin: 0,
          }}
        >
          8718
        </h1>
        <p
          style={{
            color: "rgba(255, 255, 255, 0.8)",
            fontFamily: "'IBM Plex Sans JP', sans-serif",
            fontSize: 16,
            fontWeight: 400,
            letterSpacing: 4,
            margin: 0,
          }}
        >
          FLOWER SYSTEM
        </p>
      </div>

      <div
        style={{
          flex: 1,
          backgroundColor: md3.surface,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 80px",
          gap: 28,
        }}
      >
        <h2
          style={{
            color: md3.onSurface,
            fontSize: 28,
            fontWeight: 500,
            margin: 0,
            alignSelf: "flex-start",
          }}
        >
          ログイン
        </h2>

        <form onSubmit={handleLogin} style={{ width: "100%", display: "flex", flexDirection: "column", gap: 28 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <label style={{ color: md3.onSurfaceVariant, fontSize: 14, fontWeight: 500 }}>
              メールアドレス
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              style={{
                height: 52,
                padding: "0 16px",
                borderRadius: 8,
                backgroundColor: md3.surface,
                border: `1px solid ${md3.outlineVariant}`,
                fontSize: 16,
                color: md3.onSurface,
                outline: "none",
              }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <label style={{ color: md3.onSurfaceVariant, fontSize: 14, fontWeight: 500 }}>
              パスワード
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                height: 52,
                padding: "0 16px",
                borderRadius: 8,
                backgroundColor: md3.surface,
                border: `1px solid ${md3.outlineVariant}`,
                fontSize: 16,
                color: md3.onSurface,
                outline: "none",
              }}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              height: 48,
              borderRadius: 24,
              backgroundColor: md3.primary,
              border: "none",
              color: md3.onPrimary,
              fontSize: 16,
              fontWeight: 500,
              cursor: "pointer",
              fontFamily: "'Zen Maru Gothic', sans-serif",
            }}
          >
            {isLoading ? "ログイン中..." : "ログイン"}
          </button>
        </form>

        <a
          href="#"
          style={{
            color: md3.primary,
            fontSize: 14,
            textDecoration: "none",
            alignSelf: "center",
          }}
        >
          パスワードを忘れた場合
        </a>

        {/* クイックログイン（開発用） */}
        <div style={{ width: "100%", marginTop: 8 }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 12, marginBottom: 16,
          }}>
            <div style={{ flex: 1, height: 1, backgroundColor: md3.outlineVariant }} />
            <span style={{ fontSize: 12, color: md3.onSurfaceVariant, whiteSpace: "nowrap" }}>
              クイックログイン（開発用）
            </span>
            <div style={{ flex: 1, height: 1, backgroundColor: md3.outlineVariant }} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {QUICK_LOGINS.map((q) => (
              <button
                key={q.role}
                onClick={() => doLogin(q.email, q.role)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  gap: 2,
                  padding: "10px 16px",
                  borderRadius: 12,
                  border: `1px solid ${q.color}40`,
                  backgroundColor: `${q.color}08`,
                  cursor: "pointer",
                  fontFamily: "'Zen Maru Gothic', sans-serif",
                  transition: "all 150ms ease",
                }}
              >
                <span style={{ fontSize: 14, fontWeight: 600, color: q.color }}>{q.label}</span>
                <span style={{ fontSize: 11, color: md3.onSurfaceVariant }}>{q.desc}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
