import type { Metadata } from "next"
import "./globals.css"
import Sidebar from "@/components/Sidebar"

export const metadata: Metadata = {
  title: "FORJA — Hábitos & Rutinas",
  description: "Forja tus hábitos, forja tu carácter.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)' }}>
        {/* Ambient orbs */}
        <div className="ambient-bg">
          <div className="orb orb-1" />
          <div className="orb orb-2" />
          <div className="orb orb-3" />
          <div className="orb orb-4" />
        </div>
        <Sidebar />
        <main style={{ marginLeft: 220, flex: 1, minHeight: '100vh', position: 'relative', zIndex: 1 }}>
          {children}
        </main>
      </body>
    </html>
  )
}
