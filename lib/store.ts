'use client'
import { useState, useEffect } from 'react'

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

export interface AppData {
  habits: Habit[]
  categories: Category[]
  weights: WeightEntry[]
  journal: Record<string, JournalEntry>
  agenda: AgendaBlock[]
  water: Record<string, WaterLog>
  rewards: Reward[]
  xp: number
  level: number
  gold: number
  identity: string
}

const DEFAULT_HABITS: Habit[] = [
  { id: '1',  name: 'Cero Azúcar',       color: '#FF6B6B', icon: '🚫', category: 'Salud',      goal: 31, completedDays: {}, createdAt: new Date().toISOString(), stack: 'Mañana' },
  { id: '2',  name: 'Cero Carb',          color: '#FF6B6B', icon: '🥩', category: 'Salud',      goal: 31, completedDays: {}, createdAt: new Date().toISOString(), stack: 'Mañana' },
  { id: '3',  name: '3 Termos de Agua',   color: '#4FC3F7', icon: '💧', category: 'Salud',      goal: 31, completedDays: {}, createdAt: new Date().toISOString(), stack: 'Día' },
  { id: '4',  name: '1h Ejercicio',       color: '#00E5B8', icon: '🏋️', category: 'Fitness',    goal: 31, completedDays: {}, createdAt: new Date().toISOString(), stack: 'Mañana' },
  { id: '5',  name: 'Estirar',            color: '#00E5B8', icon: '🧘', category: 'Fitness',    goal: 31, completedDays: {}, createdAt: new Date().toISOString(), stack: 'Mañana' },
  { id: '6',  name: 'Meditar',            color: '#7C6FFF', icon: '🧠', category: 'Mente',      goal: 31, completedDays: {}, createdAt: new Date().toISOString(), stack: 'Mañana' },
  { id: '7',  name: 'Visualizar',         color: '#7C6FFF', icon: '👁️', category: 'Mente',      goal: 31, completedDays: {}, createdAt: new Date().toISOString(), stack: 'Mañana' },
  { id: '8',  name: 'Agradecer',          color: '#FFD93D', icon: '🙏', category: 'Mente',      goal: 31, completedDays: {}, createdAt: new Date().toISOString(), stack: 'Mañana' },
  { id: '9',  name: 'Lectura/Audio',      color: '#FFD93D', icon: '📚', category: 'Crecimiento',goal: 31, completedDays: {}, createdAt: new Date().toISOString(), stack: 'Noche' },
  { id: '10', name: 'Dormir 7h+',         color: '#9B59B6', icon: '😴', category: 'Salud',      goal: 31, completedDays: {}, createdAt: new Date().toISOString(), stack: 'Noche' },
  { id: '11', name: 'BIT',                color: '#FF6B6B', icon: '📈', category: 'Trading',    goal: 31, completedDays: {}, createdAt: new Date().toISOString(), stack: 'Trabajo' },
  { id: '12', name: 'EOD Review',         color: '#FF6B6B', icon: '📊', category: 'Trading',    goal: 31, completedDays: {}, createdAt: new Date().toISOString(), stack: 'Noche' },
  { id: '13', name: 'Cuadro LQ',          color: '#7C6FFF', icon: '✍️', category: 'Trading',    goal: 31, completedDays: {}, createdAt: new Date().toISOString(), stack: 'Noche' },
  { id: '14', name: '2 Comidas / Horario',color: '#00E5B8', icon: '🍽️', category: 'Salud',      goal: 31, completedDays: {}, createdAt: new Date().toISOString(), stack: 'Día' },
  { id: '15', name: 'Ducha Fría',         color: '#4FC3F7', icon: '🚿', category: 'Fitness',    goal: 31, completedDays: {}, createdAt: new Date().toISOString(), stack: 'Mañana' },
  { id: '16', name: 'Sin Redes 2h+',      color: '#FF4FA3', icon: '📵', category: 'Mente',      goal: 31, completedDays: {}, createdAt: new Date().toISOString(), stack: 'Día' },
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

const DEFAULT_DATA: AppData = {
  habits: DEFAULT_HABITS,
  categories: DEFAULT_CATEGORIES,
  weights: [],
  journal: {},
  agenda: [],
  water: {},
  rewards: DEFAULT_REWARDS,
  xp: 0,
  level: 1,
  gold: 0,
  identity: 'Élite',
}

export function useAppData() {
  const [data, setData] = useState<AppData>(DEFAULT_DATA)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('habit-tracker-v2')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setData(prev => ({
          ...prev,
          ...parsed,
          // Si el guardado no tiene categorías, usar las por defecto
          categories: parsed.categories?.length ? parsed.categories : DEFAULT_CATEGORIES,
          rewards: parsed.rewards?.length ? parsed.rewards : DEFAULT_REWARDS,
        }))
      } catch {}
    }
    setLoaded(true)
  }, [])

  useEffect(() => {
    if (loaded) localStorage.setItem('habit-tracker-v2', JSON.stringify(data))
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

  const addWeight      = (e: WeightEntry) => setData(prev => ({ ...prev, weights: [...prev.weights.filter(w => w.date !== e.date), e].sort((a,b) => a.date.localeCompare(b.date)) }))
  const saveJournal    = (date: string, e: JournalEntry) => setData(prev => ({ ...prev, journal: { ...prev.journal, [date]: e } }))
  const addAgendaBlock    = (b: AgendaBlock) => setData(prev => ({ ...prev, agenda: [...prev.agenda, b] }))
  const updateAgendaBlock = (b: AgendaBlock) => setData(prev => ({ ...prev, agenda: prev.agenda.map(x => x.id === b.id ? b : x) }))
  const deleteAgendaBlock = (id: string) => setData(prev => ({ ...prev, agenda: prev.agenda.filter(b => b.id !== id) }))
  const toggleAgenda      = (id: string) => setData(prev => ({ ...prev, agenda: prev.agenda.map(b => b.id === id ? { ...b, done: !b.done } : b) }))
  const addHabit       = (h: Habit) => setData(prev => ({ ...prev, habits: [...prev.habits, h] }))
  const updateHabit    = (h: Habit) => setData(prev => ({ ...prev, habits: prev.habits.map(x => x.id === h.id ? h : x) }))
  const deleteHabit    = (id: string) => setData(prev => ({ ...prev, habits: prev.habits.filter(h => h.id !== id) }))
  const setIdentity    = (i: string) => setData(prev => ({ ...prev, identity: i }))
  const redeemReward   = (id: string) => setData(prev => {
    const r = prev.rewards.find(r => r.id === id)
    if (!r || prev.gold < r.cost) return prev
    return { ...prev, gold: prev.gold - r.cost, rewards: prev.rewards.map(rw => rw.id === id ? { ...rw, redeemed: true } : rw) }
  })
  const setWater = (date: string, glasses: number) => setData(prev => ({
    ...prev, water: { ...prev.water, [date]: { date, glasses, goal: 8 } }
  }))
  const addCategory    = (c: Category) => setData(prev => ({ ...prev, categories: [...prev.categories, c] }))
  const updateCategory = (c: Category) => setData(prev => ({ ...prev, categories: prev.categories.map(x => x.id === c.id ? c : x) }))
  const deleteCategory = (id: string) => setData(prev => ({ ...prev, categories: prev.categories.filter(c => c.id !== id) }))

  return { data, loaded, toggleHabit, addWeight, saveJournal, addAgendaBlock, updateAgendaBlock, deleteAgendaBlock, toggleAgenda, addHabit, updateHabit, deleteHabit, setIdentity, redeemReward, setWater, addCategory, updateCategory, deleteCategory }
}

export const getTodayKey  = () => new Date().toISOString().split('T')[0]
export const getDateKey   = (d: Date) => d.toISOString().split('T')[0]

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

/** Cumplimiento de un hábito en un mes dado vs su meta individual */
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
