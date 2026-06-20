'use client'
import { useAppData, getStreak, getDayScore, getDateKey, getLevelInfo, LEVEL_NAMES } from '@/lib/store'
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
    // Hábitos — checks
    { id: 'first',      icon: '🚀', title: 'Primer Paso',       desc: 'Completa tu primer hábito',              unlocked: totalChecks >= 1,    color: '#6C63FF' },
    { id: '50checks',   icon: '✅', title: '50 Checks',         desc: '50 hábitos completados en total',        unlocked: totalChecks >= 50,   color: '#52D68A' },
    { id: '100checks',  icon: '💯', title: 'Centenario',        desc: '100 hábitos completados en total',       unlocked: totalChecks >= 100,  color: '#00D4AA' },
    { id: '500checks',  icon: '💪', title: 'Guerrero',          desc: '500 hábitos completados en total',       unlocked: totalChecks >= 500,  color: '#4FC3F7' },
    { id: '1000checks', icon: '🌋', title: 'Imparable',         desc: '1.000 hábitos completados',              unlocked: totalChecks >= 1000, color: '#FF6B6B' },
    { id: '3000checks', icon: '🔱', title: 'Mil Veces Mil',     desc: '3.000 hábitos completados',              unlocked: totalChecks >= 3000, color: '#FFD93D' },
    { id: '10000checks',icon: '🌌', title: 'Diez Mil',          desc: '10.000 hábitos completados',             unlocked: totalChecks >= 10000,color: '#FFD700' },
    // Rachas
    { id: 'streak7',    icon: '📅', title: 'Una Semana',        desc: 'Racha de 7 días en cualquier hábito',   unlocked: maxStreak >= 7,   color: '#00D4AA' },
    { id: 'streak14',   icon: '🔗', title: 'Cadena de Acero',   desc: 'Racha de 14 días',                      unlocked: maxStreak >= 14,  color: '#4FC3F7' },
    { id: 'streak30',   icon: '🏆', title: 'Un Mes',            desc: 'Racha de 30 días',                      unlocked: maxStreak >= 30,  color: '#FFD93D' },
    { id: 'streak60',   icon: '🌟', title: 'Dos Meses',         desc: 'Racha de 60 días',                      unlocked: maxStreak >= 60,  color: '#FF9F43' },
    { id: 'streak90',   icon: '🔥', title: 'Trimestre',         desc: 'Racha de 90 días',                      unlocked: maxStreak >= 90,  color: '#FF6B6B' },
    { id: 'streak180',  icon: '🦅', title: 'Medio Año',         desc: 'Racha de 180 días',                     unlocked: maxStreak >= 180, color: '#FF4FA3' },
    { id: 'streak365',  icon: '👑', title: 'Un Año Entero',     desc: 'Racha de 365 días',                     unlocked: maxStreak >= 365, color: '#FFD700' },
    // Días perfectos
    { id: 'perfect1',   icon: '💎', title: 'Día Perfecto',      desc: 'Completa todos los hábitos en un día',  unlocked: perfectDays >= 1,  color: '#4FC3F7' },
    { id: 'perfect5',   icon: '🔥', title: '5 Perfectos',       desc: '5 días perfectos en los últimos 30',    unlocked: perfectDays >= 5,  color: '#FF6B6B' },
    { id: 'perfect10',  icon: '🌟', title: '10 Perfectos',      desc: '10 días perfectos en los últimos 30',   unlocked: perfectDays >= 10, color: '#FFD93D' },
    { id: 'perfect20',  icon: '🌌', title: '20 Perfectos',      desc: '20 días perfectos en los últimos 30',   unlocked: perfectDays >= 20, color: '#D7B4F3' },
    // Niveles — uno por tier (cada 10 niveles)
    { id: 'lvl10',  icon: '⚡', title: 'Nivel 10',   desc: 'Alcanza el nivel 10 — Tier Forja',          unlocked: data.level >= 10,  color: '#4FC3F7' },
    { id: 'lvl20',  icon: '🚀', title: 'Nivel 20',   desc: 'Alcanza el nivel 20 — Tier Ascenso',        unlocked: data.level >= 20,  color: '#9B8FFF' },
    { id: 'lvl30',  icon: '🌋', title: 'Nivel 30',   desc: 'Alcanza el nivel 30 — Tier Disciplina',     unlocked: data.level >= 30,  color: '#FF9F43' },
    { id: 'lvl40',  icon: '💡', title: 'Nivel 40',   desc: 'Alcanza el nivel 40 — Tier Madurez',        unlocked: data.level >= 40,  color: '#FFD93D' },
    { id: 'lvl50',  icon: '⚜️', title: 'Nivel 50',   desc: 'Alcanza el nivel 50 — Tier Élite',          unlocked: data.level >= 50,  color: '#FF6B6B' },
    { id: 'lvl60',  icon: '🧬', title: 'Nivel 60',   desc: 'Alcanza el nivel 60 — Tier Maestría',       unlocked: data.level >= 60,  color: '#FF4FA3' },
    { id: 'lvl70',  icon: '🌌', title: 'Nivel 70',   desc: 'Alcanza el nivel 70 — Tier Leyenda',        unlocked: data.level >= 70,  color: '#A8D8FF' },
    { id: 'lvl80',  icon: '🌑', title: 'Nivel 80',   desc: 'Alcanza el nivel 80 — Tier Mítico',         unlocked: data.level >= 80,  color: '#D7B4F3' },
    { id: 'lvl90',  icon: '🪐', title: 'Nivel 90',   desc: 'Alcanza el nivel 90 — Tier Trascendencia',  unlocked: data.level >= 90,  color: '#FFD700' },
    { id: 'lvl100', icon: '⚡', title: 'FORJA MÁXIMA', desc: 'Alcanza el nivel 100',                    unlocked: data.level >= 100, color: '#FFD700' },
  ]

  const unlocked = ACHIEVEMENTS.filter(a => a.unlocked)
  const locked = ACHIEVEMENTS.filter(a => !a.unlocked)
  const xpToNext = 500 - (data.xp % 500)
  const xpPercent = ((data.xp % 500) / 500) * 100
  const levelInfo = getLevelInfo(data.level)
  const nextLevelInfo = data.level < LEVEL_NAMES.length ? getLevelInfo(data.level + 1) : null

  return (
    <div style={{ padding: '32px 40px', maxWidth: 900 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 900, margin: 0 }} className="gradient-text-gold">LOGROS & NIVEL</h1>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
          {unlocked.length}/{ACHIEVEMENTS.length} desbloqueados
        </div>
      </div>

      {/* Level card */}
      <div className="card" style={{ marginBottom: 28, borderColor: `${levelInfo.color}55`, background: `${levelInfo.color}0C` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <div style={{ textAlign: 'center', minWidth: 72 }}>
            <div style={{ fontSize: 56, fontWeight: 900, lineHeight: 1, color: levelInfo.color, textShadow: `0 0 24px ${levelInfo.color}88` }}>
              {data.level}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: 1, marginTop: 2 }}>NIVEL</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: levelInfo.color, marginBottom: 4 }}>{levelInfo.name}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10, letterSpacing: 0.5 }}>
              TIER {levelInfo.tier}/10 &nbsp;·&nbsp; {data.xp} XP total &nbsp;·&nbsp;
              {nextLevelInfo ? ` ${xpToNext} XP para "${nextLevelInfo.name}"` : ' ¡Nivel máximo!'}
            </div>
            <div style={{ background: 'var(--border)', borderRadius: 8, height: 12, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${xpPercent}%`, background: `linear-gradient(90deg, ${levelInfo.color}, ${levelInfo.color}BB)`, borderRadius: 8, transition: 'width 0.8s ease', boxShadow: `0 0 10px ${levelInfo.color}66` }} />
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

        {/* Mapa de tiers */}
        <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: 1, marginBottom: 10 }}>PROGRESIÓN DE TIERS (100 NIVELES)</div>
          <div style={{ display: 'flex', gap: 4 }}>
            {Array.from({ length: 10 }, (_, i) => {
              const tierMin = i * 10 + 1
              const tierMax = i * 10 + 10
              const done = data.level > tierMax
              const current = data.level >= tierMin && data.level <= tierMax
              const tierColor = getLevelInfo(tierMin).color
              return (
                <div key={i} title={`Tier ${i+1}: Nv.${tierMin}–${tierMax}`} style={{
                  flex: 1, height: 8, borderRadius: 4,
                  background: done ? tierColor : current ? `${tierColor}88` : 'rgba(255,255,255,0.07)',
                  boxShadow: current ? `0 0 8px ${tierColor}66` : 'none',
                  transition: 'all 0.3s',
                }} />
              )
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
            <span>Nv.1</span><span>Nv.50</span><span>Nv.100</span>
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
