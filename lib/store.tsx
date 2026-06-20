'use client'
import { useState, useEffect, useRef, useContext, createContext } from 'react'
import { supabase } from './supabase'

export interface Habit {
  id: string
  name: string
  color: string
  icon: string
  category: string
  goal: number
  completedDays: Record<string, boolean>
  createdAt: string
  stack?: string
}

export interface WeightEntry {
  date: string
  weight: number
  notes?: string
}

export interface JournalEntry {
  date: string
  mood: number
  energy: number
  notes: string
  gratitude: string
  wins: string
}

export interface AgendaBlock {
  id: string
  time: string
  endTime?: string
  title: string
  category: 'morning' | 'work' | 'exercise' | 'personal' | 'evening'
  done: boolean
  date: string
}

export interface WaterLog {
  date: string
  glasses: number
  goal: number
}

export interface Reward {
  id: string
  title: string
  cost: number
  icon: string
  redeemed: boolean
}

export interface Category {
  id: string
  name: string
  color: string
}

export interface FinanceCategory {
  id: string
  name: string
  color: string
  icon: string
  budget: number // presupuesto mensual (0 = sin límite)
}

export interface Transaction {
  id: string
  date: string // YYYY-MM-DD
  amount: number
  type: 'expense' | 'income'
  category: string // FinanceCategory id
  note?: string
}

export interface SubTask {
  id: string
  title: string
  done: boolean
}

export interface Task {
  id: string
  title: string
  notes?: string
  listId: string // TaskList id
  dueDate?: string // YYYY-MM-DD
  priority: 0 | 1 | 2 | 3 // 0=ninguna, 1=baja, 2=media, 3=alta
  completed: boolean
  completedAt?: string
  createdAt: string
  subtasks: SubTask[]
  recurring?: 'none' | 'daily' | 'weekly' | 'monthly'
  recurringDays?: number[] // para 'weekly': días de la semana (0=domingo..6=sábado)
  startTime?: string // HH:MM
  endTime?: string   // HH:MM
}

export interface TaskList {
  id: string
  name: string
  color: string
  icon: string
}

export interface AppData {
  habits: Habit[]
  categories: Category[]
  weights: WeightEntry[]
  journal: Record<string, JournalEntry>
  agenda: AgendaBlock[]
  water: Record<string, WaterLog>
  rewards: Reward[]
  financeCategories: FinanceCategory[]
  transactions: Transaction[]
  taskLists: TaskList[]
  tasks: Task[]
  xp: number
  level: number
  gold: number
  identity: string
  goalWeight: number | null
}

const DEFAULT_HABITS: Habit[] = [
  { id: '1',  name: 'Cero Azúcar',       color: '#FF6B6B', icon: '🚫', category: 'c1', goal: 31, completedDays: {}, createdAt: new Date().toISOString(), stack: 'Mañana' },
  { id: '2',  name: 'Cero Carb',          color: '#FF6B6B', icon: '🥩', category: 'c1', goal: 31, completedDays: {}, createdAt: new Date().toISOString(), stack: 'Mañana' },
  { id: '3',  name: '3 Termos de Agua',   color: '#4FC3F7', icon: '💧', category: 'c1', goal: 31, completedDays: {}, createdAt: new Date().toISOString(), stack: 'Día' },
  { id: '4',  name: '1h Ejercicio',       color: '#00E5B8', icon: '🏋️', category: 'c2', goal: 31, completedDays: {}, createdAt: new Date().toISOString(), stack: 'Mañana' },
  { id: '5',  name: 'Estirar',            color: '#00E5B8', icon: '🧘', category: 'c2', goal: 31, completedDays: {}, createdAt: new Date().toISOString(), stack: 'Mañana' },
  { id: '6',  name: 'Meditar',            color: '#7C6FFF', icon: '🧠', category: 'c3', goal: 31, completedDays: {}, createdAt: new Date().toISOString(), stack: 'Mañana' },
  { id: '7',  name: 'Visualizar',         color: '#7C6FFF', icon: '👁️', category: 'c3', goal: 31, completedDays: {}, createdAt: new Date().toISOString(), stack: 'Mañana' },
  { id: '8',  name: 'Agradecer',          color: '#FFD93D', icon: '🙏', category: 'c3', goal: 31, completedDays: {}, createdAt: new Date().toISOString(), stack: 'Mañana' },
  { id: '9',  name: 'Lectura/Audio',      color: '#FFD93D', icon: '📚', category: 'c5', goal: 31, completedDays: {}, createdAt: new Date().toISOString(), stack: 'Noche' },
  { id: '10', name: 'Dormir 7h+',         color: '#9B59B6', icon: '😴', category: 'c1', goal: 31, completedDays: {}, createdAt: new Date().toISOString(), stack: 'Noche' },
  { id: '11', name: 'BIT',                color: '#FF6B6B', icon: '📈', category: 'c4', goal: 31, completedDays: {}, createdAt: new Date().toISOString(), stack: 'Trabajo' },
  { id: '12', name: 'EOD Review',         color: '#FF6B6B', icon: '📊', category: 'c4', goal: 31, completedDays: {}, createdAt: new Date().toISOString(), stack: 'Noche' },
  { id: '13', name: 'Cuadro LQ',          color: '#7C6FFF', icon: '✍️', category: 'c4', goal: 31, completedDays: {}, createdAt: new Date().toISOString(), stack: 'Noche' },
  { id: '14', name: '2 Comidas / Horario',color: '#00E5B8', icon: '🍽️', category: 'c1', goal: 31, completedDays: {}, createdAt: new Date().toISOString(), stack: 'Día' },
  { id: '15', name: 'Ducha Fría',         color: '#4FC3F7', icon: '🚿', category: 'c2', goal: 31, completedDays: {}, createdAt: new Date().toISOString(), stack: 'Mañana' },
  { id: '16', name: 'Sin Redes 2h+',      color: '#FF4FA3', icon: '📵', category: 'c3', goal: 31, completedDays: {}, createdAt: new Date().toISOString(), stack: 'Día' },
]

const DEFAULT_REWARDS: Reward[] = [
  { id: 'r1', title: '1h Netflix',       cost: 50,  icon: '📺', redeemed: false },
  { id: 'r2', title: 'Comida cheat',     cost: 100, icon: '🍕', redeemed: false },
  { id: 'r3', title: 'Día de descanso',  cost: 200, icon: '😴', redeemed: false },
  { id: 'r4', title: 'Compra deseada',   cost: 500, icon: '🛍️', redeemed: false },
]

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'c1', name: 'Salud',       color: '#FF6B6B' },
  { id: 'c2', name: 'Fitness',     color: '#00E5B8' },
  { id: 'c3', name: 'Mente',       color: '#7C6FFF' },
  { id: 'c4', name: 'Trading',     color: '#FFD93D' },
  { id: 'c5', name: 'Crecimiento', color: '#4FC3F7' },
]

const DEFAULT_FINANCE_CATEGORIES: FinanceCategory[] = [
  { id: 'f1', name: 'Comida',          color: '#FF6B6B', icon: '🍔', budget: 400 },
  { id: 'f2', name: 'Transporte',      color: '#4FC3F7', icon: '🚗', budget: 100 },
  { id: 'f3', name: 'Vivienda',        color: '#7C6FFF', icon: '🏠', budget: 600 },
  { id: 'f4', name: 'Entretenimiento', color: '#FF4FA3', icon: '🎮', budget: 80  },
  { id: 'f5', name: 'Salud',           color: '#00E5B8', icon: '🏥', budget: 60  },
  { id: 'f6', name: 'Ahorro/Inversión',color: '#FFD93D', icon: '💰', budget: 200 },
  { id: 'f7', name: 'Otros',           color: '#9B59B6', icon: '📦', budget: 100 },
  { id: 'f8', name: 'Ingreso',         color: '#2ECC71', icon: '💵', budget: 0   },
]

const DEFAULT_TASK_LISTS: TaskList[] = [
  { id: 't1', name: 'Inbox',    color: '#7C6FFF', icon: '📥' },
  { id: 't2', name: 'Trabajo',  color: '#FFD93D', icon: '💼' },
  { id: 't3', name: 'Personal', color: '#00E5B8', icon: '🏠' },
  { id: 't4', name: 'Compras',  color: '#FF4FA3', icon: '🛒' },
]

const DEFAULT_DATA: AppData = {
  habits: DEFAULT_HABITS,
  categories: DEFAULT_CATEGORIES,
  weights: [],
  journal: {},
  agenda: [],
  water: {},
  rewards: DEFAULT_REWARDS,
  financeCategories: DEFAULT_FINANCE_CATEGORIES,
  transactions: [],
  taskLists: DEFAULT_TASK_LISTS,
  tasks: [],
  xp: 0,
  level: 1,
  gold: 0,
  identity: 'Élite',
  goalWeight: null,
}

// Migra hábitos cuyo `category` quedó guardado como nombre (legado) a su id estable
function migrateHabitCategories(habits: Habit[], categories: Category[]): Habit[] {
  return habits.map(h => {
    if (categories.some(c => c.id === h.category)) return h
    const byName = categories.find(c => c.name === h.category)
    return byName ? { ...h, category: byName.id } : h
  })
}

function normalizeAppData(parsed: Partial<AppData>): Partial<AppData> {
  const categories = parsed.categories?.length ? parsed.categories : DEFAULT_CATEGORIES
  const rewards    = parsed.rewards?.length    ? parsed.rewards    : DEFAULT_REWARDS
  const habits     = parsed.habits ? migrateHabitCategories(parsed.habits, categories) : parsed.habits
  const financeCategories = parsed.financeCategories?.length ? parsed.financeCategories : DEFAULT_FINANCE_CATEGORIES
  const transactions      = parsed.transactions ?? []
  const taskLists         = parsed.taskLists?.length ? parsed.taskLists : DEFAULT_TASK_LISTS
  const tasks             = parsed.tasks ?? []
  const goalWeight        = parsed.goalWeight ?? null
  return { ...parsed, categories, rewards, financeCategories, transactions, taskLists, tasks, goalWeight, ...(habits ? { habits } : {}) }
}

// ── Tipos del contexto ──────────────────────────────────
type AppContextType = ReturnType<typeof useAppDataInternal>
const AppContext = createContext<AppContextType | null>(null)

// ── Provider — úsalo en AppShell ────────────────────────
export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const value = useAppDataInternal()
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

// ── Hook público ────────────────────────────────────────
export function useAppData() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useAppData debe usarse dentro de AppDataProvider')
  return ctx
}

// ── Lógica interna (solo se instancia UNA vez en el Provider) ──
function useAppDataInternal() {
  const [data, setData]     = useState<AppData>(DEFAULT_DATA)
  const [loaded, setLoaded] = useState(false)
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Carga inicial ──────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()

      if (session?.user) {
        // Esperamos a Supabase (source of truth) antes de mostrar nada, para evitar el flash de datos viejos
        const { data: row } = await supabase
          .from('user_data')
          .select('data')
          .eq('user_id', session.user.id)
          .single()

        if (row?.data) {
          const parsed = row.data
          setData(prev => ({ ...prev, ...normalizeAppData(parsed) }))
        } else {
          // Sin datos en la nube aún: usamos la caché local si existe, si no los valores por defecto
          const cached = localStorage.getItem('habit-tracker-v2')
          if (cached) {
            try {
              const parsed = JSON.parse(cached)
              setData(prev => ({ ...prev, ...normalizeAppData(parsed) }))
            } catch {}
          }
          await supabase.from('user_data').upsert({ user_id: session.user.id, data: DEFAULT_DATA })
        }
      } else {
        const saved = localStorage.getItem('habit-tracker-v2')
        if (saved) {
          try {
            const parsed = JSON.parse(saved)
            setData(prev => ({ ...prev, ...normalizeAppData(parsed) }))
          } catch {}
        }
        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/auth')) {
          window.location.href = '/auth'
        }
      }
      setLoaded(true)
    }
    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session && window.location.pathname.startsWith('/auth')) window.location.href = '/'
      if (event === 'SIGNED_OUT') window.location.href = '/auth'
    })
    return () => subscription.unsubscribe()
  }, [])

  // ── Sync a Supabase con debounce ───────────────────────
  useEffect(() => {
    if (!loaded) return
    localStorage.setItem('habit-tracker-v2', JSON.stringify(data))
    if (syncTimer.current) clearTimeout(syncTimer.current)
    syncTimer.current = setTimeout(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { error } = await supabase
          .from('user_data')
          .upsert({ user_id: user.id, data, updated_at: new Date().toISOString() })
        if (error) console.error('Sync error:', error)
      }
    }, 500)
  }, [data, loaded])

  const toggleHabit = (habitId: string, dateKey: string) => {
    setData(prev => {
      const habits = prev.habits.map(h => {
        if (h.id !== habitId) return h
        const wasChecked = !!h.completedDays[dateKey]
        return { ...h, completedDays: { ...h.completedDays, [dateKey]: !wasChecked } }
      })
      const nowChecked = habits.find(h => h.id === habitId)?.completedDays[dateKey]
      const xpDelta = nowChecked ? 10 : -10
      const goldDelta = nowChecked ? 5 : -5
      const newXp   = Math.max(0, prev.xp   + xpDelta)
      const newGold = Math.max(0, prev.gold  + goldDelta)
      return { ...prev, habits, xp: newXp, gold: newGold, level: Math.floor(newXp / 500) + 1 }
    })
  }

  const addWeight         = (e: WeightEntry) => setData(prev => ({ ...prev, weights: [...prev.weights.filter(w => w.date !== e.date), e].sort((a,b) => a.date.localeCompare(b.date)) }))
  const deleteWeight      = (date: string)   => setData(prev => ({ ...prev, weights: prev.weights.filter(w => w.date !== date) }))
  const saveJournal       = (date: string, e: JournalEntry) => setData(prev => ({ ...prev, journal: { ...prev.journal, [date]: e } }))
  const addAgendaBlock    = (b: AgendaBlock) => setData(prev => ({ ...prev, agenda: [...prev.agenda, b] }))
  const updateAgendaBlock = (b: AgendaBlock) => setData(prev => ({ ...prev, agenda: prev.agenda.map(x => x.id === b.id ? b : x) }))
  const deleteAgendaBlock = (id: string)     => setData(prev => ({ ...prev, agenda: prev.agenda.filter(b => b.id !== id) }))
  const toggleAgenda      = (id: string)     => setData(prev => ({ ...prev, agenda: prev.agenda.map(b => b.id === id ? { ...b, done: !b.done } : b) }))
  const addHabit          = (h: Habit)       => setData(prev => ({ ...prev, habits: [...prev.habits, h] }))
  const updateHabit       = (h: Habit)       => setData(prev => ({ ...prev, habits: prev.habits.map(x => x.id === h.id ? h : x) }))
  const deleteHabit       = (id: string)     => setData(prev => ({ ...prev, habits: prev.habits.filter(h => h.id !== id) }))
  const setIdentity       = (i: string)      => setData(prev => ({ ...prev, identity: i }))
  const addReward         = (r: Reward)      => setData(prev => ({ ...prev, rewards: [...prev.rewards, r] }))
  const deleteReward      = (id: string)     => setData(prev => ({ ...prev, rewards: prev.rewards.filter(r => r.id !== id) }))
  const redeemReward      = (id: string)     => setData(prev => {
    const r = prev.rewards.find(r => r.id === id)
    if (!r || prev.gold < r.cost) return prev
    return { ...prev, gold: prev.gold - r.cost, rewards: prev.rewards.map(rw => rw.id === id ? { ...rw, redeemed: true } : rw) }
  })
  const setWater          = (date: string, glasses: number) => setData(prev => ({ ...prev, water: { ...prev.water, [date]: { date, glasses, goal: 8 } } }))
  const addCategory       = (c: Category)   => setData(prev => ({ ...prev, categories: [...prev.categories, c] }))
  const updateCategory    = (c: Category)   => setData(prev => ({ ...prev, categories: prev.categories.map(x => x.id === c.id ? c : x) }))
  const deleteCategory    = (id: string)    => setData(prev => ({ ...prev, categories: prev.categories.filter(c => c.id !== id) }))
  const logout            = ()              => supabase.auth.signOut()
  const setGoalWeight     = (g: number | null) => setData(prev => ({ ...prev, goalWeight: g }))

  // ── Finanzas ──
  const addTransaction    = (t: Transaction) => setData(prev => ({ ...prev, transactions: [...prev.transactions, t] }))
  const updateTransaction = (t: Transaction) => setData(prev => ({ ...prev, transactions: prev.transactions.map(x => x.id === t.id ? t : x) }))
  const deleteTransaction = (id: string)     => setData(prev => ({ ...prev, transactions: prev.transactions.filter(t => t.id !== id) }))
  const addFinanceCategory    = (c: FinanceCategory) => setData(prev => ({ ...prev, financeCategories: [...prev.financeCategories, c] }))
  const updateFinanceCategory = (c: FinanceCategory) => setData(prev => ({ ...prev, financeCategories: prev.financeCategories.map(x => x.id === c.id ? c : x) }))
  const deleteFinanceCategory = (id: string)         => setData(prev => ({ ...prev, financeCategories: prev.financeCategories.filter(c => c.id !== id) }))

  // ── Tareas (To-Do) ──
  const addTask    = (t: Task) => setData(prev => ({ ...prev, tasks: [...prev.tasks, t] }))
  const updateTask = (t: Task) => setData(prev => ({ ...prev, tasks: prev.tasks.map(x => x.id === t.id ? t : x) }))
  const deleteTask = (id: string) => setData(prev => ({ ...prev, tasks: prev.tasks.filter(t => t.id !== id) }))
  const toggleTask = (id: string) => setData(prev => ({
    ...prev,
    tasks: prev.tasks.map(t => t.id === id
      ? { ...t, completed: !t.completed, completedAt: !t.completed ? new Date().toISOString() : undefined }
      : t),
  }))
  const toggleSubtask = (taskId: string, subId: string) => setData(prev => ({
    ...prev,
    tasks: prev.tasks.map(t => t.id === taskId
      ? { ...t, subtasks: t.subtasks.map(s => s.id === subId ? { ...s, done: !s.done } : s) }
      : t),
  }))
  const addTaskList    = (l: TaskList) => setData(prev => ({ ...prev, taskLists: [...prev.taskLists, l] }))
  const updateTaskList = (l: TaskList) => setData(prev => ({ ...prev, taskLists: prev.taskLists.map(x => x.id === l.id ? l : x) }))
  const deleteTaskList = (id: string)  => setData(prev => ({ ...prev, taskLists: prev.taskLists.filter(l => l.id !== id), tasks: prev.tasks.filter(t => t.listId !== id) }))

  return { data, loaded, logout, toggleHabit, addWeight, deleteWeight, saveJournal, addAgendaBlock, updateAgendaBlock, deleteAgendaBlock, toggleAgenda, addHabit, updateHabit, deleteHabit, setIdentity, setGoalWeight, addReward, deleteReward, redeemReward, setWater, addCategory, updateCategory, deleteCategory, addTransaction, updateTransaction, deleteTransaction, addFinanceCategory, updateFinanceCategory, deleteFinanceCategory, addTask, updateTask, deleteTask, toggleTask, toggleSubtask, addTaskList, updateTaskList, deleteTaskList }
}

// ── Sistema de niveles: 100 títulos diseñados para 5+ años de uso ──
export const LEVEL_NAMES: { name: string; color: string }[] = [
  // Tier 1: Despertar (1-10) — verde
  { name: '🌱 Semilla',             color: '#52D68A' },
  { name: '🌿 Brote',               color: '#52D68A' },
  { name: '💧 Primera Gota',        color: '#52D68A' },
  { name: '⚡ Chispa',              color: '#52D68A' },
  { name: '🌾 Raíz',               color: '#52D68A' },
  { name: '🌅 Amanecer',           color: '#52D68A' },
  { name: '🔥 Llama Inicial',       color: '#52D68A' },
  { name: '🌊 Primera Ola',         color: '#52D68A' },
  { name: '🌟 Estrella Naciente',   color: '#52D68A' },
  { name: '☀️ Nuevo Sol',           color: '#52D68A' },
  // Tier 2: Forja (11-20) — azul
  { name: '⚒️ Aprendiz',           color: '#4FC3F7' },
  { name: '🛡️ Escudero',           color: '#4FC3F7' },
  { name: '🗡️ Espada Joven',       color: '#4FC3F7' },
  { name: '🏹 Arquero',            color: '#4FC3F7' },
  { name: '🥊 Primer Golpe',        color: '#4FC3F7' },
  { name: '⚔️ Guerrero',           color: '#4FC3F7' },
  { name: '🦁 Corazón Valiente',    color: '#4FC3F7' },
  { name: '💪 Músculo',            color: '#4FC3F7' },
  { name: '🔩 Hierro',             color: '#4FC3F7' },
  { name: '🏔️ Primer Pico',        color: '#4FC3F7' },
  // Tier 3: Ascenso (21-30) — violeta
  { name: '🌪️ Viento',            color: '#9B8FFF' },
  { name: '🦅 Primer Vuelo',        color: '#9B8FFF' },
  { name: '🎯 Objetivo Claro',      color: '#9B8FFF' },
  { name: '🧗 Escalador',          color: '#9B8FFF' },
  { name: '🌙 Guardián',           color: '#9B8FFF' },
  { name: '🔱 Tres Pilares',        color: '#9B8FFF' },
  { name: '💎 Diamante en Bruto',   color: '#9B8FFF' },
  { name: '🚀 Despegue',           color: '#9B8FFF' },
  { name: '🌈 Horizonte',          color: '#9B8FFF' },
  { name: '🦊 Astuto',             color: '#9B8FFF' },
  // Tier 4: Disciplina (31-40) — naranja
  { name: '🧠 Mente Despierta',     color: '#FF9F43' },
  { name: '🏃 Velocista',          color: '#FF9F43' },
  { name: '🎪 Equilibrista',        color: '#FF9F43' },
  { name: '🌺 Floreciendo',         color: '#FF9F43' },
  { name: '🔮 Visionario',          color: '#FF9F43' },
  { name: '⚖️ Equilibrio',         color: '#FF9F43' },
  { name: '🗿 Roca Sólida',         color: '#FF9F43' },
  { name: '🌍 Tierra Firme',        color: '#FF9F43' },
  { name: '🔥 Fuego Controlado',    color: '#FF9F43' },
  { name: '🎖️ Primera Medalla',    color: '#FF9F43' },
  // Tier 5: Madurez (41-50) — dorado
  { name: '🧘 Meditación',         color: '#FFD93D' },
  { name: '🦋 Transformación',      color: '#FFD93D' },
  { name: '🗻 Mitad de la Cima',    color: '#FFD93D' },
  { name: '💡 Luz Interior',        color: '#FFD93D' },
  { name: '🌐 Conexión Total',      color: '#FFD93D' },
  { name: '🎨 Artista',            color: '#FFD93D' },
  { name: '🔬 Científico',          color: '#FFD93D' },
  { name: '📚 Estudioso',          color: '#FFD93D' },
  { name: '🕊️ Paz Interior',       color: '#FFD93D' },
  { name: '🏰 Constructor',         color: '#FFD93D' },
  // Tier 6: Élite (51-60) — coral
  { name: '⚜️ Élite',             color: '#FF6B6B' },
  { name: '🦾 Brazo de Acero',      color: '#FF6B6B' },
  { name: '🧩 Estratega',          color: '#FF6B6B' },
  { name: '🎓 Graduado',           color: '#FF6B6B' },
  { name: '🔑 Poseedor de Llaves',  color: '#FF6B6B' },
  { name: '🌠 Cazador de Estrellas',color: '#FF6B6B' },
  { name: '🏆 Trofeo Vivo',         color: '#FF6B6B' },
  { name: '🦸 Superhéroe',         color: '#FF6B6B' },
  { name: '🌋 Fuerza Volcánica',    color: '#FF6B6B' },
  { name: '⚡ Rayo Constante',      color: '#FF6B6B' },
  // Tier 7: Maestría (61-70) — rosa
  { name: '🧬 ADN Campeón',        color: '#FF4FA3' },
  { name: '🦁 Rey de la Sabana',    color: '#FF4FA3' },
  { name: '🎯 Tiro Certero',        color: '#FF4FA3' },
  { name: '🏅 Medallista',         color: '#FF4FA3' },
  { name: '💫 Fenómeno',           color: '#FF4FA3' },
  { name: '🌌 Viajero del Cosmos',  color: '#FF4FA3' },
  { name: '🔯 Maestro Antiguo',     color: '#FF4FA3' },
  { name: '🗡️ Guerrero Élite',     color: '#FF4FA3' },
  { name: '🧙 Sabio',              color: '#FF4FA3' },
  { name: '🦄 Ser Único',          color: '#FF4FA3' },
  // Tier 8: Leyenda (71-80) — celeste platino
  { name: '🌞 Sol Radiante',        color: '#A8D8FF' },
  { name: '🌊 Marea Eterna',        color: '#A8D8FF' },
  { name: '🏯 Gran Fortaleza',      color: '#A8D8FF' },
  { name: '🧿 Ojo del Universo',    color: '#A8D8FF' },
  { name: '🔮 Oráculo',            color: '#A8D8FF' },
  { name: '🦅 Águila Real',         color: '#A8D8FF' },
  { name: '🔱 Señor de Hábitos',    color: '#A8D8FF' },
  { name: '💠 Cristal Perfecto',    color: '#A8D8FF' },
  { name: '🌟 Nova',               color: '#A8D8FF' },
  { name: '⚡ Tormenta Imparable',  color: '#A8D8FF' },
  // Tier 9: Mítico (81-90) — lavanda brillante
  { name: '🌑 Eclipse Total',       color: '#D7B4F3' },
  { name: '💎 Diamante Puro',       color: '#D7B4F3' },
  { name: '🌌 Nebulosa',           color: '#D7B4F3' },
  { name: '⚔️ Gladiador Eterno',   color: '#D7B4F3' },
  { name: '🧿 Tercer Ojo Abierto',  color: '#D7B4F3' },
  { name: '🔥 Llama Eterna',        color: '#D7B4F3' },
  { name: '🌺 Flor Inmortal',       color: '#D7B4F3' },
  { name: '🏆 Gran Campeón',        color: '#D7B4F3' },
  { name: '🌋 Erupción Perpetua',   color: '#D7B4F3' },
  { name: '🦁 León Inmortal',       color: '#D7B4F3' },
  // Tier 10: Trascendencia (91-100) — oro puro
  { name: '⚜️ Orden Suprema',      color: '#FFD700' },
  { name: '🌠 Supernova',          color: '#FFD700' },
  { name: '🧬 Evolución Máxima',    color: '#FFD700' },
  { name: '🪐 Señor del Tiempo',    color: '#FFD700' },
  { name: '🌌 Galaxia Propia',      color: '#FFD700' },
  { name: '🔮 Profeta',            color: '#FFD700' },
  { name: '🌞 Sol Inextinguible',   color: '#FFD700' },
  { name: '👑 Gran Rey',           color: '#FFD700' },
  { name: '🦋 Metamorfosis Final',  color: '#FFD700' },
  { name: '⚡ FORJA MÁXIMA',       color: '#FFD700' },
]

export function getLevelInfo(level: number): { name: string; color: string; tier: number } {
  const idx = Math.min(level - 1, LEVEL_NAMES.length - 1)
  const base = level <= LEVEL_NAMES.length ? LEVEL_NAMES[idx] : { name: `⚡ Leyenda Infinita`, color: '#FFD700' }
  return { ...base, tier: Math.ceil(Math.min(level, 100) / 10) }
}

const COLOMBIA_TZ = 'America/Bogota'
const colombiaFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: COLOMBIA_TZ, year: 'numeric', month: '2-digit', day: '2-digit' })

export const getTodayKey  = () => colombiaFormatter.format(new Date())
export const getDateKey   = (d: Date) => colombiaFormatter.format(d)

export function getStreak(habit: Habit): number {
  let streak = 0
  const today = new Date()
  for (let i = 0; i < 365; i++) {
    const d = new Date(today); d.setDate(d.getDate() - i)
    if (habit.completedDays[getDateKey(d)]) streak++
    else if (i > 0) break
  }
  return streak
}

export function getDayScore(habits: Habit[], dateKey: string): number {
  if (!habits.length) return 0
  return Math.round(habits.filter(h => h.completedDays[dateKey]).length / habits.length * 100)
}

export function getHabitMonthPct(habit: Habit, year: number, month: number): number {
  if (habit.goal <= 0) return 0
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  let done = 0
  for (let d = 1; d <= daysInMonth; d++) {
    const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    if (habit.completedDays[key]) done++
  }
  return Math.min(100, Math.round(done / habit.goal * 100))
}

export function getHabitMonthDone(habit: Habit, year: number, month: number): number {
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  let done = 0
  for (let d = 1; d <= daysInMonth; d++) {
    const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    if (habit.completedDays[key]) done++
  }
  return done
}

export const MOTIVATIONAL_QUOTES = [
  { text: "No te conviertes en tus resultados. Te conviertes en tus hábitos.", author: "James Clear" },
  { text: "Cada acción es un voto por la persona que quieres ser.", author: "Atomic Habits" },
  { text: "El éxito es la suma de pequeños esfuerzos repetidos día tras día.", author: "Robert Collier" },
  { text: "Disciplina es hacer lo que odias como si lo amaras.", author: "Mike Tyson" },
  { text: "No necesitas motivación. Necesitas una rutina.", author: "Naval Ravikant" },
  { text: "El dolor de la disciplina pesa gramos. El dolor del arrepentimiento pesa toneladas.", author: "Jim Rohn" },
  { text: "Gana el día. El día gana la semana. La semana gana el mes.", author: "Gary Vee" },
  { text: "La identidad emerge de los hábitos. Cada hábito es un voto por tu tipo de persona.", author: "James Clear" },
  { text: "El mejor momento para empezar fue ayer. El segundo mejor momento es ahora.", author: "Proverbio Chino" },
  { text: "Sé la persona más disciplinada que conoces.", author: "Jocko Willink" },
]

export function getTodayQuote() {
  const idx = new Date().getDate() % MOTIVATIONAL_QUOTES.length
  return MOTIVATIONAL_QUOTES[idx]
}

export function getMotivationalMessage(score: number): string {
  if (score === 100) return '🔥 DÍA PERFECTO. ERES IMPARABLE.'
  if (score >= 80)  return '💎 CASI PERFECTO. CIERRA FUERTE.'
  if (score >= 60)  return '⚡ BUEN RITMO. NO PARES AHORA.'
  if (score >= 40)  return '🎯 A MITAD. ACELERA YA.'
  if (score >= 20)  return '🚀 ARRANCANDO MOTORES. VAMOS.'
  if (score > 0)    return '🌅 UN PASO A LA VEZ. EMPIEZA.'
  return '⚔️ HOY ES EL DÍA. A CONQUISTAR.'
}
