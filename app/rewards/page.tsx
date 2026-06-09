'use client'
import { useState, useEffect } from 'react'
import { useAppData, Reward } from '@/lib/store'

const ICONS = ['📺', '🍕', '😴', '🛍️', '🎮', '🍫', '🏖️', '🎬', '🥂', '🍔', '💆', '🎯']

export default function RewardsPage() {
  const { data, redeemReward, addReward, deleteReward, setIdentity } = useAppData()
  const [showAdd, setShowAdd] = useState(false)
  const [newReward, setNewReward] = useState({ title: '', cost: 50, icon: '🎁' })
  const [identityInput, setIdentityInput] = useState(data.identity)
  useEffect(() => { setIdentityInput(data.identity) }, [data.identity])

  const IDENTITIES = ['Atleta de Élite', 'Trader Profesional', 'Máquina de Hábitos', 'Guerrero Mental', 'Billonario', 'Imparable']

  return (
    <div style={{ padding: '32px 40px', maxWidth: 900 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 900, margin: 0 }} className="gradient-text-gold">RECOMPENSAS</h1>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
          Canjea tu gold por recompensas reales
        </div>
      </div>

      {/* Gold balance */}
      <div className="card" style={{ marginBottom: 24, borderColor: 'rgba(255,217,61,0.4)', background: 'rgba(255,217,61,0.06)', padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ fontSize: 48 }}>🪙</div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: 2 }}>GOLD DISPONIBLE</div>
            <div style={{ fontSize: 48, fontWeight: 900, lineHeight: 1 }} className="gradient-text-gold">{data.gold}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>+5 gold por hábito · 500 XP = subir nivel</div>
          </div>
        </div>
      </div>

      {/* Identity selector */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="section-label">🔥 TU IDENTIDAD</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
          {IDENTITIES.map(id => (
            <button key={id} onClick={() => { setIdentityInput(id); setIdentity(id) }} style={{
              padding: '8px 16px', borderRadius: 99, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
              background: data.identity === id ? 'linear-gradient(135deg, var(--accent-purple), var(--accent-pink))' : 'rgba(255,255,255,0.06)',
              color: data.identity === id ? 'white' : 'var(--text-secondary)',
              boxShadow: data.identity === id ? '0 4px 20px rgba(124,111,255,0.4)' : 'none',
              transition: 'all 0.2s',
            }}>{id}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <input value={identityInput} onChange={e => setIdentityInput(e.target.value)} placeholder="O escribe tu propia identidad..."
            className="input-glass" style={{ flex: 1 }} />
          <button className="btn-primary" onClick={() => setIdentity(identityInput)}>Guardar</button>
        </div>
      </div>

      {/* Rewards grid */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div className="section-label" style={{ marginBottom: 0 }}>CATÁLOGO</div>
        <button className="btn-ghost" onClick={() => setShowAdd(true)} style={{ fontSize: 13 }}>+ Agregar recompensa</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14, marginBottom: 24 }}>
        {data.rewards.map(r => {
          const canAfford = data.gold >= r.cost
          return (
            <div key={r.id} className="card" style={{
              textAlign: 'center', opacity: r.redeemed ? 0.5 : 1,
              borderColor: canAfford && !r.redeemed ? 'rgba(255,217,61,0.3)' : 'var(--border)',
            }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>{r.icon}</div>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{r.title}</div>
              <div style={{ fontSize: 12, color: 'var(--accent-gold)', marginBottom: 12 }}>🪙 {r.cost} gold</div>
              {r.redeemed ? (
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>✅ Canjeado</div>
              ) : (
                <button onClick={() => redeemReward(r.id)} disabled={!canAfford} style={{
                  width: '100%', padding: '8px', borderRadius: 8, border: 'none', cursor: canAfford ? 'pointer' : 'not-allowed',
                  background: canAfford ? 'linear-gradient(135deg, #FFD93D, #FF6B6B)' : 'rgba(255,255,255,0.05)',
                  color: canAfford ? 'white' : 'var(--text-muted)',
                  fontWeight: 700, fontSize: 13, transition: 'all 0.2s',
                }}>{canAfford ? '🎁 Canjear' : 'Sin gold suficiente'}</button>
              )}
              <button onClick={() => deleteReward(r.id)} style={{
                width: '100%', marginTop: 6, padding: '5px', borderRadius: 7, border: 'none',
                background: 'rgba(255,80,80,0.08)', color: 'rgba(255,80,80,0.6)',
                cursor: 'pointer', fontSize: 11, fontWeight: 600,
              }}>🗑 Eliminar</button>
            </div>
          )
        })}
      </div>

      {/* Add reward modal */}
      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
          <div className="card" style={{ width: 380, padding: 28 }}>
            <h2 style={{ fontSize: 18, fontWeight: 900, marginBottom: 18 }}>+ Nueva Recompensa</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input value={newReward.title} onChange={e => setNewReward(p => ({ ...p, title: e.target.value }))} placeholder="Nombre de la recompensa" className="input-glass" />
              <input type="number" value={newReward.cost} onChange={e => setNewReward(p => ({ ...p, cost: Number(e.target.value) }))} placeholder="Costo en gold" className="input-glass" />
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>ICONO</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {ICONS.map(ic => (
                    <button key={ic} onClick={() => setNewReward(p => ({ ...p, icon: ic }))} style={{ width: 38, height: 38, borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 20, background: newReward.icon === ic ? 'rgba(124,111,255,0.3)' : 'rgba(255,255,255,0.05)', outline: newReward.icon === ic ? '2px solid var(--accent-purple)' : 'none' }}>{ic}</button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button className="btn-ghost" onClick={() => setShowAdd(false)} style={{ flex: 1 }}>Cancelar</button>
                <button className="btn-primary" style={{ flex: 1 }} onClick={() => {
                  if (!newReward.title.trim()) return
                  addReward({ id: Date.now().toString(), ...newReward, redeemed: false })
                  setNewReward({ title: '', cost: 50, icon: '🎁' })
                  setShowAdd(false)
                }}>Agregar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
