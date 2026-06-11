'use client'
import { useState } from 'react'
import { useAppData, FinanceCategory, Transaction } from '@/lib/store'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { format, subMonths, addMonths } from 'date-fns'
import { es } from 'date-fns/locale'

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
  const [txModal, setTxModal] = useState(false)
  const [editingTx, setEditingTx] = useState<Transaction | null>(null)
  const [form, setForm] = useState(emptyTx(new Date().toISOString().split('T')[0], 'f1'))

  const [catModal, setCatModal] = useState(false)
  const [editingCat, setEditingCat] = useState<FinanceCategory | null>(null)
  const [catForm, setCatForm] = useState(emptyCat())

  if (!loaded) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <div className="gradient-text-purple" style={{ fontSize: 26, fontWeight: 900, letterSpacing: 2 }}>CARGANDO...</div>
    </div>
  )

  const monthKey = format(viewMonth, 'yyyy-MM')
  const monthTx  = data.transactions.filter(t => t.date.startsWith(monthKey)).sort((a, b) => b.date.localeCompare(a.date))

  const income  = monthTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const expense = monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const balance = income - expense
  const savingsRate = income > 0 ? Math.round((balance / income) * 100) : 0

  // ── Gastos por categoría (mes actual) ──
  const expenseCats = data.financeCategories.filter(c => c.id !== 'f8')
  const byCat = expenseCats.map(c => ({
    ...c,
    total: monthTx.filter(t => t.type === 'expense' && t.category === c.id).reduce((s, t) => s + t.amount, 0),
  }))
  const byCatWithSpend = byCat.filter(c => c.total > 0)

  // ── Tendencia últimos 6 meses ──
  const trend = Array.from({ length: 6 }, (_, i) => {
    const d = subMonths(viewMonth, 5 - i)
    const k = format(d, 'yyyy-MM')
    const txs = data.transactions.filter(t => t.date.startsWith(k))
    return {
      label: format(d, 'MMM', { locale: es }),
      Ingresos: txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
      Gastos:   txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
    }
  })

  // ── Mes anterior (para comparativas) ──
  const prevKey = format(subMonths(viewMonth, 1), 'yyyy-MM')
  const prevTx  = data.transactions.filter(t => t.date.startsWith(prevKey))
  const prevExpense = prevTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)

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
      tips.push({ icon: '🔍', tone: 'info', text: `"${top.name}" es tu mayor gasto: ${fmt(top.total)} (${pctOfTotal}% del total del mes).` })
    }
  }

  // Comparación vs mes anterior
  if (prevExpense > 0) {
    const diffPct = Math.round(((expense - prevExpense) / prevExpense) * 100)
    if (diffPct >= 15) tips.push({ icon: '📈', tone: 'warn', text: `Gastaste ${diffPct}% más que el mes pasado (${fmt(expense)} vs ${fmt(prevExpense)}).` })
    else if (diffPct <= -15) tips.push({ icon: '🎉', tone: 'good', text: `¡Bien! Gastaste ${Math.abs(diffPct)}% menos que el mes pasado.` })
  }

  // Tasa de ahorro
  if (income > 0) {
    if (savingsRate >= 20) tips.push({ icon: '💎', tone: 'good', text: `Tu tasa de ahorro es ${savingsRate}%. ¡Vas muy bien (la meta recomendada es 20%)!` })
    else if (savingsRate >= 0) tips.push({ icon: '🎯', tone: 'warn', text: `Tu tasa de ahorro es ${savingsRate}%. Intenta llegar al 20% recortando gastos pequeños.` })
    else tips.push({ icon: '🆘', tone: 'bad', text: `Estás gastando más de lo que ingresa (${fmt(Math.abs(balance))} de déficit). Revisa tus gastos variables.` })
  } else if (monthTx.length > 0) {
    tips.push({ icon: '💵', tone: 'info', text: `Aún no registras ingresos este mes. Agrégalos para calcular tu tasa de ahorro.` })
  }

  // Categorías con gasto pero sin presupuesto
  byCatWithSpend.filter(c => c.budget === 0).forEach(c => {
    tips.push({ icon: '🧮', tone: 'info', text: `"${c.name}" no tiene presupuesto. Sugerencia: define uno cercano a ${fmt(Math.ceil(c.total / 10) * 10)} basado en tu gasto actual.` })
  })

  if (tips.length === 0) {
    tips.push({ icon: '✨', tone: 'info', text: 'Registra tus gastos e ingresos del mes para recibir consejos personalizados.' })
  }

  const toneColor = { good: 'var(--accent-teal)', warn: 'var(--accent-gold)', bad: 'var(--accent-coral)', info: 'var(--accent-purple)' }

  // ── Modal helpers ──
  const openAddTx = () => {
    setEditingTx(null)
    setForm(emptyTx(new Date().toISOString().split('T')[0], 'f1'))
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
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button className="btn-ghost" onClick={() => setViewMonth(d => subMonths(d, 1))} style={{ padding: '8px 12px' }}>‹</button>
          <span style={{ fontWeight: 700, fontSize: 14, minWidth: 130, textAlign: 'center' }}>
            {format(viewMonth, 'MMMM yyyy', { locale: es }).toUpperCase()}
          </span>
          <button className="btn-ghost" onClick={() => setViewMonth(d => addMonths(d, 1))} style={{ padding: '8px 12px' }}>›</button>
          <button className="btn-ghost" onClick={() => setCatModal(true)} style={{ fontSize: 13 }}>⚙️ Categorías</button>
          <button className="btn-primary" onClick={openAddTx}>+ Movimiento</button>
        </div>
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

      {/* ── Historial del mes ── */}
      <div className="card">
        <div className="section-label">MOVIMIENTOS DEL MES</div>
        {monthTx.length === 0 ? (
          <div style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>
            Sin movimientos registrados este mes
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {monthTx.map(t => {
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
    </div>
  )
}
