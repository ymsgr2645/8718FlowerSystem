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

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    let role = "staff"
    if (email === "hanaichiya@8718.jp") {
      role = "boss"
    } else if (email.includes("-manager@")) {
      role = "manager"
    }

    setAuthCookie(email, role)
    localStorage.setItem("8718_user", JSON.stringify({ email, role }))

    setTimeout(() => {
      router.push("/dashboard")
    }, 300)
  }

  const handleDemoLogin = () => {
    setAuthCookie("demo@8718.jp", "demo")
    localStorage.setItem("8718_user", JSON.stringify({ email: "demo@8718.jp", role: "demo" }))
    router.push("/dashboard")
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

        <button
          onClick={handleDemoLogin}
          style={{
            width: "100%",
            height: 48,
            borderRadius: 24,
            backgroundColor: md3.surface,
            border: `1px solid ${md3.primary}`,
            color: md3.primary,
            fontSize: 16,
            fontWeight: 500,
            cursor: "pointer",
            fontFamily: "'Zen Maru Gothic', sans-serif",
          }}
        >
          デモログイン
        </button>
      </div>
    </div>
  )
}
