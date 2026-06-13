'use client'
import { useState, useRef } from 'react'
import { useAppData, AgendaBlock, getDateKey } from '@/lib/store'
import { format, addDays, startOfWeek } from 'date-fns'
import { es } from 'date-fns/locale'

// ── Config ──────────────────────────────────────────────
const HOUR_H   = 72   // px per hour
const START_H  = 5    // 5 AM
const END_H    = 24   // midnight
const HOURS    = Array.from({ length: END_H - START_H }, (_, i) => START_H + i)
const TOTAL_H  = (END_H - START_H) * HOUR_H

const CAT_COLORS: Record<string, string> = {
  morning:  '#FFD93D',
  work:     '#7C6FFF',
  exercise: '#00E5B8',
  personal: '#4FC3F7',
  evening:  '#FF6B6B',
}
const CAT_LABELS: Record<string, string> = {
  morning:  '🌅 Mañana',
  work:     '💼 Trabajo',
  exercise: '🏋️ Ejercicio',
  personal: '🎯 Personal',
  evening:  '🌙 Noche',
}

function dateKey(d: Date) {
  return getDateKey(d)
}
function toMin(t: string) {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}
function fromMin(m: number) {
  return `${String(Math.floor(m / 60)).padStart(2,'0')}:${String(m % 60).padStart(2,'0')}`
}
function blockTop(time: string) {
  return Math.max(0, (toMin(time) - START_H * 60) / 60 * HOUR_H)
}
function blockHeight(time: string, endTime?: string) {
  if (!endTime) return HOUR_H
  const mins = toMin(endTime) - toMin(time)
  return Math.max(24, mins / 60 * HOUR_H)
}

const DEFAULT_BLOCKS: Omit<AgendaBlock, 'id' | 'done' | 'date'>[] = [
  { time: '05:00', endTime: '05:15', title: 'Despertar + Agua',   category: 'morning'  },
  { time: '05:15', endTime: '05:45', title: 'Meditación',          category: 'morning'  },
  { time: '06:00', endTime: '07:00', title: 'Ejercicio',           category: 'exercise' },
  { time: '07:00', endTime: '07:30', title: 'Ducha fría',          category: 'morning'  },
  { time: '07:30', endTime: '08:00', title: 'Desayuno / Lectura',  category: 'personal' },
  { time: '08:00', endTime: '09:00', title: 'BIT / Mercados',      category: 'work'     },
  { time: '09:00', endTime: '12:00', title: 'Trabajo profundo',    category: 'work'     },
  { time: '12:00', endTime: '13:00', title: 'Comida',              category: 'personal' },
  { time: '18:00', endTime: '19:00', title: 'EOD Review',          category: 'work'     },
  { time: '20:00', endTime: '21:00', title: 'Estirar / Yoga',      category: 'exercise' },
  { time: '21:00', endTime: '21:30', title: 'Journal',             category: 'evening'  },
  { time: '22:00', endTime: '22:30', title: 'Lectura sin pantallas', category: 'evening' },
  { time: '22:30', endTime: '23:00', title: 'Dormir',              category: 'evening'  },
]

export default function AgendaPage() {
  const { data, addAgendaBlock, updateAgendaBlock, deleteAgendaBlock, toggleAgenda } = useAppData()
  const todayDate = new Date()
  const todayKey  = dateKey(todayDate)

  const [weekStart, setWeekStart] = useState(() => {
    const d = startOfWeek(todayDate, { weekStartsOn: 1 })
    return d
  })
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  // Modal state
  const [modal, setModal] = useState<{ date: string; time: string } | null>(null)
  const [editId, setEditId]   = useState<string | null>(null)
  const [form, setForm] = useState({ title: '', time: '09:00', endTime: '10:00', category: 'work' as AgendaBlock['category'], date: '' })

  const gridRef = useRef<HTMLDivElement>(null)

  const now = new Date()
  const nowTop = ((now.getHours() * 60 + now.getMinutes() - START_H * 60) / 60) * HOUR_H

  const loadDefaults = (date: string) => {
    DEFAULT_BLOCKS.forEach(b => {
      addAgendaBlock({ id: `${date}-${b.time}-${Math.random().toString(36).slice(2)}`, ...b, done: false, date })
    })
  }

  const openNew = (date: string, clickY: number) => {
    const snappedMin = Math.round((clickY / HOUR_H * 60 + START_H * 60) / 30) * 30
    const t = fromMin(Math.min(snappedMin, (END_H - 1) * 60))
    const e = fromMin(Math.min(snappedMin + 60, END_H * 60))
    setEditId(null)
    setForm({ title: '', time: t, endTime: e, category: 'work', date })
    setModal({ date, time: t })
  }

  const openEdit = (b: AgendaBlock) => {
    setEditId(b.id)
    setForm({ title: b.title, time: b.time, endTime: b.endTime ?? fromMin(toMin(b.time) + 60), category: b.category, date: b.date })
    setModal({ date: b.date, time: b.time })
  }

  const saveModal = () => {
    if (!form.title.trim() || !modal) return
    const { date, ...rest } = form
    if (editId) {
      updateAgendaBlock({ id: editId, ...rest, done: false, date })
    } else {
      addAgendaBlock({ id: `${date}-${Date.now()}`, ...rest, done: false, date })
    }
    setModal(null)
  }

  const handleGridClick = (date: string, e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const y    = e.clientY - rect.top + e.currentTarget.scrollTop
    openNew(date, y)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', padding: '0', overflow: 'hidden' }}>

      {/* ── Top bar ── */}
      <div style={{ padding: '20px 32px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <div>
          <h1 className="gradient-text-purple" style={{ fontSize: 26, fontWeight: 900, margin: 0 }}>AGENDA</h1>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 1 }}>
            {format(weekStart, "d 'de' MMMM", { locale: es })} — {format(addDays(weekStart, 6), "d 'de' MMMM yyyy", { locale: es })}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button onClick={() => setWeekStart(d => addDays(d, -7))} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 8, color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 18, width: 36, height: 36 }}>‹</button>
          <button onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))} style={{ padding: '7px 14px', background: 'rgba(124,111,255,0.15)', border: '1px solid rgba(124,111,255,0.4)', borderRadius: 8, color: 'var(--accent-purple)', cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>Hoy</button>
          <button onClick={() => setWeekStart(d => addDays(d, 7))} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 8, color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 18, width: 36, height: 36 }}>›</button>
        </div>
      </div>

      {/* ── Área scrolleable (header semana + grilla) ── */}
      <div className="agenda-scroll" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, minWidth: 52 + 7 * 96 }}>

      {/* ── Week header ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '52px repeat(7, minmax(96px, 1fr))', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0, background: 'rgba(10,10,20,0.7)', backdropFilter: 'blur(12px)' }}>
        <div />
        {weekDays.map(d => {
          const k = dateKey(d)
          const isToday = k === todayKey
          const dayBlocks = data.agenda.filter(b => b.date === k)
          const done = dayBlocks.filter(b => b.done).length
          return (
            <div key={k} style={{ textAlign: 'center', padding: '10px 4px', borderLeft: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ fontSize: 11, color: isToday ? 'var(--accent-purple)' : 'var(--text-muted)', fontWeight: 700, letterSpacing: 1, marginBottom: 4 }}>
                {format(d, 'EEE', { locale: es }).toUpperCase()}
              </div>
              <div style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: 36, height: 36, borderRadius: '50%',
                background: isToday ? 'var(--accent-purple)' : 'transparent',
                fontSize: 18, fontWeight: 900,
                color: isToday ? 'white' : 'var(--text-primary)',
                boxShadow: isToday ? '0 0 20px rgba(124,111,255,0.5)' : 'none',
              }}>
                {format(d, 'd')}
              </div>
              {dayBlocks.length > 0 && (
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
                  {done}/{dayBlocks.length}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* ── Grid ── */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'grid', gridTemplateColumns: '52px repeat(7, minmax(96px, 1fr))' }} ref={gridRef}>

        {/* Time labels */}
        <div style={{ position: 'relative', height: TOTAL_H }}>
          {HOURS.map(h => (
            <div key={h} style={{ position: 'absolute', top: (h - START_H) * HOUR_H - 8, right: 8, fontSize: 11, color: 'var(--text-muted)', fontWeight: 500, lineHeight: 1 }}>
              {h === 12 ? '12 PM' : h > 12 ? `${h-12} PM` : `${h} AM`}
            </div>
          ))}
        </div>

        {/* Day columns */}
        {weekDays.map(d => {
          const k = dateKey(d)
          const isToday = k === todayKey
          const dayBlocks = data.agenda.filter(b => b.date === k).sort((a, b) => a.time.localeCompare(b.time))

          return (
            <div key={k}
              onClick={e => { if ((e.target as HTMLElement).closest('[data-block]')) return; handleGridClick(k, e) }}
              style={{ position: 'relative', height: TOTAL_H, borderLeft: '1px solid rgba(255,255,255,0.05)', cursor: 'crosshair' }}
            >
              {/* Hour lines */}
              {HOURS.map(h => (
                <div key={h} style={{ position: 'absolute', top: (h - START_H) * HOUR_H, left: 0, right: 0, borderTop: '1px solid rgba(255,255,255,0.05)' }} />
              ))}
              {/* Half-hour lines */}
              {HOURS.map(h => (
                <div key={`h${h}`} style={{ position: 'absolute', top: (h - START_H) * HOUR_H + HOUR_H / 2, left: 0, right: 0, borderTop: '1px dashed rgba(255,255,255,0.03)' }} />
              ))}

              {/* Now line */}
              {isToday && nowTop >= 0 && nowTop <= TOTAL_H && (
                <div style={{ position: 'absolute', top: nowTop, left: 0, right: 0, zIndex: 10, pointerEvents: 'none' }}>
                  <div style={{ height: 2, background: 'var(--accent-coral)', boxShadow: '0 0 6px var(--accent-coral)' }} />
                  <div style={{ position: 'absolute', left: -4, top: -4, width: 10, height: 10, borderRadius: '50%', background: 'var(--accent-coral)' }} />
                </div>
              )}

              {/* Load defaults button if empty today */}
              {dayBlocks.length === 0 && isToday && (
                <div style={{ position: 'absolute', top: 16, left: 4, right: 4, zIndex: 5, pointerEvents: 'none' }}>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>clic para agregar</div>
                </div>
              )}

              {/* Event blocks */}
              {dayBlocks.map(b => {
                const color = CAT_COLORS[b.category] ?? '#888'
                const top = blockTop(b.time)
                const h   = blockHeight(b.time, b.endTime)
                const short = h < 40
                return (
                  <div key={b.id} data-block="1"
                    onClick={e => { e.stopPropagation(); openEdit(b) }}
                    style={{
                      position: 'absolute', top, left: 3, right: 3, height: h,
                      borderRadius: 8, padding: short ? '3px 6px' : '6px 8px',
                      background: b.done ? 'rgba(255,255,255,0.05)' : `${color}22`,
                      borderLeft: `3px solid ${b.done ? 'rgba(255,255,255,0.2)' : color}`,
                      border: `1px solid ${b.done ? 'rgba(255,255,255,0.08)' : color + '55'}`,
                      cursor: 'pointer', overflow: 'hidden', zIndex: 2,
                      boxShadow: b.done ? 'none' : `0 2px 12px ${color}22`,
                      transition: 'all 0.15s',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 4 }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={short ? {
                          fontSize: 10, fontWeight: 700, color: b.done ? 'var(--text-muted)' : 'var(--text-primary)',
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textDecoration: b.done ? 'line-through' : 'none',
                        } : {
                          fontSize: 12, fontWeight: 700, color: b.done ? 'var(--text-muted)' : 'var(--text-primary)',
                          textDecoration: b.done ? 'line-through' : 'none',
                          display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2,
                          overflow: 'hidden', textOverflow: 'ellipsis', wordBreak: 'break-word', lineHeight: 1.2,
                        }}>
                          {b.title}
                        </div>
                        {!short && (
                          <div style={{ fontSize: 10, color, marginTop: 2, opacity: b.done ? 0.5 : 1 }}>
                            {b.time}{b.endTime ? ` – ${b.endTime}` : ''}
                          </div>
                        )}
                      </div>
                      <button data-block="1" onClick={e => { e.stopPropagation(); toggleAgenda(b.id) }} style={{
                        flexShrink: 0, width: 18, height: 18, borderRadius: 5, border: `1.5px solid ${b.done ? 'var(--accent-teal)' : color}`,
                        background: b.done ? 'var(--accent-teal)' : 'transparent',
                        cursor: 'pointer', fontSize: 10, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {b.done ? '✓' : ''}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>

      </div>
      </div>

      {/* ── Load defaults bar (if today is empty) ── */}
      {data.agenda.filter(b => b.date === todayKey).length === 0 && (
        <div style={{ flexShrink: 0, padding: '10px 32px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'center' }}>
          <button onClick={() => loadDefaults(todayKey)} style={{ padding: '9px 22px', background: 'rgba(0,229,184,0.1)', border: '1px solid var(--accent-teal)', borderRadius: 10, color: 'var(--accent-teal)', cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>
            📅 Cargar rutina base para hoy
          </button>
        </div>
      )}

      {/* ── Modal agregar / editar ── */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={e => { if (e.target === e.currentTarget) setModal(null) }}>
          <div className="card" style={{ width: 440, padding: 32 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 20, fontWeight: 900, margin: 0 }}>{editId ? '✏️ Editar' : '+ Nueva actividad'}</h2>
              {editId && (
                <button onClick={() => { deleteAgendaBlock(editId); setModal(null) }} style={{ background: 'rgba(255,80,80,0.1)', border: '1px solid rgba(255,80,80,0.3)', borderRadius: 7, padding: '5px 10px', color: '#ff5050', cursor: 'pointer', fontSize: 13 }}>
                  🗑 Eliminar
                </button>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 5, letterSpacing: 1 }}>ACTIVIDAD</div>
                <input autoFocus value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && saveModal()}
                  placeholder="¿Qué vas a hacer?"
                  style={{ width: '100%', padding: '11px 14px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 9, color: 'var(--text-primary)', fontSize: 16, outline: 'none', boxSizing: 'border-box' }} />
              </div>

              {editId && (
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 5, letterSpacing: 1 }}>DÍA</div>
                  <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                    style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 9, color: 'var(--text-primary)', fontSize: 15, outline: 'none', boxSizing: 'border-box' }} />
                </div>
              )}

              <div className="grid-stats" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 5, letterSpacing: 1 }}>INICIO</div>
                  <input type="time" value={form.time} onChange={e => setForm(p => ({ ...p, time: e.target.value }))}
                    style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 9, color: 'var(--text-primary)', fontSize: 15, outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 5, letterSpacing: 1 }}>FIN</div>
                  <input type="time" value={form.endTime} onChange={e => setForm(p => ({ ...p, endTime: e.target.value }))}
                    style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 9, color: 'var(--text-primary)', fontSize: 15, outline: 'none', boxSizing: 'border-box' }} />
                </div>
              </div>

              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, letterSpacing: 1 }}>CATEGORÍA</div>
                <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                  {Object.entries(CAT_LABELS).map(([k, v]) => (
                    <button key={k} onClick={() => setForm(p => ({ ...p, category: k as AgendaBlock['category'] }))} style={{
                      padding: '7px 13px', borderRadius: 99, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                      background: form.category === k ? CAT_COLORS[k] : 'rgba(255,255,255,0.06)',
                      color: form.category === k ? '#000' : 'var(--text-secondary)',
                      boxShadow: form.category === k ? `0 0 14px ${CAT_COLORS[k]}66` : 'none',
                      transition: 'all 0.15s',
                    }}>{v}</button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button onClick={() => setModal(null)} style={{ flex: 1, padding: '11px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: 9, color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 14 }}>Cancelar</button>
                <button onClick={saveModal} className="btn-primary" style={{ flex: 2, padding: '11px', fontSize: 15 }}>
                  {editId ? 'Guardar cambios' : 'Agregar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
