'use client'
import { useState } from 'react'
import { useAppData, WeightEntry } from '@/lib/store'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default function BodyPage() {
  const { data, addWeight } = useAppData()
  const today = new Date().toISOString().split('T')[0]

  const [weight, setWeight]     = useState('')
  const [notes, setNotes]       = useState('')
  const [goalWeight, setGoalWeight] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('forja-goal-weight') ?? ''
    return ''
  })
  const [editingGoal, setEditingGoal] = useState(false)
  const [goalInput, setGoalInput]   = useState('')

  // Edit past entry state
  const [editEntry, setEditEntry]   = useState<WeightEntry | null>(null)
  const [editW, setEditW]           = useState('')
  const [editN, setEditN]           = useState('')

  const sorted = [...data.weights].sort((a, b) => a.date.localeCompare(b.date))
  const latest = sorted[sorted.length - 1]
  const first  = sorted[0]
  const goal   = goalWeight ? parseFloat(goalWeight) : null
  const totalChange = latest && first ? +(latest.weight - first.weight).toFixed(1) : null

  // % hacia la meta
  const goalPct = goal && first && latest
    ? Math.min(100, Math.round(Math.abs(latest.weight - first.weight) / Math.abs(goal - first.weight) * 100))
    : null

  const weightLost = totalChange !== null ? Math.abs(totalChange) : null
  const isLosing   = totalChange !== null && totalChange < 0

  // Projection
  let projection: { in30: string; weekly: string } | null = null
  if (sorted.length >= 2) {
    const last = sorted[sorted.length - 1]
    const prev = sorted[sorted.length - 2]
    const dayDiff = (new Date(last.date).getTime() - new Date(prev.date).getTime()) / 86400000
    const weeklyRate = dayDiff > 0 ? ((last.weight - prev.weight) / dayDiff) * 7 : 0
    projection = { in30: (last.weight + weeklyRate * 4).toFixed(1), weekly: weeklyRate.toFixed(2) }
  }

  const chartData = sorted.map(w => ({
    date: format(new Date(w.date + 'T12:00:00'), 'dd MMM', { locale: es }),
    peso: w.weight,
    meta: goal ?? undefined,
  }))

  const saveGoal = () => {
    const g = parseFloat(goalInput)
    if (!isNaN(g) && g > 0) {
      localStorage.setItem('forja-goal-weight', String(g))
      setGoalWeight(String(g))
    }
    setEditingGoal(false)
  }

  const handleSave = () => {
    const w = parseFloat(weight)
    if (isNaN(w) || w < 30 || w > 300) return
    addWeight({ date: today, weight: w, notes })
    setWeight('')
    setNotes('')
  }

  const openEdit = (entry: WeightEntry) => {
    setEditEntry(entry)
    setEditW(String(entry.weight))
    setEditN(entry.notes ?? '')
  }

  const saveEdit = () => {
    if (!editEntry) return
    const w = parseFloat(editW)
    if (isNaN(w) || w < 30 || w > 300) return
    addWeight({ ...editEntry, weight: w, notes: editN })
    setEditEntry(null)
  }

  const stats = sorted.length > 0 ? {
    min: Math.min(...sorted.map(w => w.weight)),
    max: Math.max(...sorted.map(w => w.weight)),
    avg: +(sorted.reduce((s, w) => s + w.weight, 0) / sorted.length).toFixed(1),
  } : null

  return (
    <div style={{ padding: '32px 40px', maxWidth: 960 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 className="gradient-text-purple" style={{ fontSize: 28, fontWeight: 900, margin: 0 }}>BODY STATS</h1>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>Peso, progreso y proyección</div>
        </div>
        {/* Meta de peso */}
        <div className="card" style={{ padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
          {editingGoal ? (
            <>
              <input autoFocus type="number" value={goalInput} onChange={e => setGoalInput(e.target.value)}
                placeholder="Meta kg" step="0.1"
                style={{ width: 90, padding: '7px 10px', background: 'var(--bg-surface)', border: '1px solid var(--accent-purple)', borderRadius: 7, color: 'var(--text-primary)', fontSize: 14, outline: 'none' }} />
              <button onClick={saveGoal} className="btn-primary" style={{ padding: '7px 14px', fontSize: 13 }}>Guardar</button>
              <button onClick={() => setEditingGoal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13 }}>✕</button>
            </>
          ) : (
            <>
              <div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: 1 }}>META</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--accent-teal)' }}>{goal ? `${goal} kg` : '—'}</div>
              </div>
              <button onClick={() => { setGoalInput(goalWeight); setEditingGoal(true) }} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 7, padding: '6px 10px', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 12 }}>
                {goal ? '✏️' : '+ Fijar meta'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Stats cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 22 }}>
        {[
          { label: 'ACTUAL',     value: latest ? `${latest.weight} kg` : '—',              color: 'var(--accent-purple)' },
          { label: 'META',       value: goal ? `${goal} kg` : '—',                          color: 'var(--accent-teal)'  },
          { label: totalChange === null ? 'CAMBIO' : totalChange < 0 ? 'PERDIDO' : totalChange > 0 ? 'GANADO' : 'SIN CAMBIO', value: weightLost ? `${weightLost} kg` : '—', color: isLosing ? 'var(--accent-teal)' : 'var(--accent-coral)' },
          { label: 'MÍNIMO',     value: stats ? `${stats.min} kg` : '—',                    color: 'var(--accent-teal)'  },
          { label: 'PROMEDIO',   value: stats ? `${stats.avg} kg` : '—',                    color: 'var(--text-secondary)'},
        ].map(s => (
          <div key={s.label} className="card" style={{ textAlign: 'center', padding: '16px 8px' }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 6, letterSpacing: 1 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* ── Goal progress ── */}
      {goal && first && latest && goalPct !== null && (
        <div className="card" style={{ marginBottom: 20, background: 'rgba(0,229,184,0.05)', borderColor: 'rgba(0,229,184,0.2)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: 1 }}>PROGRESO HACIA LA META</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
                {first.weight} kg → <strong style={{ color: 'var(--accent-teal)' }}>{goal} kg</strong>
                {latest && <span style={{ color: 'var(--text-muted)', marginLeft: 8 }}>( faltan {Math.abs(+(latest.weight - goal).toFixed(1))} kg )</span>}
              </div>
            </div>
            <div style={{ fontSize: 36, fontWeight: 900, color: goalPct >= 100 ? 'var(--accent-gold)' : 'var(--accent-teal)' }}>
              {goalPct >= 100 ? '🏆' : `${goalPct}%`}
            </div>
          </div>
          <div className="prog-track" style={{ height: 10 }}>
            <div className="prog-fill" style={{
              width: `${goalPct}%`,
              background: goalPct >= 100 ? 'var(--accent-gold)' : 'linear-gradient(90deg, var(--accent-purple), var(--accent-teal))',
              boxShadow: goalPct >= 100 ? '0 0 16px var(--accent-gold)' : '0 0 10px rgba(0,229,184,0.4)',
              transition: 'width 0.6s ease',
            }} />
          </div>
        </div>
      )}

      {/* ── Chart ── */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: 1, marginBottom: 14 }}>EVOLUCIÓN DE PESO</div>
        {chartData.length > 1 ? (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="wGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="var(--accent-purple)" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="var(--accent-purple)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
              <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)' }} formatter={(v) => [`${v} kg`, 'Peso']} />
              {goal && <ReferenceLine y={goal} stroke="var(--accent-teal)" strokeDasharray="6 3" label={{ value: `Meta ${goal}kg`, fill: 'var(--accent-teal)', fontSize: 11 }} />}
              <Area type="monotone" dataKey="peso" stroke="var(--accent-purple)" strokeWidth={2.5} fill="url(#wGrad)" dot={{ fill: 'var(--accent-purple)', r: 4 }} activeDot={{ r: 6 }} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
            Agrega al menos 2 registros para ver la gráfica
          </div>
        )}
      </div>

      {/* ── Projection ── */}
      {projection && (
        <div className="card" style={{ marginBottom: 20, borderColor: 'rgba(124,111,255,0.3)', background: 'rgba(124,111,255,0.05)' }}>
          <div style={{ fontSize: 11, color: 'var(--accent-purple)', letterSpacing: 1, marginBottom: 10 }}>📈 PROYECCIÓN</div>
          <div style={{ display: 'flex', gap: 32 }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>En 30 días</div>
              <div style={{ fontSize: 26, fontWeight: 900, color: 'var(--accent-purple)' }}>{projection.in30} kg</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Tendencia semanal</div>
              <div style={{ fontSize: 26, fontWeight: 900, color: Number(projection.weekly) < 0 ? 'var(--accent-teal)' : 'var(--accent-coral)' }}>
                {Number(projection.weekly) > 0 ? '+' : ''}{projection.weekly} kg/sem
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Registrar hoy ── */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: 1, marginBottom: 14 }}>REGISTRAR HOY</div>
        <div style={{ display: 'flex', gap: 12 }}>
          <input type="number" value={weight} onChange={e => setWeight(e.target.value)}
            placeholder="Peso (kg)" step="0.1"
            style={{ width: 130, padding: '11px 14px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 16, outline: 'none' }} />
          <input value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="Notas (opcional)"
            style={{ flex: 1, padding: '11px 14px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 14, outline: 'none' }} />
          <button onClick={handleSave} className="btn-primary" style={{ padding: '11px 28px', fontSize: 15 }}>Guardar</button>
        </div>
      </div>

      {/* ── Historial (editable) ── */}
      {sorted.length > 0 && (
        <div className="card">
          <div style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: 1, marginBottom: 14 }}>HISTORIAL</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[...sorted].reverse().slice(0, 30).map(w => {
              const isEdit = editEntry?.date === w.date
              const prev = sorted.find((_, i) => sorted[i + 1]?.date === w.date)
              const delta = prev ? +(w.weight - prev.weight).toFixed(1) : null
              return (
                <div key={w.date} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 9 }}>
                  {isEdit ? (
                    <>
                      <span style={{ fontSize: 13, color: 'var(--text-muted)', minWidth: 140 }}>{format(new Date(w.date + 'T12:00:00'), "d 'de' MMMM yyyy", { locale: es })}</span>
                      <input type="number" value={editW} onChange={e => setEditW(e.target.value)} step="0.1"
                        style={{ width: 90, padding: '6px 10px', background: 'var(--bg-surface)', border: '1px solid var(--accent-purple)', borderRadius: 7, color: 'var(--text-primary)', fontSize: 14, outline: 'none' }} />
                      <input value={editN} onChange={e => setEditN(e.target.value)} placeholder="Notas"
                        style={{ flex: 1, padding: '6px 10px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 7, color: 'var(--text-primary)', fontSize: 13, outline: 'none' }} />
                      <button onClick={saveEdit} style={{ padding: '6px 12px', background: 'var(--accent-purple)', border: 'none', borderRadius: 7, color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>✓</button>
                      <button onClick={() => setEditEntry(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 16 }}>✕</button>
                    </>
                  ) : (
                    <>
                      <span style={{ fontSize: 13, color: 'var(--text-muted)', minWidth: 140 }}>{format(new Date(w.date + 'T12:00:00'), "d 'de' MMMM yyyy", { locale: es })}</span>
                      <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--accent-purple)', minWidth: 80 }}>{w.weight} kg</span>
                      {delta !== null && (
                        <span style={{ fontSize: 13, fontWeight: 700, color: delta < 0 ? 'var(--accent-teal)' : delta > 0 ? 'var(--accent-coral)' : 'var(--text-muted)', minWidth: 60 }}>
                          {delta > 0 ? '+' : ''}{delta} kg
                        </span>
                      )}
                      {w.notes && <span style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic', flex: 1 }}>{w.notes}</span>}
                      <button onClick={() => openEdit(w)} style={{ marginLeft: 'auto', background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '4px 10px', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 12 }}>
                        ✏️ Editar
                      </button>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
