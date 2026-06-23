'use client'
import { useState } from 'react'
import { useAppData, Task, TaskList, SubTask, getTodayKey, fmt12 } from '@/lib/store'
import {
  format, addDays, isToday, isTomorrow, isPast,
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth,
  addMonths, subMonths,
} from 'date-fns'
import { es } from 'date-fns/locale'
import TimeSelect from '@/components/TimeSelect'
import { celebrate } from '@/lib/celebrate'

type View = 'today' | 'upcoming' | 'all' | 'completed' | 'calendar' | string // string = listId

const ICONS  = ['📥','💼','🏠','🛒','🎯','📚','💡','✈️','🩺','🐶','🎮','💰','🎓','🧹','🔧','📞','🎨','🌱']
const COLORS = ['#7C6FFF','#00E5B8','#FF6B6B','#FFD93D','#4FC3F7','#FF4FA3','#FF8C00','#9B59B6','#2ECC71','#E74C3C']

const PRIORITIES: { id: 0 | 1 | 2 | 3; label: string; color: string }[] = [
  { id: 3, label: 'Alta',    color: 'var(--accent-coral)' },
  { id: 2, label: 'Media',   color: 'var(--accent-gold)' },
  { id: 1, label: 'Baja',    color: 'var(--accent-teal)' },
  { id: 0, label: 'Ninguna', color: 'var(--text-muted)' },
]
const priorityColor = (p: number) => PRIORITIES.find(x => x.id === p)?.color ?? 'var(--text-muted)'

const RECURRING: { id: 'none' | 'daily' | 'weekly' | 'monthly'; label: string }[] = [
  { id: 'none',    label: 'No se repite' },
  { id: 'daily',   label: 'Diario' },
  { id: 'weekly',  label: 'Semanal' },
  { id: 'monthly', label: 'Mensual' },
]

const emptyList = (): Omit<TaskList, 'id'> => ({ name: '', color: COLORS[0], icon: ICONS[0] })

const emptyTask = (listId: string): Omit<Task, 'id' | 'createdAt'> => ({
  title: '', notes: '', listId, dueDate: undefined, priority: 0, completed: false, subtasks: [], recurring: 'none',
  recurringDays: [], startTime: undefined, endTime: undefined,
})

const WEEKDAYS = [
  { id: 1, label: 'L' }, { id: 2, label: 'M' }, { id: 3, label: 'X' }, { id: 4, label: 'J' },
  { id: 5, label: 'V' }, { id: 6, label: 'S' }, { id: 0, label: 'D' },
]

function dueLabel(dateStr?: string) {
  if (!dateStr) return null
  const d = new Date(dateStr + 'T12:00:00')
  if (isToday(d)) return { text: 'Hoy', color: 'var(--accent-gold)' }
  if (isTomorrow(d)) return { text: 'Mañana', color: 'var(--accent-teal)' }
  if (isPast(d)) return { text: format(d, 'd MMM', { locale: es }), color: 'var(--accent-coral)' }
  return { text: format(d, 'd MMM', { locale: es }), color: 'var(--text-secondary)' }
}

function durationLabel(start?: string, end?: string) {
  if (!start || !end) return null
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  let mins = (eh * 60 + em) - (sh * 60 + sm)
  if (mins < 0) mins += 24 * 60
  const h = Math.floor(mins / 60), m = mins % 60
  if (h > 0) return m > 0 ? `${h}h ${m}m` : `${h}h`
  return `${m}m`
}

function gcalLink(t: Task) {
  if (!t.dueDate) return null
  const dateCompact = t.dueDate.replace(/-/g, '')
  let dates: string
  if (t.startTime && t.endTime) {
    dates = `${dateCompact}T${t.startTime.replace(':', '')}00/${dateCompact}T${t.endTime.replace(':', '')}00`
  } else {
    const endCompact = format(addDays(new Date(t.dueDate + 'T12:00:00'), 1), 'yyyyMMdd')
    dates = `${dateCompact}/${endCompact}`
  }
  const params = new URLSearchParams({ action: 'TEMPLATE', text: t.title, dates, details: t.notes ?? '' })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

function nextDate(dateStr: string, recurring: string, recurringDays?: number[]): string {
  const d = new Date(dateStr + 'T12:00:00')
  if (recurring === 'daily') {
    if (recurringDays && recurringDays.length > 0) {
      for (let i = 1; i <= 7; i++) {
        const nd = addDays(d, i)
        if (recurringDays.includes(nd.getDay())) return format(nd, 'yyyy-MM-dd')
      }
    }
    return format(addDays(d, 1), 'yyyy-MM-dd')
  }
  if (recurring === 'weekly') {
    if (recurringDays && recurringDays.length > 0) {
      for (let i = 1; i <= 7; i++) {
        const nd = addDays(d, i)
        if (recurringDays.includes(nd.getDay())) return format(nd, 'yyyy-MM-dd')
      }
    }
    return format(addDays(d, 7), 'yyyy-MM-dd')
  }
  if (recurring === 'monthly') {
    const nd = new Date(d)
    nd.setMonth(nd.getMonth() + 1)
    return format(nd, 'yyyy-MM-dd')
  }
  return dateStr
}

export default function TareasPage() {
  const {
    data, loaded,
    addTask, updateTask, deleteTask, toggleTask, toggleSubtask,
    addTaskList, updateTaskList, deleteTaskList,
  } = useAppData()

  const [view, setView] = useState<View>('today')
  const [quickTitle, setQuickTitle] = useState('')
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const [taskModal, setTaskModal] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [form, setForm] = useState(emptyTask('t1'))
  const [newSubtask, setNewSubtask] = useState('')

  const [listModal, setListModal] = useState(false)
  const [editingList, setEditingList] = useState<TaskList | null>(null)
  const [listForm, setListForm] = useState(emptyList())

  const [planQueue, setPlanQueue] = useState<Task[] | null>(null)
  const [planIndex, setPlanIndex] = useState(0)

  const [calendarMonth, setCalendarMonth] = useState(new Date())
  const [calendarDay, setCalendarDay] = useState<string | null>(null)
  const [calendarQuickTitle, setCalendarQuickTitle] = useState('')

  if (!loaded) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <div className="gradient-text-purple" style={{ fontSize: 26, fontWeight: 900, letterSpacing: 2 }}>CARGANDO...</div>
    </div>
  )

  const listFor = (id: string) => data.taskLists.find(l => l.id === id)
  const pending = data.tasks.filter(t => !t.completed)

  const today = new Date()
  const todayStr = getTodayKey()
  const todayTasks    = pending.filter(t => t.dueDate && t.dueDate <= todayStr)
  const upcomingTasks = pending.filter(t => t.dueDate && t.dueDate > todayStr)
  const somedayTasks  = pending.filter(t => !t.dueDate)
  const completedTasks = data.tasks.filter(t => t.completed).sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''))

  const sortTasks = (arr: Task[]) => [...arr].sort((a, b) => {
    if (a.dueDate !== b.dueDate) {
      if (!a.dueDate) return 1
      if (!b.dueDate) return -1
      return a.dueDate.localeCompare(b.dueDate)
    }
    return b.priority - a.priority
  })

  let title = ''
  let visibleTasks: Task[] = []
  if (view === 'today') { title = 'HOY'; visibleTasks = sortTasks(todayTasks) }
  else if (view === 'upcoming') { title = 'PRÓXIMOS DÍAS'; visibleTasks = sortTasks(upcomingTasks) }
  else if (view === 'someday') { title = 'ALGÚN DÍA'; visibleTasks = sortTasks(somedayTasks) }
  else if (view === 'all') { title = 'TODAS LAS TAREAS'; visibleTasks = sortTasks(pending) }
  else if (view === 'completed') { title = 'COMPLETADAS'; visibleTasks = completedTasks }
  else { title = (listFor(view)?.icon ?? '') + ' ' + (listFor(view)?.name ?? '').toUpperCase(); visibleTasks = sortTasks(pending.filter(t => t.listId === view)) }

  // ── Helpers de modal ──
  const openAddTask = () => {
    setEditingTask(null)
    setForm(emptyTask(data.taskLists.some(l => l.id === view) ? view : (data.taskLists[0]?.id ?? 't1')))
    setNewSubtask('')
    setTaskModal(true)
  }
  const openEditTask = (t: Task) => {
    setEditingTask(t)
    setForm({ title: t.title, notes: t.notes ?? '', listId: t.listId, dueDate: t.dueDate, priority: t.priority, completed: t.completed, subtasks: t.subtasks, recurring: t.recurring ?? 'none', recurringDays: t.recurringDays ?? [], startTime: t.startTime, endTime: t.endTime })
    setNewSubtask('')
    setTaskModal(true)
  }
  const saveTask = () => {
    if (!form.title.trim()) return
    if (editingTask) updateTask({ ...editingTask, ...form })
    else addTask({ id: Date.now().toString(), createdAt: new Date().toISOString(), ...form })
    setTaskModal(false)
  }
  const addQuick = () => {
    if (!quickTitle.trim()) return
    const listId = (typeof view === 'string' && data.taskLists.some(l => l.id === view)) ? view : (data.taskLists[0]?.id ?? 't1')
    const quickDate = view === 'someday' ? undefined : view === 'today' ? todayStr : undefined
    addTask({ id: Date.now().toString(), createdAt: new Date().toISOString(), title: quickTitle.trim(), notes: '', listId, dueDate: quickDate, priority: 0, completed: false, subtasks: [], recurring: 'none' })
    setQuickTitle('')
  }

  const handleToggle = (t: Task) => {
    if (!t.completed) celebrate('task')
    if (!t.completed && t.recurring && t.recurring !== 'none' && t.dueDate) {
      // Tarea recurrente: en vez de completarla, la reprograma a la próxima fecha
      updateTask({ ...t, dueDate: nextDate(t.dueDate, t.recurring, t.recurringDays) })
    } else {
      toggleTask(t.id)
    }
  }

  const postpone = (t: Task, dueDate?: string) => updateTask({ ...t, dueDate })

  // ── Plan my day ──
  const startPlanMyDay = () => {
    if (visibleTasks.length === 0) return
    setPlanQueue(visibleTasks)
    setPlanIndex(0)
  }
  const planAdvance = () => {
    if (!planQueue) return
    if (planIndex + 1 >= planQueue.length) { setPlanQueue(null); setPlanIndex(0) }
    else setPlanIndex(i => i + 1)
  }
  const planCurrent = planQueue?.[planIndex] ?? null

  // ── Calendario ──
  const calStart = startOfWeek(startOfMonth(calendarMonth), { weekStartsOn: 1 })
  const calEnd   = endOfWeek(endOfMonth(calendarMonth), { weekStartsOn: 1 })
  const calDays  = eachDayOfInterval({ start: calStart, end: calEnd })
  const tasksForDay = (d: Date) => {
    const k = format(d, 'yyyy-MM-dd')
    return data.tasks.filter(t => t.dueDate === k)
  }

  const addSubtaskToForm = () => {
    if (!newSubtask.trim()) return
    setForm(p => ({ ...p, subtasks: [...p.subtasks, { id: Date.now().toString(), title: newSubtask.trim(), done: false }] }))
    setNewSubtask('')
  }
  const removeSubtaskFromForm = (id: string) => setForm(p => ({ ...p, subtasks: p.subtasks.filter(s => s.id !== id) }))
  const toggleSubtaskInForm = (id: string) => setForm(p => ({ ...p, subtasks: p.subtasks.map(s => s.id === id ? { ...s, done: !s.done } : s) }))

  // ── Render de una tarjeta de tarea ──
  const renderTask = (t: Task) => {
    const list = listFor(t.listId)
    const due = dueLabel(t.dueDate)
    const isExpanded = expanded[t.id] !== false
    const subDone = t.subtasks.filter(s => s.done).length
    const duration = durationLabel(t.startTime, t.endTime)
    const gcal = gcalLink(t)
    return (
      <div key={t.id} className="card" style={{ padding: '12px 14px', borderLeft: `3px solid ${list?.color ?? '#888'}` }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <button onClick={() => handleToggle(t)} style={{
            width: 20, height: 20, borderRadius: '50%', border: `2px solid ${priorityColor(t.priority)}`,
            background: t.completed ? priorityColor(t.priority) : 'transparent', cursor: 'pointer', flexShrink: 0, marginTop: 2,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: 'white', padding: 0,
          }}>{t.completed ? '✓' : ''}</button>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{
                fontSize: 14, fontWeight: 600,
                textDecoration: t.completed ? 'line-through' : 'none',
                color: t.completed ? 'var(--text-muted)' : 'var(--text-primary)',
              }}>{t.title}</span>
              {t.recurring && t.recurring !== 'none' && <span title="Recurrente" style={{ fontSize: 12 }}>🔁</span>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4, flexWrap: 'wrap' }}>
              {view !== t.listId && (
                <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  {list?.icon} {list?.name}
                </span>
              )}
              {due && <span style={{ fontSize: 11, fontWeight: 700, color: due.color }}>📅 {due.text}</span>}
              {(t.startTime || t.endTime) && (
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  🕐 {t.startTime ? fmt12(t.startTime) : '?'}{t.endTime ? ` – ${fmt12(t.endTime)}` : ''}{duration ? ` (${duration})` : ''}
                </span>
              )}
              {gcal && (
                <a href={gcal} target="_blank" rel="noopener noreferrer" title="Agregar a Google Calendar" style={{ fontSize: 11, color: 'var(--accent-blue)', textDecoration: 'none' }}>
                  🗓️ Calendar
                </a>
              )}
              {t.priority > 0 && (
                <span style={{ fontSize: 11, fontWeight: 700, color: priorityColor(t.priority) }}>
                  {PRIORITIES.find(p => p.id === t.priority)?.label}
                </span>
              )}
              {t.subtasks.length > 0 && (
                <button onClick={() => setExpanded(p => ({ ...p, [t.id]: !p[t.id] }))} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: 'var(--text-muted)', padding: 0 }}>
                  ☑ {subDone}/{t.subtasks.length} {isExpanded ? '▲' : '▼'}
                </button>
              )}
            </div>
            {t.notes && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, fontStyle: 'italic' }}>{t.notes}</div>}
            {isExpanded && t.subtasks.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 }}>
                {t.subtasks.map(s => (
                  <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: s.done ? 'var(--text-muted)' : 'var(--text-secondary)', cursor: 'pointer' }}>
                    <input type="checkbox" checked={s.done} onChange={() => toggleSubtask(t.id, s.id)} />
                    <span style={{ textDecoration: s.done ? 'line-through' : 'none' }}>{s.title}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
            {!t.completed && (
              <>
                <button onClick={() => postpone(t, format(addDays(new Date(), 1), 'yyyy-MM-dd'))} title="Posponer a mañana" style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 99, cursor: 'pointer', fontSize: 11, color: 'var(--text-muted)', padding: '4px 8px' }}>→ Mañana</button>
                <button onClick={() => postpone(t, format(addDays(new Date(), 7), 'yyyy-MM-dd'))} title="Posponer 1 semana" style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 99, cursor: 'pointer', fontSize: 11, color: 'var(--text-muted)', padding: '4px 8px' }}>+1 sem</button>
              </>
            )}
            <button onClick={() => openEditTask(t)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 15, color: 'var(--text-secondary)', padding: '2px 4px' }}>✏️</button>
            <button onClick={() => deleteTask(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 15, color: 'var(--accent-coral)', padding: '2px 4px', opacity: 0.7 }}>✕</button>
          </div>
        </div>
      </div>
    )
  }

  // ── Agrupación por día para vista "Próximos" ──
  const upcomingGroups = () => {
    const dates = [...new Set(upcomingTasks.map(t => t.dueDate!))].sort()
    return dates.map(k => {
      const d = new Date(k + 'T12:00:00')
      const diffDays = Math.round((d.getTime() - new Date(todayStr + 'T12:00:00').getTime()) / 86400000)
      let label: string
      if (diffDays === 1) label = 'Mañana'
      else if (diffDays <= 7) label = format(d, "EEEE d 'de' MMMM", { locale: es })
      else label = format(d, "d 'de' MMMM yyyy", { locale: es })
      return {
        label: label.charAt(0).toUpperCase() + label.slice(1),
        tasks: sortTasks(upcomingTasks.filter(t => t.dueDate === k)),
      }
    })
  }

  const openAddList = () => { setEditingList(null); setListForm(emptyList()); setListModal(true) }
  const openEditList = (l: TaskList) => { setEditingList(l); setListForm({ name: l.name, color: l.color, icon: l.icon }); setListModal(true) }
  const saveList = () => {
    if (!listForm.name.trim()) return
    if (editingList) updateTaskList({ ...editingList, ...listForm })
    else addTaskList({ id: `t${Date.now()}`, ...listForm })
    setListModal(false)
  }

  return (
    <div className="page-content" style={{ padding: '32px 40px', maxWidth: 1200 }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="gradient-text-purple" style={{ fontSize: 28, fontWeight: 900, margin: 0 }}>TO DO</h1>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
            Organiza tus pendientes por listas, fechas y prioridades
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-ghost" onClick={() => setListModal(true)} style={{ fontSize: 13 }}>⚙️ Listas</button>
          <button className="btn-primary" onClick={openAddTask}>+ Tarea</button>
        </div>
      </div>

      <div className="tareas-layout" style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 20, alignItems: 'start' }}>

        {/* ── Sidebar de vistas/listas ── */}
        <div className="card" style={{ padding: 14 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {[
              { id: 'today', icon: '📆', label: 'Hoy', count: todayTasks.length },
              { id: 'upcoming', icon: '🗓️', label: 'Próximos', count: upcomingTasks.length },
              { id: 'someday', icon: '🌫️', label: 'Algún día', count: somedayTasks.length },
              { id: 'all', icon: '📋', label: 'Todas', count: pending.length },
              { id: 'calendar', icon: '📅', label: 'Calendario', count: 0 },
              { id: 'completed', icon: '✅', label: 'Completadas', count: completedTasks.length },
            ].map(v => (
              <button key={v.id} onClick={() => setView(v.id)} style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 9, border: 'none', cursor: 'pointer',
                background: view === v.id ? 'rgba(124,111,255,0.15)' : 'transparent',
                color: view === v.id ? 'var(--accent-purple)' : 'var(--text-secondary)',
                fontWeight: view === v.id ? 700 : 400, fontSize: 13, textAlign: 'left',
              }}>
                <span>{v.icon}</span>
                <span style={{ flex: 1 }}>{v.label}</span>
                {v.count > 0 && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{v.count}</span>}
              </button>
            ))}
          </div>

          <div style={{ borderTop: '1px solid var(--border)', margin: '12px 0', paddingTop: 12 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, paddingLeft: 10, letterSpacing: 1 }}>LISTAS</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {data.taskLists.map(l => {
                const count = pending.filter(t => t.listId === l.id).length
                return (
                  <button key={l.id} onClick={() => setView(l.id)} style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 9, border: 'none', cursor: 'pointer',
                    background: view === l.id ? 'rgba(124,111,255,0.15)' : 'transparent',
                    color: view === l.id ? 'var(--accent-purple)' : 'var(--text-secondary)',
                    fontWeight: view === l.id ? 700 : 400, fontSize: 13, textAlign: 'left',
                  }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: l.color, display: 'inline-block', flexShrink: 0 }} />
                    <span>{l.icon}</span>
                    <span style={{ flex: 1 }}>{l.name}</span>
                    {count > 0 && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{count}</span>}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* ── Lista de tareas ── */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div className="section-label" style={{ marginBottom: 0 }}>{title}</div>
            {(view === 'today' || view === 'upcoming' || view === 'all') && visibleTasks.length > 0 && (
              <button className="btn-primary" onClick={startPlanMyDay} style={{ background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-teal))', fontSize: 13 }}>
                ▶ Plan my day
              </button>
            )}
          </div>

          {view !== 'completed' && view !== 'calendar' && (
            <div className="card" style={{ marginBottom: 12, padding: '10px 14px' }}>
              <div style={{ display: 'flex', gap: 10 }}>
                <input
                  value={quickTitle}
                  onChange={e => setQuickTitle(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') addQuick() }}
                  placeholder="+ Agregar tarea rápida y presiona Enter..."
                  className="input-glass"
                  style={{ flex: 1 }}
                />
                <button className="btn-primary" onClick={addQuick}>Agregar</button>
              </div>
            </div>
          )}

          {view === 'calendar' ? (
            <div className="card" style={{ padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <button className="btn-ghost" onClick={() => setCalendarMonth(d => subMonths(d, 1))} style={{ padding: '6px 12px' }}>‹</button>
                <span style={{ fontWeight: 700, fontSize: 14 }}>{format(calendarMonth, 'MMMM yyyy', { locale: es }).toUpperCase()}</span>
                <button className="btn-ghost" onClick={() => setCalendarMonth(d => addMonths(d, 1))} style={{ padding: '6px 12px' }}>›</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 6 }}>
                {['L','M','X','J','V','S','D'].map(d => (
                  <div key={d} style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-muted)', fontWeight: 700 }}>{d}</div>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
                {calDays.map(d => {
                  const dayKey = format(d, 'yyyy-MM-dd')
                  const dayTasks = tasksForDay(d)
                  const inMonth = isSameMonth(d, calendarMonth)
                  const today_ = isToday(d)
                  return (
                    <div key={dayKey} onClick={() => setCalendarDay(dayKey)} style={{
                      minHeight: 76, borderRadius: 9, padding: 6, cursor: 'pointer',
                      background: today_ ? 'rgba(124,111,255,0.12)' : 'rgba(255,255,255,0.03)',
                      border: today_ ? '1px solid var(--accent-purple)' : '1px solid transparent',
                      opacity: inMonth ? 1 : 0.35,
                    }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>{format(d, 'd')}</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {dayTasks.slice(0, 3).map(t => {
                          const list = listFor(t.listId)
                          return (
                            <div key={t.id} style={{
                              fontSize: 10, padding: '1px 4px', borderRadius: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                              background: `${list?.color ?? '#888'}33`, color: t.completed ? 'var(--text-muted)' : 'var(--text-secondary)',
                              textDecoration: t.completed ? 'line-through' : 'none',
                            }}>{t.title}</div>
                          )
                        })}
                        {dayTasks.length > 3 && <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>+{dayTasks.length - 3} más</div>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : visibleTasks.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)', fontSize: 13 }}>
              {view === 'completed' ? 'Aún no completas tareas' : '¡Nada pendiente por aquí! ✨'}
            </div>
          ) : view === 'upcoming' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {upcomingGroups().map(g => (
                <div key={g.label}>
                  <div className="section-label" style={{ marginBottom: 8 }}>{g.label}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {g.tasks.map(renderTask)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {visibleTasks.map(renderTask)}
            </div>
          )}
        </div>
      </div>

      {/* ── Modal Plan my day ── */}
      {planQueue && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1003, backdropFilter: 'blur(6px)' }}
          onClick={e => { if (e.target === e.currentTarget) setPlanQueue(null) }}>
          <div className="card" style={{ width: 420, padding: 28 }}>
            <h2 className="gradient-text-purple" style={{ fontSize: 18, fontWeight: 900, marginBottom: 4 }}>▶ Plan my day</h2>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 20 }}>Tarea {planIndex + 1} de {planQueue.length}</div>

            {planCurrent && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 16 }}>{listFor(planCurrent.listId)?.icon}</span>
                  <span style={{ fontSize: 16, fontWeight: 700 }}>{planCurrent.title}</span>
                </div>
                {planCurrent.priority > 0 && (
                  <div style={{ fontSize: 12, fontWeight: 700, color: priorityColor(planCurrent.priority), marginBottom: 16 }}>
                    Prioridad {PRIORITIES.find(p => p.id === planCurrent.priority)?.label}
                  </div>
                )}
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>¿Qué hacemos con esta tarea?</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <button className="btn-primary" onClick={() => { postpone(planCurrent, todayStr); planAdvance() }}>✅ Hacerla hoy</button>
                  <button className="btn-ghost" onClick={() => { postpone(planCurrent, format(addDays(new Date(), 1), 'yyyy-MM-dd')); planAdvance() }}>→ Mover a mañana</button>
                  <button className="btn-ghost" onClick={() => { postpone(planCurrent, format(addDays(new Date(), 7), 'yyyy-MM-dd')); planAdvance() }}>→ Próxima semana</button>
                  <button className="btn-ghost" onClick={() => { postpone(planCurrent, undefined); planAdvance() }}>🗑 Quitar fecha</button>
                  <button onClick={() => { celebrate('task'); toggleTask(planCurrent.id); planAdvance() }} style={{ background: 'rgba(0,229,184,0.1)', border: '1px solid rgba(0,229,184,0.3)', borderRadius: 9, padding: '9px', color: 'var(--accent-teal)', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>✓ Ya la completé</button>
                </div>
              </>
            )}

            <button onClick={() => setPlanQueue(null)} className="btn-ghost" style={{ width: '100%', marginTop: 16 }}>Cerrar</button>
          </div>
        </div>
      )}

      {/* ── Modal día (Calendario) ── */}
      {calendarDay && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1003, backdropFilter: 'blur(6px)' }}
          onClick={e => { if (e.target === e.currentTarget) { setCalendarDay(null); setCalendarQuickTitle('') } }}>
          <div className="card" style={{ width: 420, padding: 28, maxHeight: '85vh', overflowY: 'auto' }}>
            <h2 style={{ fontSize: 18, fontWeight: 900, marginBottom: 16 }}>
              {format(new Date(calendarDay + 'T12:00:00'), "d 'de' MMMM yyyy", { locale: es })}
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              {data.tasks.filter(t => t.dueDate === calendarDay).length === 0 && (
                <div style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: '12px 0' }}>Sin tareas este día</div>
              )}
              {data.tasks.filter(t => t.dueDate === calendarDay).map(t => {
                const list = listFor(t.listId)
                return (
                  <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: 10, borderLeft: `3px solid ${list?.color ?? '#888'}` }}>
                    <button onClick={() => handleToggle(t)} style={{
                      width: 18, height: 18, borderRadius: '50%', border: `2px solid ${priorityColor(t.priority)}`,
                      background: t.completed ? priorityColor(t.priority) : 'transparent', cursor: 'pointer', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: 'white', padding: 0,
                    }}>{t.completed ? '✓' : ''}</button>
                    <span style={{ flex: 1, fontSize: 13, textDecoration: t.completed ? 'line-through' : 'none', color: t.completed ? 'var(--text-muted)' : 'var(--text-primary)' }}>{t.title}</span>
                    <button onClick={() => { setCalendarDay(null); openEditTask(t) }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: 'var(--text-secondary)', padding: '2px 4px' }}>✏️</button>
                    <button onClick={() => deleteTask(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: 'var(--accent-coral)', padding: '2px 4px', opacity: 0.7 }}>✕</button>
                  </div>
                )
              })}
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <input
                value={calendarQuickTitle}
                onChange={e => setCalendarQuickTitle(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && calendarQuickTitle.trim()) {
                    addTask({ id: Date.now().toString(), createdAt: new Date().toISOString(), title: calendarQuickTitle.trim(), notes: '', listId: data.taskLists[0]?.id ?? 't1', dueDate: calendarDay, priority: 0, completed: false, subtasks: [], recurring: 'none' })
                    setCalendarQuickTitle('')
                  }
                }}
                placeholder="+ Agregar tarea para este día..."
                className="input-glass"
                style={{ flex: 1 }}
              />
            </div>

            <button onClick={() => { setCalendarDay(null); setCalendarQuickTitle('') }} className="btn-ghost" style={{ width: '100%', marginTop: 16 }}>Cerrar</button>
          </div>
        </div>
      )}

      {/* ── Modal Tarea ── */}
      {taskModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(6px)' }}
          onClick={e => { if (e.target === e.currentTarget) setTaskModal(false) }}>
          <div className="card" style={{ width: 460, padding: 28, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 900, margin: 0 }}>
                {editingTask ? '✏️ Editar tarea' : '+ Nueva tarea'}
              </h2>
              {form.title.trim() && form.dueDate && (() => {
                const link = gcalLink({ ...form, id: '', completed: false, createdAt: '' } as Task)
                return link ? (
                  <a href={link} target="_blank" rel="noopener noreferrer" title="Agregar a Google Calendar" style={{ background: 'rgba(79,195,247,0.1)', border: '1px solid rgba(79,195,247,0.3)', borderRadius: 7, padding: '5px 10px', color: 'var(--accent-blue)', fontSize: 12, textDecoration: 'none', whiteSpace: 'nowrap' }}>
                    🗓️ Calendar
                  </a>
                ) : null
              })()}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* Título */}
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>TÍTULO</div>
                <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="¿Qué necesitas hacer?" className="input-glass" />
              </div>

              {/* Lista */}
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>LISTA</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {data.taskLists.map(l => (
                    <button key={l.id} onClick={() => setForm(p => ({ ...p, listId: l.id }))} style={{
                      padding: '6px 12px', borderRadius: 99, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                      background: form.listId === l.id ? l.color : 'rgba(255,255,255,0.06)',
                      color: form.listId === l.id ? 'white' : 'var(--text-secondary)',
                    }}>{l.icon} {l.name}</button>
                  ))}
                </div>
              </div>

              {/* Fecha y prioridad */}
              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>FECHA LÍMITE</div>
                  <input type="date" value={form.dueDate ?? ''} onChange={e => setForm(p => ({ ...p, dueDate: e.target.value || undefined }))} className="input-glass" style={{ marginBottom: 6 }} />
                  <div style={{ display: 'flex', gap: 5 }}>
                    {[
                      { label: 'Hoy', value: getTodayKey() },
                      { label: 'Mañana', value: (() => { const d = new Date(); d.setDate(d.getDate()+1); return d.toISOString().slice(0,10) })() },
                    ].map(opt => (
                      <button key={opt.label} type="button" onClick={() => setForm(p => ({ ...p, dueDate: opt.value }))}
                        style={{ flex: 1, fontSize: 11, padding: '4px 0', borderRadius: 6, border: 'none', cursor: 'pointer',
                          background: form.dueDate === opt.value ? 'rgba(124,111,255,0.3)' : 'rgba(255,255,255,0.06)',
                          color: form.dueDate === opt.value ? 'var(--accent-purple)' : 'var(--text-muted)' }}>
                        {opt.label}
                      </button>
                    ))}
                    <button type="button" onClick={() => setForm(p => ({ ...p, dueDate: undefined }))}
                      style={{ flex: 1, fontSize: 11, padding: '4px 0', borderRadius: 6, border: 'none', cursor: 'pointer',
                        background: !form.dueDate ? 'rgba(255,79,163,0.25)' : 'rgba(255,255,255,0.06)',
                        color: !form.dueDate ? 'var(--accent-pink)' : 'var(--text-muted)' }}>
                      🌫️ Algún día
                    </button>
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>REPETICIÓN</div>
                  <select value={form.recurring} onChange={e => setForm(p => ({ ...p, recurring: e.target.value as Task['recurring'] }))} className="input-glass">
                    {RECURRING.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                  </select>
                </div>
              </div>

              {/* Días de repetición (para diario/semanal) */}
              {(form.recurring === 'daily' || form.recurring === 'weekly') && (
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>
                    {form.recurring === 'daily' ? 'REPETIR SOLO ESTOS DÍAS (vacío = todos)' : 'REPETIR ESTOS DÍAS DE LA SEMANA'}
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {WEEKDAYS.map(w => {
                      const active = (form.recurringDays ?? []).includes(w.id)
                      return (
                        <button key={w.id} type="button" onClick={() => setForm(p => {
                          const cur = p.recurringDays ?? []
                          return { ...p, recurringDays: cur.includes(w.id) ? cur.filter(x => x !== w.id) : [...cur, w.id] }
                        })} style={{
                          flex: 1, padding: '8px 0', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700,
                          background: active ? 'var(--accent-purple)' : 'rgba(255,255,255,0.06)',
                          color: active ? 'white' : 'var(--text-secondary)',
                        }}>{w.label}</button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Horario */}
              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>HORA INICIO (opcional)</div>
                  <TimeSelect value={form.startTime ?? ''} onChange={v => setForm(p => ({ ...p, startTime: v || undefined }))} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>HORA FIN (opcional)</div>
                  <TimeSelect value={form.endTime ?? ''} onChange={v => setForm(p => ({ ...p, endTime: v || undefined }))} />
                </div>
              </div>

              {/* Prioridad */}
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>PRIORIDAD</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {PRIORITIES.map(p => (
                    <button key={p.id} onClick={() => setForm(prev => ({ ...prev, priority: p.id }))} style={{
                      flex: 1, padding: '8px', borderRadius: 9, border: `1px solid ${form.priority === p.id ? p.color : 'transparent'}`, cursor: 'pointer', fontSize: 12, fontWeight: 700,
                      background: form.priority === p.id ? `${p.color}22` : 'rgba(255,255,255,0.06)',
                      color: form.priority === p.id ? p.color : 'var(--text-secondary)',
                    }}>{p.label}</button>
                  ))}
                </div>
              </div>

              {/* Notas */}
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>NOTAS (opcional)</div>
                <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Detalles adicionales..." className="input-glass" rows={2} style={{ resize: 'vertical', fontFamily: 'inherit' }} />
              </div>

              {/* Subtareas */}
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>SUBTAREAS</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
                  {form.subtasks.map(s => (
                    <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input type="checkbox" checked={s.done} onChange={() => toggleSubtaskInForm(s.id)} />
                      <span style={{ flex: 1, fontSize: 13, textDecoration: s.done ? 'line-through' : 'none', color: s.done ? 'var(--text-muted)' : 'var(--text-secondary)' }}>{s.title}</span>
                      <button onClick={() => removeSubtaskFromForm(s.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-coral)', fontSize: 13, opacity: 0.7 }}>✕</button>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input value={newSubtask} onChange={e => setNewSubtask(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSubtaskToForm() } }} placeholder="Agregar subtarea..." className="input-glass" style={{ flex: 1 }} />
                  <button className="btn-ghost" onClick={addSubtaskToForm}>+</button>
                </div>
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                {editingTask && (
                  <button onClick={() => { deleteTask(editingTask.id); setTaskModal(false) }} style={{ background: 'rgba(255,80,80,0.1)', border: '1px solid rgba(255,80,80,0.3)', borderRadius: 9, padding: '0 14px', color: '#ff5050', cursor: 'pointer', fontSize: 13 }}>🗑</button>
                )}
                <button className="btn-ghost" onClick={() => setTaskModal(false)} style={{ flex: 1 }}>Cancelar</button>
                <button className="btn-primary" onClick={saveTask} style={{ flex: 2 }}>
                  {editingTask ? '✓ Guardar cambios' : '+ Agregar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Listas ── */}
      {listModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1001, backdropFilter: 'blur(6px)' }}
          onClick={e => { if (e.target === e.currentTarget) setListModal(false) }}>
          <div className="card" style={{ width: 440, padding: 28, maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontSize: 18, fontWeight: 900, marginBottom: 20 }}>⚙️ Listas</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
              {data.taskLists.map(l => (
                <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: 10, borderLeft: `3px solid ${l.color}` }}>
                  <span style={{ fontSize: 18 }}>{l.icon}</span>
                  <span style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>{l.name}</span>
                  <button onClick={() => openEditList(l)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: 'var(--text-secondary)', padding: '2px 4px' }}>✏️</button>
                  {data.taskLists.length > 1 && (
                    <button onClick={() => deleteTaskList(l.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: 'var(--accent-coral)', padding: '2px 4px', opacity: 0.7 }}>✕</button>
                  )}
                </div>
              ))}
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>{editingList ? 'EDITAR LISTA' : 'NUEVA LISTA'}</div>
              <div style={{ marginBottom: 10 }}>
                <input value={listForm.name} onChange={e => setListForm(p => ({ ...p, name: e.target.value }))} placeholder="Nombre" className="input-glass" />
              </div>
              <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 10 }}>
                {ICONS.map(ic => (
                  <button key={ic} onClick={() => setListForm(p => ({ ...p, icon: ic }))} style={{ width: 34, height: 34, borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 16, background: listForm.icon === ic ? 'rgba(124,111,255,0.3)' : 'rgba(255,255,255,0.05)', outline: listForm.icon === ic ? '2px solid var(--accent-purple)' : 'none' }}>{ic}</button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
                {COLORS.map(c => (
                  <button key={c} onClick={() => setListForm(p => ({ ...p, color: c }))} style={{ width: 26, height: 26, borderRadius: '50%', background: c, border: listForm.color === c ? '3px solid white' : '3px solid transparent', cursor: 'pointer', boxShadow: listForm.color === c ? `0 0 10px ${c}` : 'none' }} />
                ))}
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                {editingList && (
                  <button onClick={() => { setEditingList(null); setListForm(emptyList()) }} className="btn-ghost" style={{ flex: 1 }}>Cancelar</button>
                )}
                <button className="btn-primary" onClick={saveList} style={{ flex: 1 }}>{editingList ? 'Guardar' : '+ Agregar'}</button>
              </div>
            </div>

            <button onClick={() => setListModal(false)} className="btn-ghost" style={{ width: '100%', marginTop: 16 }}>Cerrar</button>
          </div>
        </div>
      )}
    </div>
  )
}
