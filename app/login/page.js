'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.message || 'Login failed.'); return }
      window.location.href = '/'
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: '#0b0f19' }}
    >
      {/* Background radial glow */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(0,209,255,0.07) 0%, transparent 65%)',
        }}
      />
      {/* Grid lines subtle overlay */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      <div
        className="relative w-full max-w-[420px] rounded-2xl p-10"
        style={{
          background: 'rgba(255, 255, 255, 0.03)',
          backdropFilter: 'blur(40px)',
          WebkitBackdropFilter: 'blur(40px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
        }}
      >
        {/* Top cyan accent line */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-px rounded-full"
          style={{ background: 'linear-gradient(90deg, transparent, #00d1ff60, transparent)' }}
        />

        {/* Icon */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5"
            style={{
              background: 'rgba(0, 209, 255, 0.08)',
              border: '1px solid rgba(0, 209, 255, 0.18)',
              boxShadow: '0 0 40px rgba(0,209,255,0.08)',
            }}
          >
            <span className="material-symbols-outlined text-4xl" style={{ color: '#00d1ff', fontVariationSettings: "'FILL' 0, 'wght' 300" }}>
              lock_open
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Lumina Gate</h1>
          <p className="text-sm" style={{ color: '#bbc9cf' }}>
            Secure local network authentication
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email */}
          <div>
            <label
              className="block text-[10px] font-medium uppercase tracking-[0.12em] mb-2"
              style={{ color: '#859399' }}
            >
              Network Identifier
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@local.net"
              required
              autoComplete="email"
              className="w-full bg-transparent text-white placeholder:text-white/20 text-sm py-2.5 outline-none transition-all"
              style={{
                borderBottom: '1px solid rgba(255,255,255,0.12)',
                caretColor: '#00d1ff',
              }}
              onFocus={(e) => (e.target.style.borderBottomColor = '#00d1ff')}
              onBlur={(e) => (e.target.style.borderBottomColor = 'rgba(255,255,255,0.12)')}
            />
          </div>

          {/* Password */}
          <div>
            <label
              className="block text-[10px] font-medium uppercase tracking-[0.12em] mb-2"
              style={{ color: '#859399' }}
            >
              Access Cipher
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
              className="w-full bg-transparent text-white placeholder:text-white/20 text-sm py-2.5 outline-none transition-all"
              style={{
                borderBottom: '1px solid rgba(255,255,255,0.12)',
                caretColor: '#00d1ff',
              }}
              onFocus={(e) => (e.target.style.borderBottomColor = '#00d1ff')}
              onBlur={(e) => (e.target.style.borderBottomColor = 'rgba(255,255,255,0.12)')}
            />
          </div>

          {/* Error */}
          {error && (
            <div
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm"
              style={{ background: 'rgba(255,180,171,0.08)', border: '1px solid rgba(255,180,171,0.2)' }}
            >
              <span className="material-symbols-outlined text-base" style={{ color: '#ffb4ab', fontVariationSettings: "'FILL' 1" }}>
                error
              </span>
              <span style={{ color: '#ffb4ab' }}>{error}</span>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl text-sm font-bold tracking-wide transition-all active:scale-[0.98] disabled:opacity-60 mt-2"
            style={{
              background: '#00d1ff',
              color: '#003543',
              boxShadow: loading ? 'none' : '0 0 40px rgba(0,209,255,0.25)',
            }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span
                  className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin"
                />
                Authenticating...
              </span>
            ) : (
              'Establish Connection'
            )}
          </button>
        </form>

        {/* Footer status */}
        <div className="mt-8 pt-6 text-center" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="flex items-center justify-center gap-2">
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: '#4ade80', boxShadow: '0 0 6px #4ade80', animation: 'pulse 2s infinite' }}
            />
            <p className="text-[10px] uppercase tracking-[0.14em] font-medium" style={{ color: '#859399' }}>
              System Status: <span style={{ color: '#4ade80' }}>Operational</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
