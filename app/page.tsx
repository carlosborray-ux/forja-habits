'use client'
import { useAppData, getTodayKey, getDayScore, getStreak, getMotivationalMessage, getTodayQuote } from '@/lib/store'
import ProgressRing from '@/components/ProgressRing'
import { format, subDays } from 'date-fns'
import { es } from 'date-fns/locale'

export default function WarRoom() {
  const { data, loaded, toggleHabit } = useAppData()
  const today   = getTodayKey()
  const score   = getDayScore(data.habits, today)
  const quote   = getTodayQuote()
  const dayName = format(new Date(), "EEEE d 'de' MMMM yyyy", { locale: es })

  const topStreaks = [...data.habits]
    .map(h => ({ ...h, streak: getStreak(h) }))
    .sort((a, b) => b.streak - a.streak)
    .slice(0, 5)

  const xpPercent  = ((data.xp % 500) / 500) * 100
  const xpToNext   = 500 - (data.xp % 500)

  const categories = [...new Set(data.habits.map(h => h.category))]
  const catStats   = categories.map(cat => {
    const hs = data.habits.filter(h => h.category === cat)
    const done = hs.filter(h => h.completedDays[today]).length
    return { cat, done, total: hs.length, pct: Math.round(done / hs.length * 100) }
  }).sort((a, b) => b.pct - a.pct)

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(new Date(), 6 - i)
    const key = d.toISOString().split('T')[0]
    return { label: format(d, 'EEE', { locale: es }), score: getDayScore(data.habits, key), key }
  })

  // Weekly boss: lose 1hp for every missed habit today, max 100hp
  const bossMaxHp  = 100
  const donePct    = score
  const bossHp     = Math.max(0, bossMaxHp - donePct)
  const bossDefeated = bossHp === 0

  // Habit stacks
  const stacks = [...new Set(data.habits.map(h => h.stack).filter(Boolean))]

  if (!loaded) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <div className="gradient-text-purple" style={{ fontSize: 26, fontWeight: 900, letterSpacing: 2 }}>CARGANDO...</div>
    </div>
  )

  return (
    <div className="page-content" style={{ padding: '32px 40px', maxWidth: 1200 }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 }}>
          {dayName}
        </div>
        <h1 className="gradient-text-purple" style={{ fontSize: 40, fontWeight: 900, lineHeight: 1, margin: 0 }}>FLOW ROOM</h1>
        <p style={{ fontSize: 17, color: 'var(--text-secondary)', marginTop: 8, fontStyle: 'italic' }}>
          {getMotivationalMessage(score)}
        </p>
      </div>

      {/* ── Quote of the Day ── */}
      <div className="card" style={{ marginBottom: 20, borderColor: 'rgba(124,111,255,0.3)', background: 'rgba(124,111,255,0.06)', padding: '16px 22px' }}>
        <div style={{ fontSize: 10, color: 'var(--accent-purple)', letterSpacing: 2, fontWeight: 700, marginBottom: 6 }}>💡 QUOTE DEL DÍA</div>
        <div style={{ fontSize: 15, color: 'var(--text-primary)', fontStyle: 'italic', lineHeight: 1.5 }}>"{quote.text}"</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>— {quote.author}</div>
      </div>

      {/* ── Row 1: Ring + XP + Boss ── */}
      <div className="grid-stats" style={{ display: 'grid', gridTemplateColumns: '180px 1fr 1fr', gap: 16, marginBottom: 16 }}>

        {/* Score ring */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '24px 16px' }}>
          <ProgressRing
            percent={score}
            size={130}
            strokeWidth={11}
            color={score >= 80 ? 'var(--accent-teal)' : score >= 50 ? 'var(--accent-purple)' : 'var(--accent-coral)'}
            label={`${score}%`}
            sublabel="HOY"
          />
          <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
            {data.habits.filter(h => h.completedDays[today]).length} / {data.habits.length} hábitos
          </div>
        </div>

        {/* XP & Level */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div className="section-label">PROGRESO RPG</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontSize: 52, fontWeight: 900, lineHeight: 1 }} className="gradient-text-gold">{data.level}</span>
              <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>nivel</span>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
              🪙 {data.gold} gold · ⚡ {data.xp} XP
            </div>
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>
              <span>Nivel {data.level}</span>
              <span>{xpToNext} XP → nivel {data.level + 1}</span>
            </div>
            <div className="prog-track" style={{ height: 8 }}>
              <div className="prog-fill" style={{ width: `${xpPercent}%`, background: 'linear-gradient(90deg, #FFD93D, #FF6B6B)', boxShadow: '0 0 10px rgba(255,217,61,0.4)' }} />
            </div>
          </div>
        </div>

        {/* Pendientes hoy */}
        {(() => {
          const pendientes = data.habits.filter(h => !h.completedDays[today])
          const allDone = pendientes.length === 0
          return (
            <div className="card" style={{ background: allDone ? 'rgba(0,229,184,0.06)' : 'rgba(255,255,255,0.02)', borderColor: allDone ? 'rgba(0,229,184,0.35)' : 'var(--border)', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div className="section-label">⏳ PENDIENTES HOY</div>
              {allDone ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <div style={{ fontSize: 32 }}>🏆</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent-teal)' }}>¡Todo completado!</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5, overflowY: 'auto', maxHeight: 160 }}>
                  {pendientes.map(h => (
                    <div key={h.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 8px', background: 'rgba(255,255,255,0.04)', borderRadius: 8, borderLeft: `3px solid ${h.color}` }}>
                      <span style={{ fontSize: 14 }}>{h.icon}</span>
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)', flex: 1 }}>{h.name}</span>
                      <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{h.category}</span>
                    </div>
                  ))}
                </div>
              )}
              {!allDone && (
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                  {pendientes.length} de {data.habits.length} sin marcar
                </div>
              )}
            </div>
          )
        })()}
      </div>

      {/* ── Row 2: Last 7 days + Categories ── */}
      <div className="grid-stats" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 16 }}>

        {/* Last 7 days bar chart */}
        <div className="card">
          <div className="section-label">ÚLTIMOS 7 DÍAS</div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', height: 90 }}>
            {last7.map(d => (
              <div key={d.key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                {d.score > 0 && (
                  <div style={{ fontSize: 11, fontWeight: 700, color: d.score >= 80 ? 'var(--accent-teal)' : 'var(--text-muted)' }}>
                    {d.score}%
                  </div>
                )}
                <div style={{
                  width: '100%',
                  height: `${Math.max(6, d.score)}%`,
                  background: d.key === today
                    ? 'linear-gradient(180deg, var(--accent-purple), var(--accent-teal))'
                    : d.score >= 80 ? 'var(--accent-teal)'
                    : d.score >= 50 ? 'rgba(124,111,255,0.7)'
                    : 'rgba(255,255,255,0.06)',
                  borderRadius: '6px 6px 0 0',
                  boxShadow: d.key === today ? '0 0 16px rgba(124,111,255,0.5)' : 'none',
                  transition: 'height 0.5s ease',
                }} />
                <div style={{ fontSize: 11, color: d.key === today ? 'var(--accent-purple)' : 'var(--text-muted)', fontWeight: d.key === today ? 700 : 400 }}>
                  {d.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Categories */}
        <div className="card">
          <div className="section-label">POR CATEGORÍA</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {catStats.map(s => (
              <div key={s.cat}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{s.cat}</span>
                  <span style={{ fontWeight: 700, color: s.pct >= 80 ? 'var(--accent-teal)' : 'var(--text-primary)' }}>{s.pct}%</span>
                </div>
                <div className="prog-track" style={{ height: 6 }}>
                  <div className="prog-fill" style={{ width: `${s.pct}%`, background: s.pct >= 80 ? 'var(--accent-teal)' : 'var(--accent-purple)' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Top streaks ── */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="section-label">🔥 TOP RACHAS</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
          {topStreaks.map((h, i) => (
            <div key={h.id} style={{ textAlign: 'center', padding: '12px 8px', background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: 22, marginBottom: 4 }}>{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '🔥'}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4, lineHeight: 1.2 }}>{h.name}</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: h.streak > 7 ? 'var(--accent-gold)' : h.streak > 0 ? 'var(--accent-teal)' : 'var(--text-muted)' }}>
                {h.streak > 0 ? h.streak : '—'}
              </div>
              {h.streak > 0 && <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>días</div>}
            </div>
          ))}
        </div>
      </div>

      {/* ── Quick check by stack ── */}
      <div className="card">
        <div className="section-label">CHECK RÁPIDO — HOY</div>
        {stacks.map(stack => {
          const stackHabits = data.habits.filter(h => h.stack === stack)
          const stackDone = stackHabits.filter(h => h.completedDays[today]).length
          return (
            <div key={stack} style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 1 }}>{stack?.toUpperCase()}</span>
                <span style={{ fontSize: 11, color: 'var(--accent-teal)' }}>{stackDone}/{stackHabits.length}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(175px, 1fr))', gap: 8 }}>
                {stackHabits.map(h => {
                  const done = !!h.completedDays[today]
                  return (
                    <button key={h.id} onClick={() => toggleHabit(h.id, today)} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '9px 13px', borderRadius: 10, border: 'none', cursor: 'pointer',
                      background: done ? `${h.color}18` : 'rgba(255,255,255,0.04)',
                      borderLeft: `3px solid ${done ? h.color : 'rgba(255,255,255,0.08)'}`,
                      color: done ? h.color : 'var(--text-secondary)',
                      fontWeight: done ? 700 : 400, fontSize: 13,
                      transition: 'all 0.15s ease', textAlign: 'left',
                      boxShadow: done ? `0 0 12px ${h.color}22` : 'none',
                    }}>
                      <span style={{ fontSize: 16 }}>{done ? '✅' : '⬜'}</span>
                      {h.name}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
