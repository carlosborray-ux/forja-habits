'use client'
import { useState } from 'react'
import { useAppData, JournalEntry } from '@/lib/store'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

const MOODS = ['😫', '😕', '😐', '🙂', '😄', '🔥']
const ENERGY = ['💀', '😴', '🐢', '⚡', '🚀', '🌋']
const PROMPTS = [
  '¿Qué victoria, por pequeña que sea, tuviste hoy?',
  '¿Qué hábito cumpliste y cómo te hizo sentir?',
  '¿Qué obstáculo enfrentaste y cómo lo superaste?',
  '¿Qué aprendiste hoy sobre ti mismo?',
  '¿Cómo puedes hacer mañana 1% mejor que hoy?',
]

export default function JournalPage() {
  const { data, saveJournal } = useAppData()
  const today = new Date().toISOString().split('T')[0]
  const todayEntry = data.journal[today]

  const [mood, setMood] = useState(todayEntry?.mood ?? 3)
  const [energy, setEnergy] = useState(todayEntry?.energy ?? 3)
  const [notes, setNotes] = useState(todayEntry?.notes ?? '')
  const [gratitude, setGratitude] = useState(todayEntry?.gratitude ?? '')
  const [wins, setWins] = useState(todayEntry?.wins ?? '')
  const [saved, setSaved] = useState(false)

  const randomPrompt = PROMPTS[new Date().getDate() % PROMPTS.length]

  const handleSave = () => {
    saveJournal(today, { date: today, mood, energy, notes, gratitude, wins })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const recentEntries = Object.values(data.journal)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 7)

  return (
    <div style={{ padding: '32px 40px', maxWidth: 900 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 900, margin: 0 }} className="gradient-text-purple">JOURNAL</h1>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
          {format(new Date(), "EEEE d 'de' MMMM", { locale: es })}
        </div>
      </div>

      {/* Mood & Energy */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        <div className="card">
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>MOOD</div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between' }}>
            {MOODS.map((m, i) => (
              <button key={i} onClick={() => setMood(i)} style={{
                fontSize: 28, padding: '8px 12px', borderRadius: 10, border: 'none', cursor: 'pointer',
                background: mood === i ? 'rgba(108,99,255,0.2)' : 'var(--bg-surface)',
                outline: mood === i ? '2px solid var(--accent-purple)' : 'none',
                transform: mood === i ? 'scale(1.2)' : 'scale(1)',
                transition: 'all 0.15s ease',
              }}>{m}</button>
            ))}
          </div>
        </div>
        <div className="card">
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>ENERGÍA</div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between' }}>
            {ENERGY.map((e, i) => (
              <button key={i} onClick={() => setEnergy(i)} style={{
                fontSize: 28, padding: '8px 12px', borderRadius: 10, border: 'none', cursor: 'pointer',
                background: energy === i ? 'rgba(0,212,170,0.2)' : 'var(--bg-surface)',
                outline: energy === i ? '2px solid var(--accent-teal)' : 'none',
                transform: energy === i ? 'scale(1.2)' : 'scale(1)',
                transition: 'all 0.15s ease',
              }}>{e}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Prompt */}
      <div className="card" style={{ marginBottom: 20, borderColor: 'var(--accent-purple)', background: 'rgba(108,99,255,0.05)' }}>
        <div style={{ fontSize: 11, color: 'var(--accent-purple)', marginBottom: 6 }}>💡 PREGUNTA DEL DÍA</div>
        <div style={{ fontSize: 15, color: 'var(--text-primary)', fontStyle: 'italic' }}>{randomPrompt}</div>
      </div>

      {/* Notes */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>REFLEXIÓN</div>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Escribe tu reflexión del día..."
          rows={4}
          style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 14, outline: 'none', resize: 'vertical', fontFamily: 'inherit' }}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        <div className="card">
          <div style={{ fontSize: 12, color: 'var(--accent-gold)', marginBottom: 10 }}>🙏 AGRADECIMIENTOS</div>
          <textarea
            value={gratitude}
            onChange={e => setGratitude(e.target.value)}
            placeholder="3 cosas por las que estás agradecido..."
            rows={3}
            style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 14, outline: 'none', resize: 'none', fontFamily: 'inherit' }}
          />
        </div>
        <div className="card">
          <div style={{ fontSize: 12, color: 'var(--accent-teal)', marginBottom: 10 }}>🏆 VICTORIAS DEL DÍA</div>
          <textarea
            value={wins}
            onChange={e => setWins(e.target.value)}
            placeholder="¿Qué ganaste hoy?"
            rows={3}
            style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 14, outline: 'none', resize: 'none', fontFamily: 'inherit' }}
          />
        </div>
      </div>

      <button onClick={handleSave} style={{ width: '100%', padding: '14px', background: saved ? 'var(--accent-teal)' : 'var(--accent-purple)', border: 'none', borderRadius: 10, color: 'white', fontWeight: 900, fontSize: 16, cursor: 'pointer', transition: 'background 0.2s', letterSpacing: 1 }}>
        {saved ? '✅ GUARDADO' : '💾 GUARDAR JOURNAL'}
      </button>

      {/* Recent */}
      {recentEntries.length > 0 && (
        <div className="card" style={{ marginTop: 28 }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>HISTORIAL RECIENTE</div>
          <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 4 }}>
            {recentEntries.map(e => (
              <div key={e.date} style={{ minWidth: 120, padding: '12px', background: 'var(--bg-surface)', borderRadius: 10, textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
                  {format(new Date(e.date + 'T12:00:00'), 'dd MMM', { locale: es })}
                </div>
                <div style={{ fontSize: 24 }}>{MOODS[e.mood]}</div>
                <div style={{ fontSize: 18 }}>{ENERGY[e.energy]}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
