'use client'
import { useState, useEffect, useRef } from 'react'
import { useAppData, WeightEntry, getTodayKey } from '@/lib/store'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { celebrate } from '@/lib/celebrate'

interface HitoDef {
  id: string; icon: string; name: string; desc: string; xp: number; gold: number
  category: 'peso' | 'consistencia' | 'meta'
  check: (weights: WeightEntry[], goal: number | null) => boolean
}

const HITOS: HitoDef[] = [
  // ── Pérdida de peso ──
  { id: 'first',   icon: '🏁', name: 'Primer Paso',      desc: 'Registra tu primer peso',   xp: 25,  gold: 15,  category: 'peso',        check: w => w.length >= 1 },
  { id: 'lose_05', icon: '💧', name: 'Primera Gota',     desc: 'Baja 0.5 kg',               xp: 30,  gold: 15,  category: 'peso',        check: w => w.length >= 2 && w[0].weight - w[w.length-1].weight >= 0.5 },
  { id: 'lose_1',  icon: '🎯', name: 'Primer Kilo',      desc: 'Baja 1 kg',                 xp: 50,  gold: 25,  category: 'peso',        check: w => w.length >= 2 && w[0].weight - w[w.length-1].weight >= 1 },
  { id: 'lose_2',  icon: '⚡', name: 'En Marcha',        desc: 'Baja 2 kg',                 xp: 75,  gold: 35,  category: 'peso',        check: w => w.length >= 2 && w[0].weight - w[w.length-1].weight >= 2 },
  { id: 'lose_3',  icon: '🔥', name: 'Encendido',        desc: 'Baja 3 kg',                 xp: 100, gold: 50,  category: 'peso',        check: w => w.length >= 2 && w[0].weight - w[w.length-1].weight >= 3 },
  { id: 'lose_5',  icon: '💪', name: 'Cinco Kilos',      desc: 'Baja 5 kg',                 xp: 150, gold: 75,  category: 'peso',        check: w => w.length >= 2 && w[0].weight - w[w.length-1].weight >= 5 },
  { id: 'lose_7',  icon: '🌟', name: 'Siete de Siete',   desc: 'Baja 7 kg',                 xp: 200, gold: 100, category: 'peso',        check: w => w.length >= 2 && w[0].weight - w[w.length-1].weight >= 7 },
  { id: 'lose_10', icon: '🏆', name: 'Doble Dígito',     desc: 'Baja 10 kg',                xp: 300, gold: 150, category: 'peso',        check: w => w.length >= 2 && w[0].weight - w[w.length-1].weight >= 10 },
  { id: 'lose_15', icon: '🦅', name: 'Vuelo Alto',       desc: 'Baja 15 kg',                xp: 400, gold: 200, category: 'peso',        check: w => w.length >= 2 && w[0].weight - w[w.length-1].weight >= 15 },
  { id: 'lose_20', icon: '🐉', name: 'Modo Bestia',      desc: 'Baja 20 kg',                xp: 500, gold: 250, category: 'peso',        check: w => w.length >= 2 && w[0].weight - w[w.length-1].weight >= 20 },
  { id: 'lose_25', icon: '👑', name: 'Élite',            desc: 'Baja 25 kg',                xp: 600, gold: 300, category: 'peso',        check: w => w.length >= 2 && w[0].weight - w[w.length-1].weight >= 25 },
  { id: 'lose_30', icon: '🌈', name: 'Transformación',   desc: 'Baja 30 kg',                xp: 750, gold: 375, category: 'peso',        check: w => w.length >= 2 && w[0].weight - w[w.length-1].weight >= 30 },
  // ── Consistencia ──
  { id: 'days_7',  icon: '📅', name: 'Una Semana',       desc: '7 registros de peso',        xp: 60,  gold: 30,  category: 'consistencia', check: w => w.length >= 7 },
  { id: 'days_14', icon: '🗓️', name: 'Dos Semanas',      desc: '14 registros',               xp: 100, gold: 50,  category: 'consistencia', check: w => w.length >= 14 },
  { id: 'days_30', icon: '💯', name: 'Un Mes',           desc: '30 registros',               xp: 200, gold: 100, category: 'consistencia', check: w => w.length >= 30 },
  { id: 'days_60', icon: '🔮', name: 'Dos Meses',        desc: '60 registros',               xp: 350, gold: 175, category: 'consistencia', check: w => w.length >= 60 },
  { id: 'days_100',icon: '🧘', name: '100 Días',          desc: '100 registros',              xp: 500, gold: 250, category: 'consistencia', check: w => w.length >= 100 },
  // ── Meta ──
  { id: 'goal_50', icon: '🎯', name: 'Mitad del Camino', desc: '50% hacia tu meta',          xp: 150, gold: 75,  category: 'meta',        check: (w, g) => { if (!g || w.length < 2) return false; const pct = Math.abs(w[0].weight - w[w.length-1].weight) / Math.abs(g - w[0].weight) * 100; return pct >= 50 } },
  { id: 'goal_90', icon: '🏃', name: 'Casi Llegando',    desc: '90% hacia tu meta',          xp: 250, gold: 125, category: 'meta',        check: (w, g) => { if (!g || w.length < 2) return false; const pct = Math.abs(w[0].weight - w[w.length-1].weight) / Math.abs(g - w[0].weight) * 100; return pct >= 90 } },
  { id: 'goal_100',icon: '🏁', name: 'Meta Alcanzada',   desc: '¡Llegaste a tu meta!',       xp: 500, gold: 250, category: 'meta',        check: (w, g) => { if (!g || w.length < 1) return false; return w[w.length-1].weight <= g } },
]

const CAT_LABELS: Record<string, string> = { peso: '⚖️ Pérdida de Peso', consistencia: '📅 Consistencia', meta: '🎯 Meta' }

const BODY_LEVELS = [
  { emoji: '🥚', title: 'El Origen' },
  { emoji: '🐣', title: 'Primeros Pasos' },
  { emoji: '🐥', title: 'Ganando Impulso' },
  { emoji: '🐤', title: 'Tomando Forma' },
  { emoji: '🦊', title: 'Constante' },
  { emoji: '🦅', title: 'Volando Alto' },
  { emoji: '🦸', title: 'Imparable' },
  { emoji: '🐉', title: 'Modo Bestia' },
  { emoji: '🏆', title: 'Leyenda' },
]

const MOTIVATION_START = [
  'Cada gran transformación comienza con el primer registro. ¡Vamos! 🚀',
  'Registra tu peso de hoy y empieza a escribir tu evolución. ✍️',
  'El primer paso ya lo diste al abrir esta página. Sigue avanzando. 🔥',
]
const MOTIVATION_LOSING = [
  '¡Vas por buen camino! Cada kilo menos es un hábito que se consolida. 💪',
  'La constancia le está ganando a la báscula. ¡Sigue así! 🔥',
  'Tu cuerpo está respondiendo a tu disciplina. No pares ahora. 🚀',
  'Pequeños pasos diarios = grandes cambios. Vas excelente. ✨',
  'El esfuerzo de hoy es el resultado de mañana. ¡Sigue! 🌟',
]
const MOTIVATION_GAINING = [
  'Una subida no define tu progreso. Ajusta y sigue adelante. 💛',
  'El cuerpo fluctúa, lo importante es la tendencia general. Confía en el proceso. 🌱',
  'Hoy es un buen día para retomar el enfoque. Tú puedes. 💪',
  'No te castigues por un número. Vuelve a tus hábitos y verás resultados. 🔄',
]
const MOTIVATION_STABLE = [
  'Mantenerte estable también es un logro. La consistencia es la clave. 🧘',
  'Estás en zona de control. Sigue registrando, los resultados llegan. 📊',
  'La estabilidad es la base de cualquier gran cambio. Vas bien. ⚖️',
]
const MOTIVATION_GOAL_REACHED = [
  '🏆 ¡Meta alcanzada! Eres la prueba de que la constancia funciona.',
  '🎉 ¡Lo lograste! Hora de definir tu próximo objetivo y seguir creciendo.',
]

export default function BodyPage() {
  const { data, loaded, addWeight, deleteWeight, setGoalWeight, uploadFoodPhoto, deleteFoodPhoto, unlockHito } = useAppData()
  const today = getTodayKey()

  // Migración: si esta cuenta no tiene meta sincronizada pero este dispositivo
  // tenía una guardada localmente (versión anterior), la migramos a los datos sincronizados.
  useEffect(() => {
    if (!loaded) return
    if (data.goalWeight == null) {
      const legacy = localStorage.getItem('forja-goal-weight')
      if (legacy) {
        const g = parseFloat(legacy)
        if (!isNaN(g) && g > 0) setGoalWeight(g)
        localStorage.removeItem('forja-goal-weight')
      }
    }
  }, [loaded, data.goalWeight, setGoalWeight])

  const [weight, setWeight]     = useState('')
  const [notes, setNotes]       = useState('')
  const [editingGoal, setEditingGoal] = useState(false)
  const [goalInput, setGoalInput]   = useState('')

  // Edit past entry state
  const [editEntry, setEditEntry]   = useState<WeightEntry | null>(null)
  const [editW, setEditW]           = useState('')
  const [editN, setEditN]           = useState('')

  // Hitos
  const [newHito, setNewHito] = useState<HitoDef | null>(null)
  useEffect(() => { if (newHito) { const t = setTimeout(() => setNewHito(null), 4000); return () => clearTimeout(t) } }, [newHito])

  // Fotos
  const [expandedPhotoDate, setExpandedPhotoDate] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [lightbox, setLightbox] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const uploadTargetDate = useRef<string>(today)

  const handlePhotoClick = (date: string) => {
    uploadTargetDate.current = date
    setUploadError(null)
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    const date = uploadTargetDate.current
    const existing = data.foodPhotos?.[date] ?? []
    const slots = 6 - existing.length
    const toUpload = files.slice(0, slots)
    setUploading(true)
    setUploadError(null)
    for (const file of toUpload) {
      const result = await uploadFoodPhoto(date, file)
      if (result.error) {
        setUploadError(result.error)
        break
      }
    }
    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
    setExpandedPhotoDate(date)
  }

  const sorted = [...data.weights].sort((a, b) => a.date.localeCompare(b.date))
  const latest = sorted[sorted.length - 1]
  const first  = sorted[0]
  const goal   = data.goalWeight ?? null
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
      setGoalWeight(g)
    }
    setEditingGoal(false)
  }

  const handleSave = () => {
    const w = parseFloat(weight)
    if (isNaN(w) || w < 30 || w > 300) return
    const historicMin = sorted.length > 0 ? Math.min(...sorted.map(e => e.weight)) : null
    if (historicMin !== null && w < historicMin) celebrate('weight')
    const newEntry: WeightEntry = { date: today, weight: w, notes }
    const newSorted = [...data.weights.filter(e => e.date !== today), newEntry].sort((a,b) => a.date.localeCompare(b.date))
    addWeight(newEntry)
    // Verificar hitos recién desbloqueados
    const unlocked = data.unlockedHitos ?? []
    HITOS.forEach(h => {
      if (!unlocked.includes(h.id) && h.check(newSorted, goal)) {
        unlockHito(h.id, h.xp, h.gold)
        celebrate('task')
        setNewHito(h)
      }
    })
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

  // ── Evolución / motivación ──
  const evoPct = goalPct !== null ? goalPct : Math.min(100, sorted.length * 5)
  const evoLevel = Math.min(BODY_LEVELS.length - 1, Math.floor(evoPct / (100 / (BODY_LEVELS.length - 1))))
  const evo = BODY_LEVELS[evoLevel]

  const motivationPool = goalPct !== null && goalPct >= 100 ? MOTIVATION_GOAL_REACHED
    : sorted.length < 2 ? MOTIVATION_START
    : isLosing ? MOTIVATION_LOSING
    : totalChange !== null && totalChange > 0 ? MOTIVATION_GAINING
    : MOTIVATION_STABLE
  const motivationPhrase = motivationPool[new Date().getDate() % motivationPool.length]

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
                <div style={{ fontSize: 12, color: 'var(--text-muted)', letterSpacing: 1 }}>META</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--accent-teal)' }}>{goal ? `${goal} kg` : '—'}</div>
              </div>
              <button onClick={() => { setGoalInput(goal ? String(goal) : ''); setEditingGoal(true) }} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 7, padding: '6px 10px', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 12 }}>
                {goal ? '✏️' : '+ Fijar meta'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Motivación / Evolución ── */}
      <div className="card" style={{ marginBottom: 22, background: 'linear-gradient(135deg, rgba(124,111,255,0.08), rgba(0,229,184,0.05))', borderColor: 'rgba(124,111,255,0.25)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 56, lineHeight: 1, filter: 'drop-shadow(0 0 12px rgba(124,111,255,0.4))' }}>{evo.emoji}</div>
          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, flexWrap: 'wrap', gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: 1, color: 'var(--accent-purple)' }}>NIVEL {evoLevel + 1} · {evo.title}</span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{evoPct}%{goalPct !== null ? ' hacia tu meta' : ' de progreso'}</span>
            </div>
            <div className="prog-track" style={{ height: 8, marginBottom: 10 }}>
              <div className="prog-fill" style={{
                width: `${evoPct}%`,
                background: evoPct >= 100 ? 'var(--accent-gold)' : 'linear-gradient(90deg, var(--accent-purple), var(--accent-teal))',
                boxShadow: evoPct >= 100 ? '0 0 14px var(--accent-gold)' : '0 0 8px rgba(124,111,255,0.4)',
                transition: 'width 0.6s ease',
              }} />
            </div>
            <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{motivationPhrase}</div>
          </div>
        </div>
      </div>

      {/* ── Stats cards ── */}
      <div className="grid-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 22 }}>
        {[
          { label: 'ACTUAL',     value: latest ? `${latest.weight} kg` : '—',              color: 'var(--accent-purple)' },
          { label: 'META',       value: goal ? `${goal} kg` : '—',                          color: 'var(--accent-teal)'  },
          { label: totalChange === null ? 'CAMBIO' : totalChange < 0 ? 'PERDIDO' : totalChange > 0 ? 'GANADO' : 'SIN CAMBIO', value: weightLost ? `${weightLost} kg` : '—', color: isLosing ? 'var(--accent-teal)' : 'var(--accent-coral)' },
          { label: 'MÍNIMO',     value: stats ? `${stats.min} kg` : '—',                    color: 'var(--accent-teal)'  },
          { label: 'PROMEDIO',   value: stats ? `${stats.avg} kg` : '—',                    color: 'var(--text-secondary)'},
        ].map(s => (
          <div key={s.label} className="card" style={{ textAlign: 'center', padding: '16px 8px' }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6, letterSpacing: 1 }}>{s.label}</div>
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

      {/* ── Hitos ── */}
      {(['peso', 'consistencia', 'meta'] as const).map(cat => {
        const catHitos = HITOS.filter(h => h.category === cat)
        const unlockedIds = data.unlockedHitos ?? []
        const doneCount = catHitos.filter(h => unlockedIds.includes(h.id)).length
        return (
          <div key={cat} className="card" style={{ marginBottom: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: 1 }}>HITOS · {CAT_LABELS[cat]}</div>
              <div style={{ fontSize: 11, color: 'var(--accent-purple)' }}>{doneCount}/{catHitos.length}</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10 }}>
              {catHitos.map(h => {
                const done = unlockedIds.includes(h.id)
                return (
                  <div key={h.id} style={{
                    borderRadius: 10, padding: '12px 10px', textAlign: 'center',
                    background: done ? 'rgba(124,111,255,0.1)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${done ? 'rgba(124,111,255,0.4)' : 'rgba(255,255,255,0.07)'}`,
                    opacity: done ? 1 : 0.45,
                    transition: 'all 0.3s',
                    boxShadow: done ? '0 0 14px rgba(124,111,255,0.15)' : 'none',
                  }}>
                    <div style={{ fontSize: 28, marginBottom: 6, filter: done ? 'none' : 'grayscale(1)' }}>{h.icon}</div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: done ? 'var(--text-primary)' : 'var(--text-muted)', marginBottom: 3 }}>{h.name}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 8, lineHeight: 1.4 }}>{h.desc}</div>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 8, fontSize: 10 }}>
                      <span style={{ color: done ? 'var(--accent-purple)' : 'var(--text-muted)' }}>⚡ {h.xp} XP</span>
                      <span style={{ color: done ? 'var(--accent-gold)' : 'var(--text-muted)' }}>🪙 {h.gold}</span>
                    </div>
                    {done && <div style={{ fontSize: 9, color: 'var(--accent-teal)', marginTop: 5, letterSpacing: 0.5 }}>✓ LOGRADO</div>}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      {/* ── Historial (editable) ── */}
      {sorted.length > 0 && (
        <div className="card">
          <div style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: 1, marginBottom: 14 }}>HISTORIAL</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[...sorted].reverse().slice(0, 30).map(w => {
              const isEdit = editEntry?.date === w.date
              const prev = sorted.find((_, i) => sorted[i + 1]?.date === w.date)
              const delta = prev ? +(w.weight - prev.weight).toFixed(1) : null
              const photos = data.foodPhotos?.[w.date] ?? []
              const isExpanded = expandedPhotoDate === w.date
              return (
                <div key={w.date} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, overflow: 'hidden' }}>
                  {/* Fila principal */}
                  <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 10, padding: '10px 12px' }}>
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
                        {w.notes && <span style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic', flex: '1 1 100%', whiteSpace: 'normal', wordBreak: 'break-word' }}>{w.notes}</span>}
                        <button
                          onClick={() => setExpandedPhotoDate(isExpanded ? null : w.date)}
                          style={{ marginLeft: 'auto', background: photos.length ? 'rgba(124,111,255,0.12)' : 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '4px 10px', color: photos.length ? 'var(--accent-purple)' : 'var(--text-muted)', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 5 }}>
                          📷 {photos.length > 0 ? photos.length : '+'} fotos
                        </button>
                        <button onClick={() => openEdit(w)} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '4px 10px', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 12 }}>
                          ✏️
                        </button>
                        <button onClick={() => deleteWeight(w.date)} style={{ background: 'none', border: '1px solid rgba(255,80,80,0.25)', borderRadius: 6, padding: '4px 10px', color: 'var(--accent-coral)', cursor: 'pointer', fontSize: 12, opacity: 0.85 }}>
                          ✕
                        </button>
                      </>
                    )}
                  </div>

                  {/* Panel de fotos expandible */}
                  {isExpanded && (
                    <div style={{ padding: '0 12px 14px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: 1, margin: '10px 0 8px' }}>FOTOS DE LO QUE COMISTE · {photos.length}/6</div>
                      {uploadError && (
                        <div style={{ fontSize: 12, color: 'var(--accent-coral)', background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.3)', borderRadius: 7, padding: '8px 12px', marginBottom: 10 }}>
                          ⚠️ Error al subir: {uploadError}
                          {uploadError.includes('Bucket not found') || uploadError.includes('bucket') ? (
                            <div style={{ marginTop: 4, fontSize: 11, opacity: 0.8 }}>
                              Necesitas crear el bucket "food-photos" en Supabase Storage (ver instrucciones abajo)
                            </div>
                          ) : null}
                        </div>
                      )}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
                        {photos.map((url, i) => (
                          <div key={i} style={{ position: 'relative', aspectRatio: '1', borderRadius: 8, overflow: 'hidden', background: 'rgba(255,255,255,0.05)' }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={url} alt={`foto ${i + 1}`}
                              style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer' }}
                              onClick={() => setLightbox(url)}
                            />
                            <button
                              onClick={() => deleteFoodPhoto(w.date, url)}
                              style={{ position: 'absolute', top: 3, right: 3, width: 20, height: 20, borderRadius: '50%', background: 'rgba(0,0,0,0.7)', border: 'none', color: 'white', fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>
                              ✕
                            </button>
                          </div>
                        ))}
                        {photos.length < 6 && (
                          <button
                            onClick={() => handlePhotoClick(w.date)}
                            disabled={uploading}
                            style={{ aspectRatio: '1', borderRadius: 8, border: '2px dashed rgba(124,111,255,0.4)', background: 'rgba(124,111,255,0.05)', color: 'var(--accent-purple)', cursor: uploading ? 'wait' : 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontSize: 22, gap: 4, transition: 'all 0.2s' }}>
                            {uploading ? '⏳' : '+'}
                            <span style={{ fontSize: 9, opacity: 0.7 }}>{uploading ? 'subiendo' : 'foto'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Toast hito desbloqueado ── */}
      {newHito && (
        <div style={{
          position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)',
          background: 'linear-gradient(135deg, rgba(124,111,255,0.95), rgba(0,229,184,0.9))',
          borderRadius: 16, padding: '16px 28px', zIndex: 9999,
          boxShadow: '0 8px 40px rgba(124,111,255,0.5)', textAlign: 'center',
          animation: 'slideUp 0.4s ease',
          minWidth: 260,
        }}>
          <div style={{ fontSize: 36, marginBottom: 4 }}>{newHito.icon}</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', letterSpacing: 1 }}>🎉 HITO DESBLOQUEADO</div>
          <div style={{ fontSize: 18, fontWeight: 900, color: 'white', margin: '4px 0' }}>{newHito.name}</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)' }}>{newHito.desc}</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'white', marginTop: 8 }}>
            +{newHito.xp} XP &nbsp;·&nbsp; +{newHito.gold} 🪙
          </div>
        </div>
      )}
      <style>{`@keyframes slideUp { from { opacity:0; transform:translateX(-50%) translateY(20px) } to { opacity:1; transform:translateX(-50%) translateY(0) } }`}</style>

      {/* Input oculto para subir fotos */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {/* Lightbox */}
      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, cursor: 'zoom-out' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lightbox} alt="foto ampliada" style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 12, objectFit: 'contain', boxShadow: '0 0 60px rgba(0,0,0,0.8)' }} />
          <button onClick={() => setLightbox(null)} style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: 40, height: 40, fontSize: 20, color: 'white', cursor: 'pointer' }}>✕</button>
        </div>
      )}
    </div>
  )
}
