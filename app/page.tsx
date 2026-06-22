'use client'
import { useAppData, getTodayKey, getDateKey, getDayScore, getStreak, getMotivationalMessage, getTodayQuote, getLevelInfo } from '@/lib/store'
import ProgressRing from '@/components/ProgressRing'
import { celebrate } from '@/lib/celebrate'
import { format, subDays, startOfMonth } from 'date-fns'
import { es } from 'date-fns/locale'

// Bezier cúbico suavizado (catmull-rom)
function smoothPath(points: {x:number,y:number}[], tension = 0.35): string {
  if (points.length < 2) return ''
  let d = `M${points[0].x},${points[0].y}`
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i-1] ?? points[i]
    const p1 = points[i], p2 = points[i+1], p3 = points[i+2] ?? p2
    const cp1x = (p1.x + tension*(p2.x-p0.x)/2).toFixed(1)
    const cp1y = (p1.y + tension*(p2.y-p0.y)/2).toFixed(1)
    const cp2x = (p2.x - tension*(p3.x-p1.x)/2).toFixed(1)
    const cp2y = (p2.y - tension*(p3.y-p1.y)/2).toFixed(1)
    d += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`
  }
  return d
}

export default function WarRoom() {
  const { data, loaded, toggleHabit } = useAppData()
  const today   = getTodayKey()
  const score   = getDayScore(data.habits, today)
  const quote   = getTodayQuote()
  const dayName = format(new Date(), "EEEE d 'de' MMMM yyyy", { locale: es })
  const levelInfo = getLevelInfo(data.level)

  // ── Top streaks ──
  const topStreaks = [...data.habits]
    .map(h => ({ ...h, streak: getStreak(h) }))
    .sort((a, b) => b.streak - a.streak)
    .slice(0, 5)

  // ── XP ──
  const xpPercent = ((data.xp % 500) / 500) * 100
  const xpToNext  = 500 - (data.xp % 500)

  // ── Categorías hoy ──
  const catStats = data.categories.map(cat => {
    const hs = data.habits.filter(h => h.category === cat.id)
    const done = hs.filter(h => h.completedDays[today]).length
    const color = cat.color ?? 'var(--accent-purple)'
    return { cat: cat.name, color, done, total: hs.length, pct: hs.length > 0 ? Math.round(done / hs.length * 100) : 0 }
  }).filter(s => s.total > 0).sort((a, b) => b.pct - a.pct)

  // ── Últimos 7 días ──
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d   = subDays(new Date(), 6 - i)
    const key = getDateKey(d)
    return { label: format(d, 'EEE', { locale: es }), score: getDayScore(data.habits, key), key }
  })

  // ── Últimos 30 días para gráfica ──
  const last30 = Array.from({ length: 30 }, (_, i) => {
    const d   = subDays(new Date(), 29 - i)
    const key = getDateKey(d)
    return { key, score: getDayScore(data.habits, key), label: format(d, 'd', { locale: es }) }
  })

  // ── Agenda de hoy ──
  const agendaHoy = [...data.agenda]
    .filter(b => b.date === today)
    .sort((a, b) => a.time.localeCompare(b.time))

  // ── Tareas vencidas / de hoy ──
  const tareasHoy = data.tasks
    .filter(t => !t.completed && t.dueDate && t.dueDate <= today)
    .sort((a, b) => (a.dueDate ?? '').localeCompare(b.dueDate ?? ''))
    .slice(0, 6)

  // ── Finanzas del mes ──
  const mesKey = format(startOfMonth(new Date()), 'yyyy-MM')
  const txMes  = data.transactions.filter(t => t.date.startsWith(mesKey))
  const ingresos = txMes.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const gastos   = txMes.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const balance  = ingresos - gastos

  // ── Racha máxima ──
  const maxStreak = Math.max(0, ...data.habits.map(h => getStreak(h)))

  // ── Ultimo peso ──
  const lastWeight = [...data.weights].sort((a,b) => b.date.localeCompare(a.date))[0]

  // ── Stacks ──
  const stacks = [...new Set(data.habits.map(h => h.stack).filter(Boolean))]

  if (!loaded) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <div className="gradient-text-purple" style={{ fontSize: 26, fontWeight: 900, letterSpacing: 2 }}>CARGANDO...</div>
    </div>
  )

  return (
    <div className="page-content" style={{ padding: '28px 36px', maxWidth: 1200 }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 }}>{dayName}</div>
        <h1 className="gradient-text-purple" style={{ fontSize: 36, fontWeight: 900, lineHeight: 1, margin: 0 }}>FLOW ROOM</h1>
        <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginTop: 6, fontStyle: 'italic' }}>{getMotivationalMessage(score)}</p>
      </div>

      {/* ── Mini-stats header ── */}
      <div className="grid-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 16 }}>
        {[
          { icon: '🎯', label: 'SCORE HOY',       value: `${score}%`,      color: score>=80?'var(--accent-teal)':score>=50?'var(--accent-purple)':'var(--accent-coral)' },
          { icon: '🔥', label: 'RACHA MÁX.',       value: maxStreak>0?`${maxStreak}d`:'—', color: 'var(--accent-gold)' },
          { icon: '📋', label: 'TAREAS VENCIDAS',  value: tareasHoy.length > 0 ? String(tareasHoy.length) : '✓', color: tareasHoy.length>0?'var(--accent-coral)':'var(--accent-teal)' },
          { icon: '⚖️', label: 'ÚLTIMO PESO',       value: lastWeight?`${lastWeight.weight}kg`:'—', color: 'var(--accent-blue)' },
          { icon: '💰', label: 'BALANCE MES',       value: balance===0?'$0':`${balance>0?'+':''}$${Math.abs(balance).toLocaleString()}`, color: balance>=0?'var(--accent-teal)':'var(--accent-coral)' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '14px 16px', display:'flex', flexDirection:'column', gap: 4 }}>
            <div style={{ fontSize: 18 }}>{s.icon}</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: 1 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Gráfica 30 días ── */}
      {(() => {
        const W = 900, H = 110, PAD = { top: 16, right: 20, bottom: 24, left: 28 }
        const innerW = W - PAD.left - PAD.right
        const innerH = H - PAD.top - PAD.bottom
        const step   = innerW / (last30.length - 1)
        const pts    = last30.map((d, i) => ({
          x: PAD.left + i * step, y: PAD.top + innerH - (d.score / 100) * innerH, ...d
        }))
        const todayIdx = last30.findIndex(d => d.key === today)
        const line   = smoothPath(pts)
        const area   = line + ` L${pts[pts.length-1].x},${PAD.top+innerH} L${pts[0].x},${PAD.top+innerH} Z`
        const avg    = Math.round(last30.filter(d=>d.score>0).reduce((a,d)=>a+d.score,0)/(last30.filter(d=>d.score>0).length||1))
        const avgY   = PAD.top + innerH - (avg / 100) * innerH
        return (
          <div className="card" style={{ marginBottom: 16, padding: '16px 20px 10px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 8 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: 2 }}>ÚLTIMOS 30 DÍAS</div>
              <div style={{ fontSize: 12, color: 'var(--accent-purple)', fontWeight: 700 }}>
                {avg}% promedio · {last30.filter(d=>d.score===100).length} días perfectos
              </div>
            </div>
            <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} style={{ display:'block', overflow:'visible' }}>
              <defs>
                <linearGradient id="dbGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent-purple)" stopOpacity="0.4"/>
                  <stop offset="100%" stopColor="var(--accent-purple)" stopOpacity="0.02"/>
                </linearGradient>
              </defs>
              {/* Línea de promedio */}
              <line x1={PAD.left} x2={W-PAD.right} y1={avgY} y2={avgY} stroke="rgba(255,255,255,0.08)" strokeWidth="1" strokeDasharray="4 4"/>
              <text x={PAD.left-4} y={avgY+4} fontSize="9" fill="rgba(255,255,255,0.2)" textAnchor="end">{avg}%</text>
              {/* Área */}
              <path d={area} fill="url(#dbGrad)"/>
              {/* Línea */}
              <path d={line} fill="none" stroke="var(--accent-purple)" strokeWidth="2" strokeLinecap="round"/>
              {/* Punto de hoy */}
              {todayIdx >= 0 && (
                <circle cx={pts[todayIdx].x} cy={pts[todayIdx].y} r="5" fill="var(--accent-purple)" stroke="white" strokeWidth="2"/>
              )}
              {/* Etiquetas días cada ~5 */}
              {pts.map((p, i) => i % 5 === 0 || i === pts.length-1 ? (
                <text key={i} x={p.x} y={H-2} textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.3)">{p.label}</text>
              ) : null)}
            </svg>
          </div>
        )
      })()}

      {/* ── Row: Ring + XP + Pendientes ── */}
      <div className="grid-stats" style={{ display: 'grid', gridTemplateColumns: '160px 1fr 1fr', gap: 14, marginBottom: 14 }}>

        {/* Score ring */}
        <div className="card" style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap: 8, padding:'20px 14px' }}>
          <ProgressRing
            percent={score} size={120} strokeWidth={10}
            color={score>=80?'var(--accent-teal)':score>=50?'var(--accent-purple)':'var(--accent-coral)'}
            label={`${score}%`} sublabel="HOY"
          />
          <div style={{ fontSize: 11, color:'var(--text-muted)', textAlign:'center' }}>
            {data.habits.filter(h=>h.completedDays[today]).length}/{data.habits.length} hábitos
          </div>
        </div>

        {/* XP & Level */}
        <div className="card" style={{ display:'flex', flexDirection:'column', justifyContent:'space-between' }}>
          <div>
            <div className="section-label">PROGRESO RPG</div>
            <div style={{ fontSize: 13, fontWeight: 800, color: levelInfo.color, marginBottom: 6 }}>{levelInfo.name}</div>
            <div style={{ display:'flex', alignItems:'baseline', gap: 8 }}>
              <span style={{ fontSize: 46, fontWeight: 900, lineHeight: 1, color: levelInfo.color }}>{data.level}</span>
              <span style={{ fontSize: 14, color:'var(--text-muted)' }}>nivel · TIER {levelInfo.tier}/10</span>
            </div>
            <div style={{ fontSize: 12, color:'var(--text-secondary)', marginTop: 4 }}>🪙 {data.gold} gold &nbsp;·&nbsp; ⚡ {data.xp} XP</div>
          </div>
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize: 12, color:'var(--text-muted)', marginBottom: 5 }}>
              <span>Nivel {data.level}</span><span>{xpToNext} XP → nivel {data.level+1}</span>
            </div>
            <div className="prog-track" style={{ height: 7 }}>
              <div className="prog-fill" style={{ width:`${xpPercent}%`, background:`linear-gradient(90deg, ${levelInfo.color}, ${levelInfo.color}BB)`, boxShadow:`0 0 8px ${levelInfo.color}66` }}/>
            </div>
          </div>
        </div>

        {/* Pendientes hoy */}
        {(() => {
          const pendientes = data.habits.filter(h => !h.completedDays[today])
          const allDone    = pendientes.length === 0
          return (
            <div className="card" style={{ background: allDone?'rgba(0,229,184,0.06)':'rgba(255,255,255,0.02)', borderColor: allDone?'rgba(0,229,184,0.35)':'var(--border)', display:'flex', flexDirection:'column', gap: 7 }}>
              <div className="section-label">⏳ PENDIENTES HOY</div>
              {allDone ? (
                <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap: 6 }}>
                  <div style={{ fontSize: 28 }}>🏆</div>
                  <div style={{ fontSize: 14, fontWeight:700, color:'var(--accent-teal)' }}>¡Todo completado!</div>
                </div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap: 5, overflowY:'auto', maxHeight: 150 }}>
                  {pendientes.map(h => (
                    <div key={h.id} style={{ display:'flex', alignItems:'center', gap: 8, padding:'5px 8px', background:'rgba(255,255,255,0.04)', borderRadius: 8, borderLeft:`3px solid ${h.color}` }}>
                      <span style={{ fontSize: 14 }}>{h.icon}</span>
                      <span style={{ fontSize: 12, color:'var(--text-secondary)', flex:1 }}>{h.name}</span>
                    </div>
                  ))}
                </div>
              )}
              {!allDone && <div style={{ fontSize: 12, color:'var(--text-muted)' }}>{pendientes.length} de {data.habits.length} sin marcar</div>}
            </div>
          )
        })()}
      </div>

      {/* ── Row: Agenda hoy + Tareas hoy ── */}
      <div className="grid-stats" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 14, marginBottom: 14 }}>

        {/* Agenda hoy */}
        <div className="card">
          <div className="section-label">📅 AGENDA DE HOY</div>
          {agendaHoy.length === 0 ? (
            <div style={{ color:'var(--text-muted)', fontSize: 13, padding:'12px 0' }}>Sin bloques programados para hoy</div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap: 7 }}>
              {agendaHoy.slice(0, 6).map(b => {
                const catColors: Record<string, string> = { work:'var(--accent-purple)', health:'var(--accent-teal)', personal:'var(--accent-gold)', learning:'var(--accent-blue)', other:'var(--accent-coral)' }
                const catColor = catColors[b.category] ?? 'var(--accent-purple)'
                return (
                  <div key={b.id} style={{ display:'flex', alignItems:'center', gap: 10, padding:'8px 10px', background: b.done?'rgba(0,229,184,0.06)':'rgba(255,255,255,0.04)', borderRadius: 9, borderLeft:`3px solid ${catColor}`, opacity: b.done?0.55:1 }}>
                    <div style={{ minWidth: 44, fontSize: 11, fontWeight: 700, color: catColor }}>{b.time}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color:'var(--text-primary)', textDecoration: b.done?'line-through':'none' }}>{b.title}</div>
                      {b.endTime && <div style={{ fontSize: 11, color:'var(--text-muted)' }}>hasta {b.endTime}</div>}
                    </div>
                    {b.done && <span style={{ fontSize: 14 }}>✅</span>}
                  </div>
                )
              })}
              {agendaHoy.length > 6 && <div style={{ fontSize: 11, color:'var(--text-muted)', textAlign:'center' }}>+{agendaHoy.length-6} más</div>}
            </div>
          )}
        </div>

        {/* Tareas hoy / vencidas */}
        <div className="card">
          <div className="section-label">📝 TAREAS PENDIENTES</div>
          {tareasHoy.length === 0 ? (
            <div style={{ color:'var(--accent-teal)', fontSize: 13, padding:'12px 0' }}>✓ Sin tareas vencidas</div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap: 6 }}>
              {tareasHoy.map(t => {
                const overdue = t.dueDate && t.dueDate < today
                const prioColor = ['rgba(255,255,255,0.08)','var(--accent-teal)','var(--accent-gold)','var(--accent-coral)'][t.priority] ?? 'rgba(255,255,255,0.08)'
                return (
                  <div key={t.id} style={{ display:'flex', alignItems:'center', gap: 9, padding:'7px 10px', background:'rgba(255,255,255,0.04)', borderRadius: 9, borderLeft:`3px solid ${prioColor}` }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, color:'var(--text-primary)', fontWeight: 600 }}>{t.title}</div>
                      {t.dueDate && <div style={{ fontSize: 11, color: overdue?'var(--accent-coral)':'var(--text-muted)' }}>{overdue?'⚠️ Vencida: ':'📅 '}{t.dueDate}</div>}
                    </div>
                    {t.subtasks?.length > 0 && (
                      <span style={{ fontSize: 11, color:'var(--text-muted)' }}>{t.subtasks.filter(s=>s.done).length}/{t.subtasks.length}</span>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Row: Last 7 días + Categorías + Finanzas ── */}
      <div className="grid-stats" style={{ display:'grid', gridTemplateColumns:'1.4fr 1fr 1fr', gap: 14, marginBottom: 14 }}>

        {/* Last 7 days bars */}
        <div className="card">
          <div className="section-label">ÚLTIMOS 7 DÍAS</div>
          <div style={{ display:'flex', gap: 8, alignItems:'flex-end', height: 90 }}>
            {last7.map(d => (
              <div key={d.key} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap: 4 }}>
                {d.score > 0 && <div style={{ fontSize: 11, fontWeight:700, color: d.score>=80?'var(--accent-teal)':'var(--text-muted)' }}>{d.score}%</div>}
                <div style={{
                  width:'100%', height:`${Math.max(5, d.score)}%`,
                  background: d.key===today ? 'linear-gradient(180deg,var(--accent-purple),var(--accent-teal))' : d.score>=80?'var(--accent-teal)':d.score>=50?'rgba(124,111,255,0.7)':'rgba(255,255,255,0.06)',
                  borderRadius:'5px 5px 0 0', boxShadow: d.key===today?'0 0 14px rgba(124,111,255,0.5)':'none', transition:'height 0.5s ease',
                }}/>
                <div style={{ fontSize: 11, color: d.key===today?'var(--accent-purple)':'var(--text-muted)', fontWeight: d.key===today?700:400 }}>{d.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Categorías */}
        <div className="card">
          <div className="section-label">POR CATEGORÍA HOY</div>
          <div style={{ display:'flex', flexDirection:'column', gap: 8 }}>
            {catStats.map(s => (
              <div key={s.cat}>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize: 12, marginBottom: 3 }}>
                  <span style={{ color:'var(--text-secondary)' }}>{s.cat}</span>
                  <span style={{ fontWeight:700, color: s.pct>=100?'var(--accent-gold)':s.pct>=80?'var(--accent-teal)':'var(--text-primary)' }}>
                    {s.pct>=100?'🏆':''}{s.pct}%
                  </span>
                </div>
                <div className="prog-track" style={{ height: 5 }}>
                  <div className="prog-fill" style={{ width:`${s.pct}%`, background: s.pct>=80?s.color:'rgba(124,111,255,0.5)' }}/>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Finanzas del mes */}
        <div className="card">
          <div className="section-label">💰 FINANZAS — {format(new Date(),'MMMM',{locale:es}).toUpperCase()}</div>
          <div style={{ display:'flex', flexDirection:'column', gap: 10 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ fontSize: 12, color:'var(--text-muted)' }}>Ingresos</span>
              <span style={{ fontSize: 16, fontWeight:800, color:'var(--accent-teal)' }}>${ingresos.toLocaleString()}</span>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ fontSize: 12, color:'var(--text-muted)' }}>Gastos</span>
              <span style={{ fontSize: 16, fontWeight:800, color:'var(--accent-coral)' }}>${gastos.toLocaleString()}</span>
            </div>
            <div style={{ borderTop:'1px solid var(--border)', paddingTop: 8, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ fontSize: 12, fontWeight:700, color:'var(--text-secondary)' }}>Balance</span>
              <span style={{ fontSize: 20, fontWeight:900, color: balance>=0?'var(--accent-teal)':'var(--accent-coral)' }}>
                {balance>=0?'+':''} ${Math.abs(balance).toLocaleString()}
              </span>
            </div>
            {/* Barra ingresos vs gastos */}
            {(ingresos > 0 || gastos > 0) && (
              <div style={{ display:'flex', height: 6, borderRadius: 99, overflow:'hidden', gap: 2 }}>
                <div style={{ flex: ingresos||0, background:'var(--accent-teal)', transition:'flex 0.5s' }}/>
                <div style={{ flex: gastos||0, background:'var(--accent-coral)', transition:'flex 0.5s' }}/>
              </div>
            )}
            {txMes.length === 0 && <div style={{ fontSize: 11, color:'var(--text-muted)' }}>Sin transacciones este mes</div>}
          </div>
        </div>
      </div>

      {/* ── Quote ── */}
      <div className="card" style={{ marginBottom: 14, borderColor:'rgba(124,111,255,0.25)', background:'rgba(124,111,255,0.05)', padding:'14px 20px' }}>
        <div style={{ fontSize: 11, color:'var(--accent-purple)', letterSpacing: 2, fontWeight:700, marginBottom: 5 }}>💡 QUOTE DEL DÍA</div>
        <div style={{ fontSize: 14, color:'var(--text-primary)', fontStyle:'italic', lineHeight: 1.5 }}>"{quote.text}"</div>
        <div style={{ fontSize: 11, color:'var(--text-muted)', marginTop: 4 }}>— {quote.author}</div>
      </div>

      {/* ── Top streaks ── */}
      <div className="card" style={{ marginBottom: 14 }}>
        <div className="section-label">🔥 TOP RACHAS</div>
        <div className="grid-stats" style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap: 10 }}>
          {topStreaks.map((h, i) => (
            <div key={h.id} style={{ textAlign:'center', padding:'12px 8px', background:'rgba(255,255,255,0.03)', borderRadius: 12, border:'1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: 20, marginBottom: 4 }}>{i===0?'🥇':i===1?'🥈':i===2?'🥉':'🔥'}</div>
              <div style={{ fontSize: 11, color:'var(--text-secondary)', marginBottom: 4, lineHeight: 1.2 }}>{h.name}</div>
              <div style={{ fontSize: 20, fontWeight:900, color: h.streak>7?'var(--accent-gold)':h.streak>0?'var(--accent-teal)':'var(--text-muted)' }}>
                {h.streak>0?h.streak:'—'}
              </div>
              {h.streak>0 && <div style={{ fontSize: 11, color:'var(--text-muted)' }}>días</div>}
            </div>
          ))}
        </div>
      </div>

      {/* ── Check rápido por stack ── */}
      <div className="card">
        <div className="section-label">CHECK RÁPIDO — HOY</div>
        {stacks.map(stack => {
          const stackHabits = data.habits.filter(h => h.stack === stack)
          const stackDone   = stackHabits.filter(h => h.completedDays[today]).length
          return (
            <div key={stack} style={{ marginBottom: 14 }}>
              <div style={{ display:'flex', alignItems:'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontWeight:700, color:'var(--text-muted)', letterSpacing:1 }}>{stack?.toUpperCase()}</span>
                <span style={{ fontSize: 12, color:'var(--accent-teal)' }}>{stackDone}/{stackHabits.length}</span>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(175px,1fr))', gap: 8 }}>
                {stackHabits.map(h => {
                  const done = !!h.completedDays[today]
                  return (
                    <button key={h.id} onClick={() => { if (!done) celebrate('habit'); toggleHabit(h.id, today) }} style={{
                      display:'flex', alignItems:'center', gap: 10,
                      padding:'9px 13px', borderRadius: 10, border:'none', cursor:'pointer',
                      background: done?`${h.color}18`:'rgba(255,255,255,0.04)',
                      borderLeft:`3px solid ${done?h.color:'rgba(255,255,255,0.08)'}`,
                      color: done?h.color:'var(--text-secondary)',
                      fontWeight: done?700:400, fontSize: 13,
                      transition:'all 0.15s ease', textAlign:'left',
                      boxShadow: done?`0 0 12px ${h.color}22`:'none',
                    }}>
                      <span style={{ fontSize: 15 }}>{done?'✅':'⬜'}</span>
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
