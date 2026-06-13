'use client'
import { useAppData, getStreak, getDayScore, getDateKey } from '@/lib/store'
import { subDays, eachDayOfInterval } from 'date-fns'

interface Achievement {
  id: string
  icon: string
  title: string
  desc: string
  unlocked: boolean
  color: string
}

export default function AchievementsPage() {
  const { data } = useAppData()

  const last30 = eachDayOfInterval({ start: subDays(new Date(), 29), end: new Date() })
  const perfectDays = last30.filter(d => getDayScore(data.habits, getDateKey(d)) === 100).length
  const maxStreak = Math.max(0, ...data.habits.map(h => getStreak(h)))
  const totalChecks = data.habits.reduce((s, h) => s + Object.keys(h.completedDays).length, 0)

  const ACHIEVEMENTS: Achievement[] = [
    { id: 'first', icon: '🚀', title: 'Primer Paso', desc: 'Completa tu primer hábito', unlocked: totalChecks >= 1, color: '#6C63FF' },
    { id: 'week', icon: '📅', title: 'Una Semana', desc: 'Racha de 7 días en cualquier hábito', unlocked: maxStreak >= 7, color: '#00D4AA' },
    { id: 'month', icon: '🏆', title: 'Un Mes Completo', desc: 'Racha de 30 días en cualquier hábito', unlocked: maxStreak >= 30, color: '#FFD93D' },
    { id: 'perfect', icon: '💎', title: 'Día Perfecto', desc: 'Completa todos los hábitos en un día', unlocked: perfectDays >= 1, color: '#4FC3F7' },
    { id: '5perfect', icon: '🔥', title: '5 Días Perfectos', desc: '5 días perfectos en los últimos 30', unlocked: perfectDays >= 5, color: '#FF6B6B' },
    { id: 'lvl5', icon: '⚡', title: 'Nivel 5', desc: 'Alcanza el nivel 5', unlocked: data.level >= 5, color: '#9B59B6' },
    { id: 'lvl10', icon: '👑', title: 'Nivel 10', desc: 'Alcanza el nivel 10', unlocked: data.level >= 10, color: '#FFD93D' },
    { id: '100checks', icon: '✅', title: 'Centenario', desc: '100 hábitos completados en total', unlocked: totalChecks >= 100, color: '#00D4AA' },
    { id: '500checks', icon: '💪', title: 'Guerrero', desc: '500 hábitos completados en total', unlocked: totalChecks >= 500, color: '#FF6B6B' },
    { id: '1000checks', icon: '🌋', title: 'Imparable', desc: '1000 hábitos completados en total', unlocked: totalChecks >= 1000, color: '#FFD93D' },
    { id: 'streak14', icon: '🔗', title: 'Cadena de Acero', desc: 'Racha de 14 días', unlocked: maxStreak >= 14, color: '#4FC3F7' },
    { id: 'streak60', icon: '🌟', title: 'Élite', desc: 'Racha de 60 días', unlocked: maxStreak >= 60, color: '#FFD93D' },
  ]

  const unlocked = ACHIEVEMENTS.filter(a => a.unlocked)
  const locked = ACHIEVEMENTS.filter(a => !a.unlocked)
  const xpToNext = 500 - (data.xp % 500)
  const xpPercent = ((data.xp % 500) / 500) * 100

  return (
    <div style={{ padding: '32px 40px', maxWidth: 900 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 900, margin: 0 }} className="gradient-text-gold">LOGROS & NIVEL</h1>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
          {unlocked.length}/{ACHIEVEMENTS.length} desbloqueados
        </div>
      </div>

      {/* Level card */}
      <div className="card" style={{ marginBottom: 28, borderColor: 'rgba(255,217,61,0.3)', background: 'rgba(255,217,61,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 64, fontWeight: 900, lineHeight: 1 }} className="gradient-text-gold">
              {data.level}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>NIVEL</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>
              <span>{data.xp} XP</span>
              <span>{xpToNext} XP para nivel {data.level + 1}</span>
            </div>
            <div style={{ background: 'var(--border)', borderRadius: 8, height: 16, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${xpPercent}%`, background: 'linear-gradient(90deg, var(--accent-gold), var(--accent-coral))', borderRadius: 8, transition: 'width 0.8s ease', boxShadow: '0 0 12px rgba(255,217,61,0.4)' }} />
            </div>
            <div className="grid-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 16 }}>
              <div style={{ textAlign: 'center', background: 'var(--bg-surface)', borderRadius: 8, padding: '10px' }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--accent-teal)' }}>{totalChecks}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>TOTAL CHECKS</div>
              </div>
              <div style={{ textAlign: 'center', background: 'var(--bg-surface)', borderRadius: 8, padding: '10px' }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--accent-gold)' }}>{maxStreak}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>MEJOR RACHA</div>
              </div>
              <div style={{ textAlign: 'center', background: 'var(--bg-surface)', borderRadius: 8, padding: '10px' }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--accent-purple)' }}>{perfectDays}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>DÍAS PERFECTOS</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Unlocked */}
      {unlocked.length > 0 && (
        <>
          <div style={{ fontSize: 13, color: 'var(--accent-teal)', fontWeight: 700, marginBottom: 14, textTransform: 'uppercase', letterSpacing: 1 }}>
            ✅ Desbloqueados ({unlocked.length})
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14, marginBottom: 28 }}>
            {unlocked.map(a => (
              <div key={a.id} className="card" style={{ borderColor: `${a.color}55`, background: `${a.color}0D`, textAlign: 'center', padding: 20 }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>{a.icon}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: a.color, marginBottom: 4 }}>{a.title}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{a.desc}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Locked */}
      {locked.length > 0 && (
        <>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 700, marginBottom: 14, textTransform: 'uppercase', letterSpacing: 1 }}>
            🔒 Por desbloquear ({locked.length})
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
            {locked.map(a => (
              <div key={a.id} className="card" style={{ textAlign: 'center', padding: 20, opacity: 0.4, filter: 'grayscale(1)' }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>🔒</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>{a.title}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{a.desc}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
