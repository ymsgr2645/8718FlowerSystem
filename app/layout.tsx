import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "8718 FLOWER SYSTEM",
  description: "入荷・在庫・持ち出し・請求書を管理するシステム",
  icons: {
    icon: "/favicon.svg",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ja">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Abhaya+Libre:wght@400;500;600;700&family=Zen+Maru+Gothic:wght@400;500;700&family=IBM+Plex+Sans+JP:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  )
}
