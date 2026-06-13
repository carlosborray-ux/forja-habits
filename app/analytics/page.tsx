'use client'
import { useAppData, getDayScore, getTodayKey, getDateKey } from '@/lib/store'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, Cell, ScatterChart, Scatter, LineChart, Line, Area, AreaChart } from 'recharts'
import { format, eachDayOfInterval, subDays } from 'date-fns'
import { es } from 'date-fns/locale'

export default function AnalyticsPage() {
  const { data } = useAppData()

  const last30 = eachDayOfInterval({ start: subDays(new Date(), 29), end: new Date() }).map(d => {
    const key = getDateKey(d)
    const journal = data.journal[key]
    return {
      key,
      day: format(d, 'dd', { locale: es }),
      score: getDayScore(data.habits, key),
      mood: journal?.mood ?? null,
      energy: journal?.energy ?? null,
    }
  })

  const scored = last30.filter(d => d.score > 0)
  const avgScore    = scored.length > 0 ? Math.round(scored.reduce((s, d) => s + d.score, 0) / scored.length) : 0
  const perfectDays = last30.filter(d => d.score === 100).length
  const bestDay     = [...scored].sort((a, b) => b.score - a.score)[0]
  const streak7Days = last30.slice(-7).every(d => d.score > 0) ? '7 días activo' : null

  // Radar
  const radarData = data.categories.filter(cat => data.habits.some(h => h.category === cat.id)).map(cat => {
    const hs = data.habits.filter(h => h.category === cat.id)
    let done = 0
    last30.forEach(d => hs.forEach(h => { if (h.completedDays[d.key]) done++ }))
    return { cat: cat.name, value: Math.round((done / (hs.length * 30)) * 100) }
  })

  // Habit consistency
  const habitStats = data.habits.map(h => {
    const done = last30.filter(d => h.completedDays[d.key]).length
    return { ...h, done, pct: Math.round(done / 30 * 100) }
  }).sort((a, b) => b.pct - a.pct)

  // Mood vs Score correlation
  const correlationData = last30.filter(d => d.mood !== null && d.score > 0).map(d => ({
    mood: (d.mood ?? 0) + 1,
    score: d.score,
    day: d.day,
  }))

  // Energy trend
  const energyData = last30.filter(d => d.energy !== null).map(d => ({
    day: d.day,
    energy: ((d.energy ?? 0) + 1),
    score: d.score,
  }))

  // Heat map 84 days
  const heatDays = eachDayOfInterval({ start: subDays(new Date(), 83), end: new Date() })
  const todayKey = getTodayKey()

  // Best day of week
  const byDow: Record<number, number[]> = {}
  last30.forEach(d => {
    const dow = new Date(d.key + 'T12:00').getDay()
    if (!byDow[dow]) byDow[dow] = []
    byDow[dow].push(d.score)
  })
  const dowLabels = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
  const dowData = Object.entries(byDow).map(([dow, scores]) => ({
    day: dowLabels[Number(dow)],
    avg: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
  })).sort((a, b) => dowLabels.indexOf(a.day) - dowLabels.indexOf(b.day))

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1100 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 900, margin: 0 }} className="gradient-text-purple">ANALYTICS</h1>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>Inteligencia de tus últimos 30 días</div>
      </div>

      {/* KPIs */}
      <div className="grid-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
        {[
          { label: 'PROMEDIO 30D',    value: `${avgScore}%`,            color: 'var(--accent-purple)', icon: '📈' },
          { label: 'DÍAS PERFECTOS',  value: String(perfectDays),        color: 'var(--accent-gold)',   icon: '💎' },
          { label: 'MEJOR DÍA',       value: bestDay ? `${bestDay.score}%` : '—', color: 'var(--accent-teal)',   icon: '🏆' },
          { label: 'DÍAS ACTIVOS',    value: `${scored.length}/30`,      color: 'var(--accent-blue)',   icon: '⚡' },
        ].map(s => (
          <div key={s.label} className="card" style={{ textAlign: 'center', padding: '18px 12px' }}>
            <div style={{ fontSize: 24, marginBottom: 6 }}>{s.icon}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 26, fontWeight: 900, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Score + Radar */}
      <div className="grid-stats" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 16 }}>
        <div className="card">
          <div className="section-label">SCORE DIARIO — 30 DÍAS</div>
          <ResponsiveContainer width="100%" height={190}>
            <AreaChart data={last30}>
              <defs>
                <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="var(--accent-purple)" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="var(--accent-purple)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} interval={4} />
              <YAxis domain={[0, 100]} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'var(--bg-card-solid)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text-primary)', fontSize: 12 }} formatter={(v) => [`${v}%`, 'Score']} />
              <Area type="monotone" dataKey="score" stroke="var(--accent-purple)" strokeWidth={2} fill="url(#scoreGrad)" dot={false} activeDot={{ r: 5, fill: 'var(--accent-purple)' }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <div className="section-label">RADAR CATEGORÍAS</div>
          <ResponsiveContainer width="100%" height={190}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(255,255,255,0.07)" />
              <PolarAngleAxis dataKey="cat" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
              <Radar dataKey="value" stroke="var(--accent-teal)" fill="var(--accent-teal)" fillOpacity={0.2} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Mejor día semana + Mood correlation */}
      <div className="grid-stats" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div className="card">
          <div className="section-label">📅 MEJOR DÍA DE LA SEMANA</div>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={dowData} barSize={28}>
              <XAxis dataKey="day" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'var(--bg-card-solid)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text-primary)', fontSize: 12 }} formatter={(v) => [`${v}%`, 'Promedio']} />
              <Bar dataKey="avg" radius={[6, 6, 0, 0]}>
                {dowData.map((d, i) => <Cell key={i} fill={d.avg === Math.max(...dowData.map(x => x.avg)) ? 'var(--accent-gold)' : 'var(--accent-purple)'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <div className="section-label">😊 MOOD vs SCORE (correlación)</div>
          {correlationData.length > 2 ? (
            <ResponsiveContainer width="100%" height={150}>
              <ScatterChart>
                <XAxis dataKey="mood" name="Mood" type="number" domain={[1, 6]} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} label={{ value: 'Mood →', position: 'insideRight', fill: 'var(--text-muted)', fontSize: 10 }} />
                <YAxis dataKey="score" name="Score" type="number" domain={[0, 100]} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: 'var(--bg-card-solid)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text-primary)', fontSize: 12 }} cursor={{ strokeDasharray: '3 3' }} formatter={(v, name) => [name === 'Score' ? `${v}%` : v, name]} />
                <Scatter data={correlationData} fill="var(--accent-pink)" opacity={0.8} />
              </ScatterChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 150, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              Necesitas más entradas de journal para ver correlaciones
            </div>
          )}
        </div>
      </div>

      {/* Heat map */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="section-label">HEAT MAP — 12 SEMANAS</div>
        <div className="habits-scroll" style={{ display: 'grid', gridTemplateColumns: 'repeat(84, 1fr)', gap: 3, minWidth: 480 }}>
          {heatDays.map(d => {
            const key = getDateKey(d)
            const s   = getDayScore(data.habits, key)
            return (
              <div key={key} title={`${format(d, 'dd MMM', { locale: es })}: ${s}%`} style={{
                aspectRatio: '1', borderRadius: 2, cursor: 'default',
                background: s === 0 ? 'rgba(255,255,255,0.05)'
                  : s >= 80 ? 'var(--accent-teal)'
                  : s >= 50 ? 'var(--accent-purple)'
                  : 'rgba(124,111,255,0.35)',
                outline: key === todayKey ? '2px solid var(--accent-gold)' : 'none',
                boxShadow: s >= 80 ? '0 0 4px rgba(0,229,184,0.5)' : 'none',
              }} />
            )
          })}
        </div>
        <div style={{ display: 'flex', gap: 16, marginTop: 10, fontSize: 11, color: 'var(--text-muted)', alignItems: 'center' }}>
          <span>Menos</span>
          {['rgba(255,255,255,0.05)', 'rgba(124,111,255,0.35)', 'var(--accent-purple)', 'var(--accent-teal)'].map((c, i) => (
            <span key={i} style={{ width: 12, height: 12, borderRadius: 3, background: c, display: 'inline-block' }} />
          ))}
          <span>Más</span>
        </div>
      </div>

      {/* Habit table */}
      <div className="card">
        <div className="section-label">CONSISTENCIA POR HÁBITO — 30 DÍAS</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {habitStats.map((h, i) => (
            <div key={h.id} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 22, fontSize: 13, color: 'var(--text-muted)', textAlign: 'right' }}>#{i+1}</div>
              <div style={{ width: 170, fontSize: 13, color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{h.name}</div>
              <div style={{ flex: 1 }}>
                <div className="prog-track" style={{ height: 8 }}>
                  <div className="prog-fill" style={{ width: `${h.pct}%`, background: h.pct >= 80 ? 'var(--accent-teal)' : h.pct >= 50 ? h.color : 'rgba(255,255,255,0.15)', boxShadow: h.pct >= 80 ? `0 0 8px rgba(0,229,184,0.4)` : 'none' }} />
                </div>
              </div>
              <div style={{ width: 44, textAlign: 'right', fontWeight: 700, fontSize: 13, color: h.pct >= 80 ? 'var(--accent-teal)' : h.pct >= 50 ? 'var(--text-primary)' : 'var(--text-muted)' }}>{h.pct}%</div>
              <div style={{ width: 36, textAlign: 'right', fontSize: 12, color: 'var(--text-muted)' }}>{h.done}/30</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
