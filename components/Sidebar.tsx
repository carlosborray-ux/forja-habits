'use client'
import { usePathname, useRouter } from 'next/navigation'
import { useAppData } from '@/lib/store'
import { supabase } from '@/lib/supabase'

const NAV = [
  { path: '/',             icon: '⚔️',  label: 'Dashboard' },
  { path: '/habits',       icon: '✅',  label: 'Hábitos'   },
  { path: '/agenda',       icon: '📅',  label: 'Agenda'    },
  { path: '/body',         icon: '⚖️',  label: 'Body'      },
  { path: '/journal',      icon: '🧠',  label: 'Journal'   },
  { path: '/analytics',    icon: '📊',  label: 'Analytics' },
  { path: '/achievements', icon: '🏆',  label: 'Logros'    },
  { path: '/rewards',      icon: '🎁',  label: 'Recompensas'},
]

export default function Sidebar() {
  const pathname = usePathname()
  const router   = useRouter()
  const { data } = useAppData()

  const xpPercent = ((data.xp % 500) / 500) * 100

  return (
    <aside style={{
      width: 220,
      minHeight: '100vh',
      background: 'rgba(10,10,20,0.85)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      borderRight: '1px solid rgba(255,255,255,0.06)',
      display: 'flex',
      flexDirection: 'column',
      padding: '24px 0',
      position: 'fixed',
      left: 0, top: 0, bottom: 0,
      zIndex: 200,
    }}>
      {/* Logo */}
      <div style={{ padding: '0 20px 28px' }}>
        <div style={{ fontSize: 24, fontWeight: 900, letterSpacing: -1, lineHeight: 1 }} className="gradient-text-purple">
          FORJA
        </div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3, letterSpacing: 2 }}>
          HÁBITOS & RUTINAS ✦ 2026
        </div>
        <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 6, letterSpacing: 1.5, opacity: 0.7 }}>
          by CABA
        </div>
      </div>

      {/* Level strip */}
      <div style={{ margin: '0 12px 20px', padding: '10px 12px', background: 'rgba(124,111,255,0.08)', borderRadius: 12, border: '1px solid rgba(124,111,255,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 6 }}>
          <span style={{ color: 'var(--text-muted)' }}>NIVEL <strong style={{ color: 'var(--accent-gold)' }}>{data.level}</strong></span>
          <span style={{ color: 'var(--accent-gold)' }}>⚡ {data.xp} XP</span>
        </div>
        <div className="prog-track" style={{ height: 5 }}>
          <div className="prog-fill" style={{ width: `${xpPercent}%`, background: 'linear-gradient(90deg, var(--accent-purple), var(--accent-teal))' }} />
        </div>
      </div>

      {/* Gold */}
      <div style={{ margin: '-8px 12px 16px', padding: '7px 12px', background: 'rgba(255,217,61,0.07)', borderRadius: 10, border: '1px solid rgba(255,217,61,0.2)', display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 14 }}>🪙</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-gold)' }}>{data.gold}</span>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>gold</span>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '0 10px' }}>
        {NAV.map(item => {
          const active = pathname === item.path
          return (
            <button key={item.path} onClick={() => router.push(item.path)} style={{
              width: '100%',
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 12px', borderRadius: 10, border: 'none', cursor: 'pointer',
              marginBottom: 2,
              background: active ? 'rgba(124,111,255,0.15)' : 'transparent',
              color: active ? 'var(--accent-purple)' : 'var(--text-secondary)',
              fontWeight: active ? 700 : 400, fontSize: 13.5,
              textAlign: 'left',
              transition: 'all 0.15s ease',
              boxShadow: active ? 'inset 3px 0 0 var(--accent-purple)' : 'none',
            }}>
              <span style={{ fontSize: 16, width: 22, textAlign: 'center' }}>{item.icon}</span>
              {item.label}
            </button>
          )
        })}
      </nav>

      {/* Identity badge + logout */}
      <div style={{ padding: '12px 20px 0', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>IDENTIDAD</div>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }} className="gradient-text-pink">
          🔥 {data.identity}
        </div>
        <button onClick={() => supabase.auth.signOut()} style={{
          width: '100%', padding: '7px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(255,255,255,0.04)', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 12,
        }}>
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
