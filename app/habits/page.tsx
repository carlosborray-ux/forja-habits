'use client'
import { useState } from 'react'
import { useAppData, getTodayKey, getStreak, getHabitMonthPct, getHabitMonthDone, habitStartDayOfMonth, Habit, Category } from '@/lib/store'
import { format, getDaysInMonth } from 'date-fns'
import { es } from 'date-fns/locale'
import { celebrate } from '@/lib/celebrate'

const COLORS = ['#7C6FFF','#00E5B8','#FF6B6B','#FFD93D','#4FC3F7','#FF4FA3','#FF8C00','#9B59B6','#2ECC71','#E74C3C']
const ICONS  = ['💪','🧠','💧','📚','🏋️','😴','🥗','🧘','🔥','📈','✍️','🎯','🌅','🙏','📊','🚿','📵','🍽️','🎵','🏃']
const STACKS = ['Mañana','Día','Trabajo','Noche','Fin de semana']
const WEEKDAYS_H = [
  { id: 1, label: 'L' }, { id: 2, label: 'M' }, { id: 3, label: 'X' },
  { id: 4, label: 'J' }, { id: 5, label: 'V' }, { id: 6, label: 'S' }, { id: 0, label: 'D' },
]

type ModalMode = 'add' | 'edit' | null

const emptyHabit = (): Omit<Habit, 'id' | 'completedDays' | 'createdAt'> => ({
  name: '', color: '#7C6FFF', icon: '💪', category: '', goal: 30, stack: 'Día', activeDays: []
})

export default function HabitsPage() {
  const { data, loaded, toggleHabit, addHabit, updateHabit, deleteHabit, addCategory, updateCategory, deleteCategory } = useAppData()
  const today = getTodayKey()
  const now = new Date()

  const [viewMonth, setViewMonth] = useState(now)
  const [habitModal, setHabitModal] = useState<ModalMode>(null)
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null)
  const [form, setForm] = useState(emptyHabit())
  const [catModal, setCatModal] = useState(false)
  const [editingCat, setEditingCat] = useState<Category | null>(null)
  const [catForm, setCatForm] = useState({ name: '', color: '#7C6FFF' })
  const [filterCat, setFilterCat] = useState<string>('all')

  const year  = viewMonth.getFullYear()
  const month = viewMonth.getMonth()
  const daysInMonth = getDaysInMonth(viewMonth)

  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const d = new Date(year, month, i + 1)
    const key = `${year}-${String(month+1).padStart(2,'0')}-${String(i+1).padStart(2,'0')}`
    // Semana del mes (1-5) basada en bloques de 7 desde el día 1
    const weekNum = Math.ceil((i + 1) / 7)
    return { n: i + 1, key, dow: format(d, 'EEEEE', { locale: es }), weekNum }
  })

  // Score por día para la gráfica de barras
  const dayScores = days.map(d => ({
    ...d,
    score: data.habits.length > 0
      ? Math.round(data.habits.filter(h => h.completedDays[d.key]).length / data.habits.length * 100)
      : 0
  }))

  // Grupos de semanas para el subtítulo
  const weeks = [1,2,3,4,5].map(w => ({
    week: w,
    label: `Semana ${w}`,
    days: days.filter(d => d.weekNum === w),
  })).filter(w => w.days.length > 0)

  const categories = data.categories ?? []

  // Hábitos agrupados por categoría, en el orden de categories
  const habitsByCat: { cat: Category | null; habits: Habit[] }[] = []

  // Primero las categorías definidas (en orden)
  categories.forEach(cat => {
    const hs = data.habits.filter(h => h.category === cat.id)
    if (hs.length > 0) habitsByCat.push({ cat, habits: hs })
  })

  // Hábitos sin categoría reconocida (o sin categoría)
  const knownCatIds = categories.map(c => c.id)
  const uncategorized = data.habits.filter(h => !knownCatIds.includes(h.category))
  if (uncategorized.length > 0) habitsByCat.push({ cat: null, habits: uncategorized })

  // Si hay filtro activo, mostrar solo esa categoría
  const groupsToShow = filterCat === 'all'
    ? habitsByCat
    : habitsByCat.filter(g => g.cat?.id === filterCat || (filterCat === '__sin__' && g.cat === null))

  // ── Habit modal helpers ──
  const openAdd = () => {
    setForm({ ...emptyHabit(), category: categories[0]?.id ?? '' })
    setEditingHabit(null)
    setHabitModal('add')
  }
  const openEdit = (h: Habit) => {
    setForm({ name: h.name, color: h.color, icon: h.icon, category: h.category, goal: h.goal, stack: h.stack, activeDays: h.activeDays ?? [] })
    setEditingHabit(h)
    setHabitModal('edit')
  }
  const saveHabit = () => {
    if (!form.name.trim()) return
    if (habitModal === 'add') {
      addHabit({ id: Date.now().toString(), ...form, completedDays: {}, createdAt: new Date().toISOString() })
    } else if (editingHabit) {
      updateHabit({ ...editingHabit, ...form })
    }
    setHabitModal(null)
  }

  // ── Category modal helpers ──
  const openAddCat = () => { setCatForm({ name: '', color: '#7C6FFF' }); setEditingCat(null); setCatModal(true) }
  const openEditCat = (c: Category) => { setCatForm({ name: c.name, color: c.color }); setEditingCat(c); setCatModal(true) }
  const saveCat = () => {
    if (!catForm.name.trim()) return
    if (editingCat) updateCategory({ ...editingCat, ...catForm })
    else addCategory({ id: Date.now().toString(), ...catForm })
    setCatModal(false)
  }

  if (!loaded) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <div className="gradient-text-purple" style={{ fontSize: 26, fontWeight: 900, letterSpacing: 2 }}>CARGANDO...</div>
    </div>
  )

  return (
    <div className="page-content" style={{ padding: '32px 40px' }}>
      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 className="gradient-text-purple" style={{ fontSize: 28, fontWeight: 900, margin: 0 }}>HÁBITOS</h1>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
            {data.habits.filter(h => h.completedDays[today]).length}/{data.habits.length} completados hoy
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {/* Month nav */}
          <button className="btn-ghost" onClick={() => setViewMonth(new Date(year, month - 1, 1))} style={{ padding: '8px 12px' }}>‹</button>
          <span style={{ fontWeight: 700, fontSize: 14, minWidth: 130, textAlign: 'center' }}>
            {format(viewMonth, 'MMMM yyyy', { locale: es }).toUpperCase()}
          </span>
          <button className="btn-ghost" onClick={() => setViewMonth(new Date(year, month + 1, 1))} style={{ padding: '8px 12px' }}>›</button>
          <button className="btn-ghost" onClick={() => setCatModal(true)} style={{ fontSize: 13 }}>⚙️ Categorías</button>
          <button className="btn-primary" onClick={openAdd}>+ Hábito</button>
        </div>
      </div>

      {/* ── Category filter pills ── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        <button onClick={() => setFilterCat('all')} style={{
          padding: '6px 14px', borderRadius: 99, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
          background: filterCat === 'all' ? 'var(--accent-purple)' : 'rgba(255,255,255,0.06)',
          color: filterCat === 'all' ? 'white' : 'var(--text-secondary)',
        }}>Todos ({data.habits.length})</button>
        {categories.map(c => {
          const count = data.habits.filter(h => h.category === c.id).length
          return (
            <button key={c.id} onClick={() => setFilterCat(c.id)} style={{
              padding: '6px 14px', borderRadius: 99, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
              background: filterCat === c.id ? c.color : 'rgba(255,255,255,0.06)',
              color: filterCat === c.id ? 'white' : 'var(--text-secondary)',
              boxShadow: filterCat === c.id ? `0 0 14px ${c.color}55` : 'none',
              transition: 'all 0.15s',
            }}>{c.name} ({count})</button>
          )
        })}
      </div>

      {/* ── Tabla de hábitos con columna de nombre fija (CSS grid + position: sticky) ── */}
      <div className="habits-scroll" style={{ overflowX: 'auto' }}>

        {/* ── Gráfico de línea mensual ── */}
        {(() => {
          const COL = 54
          const W = days.length * COL + 266, H = 120, PAD = { top: 24, right: 0, bottom: 30, left: 4 }
          const innerW = W - PAD.left - PAD.right
          const innerH = H - PAD.top - PAD.bottom
          const pts = dayScores.map((d, i) => ({
            x: PAD.left + (i + 0.5) * COL,
            y: PAD.top + innerH - (d.score / 100) * innerH,
            score: d.score,
            key: d.key,
            n: d.n,
          }))
          const todayIdx = dayScores.findIndex(d => d.key === today)
          const polyline = pts.map(p => `${p.x},${p.y}`).join(' ')
          // Área rellena debajo
          const areaPath = `M${pts[0].x},${PAD.top + innerH} ` +
            pts.map(p => `L${p.x},${p.y}`).join(' ') +
            ` L${pts[pts.length - 1].x},${PAD.top + innerH} Z`
          return (
            <div className="card" style={{ marginLeft: 190, marginBottom: 6, padding: '14px 0 8px', overflow: 'hidden', width: days.length * 54 + 266 }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', letterSpacing: 2, marginBottom: 6, padding: '0 16px' }}>
                PROGRESO DEL MES — {format(viewMonth, 'MMMM yyyy', { locale: es }).toUpperCase()}
                <span style={{ marginLeft: 12, color: 'var(--accent-teal)', fontWeight: 700 }}>
                  {Math.round(dayScores.filter(d => d.score > 0).reduce((a, d) => a + d.score, 0) / (dayScores.filter(d => d.score > 0).length || 1))}% promedio
                </span>
              </div>
              <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} style={{ display: 'block', overflow: 'visible' }}>
                <defs>
                  <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FF4FA3" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#FF4FA3" stopOpacity="0.01" />
                  </linearGradient>
                </defs>
                {/* Grid horizontales */}
                {[0, 25, 50, 75, 100].map(v => {
                  const gy = PAD.top + innerH - (v / 100) * innerH
                  return (
                    <line key={v} x1={PAD.left} x2={W - PAD.right} y1={gy} y2={gy} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                  )
                })}
                {/* Área rellena */}
                <path d={areaPath} fill="url(#lineGrad)" />
                {/* Línea principal */}
                <polyline points={polyline} fill="none" stroke="#FF4FA3" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
                {/* Puntos y etiquetas de días */}
                {pts.map((p, i) => {
                  const isToday = i === todayIdx
                  const hasDot = dayScores[i].score > 0 || isToday
                  return (
                    <g key={p.key}>
                      {hasDot && (
                        <circle cx={p.x} cy={p.y} r={isToday ? 5 : 3}
                          fill={isToday ? '#7C6FFF' : '#FF4FA3'}
                          stroke={isToday ? '#fff' : 'transparent'} strokeWidth="1.5"
                          style={{ filter: isToday ? 'drop-shadow(0 0 6px #7C6FFF)' : 'none' }}
                        />
                      )}
                      {/* Número del día */}
                      <text x={p.x} y={H - 2} textAnchor="middle" fontSize="12"
                        fill={isToday ? 'var(--accent-purple)' : 'rgba(255,255,255,0.4)'}
                        fontWeight={isToday ? '800' : '600'}
                      >{p.n}</text>
                    </g>
                  )
                })}
                {/* Etiqueta hoy */}
                {todayIdx >= 0 && (
                  <text x={pts[todayIdx].x} y={pts[todayIdx].y - 9} textAnchor="middle" fontSize="9"
                    fill="var(--accent-purple)" fontWeight="800">
                    {dayScores[todayIdx].score}%
                  </text>
                )}
              </svg>
            </div>
          )
        })()}

        {/* ── Grid: columna de nombre fija (sticky) + días + stats ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: `190px repeat(${days.length}, 54px) 64px 74px 64px 64px`,
          rowGap: 3,
          width: 190 + days.length * 54 + 266,
        }}>

          {/* ── Fila barras de cumplimiento diario ── */}
          <div style={{ position: 'sticky', left: 0, zIndex: 2, background: 'var(--bg-card-solid)', height: 94, padding: '0 12px 6px', display: 'flex', alignItems: 'flex-end', fontSize: 11, color: 'var(--text-muted)', fontWeight: 500, borderRadius: '8px 0 0 8px' }}>
            % DIARIO
          </div>
          {dayScores.map(d => {
            const pct = d.score
            const maxBarH = 72
            const barH = pct > 0 ? Math.max(6, Math.round(pct / 100 * maxBarH)) : 4
            const color = pct >= 80 ? 'var(--accent-teal)' : pct >= 50 ? 'var(--accent-purple)' : pct > 0 ? '#FFD93D' : 'rgba(255,255,255,0.10)'
            const isToday = d.key === today
            return (
              <div key={d.key} style={{ height: 94, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', gap: 2, padding: '0 1px' }}>
                {pct > 0 && (
                  <div style={{ fontSize: 11, color: isToday ? 'var(--accent-purple)' : pct >= 80 ? 'var(--accent-teal)' : 'var(--text-muted)', fontWeight: 700, lineHeight: 1 }}>
                    {pct}%
                  </div>
                )}
                <div style={{
                  width: 32, height: barH,
                  background: isToday ? 'linear-gradient(180deg, var(--accent-purple), var(--accent-teal))' : color,
                  borderRadius: '4px 4px 0 0',
                  boxShadow: isToday ? '0 0 12px rgba(124,111,255,0.8)' : pct >= 80 ? `0 0 8px rgba(0,229,184,0.5)` : 'none',
                  transition: 'height 0.4s ease',
                }} />
              </div>
            )
          })}
          <div style={{ height: 94, gridColumn: 'span 4' }} />

          {/* ── Fila semanas — pegada a los días ── */}
          <div style={{ position: 'sticky', left: 0, zIndex: 2, background: 'var(--bg-card-solid)', height: 24 }} />
          {weeks.map(w => (
            <div key={w.week} style={{
              gridColumn: `span ${w.days.length}`,
              height: 24, textAlign: 'center', padding: '6px 2px 2px',
              fontSize: 10, fontWeight: 800, letterSpacing: 1.5,
              color: 'var(--accent-purple)',
              borderBottom: '1px solid rgba(124,111,255,0.3)',
            }}>
              SEM {w.week}
            </div>
          ))}
          <div style={{ height: 24, gridColumn: 'span 4' }} />

          {/* ── Fila días (letra + número) ── */}
          <div style={{ position: 'sticky', left: 0, zIndex: 2, background: 'var(--bg-card-solid)', height: 44, padding: '4px 12px', display: 'flex', alignItems: 'center', textAlign: 'left', fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: 1 }}>
            HÁBITO
          </div>
          {days.map(d => (
            <div key={d.key} style={{
              height: 44, textAlign: 'center', padding: '4px 0', fontSize: 11,
              color: d.key === today ? 'var(--accent-purple)' : 'var(--text-muted)',
              fontWeight: d.key === today ? 900 : 400,
            }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{d.dow}</div>
              <div style={{ fontSize: 16, fontWeight: 800 }}>{d.n}</div>
            </div>
          ))}
          <div style={{ height: 44, textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>META</div>
          <div style={{ height: 44, textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>CUMPL.</div>
          <div style={{ height: 44, textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>RACHA</div>
          <div style={{ height: 44 }} />

          {/* ── Grupos de hábitos ── */}
          {groupsToShow.map(({ cat, habits: groupHabits }) => {
            const catColor = cat?.color ?? '#888'
            const catDone  = groupHabits.filter(h => h.completedDays[today]).length
            const catTotal = groupHabits.length
            const catPct   = Math.round(catDone / catTotal * 100)

            return (
              <div key={`group-${cat?.id ?? '__sin__'}`} style={{ display: 'contents' }}>

                {/* ── Fila separadora de categoría ── */}
                <div style={{
                  gridColumn: '1 / -1',
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '6px 14px 6px 10px', margin: '6px 0 0',
                  borderLeft: `4px solid ${catColor}`,
                  background: `${catColor}0D`,
                  borderRadius: '0 8px 8px 0',
                  height: 38,
                }}>
                  <span style={{ fontSize: 22, fontWeight: 900, color: catColor, letterSpacing: -0.5 }}>{cat?.name ?? 'Sin categoría'}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{catDone}/{catTotal} hoy</span>
                  <div style={{ width: 80, background: 'rgba(255,255,255,0.06)', borderRadius: 99, height: 5 }}>
                    <div style={{ height: '100%', width: `${catPct}%`, background: catColor, borderRadius: 99, transition: 'width 0.4s', boxShadow: catPct === 100 ? `0 0 8px ${catColor}` : 'none' }} />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: catPct === 100 ? catColor : 'var(--text-muted)' }}>
                    {catPct === 100 ? '✅ 100%' : `${catPct}%`}
                  </span>
                  <button
                    onClick={() => { setForm({ ...emptyHabit(), category: cat?.id ?? categories[0]?.id ?? '' }); setEditingHabit(null); setHabitModal('add') }}
                    style={{ marginLeft: 'auto', background: 'none', border: `1px solid ${catColor}55`, borderRadius: 6, cursor: 'pointer', color: catColor, fontSize: 11, fontWeight: 700, padding: '3px 8px' }}
                  >+ hábito</button>
                </div>

                {/* ── Filas de hábitos del grupo ── */}
                {groupHabits.map(h => {
                  const streak = getStreak(h)
                  const done   = getHabitMonthDone(h, year, month)
                  const pct    = getHabitMonthPct(h, year, month)
                  const habitCatColor = data.categories.find(c => c.id === h.category)?.color ?? h.color
                  return (
                    <div key={h.id} style={{ display: 'contents' }}>

                      {/* Nombre (columna fija) */}
                      <div style={{
                        position: 'sticky', left: 0, zIndex: 1, background: 'var(--bg-card-solid)',
                        height: 48, padding: '4px 12px', borderLeft: `3px solid ${h.color}`, borderRadius: '8px 0 0 8px',
                        display: 'flex', alignItems: 'center',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7, width: '100%' }}>
                          <span style={{ fontSize: 18, flexShrink: 0 }}>{h.icon}</span>
                          <div style={{ overflow: 'hidden', display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{h.name}</div>
                            {h.stack && <span style={{ fontSize: 11, padding: '2px 6px', borderRadius: 99, background: 'rgba(255,255,255,0.08)', color: 'var(--text-muted)', whiteSpace: 'nowrap', flexShrink: 0 }}>{h.stack}</span>}
                          </div>
                        </div>
                      </div>

                      {/* Checkboxes por día */}
                      {(() => {
                        const startDay = habitStartDayOfMonth(h, year, month)
                        return days.map(d => {
                        const dayDow = new Date(year, month, d.n).getDay()
                        const beforeCreation = d.n < startDay
                        const isActiveDay = !beforeCreation && (!h.activeDays || h.activeDays.length === 0 || h.activeDays.includes(dayDow))
                        const checked = !!h.completedDays[d.key]
                        const isToday = d.key === today
                        return (
                          <div key={d.key} style={{ height: 48, textAlign: 'center', padding: '4px 0', background: isActiveDay ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.12)' }}>
                            {isActiveDay ? (
                              <button onClick={() => { if (!checked) celebrate('habit'); toggleHabit(h.id, d.key) }} style={{
                                width: 40, height: 40, borderRadius: 12,
                                border: checked ? 'none' : isToday ? `2px solid ${habitCatColor}` : '2px solid rgba(255,255,255,0.12)',
                                cursor: 'pointer',
                                background: checked ? habitCatColor : isToday ? `${habitCatColor}15` : 'rgba(255,255,255,0.04)',
                                boxShadow: checked ? `0 0 16px ${habitCatColor}88` : 'none',
                                transition: 'all 0.15s ease',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                margin: '0 auto',
                              }}>
                                {checked && (
                                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                                    <path d="M3 9L7 13L15 5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                                )}
                              </button>
                            ) : (
                              <div style={{ height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.1)', fontSize: 14 }}>—</div>
                            )}
                          </div>
                        )
                      })})()}

                      {/* META */}
                      <div style={{ height: 48, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.025)' }}>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          {done}/{(() => {
                            if (!h.activeDays || h.activeDays.length === 0) return h.goal
                            const startDay = habitStartDayOfMonth(h, year, month)
                            return days.filter(d => d.n >= startDay && h.activeDays!.includes(new Date(year, month, d.n).getDay())).length
                          })()}
                        </span>
                      </div>

                      {/* CUMPL */}
                      <div style={{ height: 48, textAlign: 'center', padding: '3px 4px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.025)' }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: pct >= 100 ? 'var(--accent-gold)' : pct >= 70 ? 'var(--accent-teal)' : pct >= 40 ? 'var(--accent-purple)' : 'var(--text-muted)', marginBottom: 3 }}>
                          {pct >= 100 ? '🏆' : `${pct}%`}
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 99, height: 4, margin: '0 auto', width: 44 }}>
                          <div style={{ height: '100%', width: `${Math.min(100, pct)}%`, background: pct >= 100 ? 'var(--accent-gold)' : pct >= 70 ? 'var(--accent-teal)' : 'var(--accent-purple)', borderRadius: 99, transition: 'width 0.4s' }} />
                        </div>
                      </div>

                      {/* RACHA */}
                      <div style={{ height: 48, textAlign: 'center', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', color: streak >= 7 ? 'var(--accent-gold)' : streak > 0 ? 'var(--accent-teal)' : 'var(--text-muted)', background: 'rgba(255,255,255,0.025)' }}>
                        {streak > 0 ? `🔥${streak}` : '—'}
                      </div>

                      {/* Editar / borrar */}
                      <div style={{ height: 48, textAlign: 'center', borderRadius: '0 8px 8px 0', paddingRight: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.025)' }}>
                        <div style={{ display: 'flex', gap: 0, justifyContent: 'center' }}>
                          <button onClick={() => openEdit(h)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 16, padding: '2px 3px' }}>✏️</button>
                          <button onClick={() => deleteHabit(h.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-coral)', fontSize: 16, padding: '2px 3px', opacity: 0.7 }}>✕</button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Habit Modal (Add / Edit) ── */}
      {habitModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(6px)' }}>
          <div className="card" style={{ width: 460, padding: 28, maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontSize: 18, fontWeight: 900, marginBottom: 20 }}>
              {habitModal === 'add' ? '+ Nuevo Hábito' : '✏️ Editar Hábito'}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* Name */}
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>NOMBRE</div>
                <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Nombre del hábito" className="input-glass" />
              </div>

              {/* Category */}
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>CATEGORÍA</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {categories.map(c => (
                    <button key={c.id} onClick={() => setForm(p => ({ ...p, category: c.id }))} style={{
                      padding: '6px 12px', borderRadius: 99, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                      background: form.category === c.id ? c.color : 'rgba(255,255,255,0.06)',
                      color: form.category === c.id ? 'white' : 'var(--text-secondary)',
                      transition: 'all 0.1s',
                    }}>{c.name}</button>
                  ))}
                  <button onClick={() => { setCatModal(true); setHabitModal(null) }} style={{ padding: '6px 12px', borderRadius: 99, border: '1px dashed var(--border-bright)', background: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--text-muted)' }}>+ Nueva</button>
                </div>
              </div>

              {/* Stack */}
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>MOMENTO DEL DÍA</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {STACKS.map(s => (
                    <button key={s} onClick={() => setForm(p => ({ ...p, stack: s }))} style={{
                      padding: '6px 12px', borderRadius: 99, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                      background: form.stack === s ? 'rgba(124,111,255,0.3)' : 'rgba(255,255,255,0.06)',
                      color: form.stack === s ? 'var(--accent-purple)' : 'var(--text-secondary)',
                      outline: form.stack === s ? '1px solid var(--accent-purple)' : 'none',
                    }}>{s}</button>
                  ))}
                </div>
              </div>

              {/* Días de la semana */}
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>DÍAS ACTIVOS</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {WEEKDAYS_H.map(w => {
                    const active = (form.activeDays ?? []).includes(w.id)
                    return (
                      <button key={w.id} type="button" onClick={() => setForm(p => {
                        const cur = p.activeDays ?? []
                        return { ...p, activeDays: cur.includes(w.id) ? cur.filter(x => x !== w.id) : [...cur, w.id] }
                      })} style={{
                        flex: 1, padding: '8px 0', borderRadius: 8, border: 'none', cursor: 'pointer',
                        fontSize: 12, fontWeight: 700,
                        background: active ? 'var(--accent-purple)' : 'rgba(255,255,255,0.06)',
                        color: active ? 'white' : 'var(--text-secondary)',
                        outline: active ? '1px solid var(--accent-purple)' : 'none',
                      }}>{w.label}</button>
                    )
                  })}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 5 }}>
                  {(form.activeDays ?? []).length === 0
                    ? 'Sin filtro — aplica todos los días'
                    : `Activo solo ${(form.activeDays ?? []).length} días/semana — la meta mensual se calcula automáticamente`}
                </div>
              </div>

              {/* Goal — solo si no hay días configurados */}
              {(form.activeDays ?? []).length === 0 && (
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>META MENSUAL (días)</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <input
                      type="range" min={1} max={31} value={form.goal}
                      onChange={e => setForm(p => ({ ...p, goal: Number(e.target.value) }))}
                      style={{ flex: 1, accentColor: 'var(--accent-purple)' }}
                    />
                    <span style={{ fontSize: 22, fontWeight: 900, color: 'var(--accent-purple)', minWidth: 40, textAlign: 'center' }}>{form.goal}</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                    {form.goal === 31 ? 'Todos los días del mes' : form.goal >= 20 ? 'Casi todos los días' : form.goal >= 10 ? 'Varias veces por semana' : 'Pocas veces al mes'}
                  </div>
                </div>
              )}

              {/* Icon */}
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>ICONO</div>
                <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                  {ICONS.map(ic => (
                    <button key={ic} onClick={() => setForm(p => ({ ...p, icon: ic }))} style={{ width: 36, height: 36, borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 18, background: form.icon === ic ? 'rgba(124,111,255,0.3)' : 'rgba(255,255,255,0.05)', outline: form.icon === ic ? '2px solid var(--accent-purple)' : 'none', transition: 'all 0.1s' }}>{ic}</button>
                  ))}
                </div>
              </div>

              {/* Color */}
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>COLOR</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {COLORS.map(c => (
                    <button key={c} onClick={() => setForm(p => ({ ...p, color: c }))} style={{ width: 28, height: 28, borderRadius: '50%', background: c, border: form.color === c ? '3px solid white' : '3px solid transparent', cursor: 'pointer', boxShadow: form.color === c ? `0 0 10px ${c}` : 'none', transition: 'all 0.1s' }} />
                  ))}
                </div>
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button className="btn-ghost" onClick={() => setHabitModal(null)} style={{ flex: 1 }}>Cancelar</button>
                <button className="btn-primary" onClick={saveHabit} style={{ flex: 2 }}>
                  {habitModal === 'add' ? '+ Agregar' : '✓ Guardar cambios'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Category Modal ── */}
      {catModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1001, backdropFilter: 'blur(6px)' }}>
          <div className="card" style={{ width: 420, padding: 28 }}>
            <h2 style={{ fontSize: 18, fontWeight: 900, marginBottom: 20 }}>⚙️ Categorías</h2>

            {/* List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
              {categories.map(c => (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: 10, borderLeft: `3px solid ${c.color}` }}>
                  <div style={{ width: 14, height: 14, borderRadius: '50%', background: c.color, flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>{c.name}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{data.habits.filter(h => h.category === c.id).length} hábitos</span>
                  <button onClick={() => openEditCat(c)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: 'var(--text-secondary)', padding: '2px 4px' }}>✏️</button>
                  <button onClick={() => deleteCategory(c.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: 'var(--accent-coral)', padding: '2px 4px', opacity: 0.7 }}>✕</button>
                </div>
              ))}
            </div>

            {/* Add/Edit form */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>{editingCat ? 'EDITAR CATEGORÍA' : 'NUEVA CATEGORÍA'}</div>
              <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                <input value={catForm.name} onChange={e => setCatForm(p => ({ ...p, name: e.target.value }))} placeholder="Nombre de la categoría" className="input-glass" style={{ flex: 1 }} />
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
                {COLORS.map(c => (
                  <button key={c} onClick={() => setCatForm(p => ({ ...p, color: c }))} style={{ width: 26, height: 26, borderRadius: '50%', background: c, border: catForm.color === c ? '3px solid white' : '3px solid transparent', cursor: 'pointer', boxShadow: catForm.color === c ? `0 0 8px ${c}` : 'none' }} />
                ))}
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn-ghost" onClick={() => { setCatModal(false); setEditingCat(null) }} style={{ flex: 1 }}>Cerrar</button>
                <button className="btn-primary" onClick={saveCat} style={{ flex: 1 }}>{editingCat ? 'Guardar' : '+ Agregar'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
