'use client'
import { usePathname, useRouter } from 'next/navigation'
import { useAppData } from '@/lib/store'

const NAV = [
  { path: '/',          icon: '⚔️',  label: 'Home'    },
  { path: '/habits',    icon: '✅',  label: 'Hábitos' },
  { path: '/agenda',    icon: '📅',  label: 'Agenda'  },
  { path: '/body',      icon: '⚖️',  label: 'Body'    },
  { path: '/finanzas',  icon: '💰',  label: 'Finanzas'},
  { path: '/tareas',    icon: '📝',  label: 'To Do'   },
  { path: '/journal',   icon: '🧠',  label: 'Journal' },
  { path: '/analytics', icon: '📊',  label: 'Stats'   },
  { path: '/rewards',   icon: '🎁',  label: 'Rewards' },
]

export default function BottomNav() {
  const pathname = usePathname()
  const router   = useRouter()
  const { data } = useAppData()

  const todayStr = new Date().toISOString().split('T')[0]
  const pendingToday = data.tasks.filter(t => !t.completed && t.dueDate && t.dueDate <= todayStr).length

  return (
    <nav className="bottom-nav">
      {NAV.map(item => {
        const active = pathname === item.path
        return (
          <button key={item.path} onClick={() => router.push(item.path)} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '6px 8px', borderRadius: 10, flex: 1, position: 'relative',
            color: active ? 'var(--accent-purple)' : 'var(--text-muted)',
            transition: 'all 0.15s',
          }}>
            <span style={{ fontSize: 20, position: 'relative' }}>
              {item.icon}
              {item.path === '/tareas' && pendingToday > 0 && (
                <span style={{
                  position: 'absolute', top: -4, right: -8,
                  background: 'var(--accent-coral)', color: 'white', fontSize: 9, fontWeight: 700,
                  borderRadius: 99, minWidth: 14, height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px',
                }}>{pendingToday}</span>
              )}
            </span>
            <span style={{ fontSize: 9, fontWeight: active ? 700 : 400, letterSpacing: 0.3 }}>{item.label}</span>
            {active && <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--accent-purple)', marginTop: 1 }} />}
          </button>
        )
      })}
    </nav>
  )
}
