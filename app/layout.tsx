import type { Metadata } from "next"
import "./globals.css"
import AppShell from "@/components/AppShell"

export const metadata: Metadata = {
  title: "FORJA — Hábitos & Rutinas",
  description: "Forja tus hábitos, forja tu carácter.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#07070F" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
        <div className="ambient-bg">
          <div className="orb orb-1" /><div className="orb orb-2" />
          <div className="orb orb-3" /><div className="orb orb-4" />
        </div>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  )
}
