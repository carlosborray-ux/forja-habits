'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function AuthPage() {
  const [mode, setMode]       = useState<'login' | 'register'>('login')
  const [email, setEmail]     = useState('')
  const [password, setPassword] = useState('')
  const [name, setName]       = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [msg, setMsg]         = useState('')

  const handleSubmit = async () => {
    setError(''); setMsg(''); setLoading(true)
    if (!email || !password) { setError('Completa todos los campos'); setLoading(false); return }

    if (mode === 'register') {
      const { error: e } = await supabase.auth.signUp({
        email, password,
        options: { data: { full_name: name } }
      })
      if (e) setError(e.message)
      else setMsg('¡Cuenta creada! Revisa tu email para confirmar.')
    } else {
      const { error: e } = await supabase.auth.signInWithPassword({ email, password })
      if (e) setError(e.message)
    }
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-base)', padding: 20,
    }}>
      {/* Orbs */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', width: 500, height: 500, borderRadius: '50%', background: '#7C6FFF', top: -200, left: -100, filter: 'blur(80px)', opacity: 0.15 }} />
        <div style={{ position: 'absolute', width: 350, height: 350, borderRadius: '50%', background: '#00E5B8', bottom: -100, right: -100, filter: 'blur(80px)', opacity: 0.12 }} />
      </div>

      <div style={{ width: '100%', maxWidth: 400, position: 'relative', zIndex: 1 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div className="gradient-text-purple" style={{ fontSize: 48, fontWeight: 900, letterSpacing: -2, lineHeight: 1 }}>FORJA</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', letterSpacing: 3, marginTop: 4 }}>HÁBITOS & RUTINAS ✦ 2026</div>
        </div>

        {/* Card */}
        <div className="card" style={{ padding: 32 }}>
          {/* Toggle */}
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: 4, marginBottom: 24 }}>
            {(['login', 'register'] as const).map(m => (
              <button key={m} onClick={() => { setMode(m); setError(''); setMsg('') }} style={{
                flex: 1, padding: '9px', borderRadius: 8, border: 'none', cursor: 'pointer',
                background: mode === m ? 'var(--accent-purple)' : 'transparent',
                color: mode === m ? 'white' : 'var(--text-muted)',
                fontWeight: 700, fontSize: 14, transition: 'all 0.2s',
              }}>
                {m === 'login' ? 'Entrar' : 'Crear cuenta'}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {mode === 'register' && (
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 5, letterSpacing: 1 }}>NOMBRE</div>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Tu nombre"
                  className="input-glass" style={{ fontSize: 15 }} />
              </div>
            )}

            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 5, letterSpacing: 1 }}>EMAIL</div>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@email.com"
                className="input-glass" style={{ fontSize: 15 }} />
            </div>

            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 5, letterSpacing: 1 }}>CONTRASEÑA</div>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres" onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                className="input-glass" style={{ fontSize: 15 }} />
            </div>

            {error && (
              <div style={{ padding: '10px 14px', background: 'rgba(255,80,80,0.1)', border: '1px solid rgba(255,80,80,0.3)', borderRadius: 8, fontSize: 13, color: '#ff6b6b' }}>
                ⚠️ {error}
              </div>
            )}
            {msg && (
              <div style={{ padding: '10px 14px', background: 'rgba(0,229,184,0.1)', border: '1px solid rgba(0,229,184,0.3)', borderRadius: 8, fontSize: 13, color: 'var(--accent-teal)' }}>
                ✅ {msg}
              </div>
            )}

            <button onClick={handleSubmit} disabled={loading} className="btn-primary" style={{ width: '100%', padding: '13px', fontSize: 16, marginTop: 4, opacity: loading ? 0.7 : 1 }}>
              {loading ? '...' : mode === 'login' ? '⚔️ Entrar a FORJA' : '🚀 Crear mi cuenta'}
            </button>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: 'var(--text-muted)' }}>
          Tus datos se sincronizan entre todos tus dispositivos
        </div>
      </div>
    </div>
  )
}
