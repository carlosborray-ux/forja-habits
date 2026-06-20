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

  // Stats derivados de otras secciones
  const totalJournal      = Object.keys(data.journal).length
  const completedTasks    = data.tasks.filter(t => t.completed).length
  const totalTransactions = data.transactions.length
  const totalAgenda       = data.agenda.length
  const totalWeights      = data.weights.length
  const totalHabits       = data.habits.length
  const waterDays         = Object.keys(data.water).length
  const sortedW           = [...data.weights].sort((a, b) => a.date.localeCompare(b.date))
  const weightDropped     = sortedW.length >= 2 && sortedW[sortedW.length - 1].weight < sortedW[0].weight

  const ACHIEVEMENTS: Achievement[] = [
    // ── HÁBITOS: Cantidad de checks ──
    { id: 'first',       icon: '🚀', title: 'Primer Paso',        desc: 'Completa tu primer hábito',          unlocked: totalChecks >= 1,     color: '#6C63FF' },
    { id: 'checks25',    icon: '✨', title: 'Arrancando',         desc: '25 hábitos completados',             unlocked: totalChecks >= 25,    color: '#52D68A' },
    { id: 'checks50',    icon: '✅', title: '50 Checks',          desc: '50 hábitos completados',             unlocked: totalChecks >= 50,    color: '#52D68A' },
    { id: 'checks100',   icon: '💯', title: 'Centenario',         desc: '100 hábitos completados',            unlocked: totalChecks >= 100,   color: '#00D4AA' },
    { id: 'checks250',   icon: '⚡', title: 'Disciplinado',       desc: '250 hábitos completados',            unlocked: totalChecks >= 250,   color: '#4FC3F7' },
    { id: 'checks500',   icon: '💪', title: 'Guerrero',           desc: '500 hábitos completados',            unlocked: totalChecks >= 500,   color: '#4FC3F7' },
    { id: 'checks1000',  icon: '🌋', title: 'Imparable',          desc: '1.000 hábitos completados',          unlocked: totalChecks >= 1000,  color: '#FF6B6B' },
    { id: 'checks2500',  icon: '🔱', title: 'Bestia',             desc: '2.500 hábitos completados',          unlocked: totalChecks >= 2500,  color: '#FF9F43' },
    { id: 'checks5000',  icon: '🏯', title: 'Fortaleza Viva',     desc: '5.000 hábitos completados',          unlocked: totalChecks >= 5000,  color: '#FFD93D' },
    { id: 'checks10000', icon: '🌌', title: 'Diez Mil',           desc: '10.000 hábitos completados',         unlocked: totalChecks >= 10000, color: '#FFD700' },
    { id: 'checks25000', icon: '🪐', title: 'Leyenda Viviente',   desc: '25.000 hábitos completados',         unlocked: totalChecks >= 25000, color: '#FFD700' },
    // ── HÁBITOS: Cantidad creados ──
    { id: 'habits3',  icon: '🌱', title: 'Trío de Hábitos',   desc: 'Crea al menos 3 hábitos',             unlocked: totalHabits >= 3,  color: '#52D68A' },
    { id: 'habits5',  icon: '🌿', title: 'Jardín de Hábitos', desc: 'Crea al menos 5 hábitos',             unlocked: totalHabits >= 5,  color: '#52D68A' },
    { id: 'habits10', icon: '🌳', title: 'Ecosistema',        desc: 'Crea al menos 10 hábitos',            unlocked: totalHabits >= 10, color: '#00D4AA' },
    { id: 'habits15', icon: '🏕️', title: 'Selva Interior',   desc: 'Crea al menos 15 hábitos',            unlocked: totalHabits >= 15, color: '#00D4AA' },
    // ── RACHAS ──
    { id: 'streak3',   icon: '🔥', title: 'Primer Fuego',       desc: 'Racha de 3 días en un hábito',       unlocked: maxStreak >= 3,   color: '#FF9F43' },
    { id: 'streak7',   icon: '📅', title: 'Una Semana',          desc: 'Racha de 7 días en un hábito',       unlocked: maxStreak >= 7,   color: '#00D4AA' },
    { id: 'streak14',  icon: '🔗', title: 'Cadena de Acero',     desc: 'Racha de 14 días',                   unlocked: maxStreak >= 14,  color: '#4FC3F7' },
    { id: 'streak21',  icon: '🧱', title: 'Tres Semanas',        desc: 'Racha de 21 días — el hábito se forma', unlocked: maxStreak >= 21, color: '#9B8FFF' },
    { id: 'streak30',  icon: '🏆', title: 'Un Mes',              desc: 'Racha de 30 días',                   unlocked: maxStreak >= 30,  color: '#FFD93D' },
    { id: 'streak45',  icon: '🌊', title: 'Marea Constante',     desc: 'Racha de 45 días',                   unlocked: maxStreak >= 45,  color: '#4FC3F7' },
    { id: 'streak60',  icon: '🌟', title: 'Dos Meses',           desc: 'Racha de 60 días',                   unlocked: maxStreak >= 60,  color: '#FF9F43' },
    { id: 'streak90',  icon: '🔥', title: 'Trimestre de Fuego',  desc: 'Racha de 90 días',                   unlocked: maxStreak >= 90,  color: '#FF6B6B' },
    { id: 'streak120', icon: '🦁', title: 'Cuatro Meses',        desc: 'Racha de 120 días',                  unlocked: maxStreak >= 120, color: '#FF6B6B' },
    { id: 'streak180', icon: '🦅', title: 'Medio Año',           desc: 'Racha de 180 días',                  unlocked: maxStreak >= 180, color: '#FF4FA3' },
    { id: 'streak270', icon: '🌌', title: 'Tres Cuartos',        desc: 'Racha de 270 días',                  unlocked: maxStreak >= 270, color: '#D7B4F3' },
    { id: 'streak365', icon: '👑', title: 'Un Año Entero',       desc: 'Racha de 365 días consecutivos',     unlocked: maxStreak >= 365, color: '#FFD700' },
    { id: 'streak500', icon: '🌠', title: 'Quinientos Días',     desc: 'Racha de 500 días',                  unlocked: maxStreak >= 500, color: '#FFD700' },
    { id: 'streak730', icon: '⚡', title: 'Dos Años Sin Parar',  desc: 'Racha de 730 días',                  unlocked: maxStreak >= 730, color: '#FFD700' },
    // ── DÍAS PERFECTOS ──
    { id: 'perfect1',  icon: '💎', title: 'Día Perfecto',        desc: 'Completa todos los hábitos en un día',    unlocked: perfectDays >= 1,  color: '#4FC3F7' },
    { id: 'perfect3',  icon: '🌟', title: 'Triple Perfecto',     desc: '3 días perfectos en los últimos 30',      unlocked: perfectDays >= 3,  color: '#9B8FFF' },
    { id: 'perfect5',  icon: '🔥', title: '5 Perfectos',         desc: '5 días perfectos en los últimos 30',      unlocked: perfectDays >= 5,  color: '#FF6B6B' },
    { id: 'perfect10', icon: '⚡', title: '10 Perfectos',        desc: '10 días perfectos en los últimos 30',     unlocked: perfectDays >= 10, color: '#FFD93D' },
    { id: 'perfect15', icon: '🏆', title: 'Medio Mes Perfecto',  desc: '15 días perfectos en los últimos 30',     unlocked: perfectDays >= 15, color: '#FF9F43' },
    { id: 'perfect20', icon: '🌌', title: 'Casi Imparable',      desc: '20 días perfectos en los últimos 30',     unlocked: perfectDays >= 20, color: '#D7B4F3' },
    { id: 'perfect30', icon: '👑', title: 'Mes Perfecto',        desc: '30 días perfectos consecutivos — épico',  unlocked: perfectDays >= 30, color: '#FFD700' },
    // ── JOURNAL ──
    { id: 'journal1',   icon: '🖊️', title: 'Primera Página',    desc: 'Escribe tu primera entrada de journal',   unlocked: totalJournal >= 1,   color: '#9B8FFF' },
    { id: 'journal7',   icon: '📔', title: 'Una Semana de Alma', desc: '7 entradas en el journal',                unlocked: totalJournal >= 7,   color: '#9B8FFF' },
    { id: 'journal30',  icon: '📚', title: 'Un Mes de Reflexión',desc: '30 entradas en el journal',               unlocked: totalJournal >= 30,  color: '#7C6FFF' },
    { id: 'journal100', icon: '🧠', title: 'Mente Documentada',  desc: '100 entradas en el journal',              unlocked: totalJournal >= 100, color: '#7C6FFF' },
    { id: 'journal200', icon: '📖', title: 'Tu Propio Libro',    desc: '200 entradas en el journal',              unlocked: totalJournal >= 200, color: '#FF4FA3' },
    { id: 'journal365', icon: '🌌', title: 'Un Año de Conciencia',desc: '365 entradas en el journal',             unlocked: totalJournal >= 365, color: '#FFD700' },
    // ── TAREAS ──
    { id: 'task1',   icon: '☑️', title: 'Primera Tarea',       desc: 'Completa tu primera tarea',              unlocked: completedTasks >= 1,   color: '#00D4AA' },
    { id: 'task10',  icon: '📋', title: 'Lista Activa',         desc: '10 tareas completadas',                  unlocked: completedTasks >= 10,  color: '#00D4AA' },
    { id: 'task50',  icon: '✅', title: 'Ejecutor',             desc: '50 tareas completadas',                  unlocked: completedTasks >= 50,  color: '#4FC3F7' },
    { id: 'task100', icon: '⚡', title: 'Máquina de Hacer',    desc: '100 tareas completadas',                 unlocked: completedTasks >= 100, color: '#FF9F43' },
    { id: 'task250', icon: '🔱', title: 'Implacable',           desc: '250 tareas completadas',                 unlocked: completedTasks >= 250, color: '#FFD93D' },
    { id: 'task500', icon: '🏆', title: 'Maestro del Hacer',   desc: '500 tareas completadas',                 unlocked: completedTasks >= 500, color: '#FFD700' },
    // ── PESO / BODY ──
    { id: 'weight1',    icon: '⚖️', title: 'Me Peso',           desc: 'Registra tu primer peso',                unlocked: totalWeights >= 1,   color: '#FF9F43' },
    { id: 'weight7',    icon: '📉', title: 'Semana en la Báscula',desc: '7 registros de peso',                  unlocked: totalWeights >= 7,   color: '#FF9F43' },
    { id: 'weight30',   icon: '📊', title: 'Mes de Datos',      desc: '30 registros de peso',                   unlocked: totalWeights >= 30,  color: '#FF6B6B' },
    { id: 'weight100',  icon: '🏅', title: 'Cien Pesadas',      desc: '100 registros de peso',                  unlocked: totalWeights >= 100, color: '#FFD93D' },
    { id: 'weightdown', icon: '🎯', title: 'Bajando el Número',  desc: 'Tu peso actual es menor que tu registro inicial', unlocked: weightDropped, color: '#00D4AA' },
    { id: 'weightgoal', icon: '🥇', title: 'Meta Definida',     desc: 'Establece una meta de peso',             unlocked: data.goalWeight !== null, color: '#FF4FA3' },
    // ── FINANZAS ──
    { id: 'finance1',   icon: '💰', title: 'Primera Transacción',desc: 'Registra tu primera transacción',        unlocked: totalTransactions >= 1,   color: '#52D68A' },
    { id: 'finance10',  icon: '💳', title: 'Empezando a Contar', desc: '10 transacciones registradas',           unlocked: totalTransactions >= 10,  color: '#52D68A' },
    { id: 'finance50',  icon: '📈', title: 'Control Financiero', desc: '50 transacciones registradas',           unlocked: totalTransactions >= 50,  color: '#00D4AA' },
    { id: 'finance200', icon: '🏦', title: 'Contador Personal',  desc: '200 transacciones registradas',          unlocked: totalTransactions >= 200, color: '#4FC3F7' },
    { id: 'finance500', icon: '💎', title: 'CFO de Tu Vida',     desc: '500 transacciones registradas',          unlocked: totalTransactions >= 500, color: '#FFD93D' },
    // ── AGENDA ──
    { id: 'agenda1',   icon: '📅', title: 'Primera Cita',        desc: 'Crea tu primer bloque de agenda',        unlocked: totalAgenda >= 1,   color: '#FF4FA3' },
    { id: 'agenda10',  icon: '🗓️', title: 'Agenda en Marcha',   desc: '10 bloques de agenda creados',           unlocked: totalAgenda >= 10,  color: '#FF4FA3' },
    { id: 'agenda50',  icon: '📆', title: 'Bien Organizado',     desc: '50 bloques de agenda creados',           unlocked: totalAgenda >= 50,  color: '#FF6B6B' },
    { id: 'agenda100', icon: '🗺️', title: 'Arquitecto del Día', desc: '100 bloques de agenda creados',          unlocked: totalAgenda >= 100, color: '#FF6B6B' },
    { id: 'agenda500', icon: '🏯', title: 'Maestro del Tiempo',  desc: '500 bloques de agenda creados',          unlocked: totalAgenda >= 500, color: '#FFD700' },
    // ── AGUA ──
    { id: 'water1',  icon: '💧', title: 'Primera Gota',          desc: 'Registra tu primer día de hidratación',  unlocked: waterDays >= 1,  color: '#4FC3F7' },
    { id: 'water7',  icon: '🌊', title: 'Semana Hidratada',      desc: '7 días registrando agua',                unlocked: waterDays >= 7,  color: '#4FC3F7' },
    { id: 'water30', icon: '🏊', title: 'Mes de Hidratación',    desc: '30 días registrando agua',               unlocked: waterDays >= 30, color: '#00D4AA' },
    { id: 'water90', icon: '🐋', title: 'Ballena Saludable',     desc: '90 días registrando agua',               unlocked: waterDays >= 90, color: '#9B8FFF' },
    // ── ORO ──
    { id: 'gold100',  icon: '🪙', title: 'Primeras Monedas',     desc: 'Acumula 100 de oro',                     unlocked: data.gold >= 100,  color: '#FFD93D' },
    { id: 'gold500',  icon: '💰', title: 'Bolsillo Lleno',       desc: 'Acumula 500 de oro',                     unlocked: data.gold >= 500,  color: '#FFD93D' },
    { id: 'gold1000', icon: '🏺', title: 'Tesoro',               desc: 'Acumula 1.000 de oro',                   unlocked: data.gold >= 1000, color: '#FF9F43' },
    { id: 'gold5000', icon: '👑', title: 'Rey del Oro',          desc: 'Acumula 5.000 de oro',                   unlocked: data.gold >= 5000, color: '#FFD700' },
    // ── NIVELES — un logro por tier ──
    { id: 'lvl5',   icon: '🌿', title: 'Nivel 5',        desc: 'Alcanza el nivel 5',                            unlocked: data.level >= 5,   color: '#52D68A' },
    { id: 'lvl10',  icon: '⚡', title: 'Nivel 10',       desc: 'Alcanza el nivel 10 — Tier Forja',             unlocked: data.level >= 10,  color: '#4FC3F7' },
    { id: 'lvl20',  icon: '🚀', title: 'Nivel 20',       desc: 'Alcanza el nivel 20 — Tier Ascenso',           unlocked: data.level >= 20,  color: '#9B8FFF' },
    { id: 'lvl30',  icon: '🌋', title: 'Nivel 30',       desc: 'Alcanza el nivel 30 — Tier Disciplina',        unlocked: data.level >= 30,  color: '#FF9F43' },
    { id: 'lvl40',  icon: '💡', title: 'Nivel 40',       desc: 'Alcanza el nivel 40 — Tier Madurez',           unlocked: data.level >= 40,  color: '#FFD93D' },
    { id: 'lvl50',  icon: '⚜️', title: 'Nivel 50',       desc: 'Alcanza el nivel 50 — Tier Élite',             unlocked: data.level >= 50,  color: '#FF6B6B' },
    { id: 'lvl60',  icon: '🧬', title: 'Nivel 60',       desc: 'Alcanza el nivel 60 — Tier Maestría',          unlocked: data.level >= 60,  color: '#FF4FA3' },
    { id: 'lvl70',  icon: '🌌', title: 'Nivel 70',       desc: 'Alcanza el nivel 70 — Tier Leyenda',           unlocked: data.level >= 70,  color: '#A8D8FF' },
    { id: 'lvl80',  icon: '🌑', title: 'Nivel 80',       desc: 'Alcanza el nivel 80 — Tier Mítico',            unlocked: data.level >= 80,  color: '#D7B4F3' },
    { id: 'lvl90',  icon: '🪐', title: 'Nivel 90',       desc: 'Alcanza el nivel 90 — Tier Trascendencia',     unlocked: data.level >= 90,  color: '#FFD700' },
    { id: 'lvl100', icon: '⚡', title: 'FORJA MÁXIMA',   desc: 'Alcanza el nivel 100 — has llegado al límite', unlocked: data.level >= 100, color: '#FFD700' },
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
