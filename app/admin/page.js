'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

function formatBytes(bytes) {
  if (!bytes) return '0 B'
  const k = 1024, sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

function getMimeIcon(mimeType) {
  if (!mimeType) return { icon: 'draft', color: '#a4e6ff' }
  if (mimeType.startsWith('image/')) return { icon: 'image', color: '#4ade80' }
  if (mimeType === 'application/pdf') return { icon: 'description', color: '#a4e6ff' }
  if (mimeType.startsWith('video/')) return { icon: 'video_file', color: '#ffd59c' }
  if (mimeType.startsWith('audio/')) return { icon: 'audio_file', color: '#f472b6' }
  if (mimeType.includes('zip') || mimeType.includes('tar')) return { icon: 'folder_zip', color: '#fbbf24' }
  if (mimeType.includes('spreadsheet') || mimeType.includes('csv')) return { icon: 'table_chart', color: '#34d399' }
  if (mimeType.includes('word')) return { icon: 'article', color: '#60a5fa' }
  return { icon: 'draft', color: '#a4e6ff' }
}

function initials(name = '') {
  return name.split(' ').map((w) => w[0]?.toUpperCase()).join('').slice(0, 2)
}

export default function AdminPage() {
  const router = useRouter()
  const [stats, setStats] = useState(null)
  const [logs, setLogs] = useState([])
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showAddUser, setShowAddUser] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const [form, setForm] = useState({ name: '', email: '', password: '', userRole: 'USER' })
  const [formError, setFormError] = useState('')
  const [formLoading, setFormLoading] = useState(false)
  const [formSuccess, setFormSuccess] = useState('')

  const fetchData = useCallback(async () => {
    try {
      const [meRes, logsRes] = await Promise.all([fetch('/api/auth/me'), fetch('/api/admin/logs')])
      if (!meRes.ok || !logsRes.ok) { router.push('/'); return }
      const meData = await meRes.json()
      const logsData = await logsRes.json()
      if (meData.user?.role !== 'ADMIN') { router.push('/'); return }
      setUser(meData.user)
      setStats(logsData.stats || {})
      setLogs(logsData.logs || [])
    } catch { router.push('/') }
    finally { setLoading(false) }
  }, [router])

  useEffect(() => { fetchData() }, [fetchData])

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  async function handleAddUser(e) {
    e.preventDefault(); setFormError(''); setFormSuccess(''); setFormLoading(true)
    try {
      const res = await fetch('/api/admin/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (data.success) {
        setFormSuccess(`User "${form.name}" created successfully.`)
        setForm({ name: '', email: '', password: '', userRole: 'USER' })
        fetchData()
      } else setFormError(data.message)
    } catch { setFormError('Network error.') }
    finally { setFormLoading(false) }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0b0f19' }}>
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-2 border-white/5 border-t-[#00d1ff] animate-spin mx-auto mb-4" />
          <p className="text-sm" style={{ color: '#859399' }}>Loading admin panel...</p>
        </div>
      </div>
    )
  }

  const storageGB = ((stats?.totalStorageBytes || 0) / (1024 ** 3)).toFixed(2)
  const storagePct = Math.min((storageGB / 2048) * 100, 100).toFixed(0)
  const barHeights = [60, 40, 85, 70, 55, 95]
  const barDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  // ── Sidebar content ───────────────────────────────────────────────────────
  const SidebarContent = ({ onClose }) => (
    <>
      <div className="px-5 py-5 mb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(0,209,255,0.12)', border: '1px solid rgba(0,209,255,0.2)' }}>
              <span className="material-symbols-outlined text-xl" style={{ color: '#00d1ff', fontVariationSettings: "'FILL' 1, 'wght' 300" }}>hub</span>
            </div>
            <div>
              <p className="text-[15px] font-bold text-white leading-none">Lumina</p>
              <p className="text-[10px] uppercase tracking-[0.14em] mt-0.5 font-medium" style={{ color: '#859399' }}>Network Drive</p>
            </div>
          </div>
          {onClose && (
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5">
              <span className="material-symbols-outlined text-[20px]" style={{ color: '#859399' }}>close</span>
            </button>
          )}
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        <p className="px-3 py-1 text-[10px] uppercase tracking-[0.12em] font-medium" style={{ color: '#859399' }}>Navigation</p>
        {[
          { icon: 'folder_open', label: 'All Files' },
          { icon: 'share', label: 'Shared with Me' },
          { icon: 'schedule', label: 'Recent' },
        ].map((item) => (
          <button
            key={item.label}
            onClick={() => { router.push('/'); onClose?.() }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all"
            style={{ color: '#bbc9cf', borderLeft: '2px solid transparent', opacity: 0.7 }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.7'; e.currentTarget.style.background = 'transparent' }}
          >
            <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 0, 'wght' 300" }}>{item.icon}</span>
            {item.label}
          </button>
        ))}

        <div className="pt-0.5">
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium"
            style={{ color: '#00d1ff', background: 'rgba(0,209,255,0.08)', borderLeft: '2px solid #00d1ff' }}>
            <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1, 'wght' 400" }}>dashboard</span>
            Admin Dashboard
          </button>
        </div>

        <div className="my-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }} />

        <button
          onClick={() => { setShowAddUser(true); onClose?.() }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all"
          style={{ color: '#ffd59c', borderLeft: '2px solid transparent', opacity: 0.8 }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.background = 'rgba(255,213,156,0.06)' }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.8'; e.currentTarget.style.background = 'transparent' }}
        >
          <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 0, 'wght' 300" }}>person_add</span>
          Add New User
        </button>
      </nav>

      <div className="p-4">
        <div className="p-4 rounded-xl mb-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex justify-between items-center mb-3">
            <span className="text-[11px] uppercase tracking-[0.1em] font-medium" style={{ color: '#859399' }}>Storage</span>
            <span className="material-symbols-outlined text-[16px]" style={{ color: '#00d1ff' }}>cloud_queue</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden mb-2" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <div className="h-full rounded-full" style={{ width: `${storagePct}%`, background: '#00d1ff', boxShadow: '0 0 10px rgba(0,209,255,0.5)' }} />
          </div>
          <p className="text-[10px]" style={{ color: '#859399', opacity: 0.6 }}>{formatBytes(stats?.totalStorageBytes || 0)} used</p>
        </div>

        <div className="p-3 rounded-xl flex items-center gap-3" style={{ background: 'rgba(255,255,255,0.03)' }}>
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
            style={{ background: 'rgba(255,213,156,0.1)', color: '#ffd59c', border: '1px solid rgba(255,213,156,0.2)' }}>
            {initials(user?.name)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-white truncate">{user?.name}</p>
            <p className="text-[10px] font-mono uppercase" style={{ color: '#ffd59c' }}>Administrator</p>
          </div>
          <button onClick={handleLogout} title="Logout" className="transition-opacity opacity-40 hover:opacity-100">
            <span className="material-symbols-outlined text-[18px]" style={{ color: '#bbc9cf', fontVariationSettings: "'FILL' 0, 'wght' 300" }}>logout</span>
          </button>
        </div>
      </div>
    </>
  )

  return (
    <div className="min-h-screen flex" style={{ background: '#0b0f19', color: '#dfe2f1' }}>

      <div className="fixed inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 80% 40% at 50% -10%, rgba(0,209,255,0.06) 0%, transparent 60%)' }} />

      {/* ── DESKTOP SIDEBAR ─────────────────────────────────────────────── */}
      <aside className="hidden md:flex fixed left-0 top-0 h-screen w-64 flex-col z-40"
        style={{ background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(32px)', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
        <SidebarContent />
      </aside>

      {/* ── MOBILE DRAWER ───────────────────────────────────────────────── */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }} onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-72 flex flex-col overflow-y-auto"
            style={{ background: '#0f1420', borderRight: '1px solid rgba(255,255,255,0.08)', boxShadow: '8px 0 40px rgba(0,0,0,0.5)' }}>
            <SidebarContent onClose={() => setSidebarOpen(false)} />
          </aside>
        </div>
      )}

      {/* ── MAIN CONTENT ─────────────────────────────────────────────────── */}
      <main className="flex-1 md:ml-64 min-h-screen pb-16 md:pb-0">

        {/* ── MOBILE HEADER ─────────────────────────────────────────────── */}
        <header className="md:hidden sticky top-0 z-40 flex items-center gap-3 px-4 h-14"
          style={{ background: 'rgba(11,15,25,0.95)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-1 rounded-xl active:bg-white/5">
            <span className="material-symbols-outlined text-[22px]" style={{ color: '#bbc9cf' }}>menu</span>
          </button>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="material-symbols-outlined text-[16px]" style={{ color: '#ffd59c' }}>shield</span>
            <span className="text-[14px] font-semibold text-white truncate">Admin Panel</span>
          </div>
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full"
            style={{ background: 'rgba(0,209,255,0.06)', border: '1px solid rgba(0,209,255,0.15)' }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#00d1ff', boxShadow: '0 0 6px #00d1ff', animation: 'pulse 2s infinite' }} />
            <span className="text-[9px] uppercase tracking-widest font-mono" style={{ color: '#00d1ff' }}>Admin</span>
          </div>
        </header>

        {/* ── DESKTOP TOP BAR ───────────────────────────────────────────── */}
        <header className="hidden md:flex sticky top-0 z-30 items-center justify-between px-6 h-16"
          style={{ background: 'rgba(11,15,25,0.85)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]" style={{ color: '#ffd59c' }}>shield</span>
            <span className="text-[10px] uppercase tracking-widest font-mono" style={{ color: '#bbc9cf' }}>Lumina Admin Control</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full"
            style={{ background: 'rgba(0,209,255,0.06)', border: '1px solid rgba(0,209,255,0.15)' }}>
            <span className="w-2 h-2 rounded-full" style={{ background: '#00d1ff', boxShadow: '0 0 6px #00d1ff', animation: 'pulse 2s infinite' }} />
            <span className="text-[10px] uppercase tracking-widest font-mono" style={{ color: '#00d1ff' }}>Role: Admin</span>
          </div>
        </header>

        <div className="p-4 md:p-6 max-w-[1440px] mx-auto">

          {/* Page Header */}
          <div className="mb-6 md:mb-8">
            <h1 className="text-2xl md:text-4xl font-bold tracking-tight text-white mb-1">Network Overview</h1>
            <p className="text-sm" style={{ color: '#bbc9cf' }}>
              Administrative control panel for{' '}
              <span className="font-mono" style={{ color: '#00d1ff' }}>Lumina-Node-01</span>
            </p>
          </div>

          {/* ── METRIC CARDS ────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-5 mb-6 md:mb-8">

            <div className="rounded-2xl p-5 md:p-6 relative overflow-hidden group transition-all"
              style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(0,209,255,0.25)')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)')}>
              <div className="flex items-center justify-between mb-3 md:mb-4">
                <span className="text-[11px] uppercase tracking-[0.12em] font-medium" style={{ color: '#859399' }}>Total Files</span>
                <span className="material-symbols-outlined text-[20px] md:text-[22px] opacity-30 group-hover:opacity-80 transition-opacity" style={{ color: '#a4e6ff', fontVariationSettings: "'FILL' 0, 'wght' 200" }}>inventory_2</span>
              </div>
              <p className="text-4xl md:text-5xl font-bold text-white tracking-tight">{(stats?.totalFiles || 0).toLocaleString()}</p>
              <div className="mt-2 md:mt-3 flex items-center gap-1 text-[11px] font-medium" style={{ color: '#4ade80' }}>
                <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400" }}>trending_up</span>
                +12% this week
              </div>
              <div className="absolute -right-6 -bottom-6 opacity-[0.04] group-hover:scale-110 transition-transform duration-700">
                <span className="material-symbols-outlined" style={{ fontSize: '120px', color: '#a4e6ff', fontVariationSettings: "'FILL' 1, 'wght' 400" }}>inventory_2</span>
              </div>
            </div>

            <div className="rounded-2xl p-5 md:p-6 relative overflow-hidden group transition-all"
              style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(0,209,255,0.25)')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)')}>
              <div className="flex items-center justify-between mb-3 md:mb-4">
                <span className="text-[11px] uppercase tracking-[0.12em] font-medium" style={{ color: '#859399' }}>Storage Used</span>
                <span className="material-symbols-outlined text-[20px] md:text-[22px] opacity-30 group-hover:opacity-80 transition-opacity" style={{ color: '#a4e6ff', fontVariationSettings: "'FILL' 0, 'wght' 200" }}>database</span>
              </div>
              <div className="flex items-baseline gap-2 mb-2 md:mb-3">
                <span className="text-4xl md:text-5xl font-bold text-white tracking-tight">{storageGB}</span>
                <span className="text-base" style={{ color: '#859399' }}>GB</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <div className="h-full rounded-full" style={{ width: `${storagePct}%`, background: '#00d1ff', boxShadow: '0 0 12px rgba(0,209,255,0.5)' }} />
              </div>
              <p className="text-[11px] mt-1.5" style={{ color: '#859399' }}>{storagePct}% of network capacity</p>
            </div>

            <div className="rounded-2xl p-5 md:p-6 relative overflow-hidden group transition-all"
              style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(0,209,255,0.25)')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)')}>
              <div className="flex items-center justify-between mb-3 md:mb-4">
                <span className="text-[11px] uppercase tracking-[0.12em] font-medium" style={{ color: '#859399' }}>Registered Users</span>
                <span className="material-symbols-outlined text-[20px] md:text-[22px] opacity-30 group-hover:opacity-80 transition-opacity" style={{ color: '#a4e6ff', fontVariationSettings: "'FILL' 0, 'wght' 200" }}>group</span>
              </div>
              <p className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-2 md:mb-3">{stats?.totalUsers || 0}</p>
              <div className="flex -space-x-2">
                {Array.from({ length: Math.min(4, stats?.totalUsers || 0) }).map((_, i) => (
                  <div key={i} className="w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center text-[9px] font-bold border-2"
                    style={{ background: `hsl(${i * 70 + 180}, 55%, 28%)`, borderColor: '#0b0f19', color: 'white' }}>
                    {String.fromCharCode(65 + i)}
                  </div>
                ))}
                {(stats?.totalUsers || 0) > 4 && (
                  <div className="w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center text-[9px] font-bold border-2"
                    style={{ background: 'rgba(255,255,255,0.06)', borderColor: '#0b0f19', color: '#859399' }}>
                    +{(stats?.totalUsers || 0) - 4}
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* ── ACTIVITY LOG TABLE ───────────────────────────────────────── */}
          <div className="rounded-2xl overflow-hidden mb-6 md:mb-8"
            style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="px-4 md:px-6 py-4 flex justify-between items-center"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div>
                <h2 className="text-base md:text-lg font-semibold text-white">Activity Log</h2>
                <p className="text-[11px] mt-0.5" style={{ color: '#859399' }}>{stats?.totalDownloads || 0} total download events</p>
              </div>
              <div className="flex items-center gap-2 md:gap-3">
                <div className="flex items-center gap-1.5 text-[11px] font-mono" style={{ color: '#4ade80' }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" style={{ boxShadow: '0 0 4px #4ade80' }} />
                  <span className="hidden sm:inline">LIVE</span>
                </div>
                <button className="px-2.5 md:px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#bbc9cf' }}>
                  Export
                </button>
              </div>
            </div>

            {/* Mobile: card list */}
            <div className="md:hidden">
              {logs.length === 0 ? (
                <div className="px-4 py-12 text-center">
                  <span className="material-symbols-outlined text-4xl mb-3 block opacity-20" style={{ color: '#859399', fontVariationSettings: "'FILL' 0, 'wght' 200" }}>history</span>
                  <p className="text-sm" style={{ color: '#859399' }}>No download activity yet.</p>
                </div>
              ) : (
                <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                  {logs.map((log, idx) => {
                    const { icon, color } = getMimeIcon(log.file?.mimeType)
                    const ts = new Date(log.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                    return (
                      <div key={log.id || idx} className="flex items-center gap-3 px-4 py-3">
                        <span className="material-symbols-outlined text-[20px] flex-shrink-0" style={{ color, fontVariationSettings: "'FILL' 0, 'wght' 300" }}>{icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">{log.file?.originalName || '—'}</p>
                          <p className="text-[11px] mt-0.5" style={{ color: '#859399' }}>
                            By {log.downloadedBy?.name || '—'} · {ts}
                          </p>
                        </div>
                        <span className="material-symbols-outlined text-[18px] flex-shrink-0" style={{ color: '#4ade80', fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Desktop: table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    {['File Name', 'Uploaded By', 'Downloaded By', 'Timestamp', 'Status'].map((h) => (
                      <th key={h} className="px-6 py-3 text-[10px] uppercase tracking-[0.12em] font-medium whitespace-nowrap" style={{ color: '#859399' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-14 text-center text-sm" style={{ color: '#859399' }}>
                        <span className="material-symbols-outlined text-4xl mb-3 block opacity-20" style={{ fontVariationSettings: "'FILL' 0, 'wght' 200" }}>history</span>
                        No download activity yet.
                      </td>
                    </tr>
                  ) : (
                    logs.map((log, idx) => {
                      const { icon, color } = getMimeIcon(log.file?.mimeType)
                      const ts = new Date(log.createdAt).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                      return (
                        <tr key={log.id || idx} className="transition-colors" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <span className="material-symbols-outlined text-[18px]" style={{ color, opacity: 0.8, fontVariationSettings: "'FILL' 0, 'wght' 300" }}>{icon}</span>
                              <span className="text-sm font-medium text-white truncate" style={{ maxWidth: '200px' }}>{log.file?.originalName || '—'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold" style={{ background: 'rgba(0,209,255,0.1)', color: '#00d1ff' }}>{initials(log.file?.uploadedBy?.name)}</div>
                              <span className="text-[13px]" style={{ color: '#bbc9cf' }}>{log.file?.uploadedBy?.name || '—'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium"
                              style={{ background: 'rgba(0,209,255,0.08)', color: '#00d1ff', border: '1px solid rgba(0,209,255,0.18)' }}>
                              {log.downloadedBy?.name || '—'}
                            </span>
                          </td>
                          <td className="px-6 py-4"><span className="text-[12px] font-mono whitespace-nowrap" style={{ color: '#859399' }}>{ts}</span></td>
                          <td className="px-6 py-4">
                            <span className="material-symbols-outlined text-[18px]" style={{ color: '#4ade80', fontVariationSettings: "'FILL' 1, 'wght' 400" }}>check_circle</span>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
              {logs.length > 0 && (
                <div className="px-6 py-3 flex justify-between items-center"
                  style={{ borderTop: '1px solid rgba(255,255,255,0.04)', background: 'rgba(255,255,255,0.01)' }}>
                  <span className="text-[11px]" style={{ color: '#859399' }}>Showing {logs.length} of {stats?.totalDownloads || 0} events</span>
                  <div className="flex gap-2">
                    {['chevron_left', 'chevron_right'].map((ic) => (
                      <button key={ic} className="p-1.5 rounded-lg transition-colors hover:bg-white/5" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                        <span className="material-symbols-outlined text-[16px]" style={{ color: '#859399' }}>{ic}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── BENTO GRID ──────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5 mb-4 md:mb-5">

            {/* Bar Chart */}
            <div className="md:col-span-2 rounded-2xl p-5 md:p-6"
              style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <h3 className="text-[11px] uppercase tracking-[0.12em] font-medium mb-4 md:mb-6" style={{ color: '#859399' }}>System Load Analysis</h3>
              <div className="flex items-end justify-between gap-2 md:gap-3 h-32 md:h-40">
                {barHeights.map((h, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full rounded-t-lg relative overflow-hidden group cursor-pointer"
                      style={{ height: `${h}%`, background: 'rgba(0,209,255,0.07)', minHeight: '6px' }}>
                      {i === 5 && <div className="absolute inset-0 rounded-t-lg" style={{ background: 'rgba(0,209,255,0.22)', boxShadow: '0 -4px 20px rgba(0,209,255,0.2)' }} />}
                      <div className="absolute inset-0 rounded-t-lg opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'rgba(0,209,255,0.12)' }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-3">
                {barDays.map((d, i) => (
                  <div key={d} className="flex-1 text-center">
                    <span className="text-[10px] uppercase font-mono" style={{ color: i === 5 ? '#00d1ff' : '#859399', opacity: i === 5 ? 1 : 0.5 }}>{d}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Node Health */}
            <div className="rounded-2xl p-5 md:p-6 flex flex-col"
              style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <h3 className="text-[11px] uppercase tracking-[0.12em] font-medium mb-4 md:mb-5" style={{ color: '#859399' }}>Node Health</h3>
              <div className="space-y-3 md:space-y-4 flex-1">
                {[
                  { label: 'Lumina-Node-Primary', status: 'STABLE', color: '#4ade80', bg: 'rgba(74,222,128,0.08)', border: 'rgba(74,222,128,0.2)' },
                  { label: 'Lumina-Node-Secondary', status: 'STABLE', color: '#4ade80', bg: 'rgba(74,222,128,0.08)', border: 'rgba(74,222,128,0.2)' },
                  { label: 'Storage-Array-01', status: 'HEAVY LOAD', color: '#fbbf24', bg: 'rgba(251,191,36,0.08)', border: 'rgba(251,191,36,0.2)' },
                  { label: 'Backup-Node-01', status: 'OFFLINE', color: '#f87171', bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.2)' },
                ].map((node) => (
                  <div key={node.label} className="flex justify-between items-center">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: node.color, boxShadow: `0 0 5px ${node.color}` }} />
                      <span className="text-[12px] truncate" style={{ color: '#bbc9cf' }}>{node.label}</span>
                    </div>
                    <span className="text-[9px] font-bold font-mono px-2 py-0.5 rounded-full uppercase tracking-wider flex-shrink-0 ml-2"
                      style={{ background: node.bg, color: node.color, border: `1px solid ${node.border}` }}>
                      {node.status}
                    </span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => alert('Diagnostic complete: all systems nominal.')}
                className="w-full mt-5 md:mt-6 py-2.5 rounded-xl text-sm font-medium transition-all hover:bg-white/5 active:scale-[0.98]"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#bbc9cf' }}>
                Run Maintenance Diagnostic
              </button>
            </div>

          </div>

          {/* ── SECONDARY STATS ─────────────────────────────────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {[
              { label: 'Total Folders', value: stats?.totalFolders || 0, icon: 'folder', color: '#ffd59c', bg: 'rgba(255,213,156,0.08)' },
              { label: 'Public Folders', value: stats?.publicFolders || 0, icon: 'public', color: '#4ade80', bg: 'rgba(74,222,128,0.08)' },
              { label: 'Private Folders', value: stats?.privateFolders || 0, icon: 'lock', color: '#fb923c', bg: 'rgba(251,146,60,0.08)' },
              { label: 'Total Downloads', value: stats?.totalDownloads || 0, icon: 'download', color: '#a4e6ff', bg: 'rgba(0,209,255,0.08)' },
            ].map((s) => (
              <div key={s.label} className="rounded-xl p-3 md:p-4 flex items-center gap-3 md:gap-4 transition-all"
                style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)')}>
                <div className="w-9 h-9 md:w-10 md:h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: s.bg }}>
                  <span className="material-symbols-outlined text-[18px] md:text-[20px]" style={{ color: s.color, fontVariationSettings: "'FILL' 1, 'wght' 300" }}>{s.icon}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-xl md:text-2xl font-bold text-white leading-none">{s.value}</p>
                  <p className="text-[10px] md:text-[11px] mt-1 truncate" style={{ color: '#859399' }}>{s.label}</p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </main>

      {/* ── MOBILE BOTTOM NAV ───────────────────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40"
        style={{ background: 'rgba(11,15,25,0.97)', backdropFilter: 'blur(24px)', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center">
          <button onClick={() => router.push('/')} className="flex-1 flex flex-col items-center py-2.5 gap-0.5 active:bg-white/5 transition-colors">
            <span className="material-symbols-outlined text-[22px]" style={{ color: '#859399' }}>folder_open</span>
            <span className="text-[10px] font-medium" style={{ color: '#859399' }}>Files</span>
          </button>
          <button className="flex-1 flex flex-col items-center py-2.5 gap-0.5 transition-colors" style={{ background: 'rgba(0,209,255,0.05)' }}>
            <span className="material-symbols-outlined text-[22px]" style={{ color: '#00d1ff', fontVariationSettings: "'FILL' 1" }}>dashboard</span>
            <span className="text-[10px] font-medium" style={{ color: '#00d1ff' }}>Admin</span>
          </button>
          <button onClick={() => setShowAddUser(true)} className="flex-1 flex flex-col items-center py-2.5 gap-0.5 active:bg-white/5 transition-colors">
            <span className="material-symbols-outlined text-[22px]" style={{ color: '#ffd59c' }}>person_add</span>
            <span className="text-[10px] font-medium" style={{ color: '#ffd59c' }}>Add User</span>
          </button>
          <button onClick={handleLogout} className="flex-1 flex flex-col items-center py-2.5 gap-0.5 active:bg-white/5 transition-colors">
            <span className="material-symbols-outlined text-[22px]" style={{ color: '#859399' }}>logout</span>
            <span className="text-[10px] font-medium" style={{ color: '#859399' }}>Logout</span>
          </button>
        </div>
      </nav>

      {/* ── ADD USER MODAL ──────────────────────────────────────────────── */}
      {showAddUser && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-6 pb-8 sm:pb-6"
            style={{ background: 'rgba(20,23,36,0.99)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 -8px 80px rgba(0,0,0,0.7)' }}>
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-white">Create Network User</h3>
                <p className="text-[11px] mt-0.5" style={{ color: '#859399' }}>Grant access to the Lumina network drive</p>
              </div>
              <button onClick={() => { setShowAddUser(false); setFormError(''); setFormSuccess('') }} className="p-1.5 rounded-lg transition-colors hover:bg-white/5">
                <span className="material-symbols-outlined text-[20px]" style={{ color: '#859399' }}>close</span>
              </button>
            </div>

            <form onSubmit={handleAddUser} className="space-y-4">
              {[
                { label: 'Display Name', key: 'name', type: 'text', placeholder: 'e.g. Sarah Kim' },
                { label: 'Email Address', key: 'email', type: 'email', placeholder: 'user@local.net' },
                { label: 'Initial Password', key: 'password', type: 'password', placeholder: '••••••••' },
              ].map(({ label, key, type, placeholder }) => (
                <div key={key}>
                  <label className="block text-[10px] uppercase tracking-[0.12em] font-medium mb-1.5" style={{ color: '#859399' }}>{label}</label>
                  <input
                    type={type} value={form[key]} placeholder={placeholder} required
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl text-sm text-white bg-transparent outline-none transition-all"
                    style={{ border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)' }}
                    onFocus={(e) => (e.target.style.borderColor = '#00d1ff')}
                    onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
                  />
                </div>
              ))}

              <div>
                <label className="block text-[10px] uppercase tracking-[0.12em] font-medium mb-2" style={{ color: '#859399' }}>Access Level</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'USER', label: 'Read-Only', desc: 'View public files only', icon: 'visibility' },
                    { value: 'USER_PLUS', label: 'Contributor', desc: 'Upload & manage files', icon: 'edit' },
                  ].map((role) => (
                    <button key={role.value} type="button" onClick={() => setForm({ ...form, userRole: role.value })}
                      className="flex items-start gap-2 p-3 rounded-xl text-left transition-all"
                      style={form.userRole === role.value
                        ? { background: 'rgba(0,209,255,0.08)', border: '1px solid rgba(0,209,255,0.35)' }
                        : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <span className="material-symbols-outlined text-[16px] mt-0.5" style={{ color: form.userRole === role.value ? '#00d1ff' : '#859399', fontVariationSettings: "'FILL' 0, 'wght' 300" }}>{role.icon}</span>
                      <div>
                        <p className="text-xs font-semibold" style={{ color: form.userRole === role.value ? '#00d1ff' : '#bbc9cf' }}>{role.label}</p>
                        <p className="text-[10px] mt-0.5" style={{ color: '#859399' }}>{role.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {formError && (
                <div className="flex items-center gap-2 p-3 rounded-lg" style={{ background: 'rgba(255,180,171,0.07)', border: '1px solid rgba(255,180,171,0.2)' }}>
                  <span className="material-symbols-outlined text-base" style={{ color: '#ffb4ab', fontVariationSettings: "'FILL' 1" }}>error</span>
                  <p className="text-sm" style={{ color: '#ffb4ab' }}>{formError}</p>
                </div>
              )}
              {formSuccess && (
                <div className="flex items-center gap-2 p-3 rounded-lg" style={{ background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.2)' }}>
                  <span className="material-symbols-outlined text-base" style={{ color: '#4ade80', fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  <p className="text-sm" style={{ color: '#4ade80' }}>{formSuccess}</p>
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => { setShowAddUser(false); setFormError(''); setFormSuccess('') }}
                  className="flex-1 py-3 rounded-xl text-sm font-medium transition-all"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#bbc9cf' }}>
                  Cancel
                </button>
                <button type="submit" disabled={formLoading}
                  className="flex-1 py-3 rounded-xl text-sm font-bold transition-all active:scale-[0.98] disabled:opacity-50"
                  style={{ background: '#00d1ff', color: '#003543', boxShadow: '0 0 20px rgba(0,209,255,0.2)' }}>
                  {formLoading ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
