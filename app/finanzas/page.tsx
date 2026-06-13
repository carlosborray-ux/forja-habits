'use client'
import { useState } from 'react'
import { useAppData, FinanceCategory, Transaction, getTodayKey } from '@/lib/store'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import {
  format, subMonths, addMonths,
  startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear,
  subQuarters, addQuarters, subYears, addYears, getQuarter,
  differenceInCalendarDays, differenceInCalendarMonths,
} from 'date-fns'
import { es } from 'date-fns/locale'

type Period = 'month' | 'quarter' | 'year' | 'all'
const DAY_NAMES = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado']

const ICONS  = ['💰','🍔','🚗','🏠','🎮','🏥','📦','💵','🛒','✈️','📱','👕','🎓','🐶','🎁','⚡','💡','🧾','🎵','🍺']
const COLORS = ['#7C6FFF','#00E5B8','#FF6B6B','#FFD93D','#4FC3F7','#FF4FA3','#FF8C00','#9B59B6','#2ECC71','#E74C3C']

const fmt = (n: number) => n.toLocaleString('es', { minimumFractionDigits: 0, maximumFractionDigits: 2 })

const emptyCat = (): Omit<FinanceCategory, 'id'> => ({ name: '', color: COLORS[0], icon: ICONS[0], budget: 0 })
const emptyTx = (dateKey: string, defaultCat: string): Omit<Transaction, 'id'> => ({
  date: dateKey, amount: 0, type: 'expense', category: defaultCat, note: '',
})

export default function FinanzasPage() {
  const {
    data, loaded,
    addTransaction, updateTransaction, deleteTransaction,
    addFinanceCategory, updateFinanceCategory, deleteFinanceCategory,
  } = useAppData()

  const [viewMonth, setViewMonth] = useState(new Date())
  const [period, setPeriod] = useState<Period>('month')
  const [txModal, setTxModal] = useState(false)
  const [editingTx, setEditingTx] = useState<Transaction | null>(null)
  const [form, setForm] = useState(emptyTx(getTodayKey(), 'f1'))

  const [catModal, setCatModal] = useState(false)
  const [editingCat, setEditingCat] = useState<FinanceCategory | null>(null)
  const [catForm, setCatForm] = useState(emptyCat())

  const [aiModal, setAiModal] = useState(false)

  if (!loaded) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <div className="gradient-text-purple" style={{ fontSize: 26, fontWeight: 900, letterSpacing: 2 }}>CARGANDO...</div>
    </div>
  )

  // ── Rango del período seleccionado ──
  const allDates = data.transactions.map(t => t.date).sort()
  const getRange = (p: Period, ref: Date): { start: Date; end: Date } => {
    switch (p) {
      case 'quarter': return { start: startOfQuarter(ref), end: endOfQuarter(ref) }
      case 'year':    return { start: startOfYear(ref), end: endOfYear(ref) }
      case 'all': {
        const start = allDates.length ? new Date(allDates[0] + 'T12:00:00') : startOfYear(ref)
        return { start, end: endOfMonth(new Date()) }
      }
      default: return { start: startOfMonth(ref), end: endOfMonth(ref) }
    }
  }
  const { start, end } = getRange(period, viewMonth)
  const today = new Date()
  const effectiveEnd = end > today ? today : end

  const monthsInRange = period === 'month' ? 1 : period === 'quarter' ? 3 : period === 'year' ? 12
    : Math.max(1, differenceInCalendarMonths(end, start) + 1)

  const periodLabel = period === 'month' ? format(viewMonth, 'MMMM yyyy', { locale: es }).toUpperCase()
    : period === 'quarter' ? `T${getQuarter(viewMonth)} ${format(viewMonth, 'yyyy')}`
    : period === 'year' ? format(viewMonth, 'yyyy')
    : 'TODO EL HISTORIAL'

  const inRange = (dateStr: string, s: Date, e: Date) => {
    const d = new Date(dateStr + 'T12:00:00')
    return d >= s && d <= e
  }

  const periodTx = data.transactions.filter(t => inRange(t.date, start, end)).sort((a, b) => b.date.localeCompare(a.date))

  const income  = periodTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const expense = periodTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const balance = income - expense
  const savingsRate = income > 0 ? Math.round((balance / income) * 100) : 0

  // ── Gastos por categoría (período, presupuesto escalado al # de meses) ──
  const expenseCats = data.financeCategories.filter(c => c.id !== 'f8')
  const byCat = expenseCats.map(c => ({
    ...c,
    total: periodTx.filter(t => t.type === 'expense' && t.category === c.id).reduce((s, t) => s + t.amount, 0),
    budget: c.budget * monthsInRange,
  }))
  const byCatWithSpend = byCat.filter(c => c.total > 0)

  // ── Tendencia últimos 6 meses ──
  const trend = Array.from({ length: 6 }, (_, i) => {
    const d = subMonths(new Date(), 5 - i)
    const k = format(d, 'yyyy-MM')
    const txs = data.transactions.filter(t => t.date.startsWith(k))
    return {
      label: format(d, 'MMM', { locale: es }),
      Ingresos: txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
      Gastos:   txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
    }
  })

  // ── Período anterior (para comparativas) ──
  const getPrevRef = (p: Period, ref: Date) => p === 'quarter' ? subQuarters(ref, 1) : p === 'year' ? subYears(ref, 1) : subMonths(ref, 1)
  const prevRange = period !== 'all' ? getRange(period, getPrevRef(period, viewMonth)) : null
  const prevTx = prevRange ? data.transactions.filter(t => inRange(t.date, prevRange.start, prevRange.end)) : []
  const prevExpense = prevTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const prevByCat = expenseCats.map(c => ({
    ...c,
    total: prevTx.filter(t => t.type === 'expense' && t.category === c.id).reduce((s, t) => s + t.amount, 0),
  }))

  // ── Métricas adicionales ──
  const daysInRange = Math.max(1, differenceInCalendarDays(effectiveEnd, start) + 1)
  const avgDaily = expense / daysInRange

  const expenseTx = periodTx.filter(t => t.type === 'expense')
  const topExpenses = [...expenseTx].sort((a, b) => b.amount - a.amount).slice(0, 5)

  const isCurrentMonth = period === 'month' && format(viewMonth, 'yyyy-MM') === format(new Date(), 'yyyy-MM')
  const daysInMonth = differenceInCalendarDays(endOfMonth(viewMonth), startOfMonth(viewMonth)) + 1
  const projection = isCurrentMonth ? avgDaily * daysInMonth : null

  // ── Patrón de gasto por día de la semana ──
  const byDayOfWeek = DAY_NAMES.map((name, i) => ({
    name,
    total: expenseTx.filter(t => new Date(t.date + 'T12:00:00').getDay() === i).reduce((s, t) => s + t.amount, 0),
  }))
  const topDay = [...byDayOfWeek].sort((a, b) => b.total - a.total)[0]

  // ── Consejos (motor de reglas tipo "asesor financiero") ──
  type Tip = { icon: string; text: string; tone: 'good' | 'warn' | 'bad' | 'info' }
  const tips: Tip[] = []

  // Categorías sobre presupuesto
  byCat.forEach(c => {
    if (c.budget > 0 && c.total > c.budget) {
      const pctOver = Math.round((c.total / c.budget - 1) * 100)
      tips.push({ icon: '🚨', tone: 'bad', text: `Te pasaste ${pctOver}% del presupuesto en "${c.name}" (${fmt(c.total)} de ${fmt(c.budget)}).` })
    } else if (c.budget > 0 && c.total > c.budget * 0.85) {
      tips.push({ icon: '⚠️', tone: 'warn', text: `Vas en ${Math.round((c.total / c.budget) * 100)}% del presupuesto de "${c.name}". Cuidado para no pasarte.` })
    }
  })

  // Categoría con mayor gasto
  if (byCatWithSpend.length > 0) {
    const top = [...byCatWithSpend].sort((a, b) => b.total - a.total)[0]
    const pctOfTotal = expense > 0 ? Math.round((top.total / expense) * 100) : 0
    if (pctOfTotal >= 30) {
      tips.push({ icon: '🔍', tone: 'info', text: `"${top.name}" es tu mayor gasto: ${fmt(top.total)} (${pctOfTotal}% del total del período).` })
    }
  }

  // Comparación vs período anterior
  if (prevExpense > 0) {
    const diffPct = Math.round(((expense - prevExpense) / prevExpense) * 100)
    if (diffPct >= 15) tips.push({ icon: '📈', tone: 'warn', text: `Gastaste ${diffPct}% más que en el período anterior (${fmt(expense)} vs ${fmt(prevExpense)}).` })
    else if (diffPct <= -15) tips.push({ icon: '🎉', tone: 'good', text: `¡Bien! Gastaste ${Math.abs(diffPct)}% menos que en el período anterior.` })
  }

  // Tasa de ahorro
  if (income > 0) {
    if (savingsRate >= 20) tips.push({ icon: '💎', tone: 'good', text: `Tu tasa de ahorro es ${savingsRate}%. ¡Vas muy bien (la meta recomendada es 20%)!` })
    else if (savingsRate >= 0) tips.push({ icon: '🎯', tone: 'warn', text: `Tu tasa de ahorro es ${savingsRate}%. Intenta llegar al 20% recortando gastos pequeños.` })
    else tips.push({ icon: '🆘', tone: 'bad', text: `Estás gastando más de lo que ingresa (${fmt(Math.abs(balance))} de déficit). Revisa tus gastos variables.` })
  } else if (periodTx.length > 0) {
    tips.push({ icon: '💵', tone: 'info', text: `Aún no registras ingresos en este período. Agrégalos para calcular tu tasa de ahorro.` })
  }

  // Proyección de fin de mes
  if (projection !== null && projection > 0) {
    tips.push({ icon: '📅', tone: 'info', text: `A este ritmo, terminarás el mes con un gasto aproximado de $${fmt(projection)}.` })
  }

  // Día de la semana con más gasto
  if (topDay.total > 0 && expense > 0) {
    const pctOfTotal = Math.round((topDay.total / expense) * 100)
    if (pctOfTotal >= 25) {
      tips.push({ icon: '📆', tone: 'info', text: `Los días ${topDay.name} concentran el ${pctOfTotal}% de tus gastos (${fmt(topDay.total)}).` })
    }
  }

  // Categorías con gasto pero sin presupuesto
  byCatWithSpend.filter(c => c.budget === 0).forEach(c => {
    tips.push({ icon: '🧮', tone: 'info', text: `"${c.name}" no tiene presupuesto. Sugerencia: define uno cercano a ${fmt(Math.ceil((c.total / monthsInRange) / 10) * 10)} mensual basado en tu gasto actual.` })
  })

  if (tips.length === 0) {
    tips.push({ icon: '✨', tone: 'info', text: 'Registra tus gastos e ingresos del período para recibir consejos personalizados.' })
  }

  const toneColor = { good: 'var(--accent-teal)', warn: 'var(--accent-gold)', bad: 'var(--accent-coral)', info: 'var(--accent-purple)' }

  // ── Reporte detallado para el modal de Análisis IA ──
  const catTrend = byCat.map(c => {
    const prev = prevByCat.find(p => p.id === c.id)?.total ?? 0
    const diff = prev > 0 ? Math.round(((c.total - prev) / prev) * 100) : (c.total > 0 ? 100 : 0)
    return { ...c, prev, diff }
  }).filter(c => c.total > 0 || c.prev > 0).sort((a, b) => b.total - a.total)

  // ── Modal helpers ──
  const openAddTx = () => {
    setEditingTx(null)
    setForm(emptyTx(getTodayKey(), 'f1'))
    setTxModal(true)
  }
  const openEditTx = (t: Transaction) => {
    setEditingTx(t)
    setForm({ date: t.date, amount: t.amount, type: t.type, category: t.category, note: t.note ?? '' })
    setTxModal(true)
  }
  const saveTx = () => {
    if (!form.amount || form.amount <= 0) return
    if (editingTx) updateTransaction({ ...editingTx, ...form })
    else addTransaction({ id: Date.now().toString(), ...form })
    setTxModal(false)
  }

  const openAddCat = () => { setEditingCat(null); setCatForm(emptyCat()); setCatModal(true) }
  const openEditCat = (c: FinanceCategory) => { setEditingCat(c); setCatForm({ name: c.name, color: c.color, icon: c.icon, budget: c.budget }); setCatModal(true) }
  const saveCat = () => {
    if (!catForm.name.trim()) return
    if (editingCat) updateFinanceCategory({ ...editingCat, ...catForm })
    else addFinanceCategory({ id: `f${Date.now()}`, ...catForm })
    setCatModal(false)
  }

  const catFor = (id: string) => data.financeCategories.find(c => c.id === id)

  const stepPeriod = (dir: 1 | -1) => {
    setViewMonth(d => {
      if (period === 'quarter') return dir === 1 ? addQuarters(d, 1) : subQuarters(d, 1)
      if (period === 'year') return dir === 1 ? addYears(d, 1) : subYears(d, 1)
      return dir === 1 ? addMonths(d, 1) : subMonths(d, 1)
    })
  }

  const PERIODS: { id: Period; label: string }[] = [
    { id: 'month', label: 'Mes' },
    { id: 'quarter', label: 'Trimestre' },
    { id: 'year', label: 'Año' },
    { id: 'all', label: 'Todo' },
  ]

  return (
    <div className="page-content" style={{ padding: '32px 40px', maxWidth: 1200 }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="gradient-text-purple" style={{ fontSize: 28, fontWeight: 900, margin: 0 }}>FINANZAS</h1>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
            Controla tus ingresos, gastos y presupuestos
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          {period !== 'all' && (
            <>
              <button className="btn-ghost" onClick={() => stepPeriod(-1)} style={{ padding: '8px 12px' }}>‹</button>
              <span style={{ fontWeight: 700, fontSize: 14, minWidth: 130, textAlign: 'center' }}>
                {periodLabel}
              </span>
              <button className="btn-ghost" onClick={() => stepPeriod(1)} style={{ padding: '8px 12px' }}>›</button>
            </>
          )}
          {period === 'all' && (
            <span style={{ fontWeight: 700, fontSize: 14, minWidth: 130, textAlign: 'center' }}>{periodLabel}</span>
          )}
          <button className="btn-ghost" onClick={() => setCatModal(true)} style={{ fontSize: 13 }}>⚙️ Categorías</button>
          <button className="btn-primary" onClick={openAddTx}>+ Movimiento</button>
        </div>
      </div>

      {/* ── Selector de período + Análisis IA ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', gap: 6, background: 'rgba(255,255,255,0.04)', borderRadius: 99, padding: 4 }}>
          {PERIODS.map(p => (
            <button key={p.id} onClick={() => setPeriod(p.id)} style={{
              padding: '7px 16px', borderRadius: 99, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700,
              background: period === p.id ? 'var(--accent-purple)' : 'transparent',
              color: period === p.id ? 'white' : 'var(--text-secondary)',
              transition: 'all 0.15s',
            }}>{p.label}</button>
          ))}
        </div>
        <button className="btn-primary" onClick={() => setAiModal(true)} style={{ background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-teal))' }}>
          🤖 Análisis IA
        </button>
      </div>

      {/* ── Resumen ── */}
      <div className="grid-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 16 }}>
        <div className="card">
          <div className="section-label">INGRESOS</div>
          <div style={{ fontSize: 26, fontWeight: 900, color: 'var(--accent-teal)' }}>${fmt(income)}</div>
        </div>
        <div className="card">
          <div className="section-label">GASTOS</div>
          <div style={{ fontSize: 26, fontWeight: 900, color: 'var(--accent-coral)' }}>${fmt(expense)}</div>
        </div>
        <div className="card">
          <div className="section-label">BALANCE</div>
          <div style={{ fontSize: 26, fontWeight: 900, color: balance >= 0 ? 'var(--accent-teal)' : 'var(--accent-coral)' }}>
            {balance >= 0 ? '+' : '-'}${fmt(Math.abs(balance))}
          </div>
        </div>
        <div className="card">
          <div className="section-label">TASA DE AHORRO</div>
          <div style={{ fontSize: 26, fontWeight: 900, color: savingsRate >= 20 ? 'var(--accent-teal)' : savingsRate >= 0 ? 'var(--accent-gold)' : 'var(--accent-coral)' }}>
            {income > 0 ? `${savingsRate}%` : '—'}
          </div>
        </div>
      </div>

      {/* ── Métricas adicionales ── */}
      <div className="grid-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 16 }}>
        <div className="card">
          <div className="section-label">PROMEDIO DIARIO</div>
          <div style={{ fontSize: 22, fontWeight: 900 }}>${fmt(avgDaily)}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>en {daysInRange} días</div>
        </div>
        <div className="card">
          <div className="section-label">MAYOR GASTO INDIVIDUAL</div>
          {topExpenses.length > 0 ? (
            <>
              <div style={{ fontSize: 22, fontWeight: 900 }}>${fmt(topExpenses[0].amount)}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                {catFor(topExpenses[0].category)?.icon} {catFor(topExpenses[0].category)?.name} · {format(new Date(topExpenses[0].date + 'T12:00:00'), 'd MMM', { locale: es })}
              </div>
            </>
          ) : <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--text-muted)' }}>—</div>}
        </div>
        <div className="card">
          <div className="section-label">{projection !== null ? 'PROYECCIÓN FIN DE MES' : 'DÍA CON MÁS GASTO'}</div>
          {projection !== null ? (
            <>
              <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--accent-gold)' }}>${fmt(projection)}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>según tu ritmo actual</div>
            </>
          ) : topDay.total > 0 ? (
            <>
              <div style={{ fontSize: 22, fontWeight: 900 }}>{topDay.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>${fmt(topDay.total)} acumulado</div>
            </>
          ) : <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--text-muted)' }}>—</div>}
        </div>
      </div>

      {/* ── Charts ── */}
      <div className="grid-stats" style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 16, marginBottom: 16 }}>
        <div className="card">
          <div className="section-label">GASTOS POR CATEGORÍA</div>
          {byCatWithSpend.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={byCatWithSpend} dataKey="total" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
                  {byCatWithSpend.map((c, i) => <Cell key={i} fill={c.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'var(--bg-card-solid)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text-primary)', fontSize: 12 }} formatter={(v, n) => [`$${fmt(Number(v))}`, n]} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              Sin gastos registrados este mes
            </div>
          )}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
            {byCatWithSpend.map(c => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-secondary)' }}>
                <span style={{ width: 9, height: 9, borderRadius: '50%', background: c.color, display: 'inline-block' }} />
                {c.icon} {c.name}: ${fmt(c.total)}
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="section-label">TENDENCIA — ÚLTIMOS 6 MESES</div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={trend}>
              <XAxis dataKey="label" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: 'var(--bg-card-solid)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text-primary)', fontSize: 12 }} formatter={(v) => `$${fmt(Number(v))}`} />
              <Legend wrapperStyle={{ fontSize: 12, color: 'var(--text-secondary)' }} />
              <Bar dataKey="Ingresos" fill="var(--accent-teal)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Gastos" fill="var(--accent-coral)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Consejos IA ── */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="section-label">🤖 ASESOR FINANCIERO</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {tips.map((t, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, borderLeft: `3px solid ${toneColor[t.tone]}` }}>
              <span style={{ fontSize: 16 }}>{t.icon}</span>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{t.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Presupuestos por categoría ── */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="section-label">PRESUPUESTOS</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {byCat.map(c => {
            const pct = c.budget > 0 ? Math.min(100, Math.round((c.total / c.budget) * 100)) : 0
            return (
              <div key={c.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 5 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{c.icon} {c.name}</span>
                  <span style={{ fontWeight: 700, color: c.budget > 0 && c.total > c.budget ? 'var(--accent-coral)' : 'var(--text-primary)' }}>
                    ${fmt(c.total)} {c.budget > 0 ? `/ $${fmt(c.budget)}` : ''}
                  </span>
                </div>
                <div className="prog-track" style={{ height: 6 }}>
                  <div className="prog-fill" style={{ width: `${c.budget > 0 ? pct : Math.min(100, c.total > 0 ? 100 : 0)}%`, background: c.budget > 0 && c.total > c.budget ? 'var(--accent-coral)' : c.color }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Mayores gastos del período ── */}
      {topExpenses.length > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="section-label">MAYORES GASTOS DEL PERÍODO</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {topExpenses.map(t => {
              const c = catFor(t.category)
              return (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 9, borderLeft: `3px solid ${c?.color ?? '#888'}` }}>
                  <span style={{ fontSize: 16 }}>{c?.icon ?? '💸'}</span>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)', minWidth: 80 }}>{format(new Date(t.date + 'T12:00:00'), 'd MMM', { locale: es })}</span>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)', flex: 1 }}>{c?.name ?? '—'}{t.note ? ` · ${t.note}` : ''}</span>
                  <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--accent-coral)' }}>${fmt(t.amount)}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Historial del período ── */}
      <div className="card">
        <div className="section-label">MOVIMIENTOS {period === 'all' ? '(TODOS)' : `— ${periodLabel}`}</div>
        {periodTx.length === 0 ? (
          <div style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>
            Sin movimientos registrados en este período
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 420, overflowY: 'auto' }}>
            {periodTx.map(t => {
              const c = catFor(t.category)
              return (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 9, borderLeft: `3px solid ${c?.color ?? '#888'}` }}>
                  <span style={{ fontSize: 16 }}>{c?.icon ?? '💸'}</span>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)', minWidth: 80 }}>{format(new Date(t.date + 'T12:00:00'), 'd MMM', { locale: es })}</span>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)', minWidth: 110 }}>{c?.name ?? '—'}</span>
                  {t.note && <span style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic', flex: 1 }}>{t.note}</span>}
                  <span style={{ fontSize: 15, fontWeight: 800, marginLeft: 'auto', color: t.type === 'income' ? 'var(--accent-teal)' : 'var(--accent-coral)' }}>
                    {t.type === 'income' ? '+' : '-'}${fmt(t.amount)}
                  </span>
                  <button onClick={() => openEditTx(t)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 16, padding: '2px 3px' }}>✏️</button>
                  <button onClick={() => deleteTransaction(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-coral)', fontSize: 16, padding: '2px 3px', opacity: 0.7 }}>✕</button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Modal Movimiento ── */}
      {txModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(6px)' }}
          onClick={e => { if (e.target === e.currentTarget) setTxModal(false) }}>
          <div className="card" style={{ width: 420, padding: 28 }}>
            <h2 style={{ fontSize: 18, fontWeight: 900, marginBottom: 20 }}>
              {editingTx ? '✏️ Editar movimiento' : '+ Nuevo movimiento'}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* Tipo */}
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setForm(p => ({ ...p, type: 'expense', category: p.category === 'f8' ? 'f1' : p.category }))} style={{
                  flex: 1, padding: '9px', borderRadius: 9, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13,
                  background: form.type === 'expense' ? 'var(--accent-coral)' : 'rgba(255,255,255,0.06)',
                  color: form.type === 'expense' ? 'white' : 'var(--text-secondary)',
                }}>💸 Gasto</button>
                <button onClick={() => setForm(p => ({ ...p, type: 'income', category: 'f8' }))} style={{
                  flex: 1, padding: '9px', borderRadius: 9, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13,
                  background: form.type === 'income' ? 'var(--accent-teal)' : 'rgba(255,255,255,0.06)',
                  color: form.type === 'income' ? 'white' : 'var(--text-secondary)',
                }}>💵 Ingreso</button>
              </div>

              {/* Monto */}
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>MONTO</div>
                <input type="number" min={0} step="0.01" value={form.amount || ''} onChange={e => setForm(p => ({ ...p, amount: Number(e.target.value) }))}
                  placeholder="0.00" className="input-glass" />
              </div>

              {/* Fecha */}
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>FECHA</div>
                <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} className="input-glass" />
              </div>

              {/* Categoría */}
              {form.type === 'expense' && (
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>CATEGORÍA</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {expenseCats.map(c => (
                      <button key={c.id} onClick={() => setForm(p => ({ ...p, category: c.id }))} style={{
                        padding: '6px 12px', borderRadius: 99, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                        background: form.category === c.id ? c.color : 'rgba(255,255,255,0.06)',
                        color: form.category === c.id ? 'white' : 'var(--text-secondary)',
                        transition: 'all 0.1s',
                      }}>{c.icon} {c.name}</button>
                    ))}
                  </div>
                </div>
              )}

              {/* Nota */}
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>NOTA (opcional)</div>
                <input value={form.note} onChange={e => setForm(p => ({ ...p, note: e.target.value }))} placeholder="Detalle..." className="input-glass" />
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                {editingTx && (
                  <button onClick={() => { deleteTransaction(editingTx.id); setTxModal(false) }} style={{ background: 'rgba(255,80,80,0.1)', border: '1px solid rgba(255,80,80,0.3)', borderRadius: 9, padding: '0 14px', color: '#ff5050', cursor: 'pointer', fontSize: 13 }}>🗑</button>
                )}
                <button className="btn-ghost" onClick={() => setTxModal(false)} style={{ flex: 1 }}>Cancelar</button>
                <button className="btn-primary" onClick={saveTx} style={{ flex: 2 }}>
                  {editingTx ? '✓ Guardar cambios' : '+ Agregar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Categorías ── */}
      {catModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1001, backdropFilter: 'blur(6px)' }}
          onClick={e => { if (e.target === e.currentTarget) setCatModal(false) }}>
          <div className="card" style={{ width: 440, padding: 28, maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontSize: 18, fontWeight: 900, marginBottom: 20 }}>⚙️ Categorías de gasto</h2>

            {/* List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
              {data.financeCategories.map(c => (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: 10, borderLeft: `3px solid ${c.color}` }}>
                  <span style={{ fontSize: 18 }}>{c.icon}</span>
                  <span style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>{c.name}</span>
                  {c.budget > 0 && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>presup. ${fmt(c.budget)}</span>}
                  <button onClick={() => openEditCat(c)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: 'var(--text-secondary)', padding: '2px 4px' }}>✏️</button>
                  {c.id !== 'f8' && (
                    <button onClick={() => deleteFinanceCategory(c.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: 'var(--accent-coral)', padding: '2px 4px', opacity: 0.7 }}>✕</button>
                  )}
                </div>
              ))}
            </div>

            {/* Add/Edit form */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>{editingCat ? 'EDITAR CATEGORÍA' : 'NUEVA CATEGORÍA'}</div>
              <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                <input value={catForm.name} onChange={e => setCatForm(p => ({ ...p, name: e.target.value }))} placeholder="Nombre" className="input-glass" style={{ flex: 1 }} />
                <input type="number" min={0} value={catForm.budget || ''} onChange={e => setCatForm(p => ({ ...p, budget: Number(e.target.value) }))} placeholder="Presupuesto" className="input-glass" style={{ width: 130 }} />
              </div>
              <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 10 }}>
                {ICONS.map(ic => (
                  <button key={ic} onClick={() => setCatForm(p => ({ ...p, icon: ic }))} style={{ width: 34, height: 34, borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 16, background: catForm.icon === ic ? 'rgba(124,111,255,0.3)' : 'rgba(255,255,255,0.05)', outline: catForm.icon === ic ? '2px solid var(--accent-purple)' : 'none' }}>{ic}</button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
                {COLORS.map(c => (
                  <button key={c} onClick={() => setCatForm(p => ({ ...p, color: c }))} style={{ width: 26, height: 26, borderRadius: '50%', background: c, border: catForm.color === c ? '3px solid white' : '3px solid transparent', cursor: 'pointer', boxShadow: catForm.color === c ? `0 0 10px ${c}` : 'none' }} />
                ))}
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                {editingCat && (
                  <button onClick={() => { setEditingCat(null); setCatForm(emptyCat()) }} className="btn-ghost" style={{ flex: 1 }}>Cancelar</button>
                )}
                <button className="btn-primary" onClick={saveCat} style={{ flex: 1 }}>{editingCat ? 'Guardar' : '+ Agregar'}</button>
              </div>
            </div>

            <button onClick={() => setCatModal(false)} className="btn-ghost" style={{ width: '100%', marginTop: 16 }}>Cerrar</button>
          </div>
        </div>
      )}

      {/* ── Modal Análisis IA ── */}
      {aiModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1002, backdropFilter: 'blur(6px)' }}
          onClick={e => { if (e.target === e.currentTarget) setAiModal(false) }}>
          <div className="card" style={{ width: 560, padding: 28, maxHeight: '88vh', overflowY: 'auto' }}>
            <h2 className="gradient-text-purple" style={{ fontSize: 20, fontWeight: 900, marginBottom: 4 }}>🤖 Análisis IA</h2>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>{periodLabel}</div>

            {/* Resumen */}
            <div style={{ marginBottom: 20 }}>
              <div className="section-label">RESUMEN DEL PERÍODO</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                Ingresos de <strong style={{ color: 'var(--accent-teal)' }}>${fmt(income)}</strong> y gastos de <strong style={{ color: 'var(--accent-coral)' }}>${fmt(expense)}</strong>,
                {' '}dejando un balance {balance >= 0 ? 'positivo' : 'negativo'} de <strong style={{ color: balance >= 0 ? 'var(--accent-teal)' : 'var(--accent-coral)' }}>${fmt(Math.abs(balance))}</strong>
                {income > 0 ? ` (tasa de ahorro del ${savingsRate}%).` : '.'}
                {' '}Promedio diario de gasto: <strong>${fmt(avgDaily)}</strong> en {daysInRange} días{periodTx.length > 0 ? `, con ${periodTx.length} movimientos registrados.` : '.'}
              </div>
            </div>

            {/* Categorías principales */}
            {catTrend.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div className="section-label">CATEGORÍAS PRINCIPALES</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {catTrend.slice(0, 5).map(c => (
                    <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
                      <span>{c.icon}</span>
                      <span style={{ flex: 1 }}>{c.name}</span>
                      <span style={{ fontWeight: 700 }}>${fmt(c.total)}</span>
                      {prevRange && (
                        <span style={{ fontSize: 12, color: c.diff > 0 ? 'var(--accent-coral)' : c.diff < 0 ? 'var(--accent-teal)' : 'var(--text-muted)', minWidth: 60, textAlign: 'right' }}>
                          {c.prev > 0 ? `${c.diff > 0 ? '+' : ''}${c.diff}%` : 'nuevo'}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Mayores gastos individuales */}
            {topExpenses.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div className="section-label">MAYORES GASTOS INDIVIDUALES</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {topExpenses.slice(0, 3).map(t => {
                    const c = catFor(t.category)
                    return (
                      <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
                        <span>{c?.icon}</span>
                        <span style={{ flex: 1 }}>{c?.name}{t.note ? ` · ${t.note}` : ''}</span>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{format(new Date(t.date + 'T12:00:00'), 'd MMM', { locale: es })}</span>
                        <span style={{ fontWeight: 700, color: 'var(--accent-coral)' }}>${fmt(t.amount)}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Patrón semanal */}
            {expense > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div className="section-label">PATRÓN SEMANAL DE GASTO</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {byDayOfWeek.filter(d => d.total > 0).sort((a, b) => b.total - a.total).map(d => {
                    const pct = Math.round((d.total / expense) * 100)
                    return (
                      <div key={d.name}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 2 }}>
                          <span>{d.name}</span>
                          <span>${fmt(d.total)} ({pct}%)</span>
                        </div>
                        <div className="prog-track" style={{ height: 4 }}>
                          <div className="prog-fill" style={{ width: `${pct}%`, background: 'var(--accent-purple)' }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Recomendaciones */}
            <div style={{ marginBottom: 8 }}>
              <div className="section-label">RECOMENDACIONES</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {tips.map((t, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, borderLeft: `3px solid ${toneColor[t.tone]}` }}>
                    <span style={{ fontSize: 16 }}>{t.icon}</span>
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{t.text}</span>
                  </div>
                ))}
              </div>
            </div>

            <button onClick={() => setAiModal(false)} className="btn-ghost" style={{ width: '100%', marginTop: 16 }}>Cerrar</button>
          </div>
        </div>
      )}
    </div>
  )
}
