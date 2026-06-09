'use client'
import { usePathname } from 'next/navigation'
import Sidebar from './Sidebar'
import BottomNav from './BottomNav'
import { AppDataProvider } from '@/lib/store'

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAuth   = pathname?.startsWith('/auth')

  if (isAuth) {
    return <>{children}</>
  }

  return (
    <AppDataProvider>
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <Sidebar />
        <main style={{ marginLeft: 220, flex: 1, minHeight: '100vh', position: 'relative', zIndex: 1 }}>
          {children}
        </main>
        <BottomNav />
      </div>
    </AppDataProvider>
  )
}
