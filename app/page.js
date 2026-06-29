'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatBytes(bytes) {
  if (!bytes) return '0 B'
  const k = 1024, sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

function relativeTime(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'Just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function getMimeIcon(mimeType) {
  if (!mimeType) return { icon: 'draft', color: '#a4e6ff', bg: 'rgba(164,230,255,0.12)' }
  if (mimeType.startsWith('image/')) return { icon: 'image', color: '#4ade80', bg: 'rgba(74,222,128,0.12)' }
  if (mimeType === 'application/pdf') return { icon: 'description', color: '#a4e6ff', bg: 'rgba(0,209,255,0.12)' }
  if (mimeType.startsWith('video/')) return { icon: 'video_file', color: '#ffd59c', bg: 'rgba(255,213,156,0.12)' }
  if (mimeType.startsWith('audio/')) return { icon: 'audio_file', color: '#f472b6', bg: 'rgba(244,114,182,0.12)' }
  if (mimeType.includes('zip') || mimeType.includes('tar') || mimeType.includes('rar')) return { icon: 'folder_zip', color: '#fbbf24', bg: 'rgba(251,191,36,0.12)' }
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || mimeType.includes('csv')) return { icon: 'table_chart', color: '#34d399', bg: 'rgba(52,211,153,0.12)' }
  if (mimeType.includes('word') || mimeType.includes('document')) return { icon: 'article', color: '#60a5fa', bg: 'rgba(96,165,250,0.12)' }
  if (mimeType.includes('javascript') || mimeType.includes('json') || mimeType.includes('text/')) return { icon: 'code', color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' }
  return { icon: 'draft', color: '#a4e6ff', bg: 'rgba(164,230,255,0.12)' }
}

function getRoleColor(role) {
  if (role === 'ADMIN') return '#ffd59c'
  if (role === 'USER_PLUS') return '#00d1ff'
  return '#b7c8e1'
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function HomePage() {
  const router = useRouter()
  const dropZoneRef = useRef(null)

  const [user, setUser] = useState(null)
  const [folders, setFolders] = useState([])
  const [selectedFolder, setSelectedFolder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [downloadingId, setDownloadingId] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const [showCreateFolder, setShowCreateFolder] = useState(false)
  const [showUpload, setShowUpload] = useState(false)

  const [newFolderName, setNewFolderName] = useState('')
  const [newFolderPublic, setNewFolderPublic] = useState(false)
  const [folderLoading, setFolderLoading] = useState(false)
  const [folderError, setFolderError] = useState('')

  const [uploadFile, setUploadFile] = useState(null)
  const [uploadFolderId, setUploadFolderId] = useState('')
  const [uploadLoading, setUploadLoading] = useState(false)
  const [uploadError, setUploadError] = useState('')

  const fetchData = useCallback(async () => {
    try {
      const [meRes, foldersRes] = await Promise.all([fetch('/api/auth/me'), fetch('/api/folders')])
      if (!meRes.ok) { router.push('/login'); return }
      const meData = await meRes.json()
      const foldersData = await foldersRes.json()
      setUser(meData.user)
      setFolders(foldersData.folders || [])
    } catch { router.push('/login') }
    finally { setLoading(false) }
  }, [router])

  useEffect(() => { fetchData() }, [fetchData])

  useEffect(() => {
    const el = dropZoneRef.current
    if (!el) return
    const onDragOver = (e) => { e.preventDefault(); setIsDragging(true) }
    const onDragLeave = () => setIsDragging(false)
    const onDrop = (e) => {
      e.preventDefault(); setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) { setUploadFile(file); setShowUpload(true) }
    }
    el.addEventListener('dragover', onDragOver)
    el.addEventListener('dragleave', onDragLeave)
    el.addEventListener('drop', onDrop)
    return () => { el.removeEventListener('dragover', onDragOver); el.removeEventListener('dragleave', onDragLeave); el.removeEventListener('drop', onDrop) }
  }, [selectedFolder])

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  async function handleDownload(fileId, fileName) {
    setDownloadingId(fileId)
    try {
      const res = await fetch('/api/files/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId }),
      })
      if (!res.ok) { const d = await res.json(); alert(d.message); return }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      Object.assign(document.createElement('a'), { href: url, download: fileName }).click()
      URL.revokeObjectURL(url)
    } catch { alert('Download failed.') }
    finally { setDownloadingId(null) }
  }

  async function handleDeleteFile(fileId) {
    if (!confirm('Delete this file permanently?')) return
    const res = await fetch(`/api/files/${fileId}`, { method: 'DELETE' })
    const data = await res.json()
    if (data.success) {
      fetchData()
      setSelectedFolder((prev) => prev ? { ...prev, files: prev.files.filter((f) => f.id !== fileId) } : null)
    } else alert(data.message)
  }

  async function handleDeleteFolder(folderId) {
    if (!confirm('Delete this folder and ALL its files?')) return
    const res = await fetch(`/api/folders/${folderId}`, { method: 'DELETE' })
    const data = await res.json()
    if (data.success) { if (selectedFolder?.id === folderId) setSelectedFolder(null); fetchData() }
    else alert(data.message)
  }

  async function handleTogglePublic(folderId, isPublic) {
    const res = await fetch(`/api/folders/${folderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPublic: !isPublic }),
    })
    const data = await res.json()
    if (data.success) {
      fetchData()
      if (selectedFolder?.id === folderId) setSelectedFolder((p) => ({ ...p, isPublic: !isPublic }))
    } else alert(data.message)
  }

  async function handleCreateFolder(e) {
    e.preventDefault(); setFolderError(''); setFolderLoading(true)
    try {
      const res = await fetch('/api/folders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newFolderName, isPublic: newFolderPublic }),
      })
      const data = await res.json()
      if (data.success) { setShowCreateFolder(false); setNewFolderName(''); setNewFolderPublic(false); fetchData() }
      else setFolderError(data.message)
    } catch { setFolderError('Network error.') }
    finally { setFolderLoading(false) }
  }

  async function handleUpload(e) {
    e.preventDefault(); setUploadError('')
    if (!uploadFile) { setUploadError('Please select a file.'); return }
    if (!uploadFolderId) { setUploadError('Please select a folder.'); return }
    setUploadLoading(true)
    try {
      const form = new FormData()
      form.append('file', uploadFile); form.append('folderId', uploadFolderId)
      const res = await fetch('/api/files/upload', { method: 'POST', body: form })
      const data = await res.json()
      if (data.success) { setShowUpload(false); setUploadFile(null); setUploadFolderId(''); fetchData() }
      else setUploadError(data.message)
    } catch { setUploadError('Network error.') }
    finally { setUploadLoading(false) }
  }

  const canContribute = user?.role === 'USER_PLUS' || user?.role === 'ADMIN'
  const isAdmin = user?.role === 'ADMIN'
  const currentFiles = selectedFolder?.files || []
  const totalStorageBytes = folders.flatMap((f) => f.files).reduce((acc, f) => acc + (f.size || 0), 0)
  const allFiles = folders.flatMap((f) => f.files).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0b0f19' }}>
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-2 border-white/5 border-t-[#00d1ff] animate-spin mx-auto mb-4" />
          <p className="text-sm" style={{ color: '#859399' }}>Connecting to node...</p>
        </div>
      </div>
    )
  }

  // ── Sidebar content (shared between desktop + mobile drawer) ──────────────
  const SidebarContent = ({ onClose }) => (
    <>
      {/* Brand */}
      <div className="px-5 py-5 mb-2">
        <div className="flex items-center justify-between mb-5">
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

        {canContribute && (
          <button
            onClick={() => { setShowUpload(true); onClose?.() }}
            className="w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.97]"
            style={{ background: '#00d1ff', color: '#003543', boxShadow: '0 0 24px rgba(0,209,255,0.2)' }}
          >
            <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400" }}>upload_file</span>
            UPLOAD FILE
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        <p className="px-3 py-1 text-[10px] uppercase tracking-[0.12em] font-medium" style={{ color: '#859399' }}>Navigation</p>
        <button
          onClick={() => { setSelectedFolder(null); onClose?.() }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
          style={!selectedFolder
            ? { color: '#00d1ff', background: 'rgba(0,209,255,0.08)', borderLeft: '2px solid #00d1ff' }
            : { color: '#bbc9cf', borderLeft: '2px solid transparent', opacity: 0.7 }}
        >
          <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: `'FILL' ${!selectedFolder ? 1 : 0}, 'wght' 300` }}>folder_open</span>
          All Files
        </button>

        {folders.length > 0 && (
          <>
            <p className="px-3 py-2 text-[10px] uppercase tracking-[0.12em] font-medium mt-3" style={{ color: '#859399' }}>Folders</p>
            {folders.map((folder) => (
              <button
                key={folder.id}
                onClick={() => { setSelectedFolder(folder); onClose?.() }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all"
                style={selectedFolder?.id === folder.id
                  ? { color: '#00d1ff', background: 'rgba(0,209,255,0.08)', borderLeft: '2px solid #00d1ff', fontWeight: 500 }
                  : { color: '#bbc9cf', borderLeft: '2px solid transparent', opacity: 0.7 }}
              >
                <span className="material-symbols-outlined text-[18px]" style={{ color: selectedFolder?.id === folder.id ? '#00d1ff' : '#ffd59c', fontVariationSettings: "'FILL' 1, 'wght' 300" }}>folder</span>
                <span className="truncate flex-1 text-left">{folder.name}</span>
                {!folder.isPublic && (
                  <span className="material-symbols-outlined text-[14px]" style={{ color: '#859399', fontVariationSettings: "'FILL' 0, 'wght' 300" }}>lock</span>
                )}
              </button>
            ))}
          </>
        )}

        {canContribute && (
          <button
            onClick={() => { setShowCreateFolder(true); onClose?.() }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all mt-1"
            style={{ color: '#859399', borderLeft: '2px solid transparent' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#00d1ff'; e.currentTarget.style.opacity = '1' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#859399'; e.currentTarget.style.opacity = '0.7' }}
          >
            <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 0, 'wght' 300" }}>create_new_folder</span>
            New Folder
          </button>
        )}

        {isAdmin && (
          <>
            <div className="my-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }} />
            <button
              onClick={() => { router.push('/admin'); onClose?.() }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all"
              style={{ color: '#ffd59c', borderLeft: '2px solid transparent', opacity: 0.8 }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.background = 'rgba(255,213,156,0.06)' }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.8'; e.currentTarget.style.background = 'transparent' }}
            >
              <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 0, 'wght' 300" }}>dashboard</span>
              Admin Dashboard
            </button>
          </>
        )}
      </nav>

      {/* Storage + User */}
      <div className="p-4">
        <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex justify-between items-center mb-3">
            <span className="text-[11px] uppercase tracking-[0.1em] font-medium" style={{ color: '#859399' }}>Storage</span>
            <span className="material-symbols-outlined text-[16px]" style={{ color: '#00d1ff' }}>cloud_queue</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden mb-2" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <div className="h-full rounded-full" style={{ width: '65%', background: '#00d1ff', boxShadow: '0 0 10px rgba(0,209,255,0.5)' }} />
          </div>
          <p className="text-[10px]" style={{ color: '#859399', opacity: 0.6 }}>{formatBytes(totalStorageBytes)} used</p>
        </div>

        <div className="mt-3 p-3 rounded-xl flex items-center gap-3" style={{ background: 'rgba(255,255,255,0.03)' }}>
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
            style={{ background: `${getRoleColor(user?.role)}18`, color: getRoleColor(user?.role), border: `1px solid ${getRoleColor(user?.role)}30` }}>
            {user?.name?.charAt(0)?.toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-white truncate">{user?.name}</p>
            <p className="text-[10px] font-mono uppercase" style={{ color: getRoleColor(user?.role) }}>{user?.role?.replace('_', ' ')}</p>
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

      {/* ── DESKTOP SIDEBAR ─────────────────────────────────────────────── */}
      <aside
        className="hidden md:flex fixed left-0 top-0 h-screen w-64 flex-col z-40"
        style={{ background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(32px)', borderRight: '1px solid rgba(255,255,255,0.06)' }}
      >
        <SidebarContent />
      </aside>

      {/* ── MOBILE DRAWER ───────────────────────────────────────────────── */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0"
            style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
            onClick={() => setSidebarOpen(false)}
          />
          <aside
            className="absolute left-0 top-0 h-full w-72 flex flex-col overflow-y-auto"
            style={{ background: '#0f1420', borderRight: '1px solid rgba(255,255,255,0.08)', boxShadow: '8px 0 40px rgba(0,0,0,0.5)' }}
          >
            <SidebarContent onClose={() => setSidebarOpen(false)} />
          </aside>
        </div>
      )}

      {/* ── MAIN CONTENT ─────────────────────────────────────────────────── */}
      <main className="flex-1 md:ml-64 min-h-screen flex flex-col pb-16 md:pb-0">

        {/* ── MOBILE HEADER ─────────────────────────────────────────────── */}
        <header
          className="md:hidden sticky top-0 z-40 flex items-center gap-3 px-4 h-14"
          style={{ background: 'rgba(11,15,25,0.95)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          {selectedFolder ? (
            <button
              onClick={() => setSelectedFolder(null)}
              className="p-2 -ml-1 rounded-xl active:bg-white/5 flex-shrink-0"
            >
              <span className="material-symbols-outlined text-[22px]" style={{ color: '#00d1ff' }}>arrow_back</span>
            </button>
          ) : (
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 -ml-1 rounded-xl active:bg-white/5 flex-shrink-0"
            >
              <span className="material-symbols-outlined text-[22px]" style={{ color: '#bbc9cf' }}>menu</span>
            </button>
          )}

          <div className="flex items-center gap-2 flex-1 min-w-0">
            {!selectedFolder && (
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(0,209,255,0.12)', border: '1px solid rgba(0,209,255,0.2)' }}>
                <span className="material-symbols-outlined text-[14px]" style={{ color: '#00d1ff', fontVariationSettings: "'FILL' 1" }}>hub</span>
              </div>
            )}
            <span className="text-[15px] font-semibold text-white truncate">
              {selectedFolder ? selectedFolder.name : 'Lumina Drive'}
            </span>
            {selectedFolder && (
              <span
                className="text-[9px] font-mono px-1.5 py-0.5 rounded-full flex-shrink-0"
                style={selectedFolder.isPublic
                  ? { background: 'rgba(74,222,128,0.1)', color: '#4ade80' }
                  : { background: 'rgba(251,146,60,0.1)', color: '#fb923c' }}
              >
                {selectedFolder.isPublic ? 'PUBLIC' : 'PRIVATE'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            {canContribute && (
              <button
                onClick={() => {
                  if (selectedFolder) setUploadFolderId(String(selectedFolder.id))
                  setShowUpload(true)
                }}
                className="p-2 rounded-xl active:bg-white/5"
                style={{ background: 'rgba(0,209,255,0.08)' }}
              >
                <span className="material-symbols-outlined text-[20px]" style={{ color: '#00d1ff' }}>upload_file</span>
              </button>
            )}
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ background: `${getRoleColor(user?.role)}18`, color: getRoleColor(user?.role), border: `1px solid ${getRoleColor(user?.role)}25` }}
            >
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
          </div>
        </header>

        {/* ── DESKTOP TOP BAR ───────────────────────────────────────────── */}
        <header
          className="hidden md:flex sticky top-0 z-30 items-center justify-between px-6 h-16"
          style={{ background: 'rgba(11,15,25,0.85)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="flex items-center gap-2 text-sm" style={{ color: '#859399' }}>
            <button onClick={() => setSelectedFolder(null)} className="hover:text-white transition-colors">Root</button>
            {selectedFolder && (
              <>
                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                <span className="text-white">{selectedFolder.name}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <span className="material-symbols-outlined text-[16px]" style={{ color: '#859399' }}>search</span>
              <input
                type="text"
                placeholder="Search files..."
                className="bg-transparent text-sm outline-none w-44 placeholder:text-white/25"
                style={{ color: '#dfe2f1' }}
              />
            </div>
            <button className="p-2 rounded-lg transition-colors hover:bg-white/5">
              <span className="material-symbols-outlined text-[20px]" style={{ color: '#859399' }}>grid_view</span>
            </button>
            <button className="p-2 rounded-lg transition-colors hover:bg-white/5">
              <span className="material-symbols-outlined text-[20px]" style={{ color: '#859399' }}>list</span>
            </button>
          </div>
        </header>

        {/* ── PAGE CONTENT ──────────────────────────────────────────────── */}
        <div className="flex-1 p-4 md:p-6 max-w-[1440px] mx-auto w-full">

          {/* Page title */}
          <div className="flex items-start justify-between mb-6 md:mb-8 gap-3">
            <div className="min-w-0">
              <h1 className="text-2xl md:text-4xl font-bold tracking-tight text-white mb-1 truncate">
                {selectedFolder ? selectedFolder.name : 'Drive Explorer'}
              </h1>
              <p className="text-sm" style={{ color: '#bbc9cf' }}>
                {selectedFolder
                  ? `${currentFiles.length} files in this folder`
                  : 'Managed node: '}
                {!selectedFolder && (
                  <span className="font-mono" style={{ color: '#00d1ff' }}>LN-LOCAL-CORE</span>
                )}
              </p>
            </div>
            {selectedFolder && (
              <div className="hidden md:flex items-center gap-2 flex-shrink-0">
                <span
                  className="flex items-center gap-1.5 text-[11px] font-mono px-3 py-1 rounded-full"
                  style={selectedFolder.isPublic
                    ? { background: 'rgba(74,222,128,0.1)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.2)' }
                    : { background: 'rgba(251,146,60,0.1)', color: '#fb923c', border: '1px solid rgba(251,146,60,0.2)' }}
                >
                  <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    {selectedFolder.isPublic ? 'public' : 'lock'}
                  </span>
                  {selectedFolder.isPublic ? 'PUBLIC' : 'PRIVATE'}
                </span>
                {isAdmin && (
                  <button
                    onClick={() => handleTogglePublic(selectedFolder.id, selectedFolder.isPublic)}
                    className="text-xs px-3 py-1 rounded-full transition-all"
                    style={{ background: 'rgba(255,255,255,0.06)', color: '#bbc9cf', border: '1px solid rgba(255,255,255,0.1)' }}
                  >
                    Toggle
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Admin controls for folder visibility on mobile */}
          {selectedFolder && isAdmin && (
            <div className="md:hidden flex items-center gap-2 mb-4">
              <span
                className="flex items-center gap-1.5 text-[11px] font-mono px-3 py-1 rounded-full"
                style={selectedFolder.isPublic
                  ? { background: 'rgba(74,222,128,0.1)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.2)' }
                  : { background: 'rgba(251,146,60,0.1)', color: '#fb923c', border: '1px solid rgba(251,146,60,0.2)' }}
              >
                {selectedFolder.isPublic ? 'PUBLIC' : 'PRIVATE'}
              </span>
              <button
                onClick={() => handleTogglePublic(selectedFolder.id, selectedFolder.isPublic)}
                className="text-xs px-3 py-1 rounded-full"
                style={{ background: 'rgba(255,255,255,0.06)', color: '#bbc9cf', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                Toggle Visibility
              </button>
            </div>
          )}

          {/* ── DRAG & DROP ZONE ────────────────────────────────────────── */}
          {canContribute && selectedFolder && (
            <div
              ref={dropZoneRef}
              onClick={() => { setUploadFolderId(String(selectedFolder.id)); setShowUpload(true) }}
              className="mb-6 md:mb-8 p-5 md:p-8 rounded-2xl cursor-pointer transition-all flex flex-col items-center justify-center gap-3 md:gap-4 group"
              style={{
                border: `2px dashed ${isDragging ? '#00d1ff' : 'rgba(255,255,255,0.1)'}`,
                background: isDragging ? 'rgba(0,209,255,0.04)' : 'rgba(255,255,255,0.01)',
              }}
            >
              <div
                className="w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-transform group-hover:scale-110"
                style={{ background: 'rgba(0,209,255,0.08)' }}
              >
                <span className="material-symbols-outlined text-3xl md:text-4xl" style={{ color: '#00d1ff', fontVariationSettings: "'FILL' 0, 'wght' 200" }}>cloud_upload</span>
              </div>
              <div className="text-center">
                <p className="text-base md:text-lg font-semibold text-white mb-1">Upload New Assets</p>
                <p className="text-sm hidden md:block" style={{ color: '#859399' }}>
                  Drag and drop files here, or{' '}
                  <span style={{ color: '#00d1ff' }} className="underline underline-offset-2">browse your local drive</span>
                </p>
                <p className="text-sm md:hidden" style={{ color: '#859399' }}>Tap to browse and upload</p>
              </div>
              <div className="hidden md:flex gap-3 mt-1">
                {['description PDF, DOCX', 'image PNG, JPG', 'video_file MP4, MOV'].map((item) => {
                  const [icon, ...rest] = item.split(' ')
                  return (
                    <div key={icon} className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] uppercase tracking-widest font-medium"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#859399' }}>
                      <span className="material-symbols-outlined text-[14px]">{icon}</span>
                      {rest.join(' ')}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── FOLDER GRID ─────────────────────────────────────────────── */}
          {!selectedFolder && (
            <>
              {folders.length === 0 ? (
                <EmptyState title="No folders yet" subtitle={canContribute ? 'Create your first virtual folder.' : 'No folders have been shared with you.'} icon="folder_off" />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4 mb-8 md:mb-10">
                  {folders.map((folder) => (
                    <FolderCard
                      key={folder.id}
                      folder={folder}
                      userId={user?.id}
                      isAdmin={isAdmin}
                      canContribute={canContribute}
                      onOpen={() => setSelectedFolder(folder)}
                      onDelete={() => handleDeleteFolder(folder.id)}
                      onToggle={() => handleTogglePublic(folder.id, folder.isPublic)}
                    />
                  ))}
                  {canContribute && (
                    <button
                      onClick={() => setShowCreateFolder(true)}
                      className="p-6 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-3 transition-all group min-h-[140px] md:min-h-[160px]"
                      style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.01)' }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(0,209,255,0.4)'; e.currentTarget.style.background = 'rgba(0,209,255,0.03)' }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.background = 'rgba(255,255,255,0.01)' }}
                    >
                      <span className="material-symbols-outlined text-4xl transition-all group-hover:scale-110" style={{ color: '#859399', fontVariationSettings: "'FILL' 0, 'wght' 200" }}>add_circle</span>
                      <span className="text-xs font-mono uppercase tracking-widest" style={{ color: '#859399' }}>New Folder</span>
                    </button>
                  )}
                </div>
              )}

              {/* Recent Activity */}
              {allFiles.length > 0 && (
                <section>
                  <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
                  <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    {/* Mobile: card list */}
                    <div className="md:hidden divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                      {allFiles.map((file) => {
                        const { icon, color } = getMimeIcon(file.mimeType)
                        return (
                          <div key={file.id} className="flex items-center gap-3 px-4 py-3">
                            <span className="material-symbols-outlined text-[20px] flex-shrink-0" style={{ color, fontVariationSettings: "'FILL' 0, 'wght' 300" }}>{icon}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-white truncate">{file.originalName}</p>
                              <p className="text-[11px] mt-0.5" style={{ color: '#859399' }}>
                                {file.uploadedBy?.name} · {relativeTime(file.createdAt)} · {formatBytes(file.size)}
                              </p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    {/* Desktop: table */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            {['File Name', 'Folder', 'Owner', 'Modified', 'Size'].map((h) => (
                              <th key={h} className="px-5 py-3 text-[10px] uppercase tracking-widest font-medium whitespace-nowrap" style={{ color: '#859399' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {allFiles.map((file) => {
                            const { icon, color } = getMimeIcon(file.mimeType)
                            const parentFolder = folders.find((f) => f.id === file.folderId)
                            return (
                              <tr
                                key={file.id}
                                className="transition-colors"
                                style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                              >
                                <td className="px-5 py-3.5">
                                  <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-[18px]" style={{ color, fontVariationSettings: "'FILL' 0, 'wght' 300" }}>{icon}</span>
                                    <span className="text-sm font-medium text-white truncate max-w-[180px]">{file.originalName}</span>
                                  </div>
                                </td>
                                <td className="px-5 py-3.5">
                                  <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.06)', color: '#bbc9cf' }}>
                                    {parentFolder?.name || '—'}
                                  </span>
                                </td>
                                <td className="px-5 py-3.5">
                                  <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold" style={{ background: 'rgba(0,209,255,0.12)', color: '#00d1ff' }}>
                                      {file.uploadedBy?.name?.charAt(0)?.toUpperCase()}
                                    </div>
                                    <span className="text-sm" style={{ color: '#bbc9cf' }}>{file.uploadedBy?.name}</span>
                                  </div>
                                </td>
                                <td className="px-5 py-3.5 text-sm whitespace-nowrap" style={{ color: '#859399' }}>{relativeTime(file.createdAt)}</td>
                                <td className="px-5 py-3.5 text-sm font-mono whitespace-nowrap" style={{ color: '#859399' }}>{formatBytes(file.size)}</td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </section>
              )}
            </>
          )}

          {/* ── FILE GRID ───────────────────────────────────────────────── */}
          {selectedFolder && (
            <>
              {currentFiles.length === 0 ? (
                <EmptyState
                  title="Folder is empty"
                  subtitle={canContribute ? 'Upload files or tap the upload button above.' : 'No files in this folder.'}
                  icon="folder_open"
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
                  {currentFiles.map((file) => (
                    <FileCard
                      key={file.id}
                      file={file}
                      userId={user?.id}
                      isAdmin={isAdmin}
                      canContribute={canContribute}
                      downloading={downloadingId === file.id}
                      onDownload={() => handleDownload(file.id, file.originalName)}
                      onDelete={() => handleDeleteFile(file.id)}
                    />
                  ))}
                  {canContribute && (
                    <button
                      onClick={() => { setUploadFolderId(String(selectedFolder.id)); setShowUpload(true) }}
                      className="p-6 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-3 transition-all group min-h-[180px] md:min-h-[200px]"
                      style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.01)' }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(0,209,255,0.4)'; e.currentTarget.style.background = 'rgba(0,209,255,0.03)' }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.background = 'rgba(255,255,255,0.01)' }}
                    >
                      <span className="material-symbols-outlined text-4xl transition-all group-hover:scale-110" style={{ color: '#859399', fontVariationSettings: "'FILL' 0, 'wght' 200" }}>add_circle</span>
                      <span className="text-xs font-mono uppercase tracking-widest" style={{ color: '#859399' }}>Add New Entry</span>
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* ── MOBILE BOTTOM NAV ───────────────────────────────────────────── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40"
        style={{ background: 'rgba(11,15,25,0.97)', backdropFilter: 'blur(24px)', borderTop: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div className="flex items-center">
          <button
            onClick={() => setSelectedFolder(null)}
            className="flex-1 flex flex-col items-center py-2.5 gap-0.5 active:bg-white/5 transition-colors"
          >
            <span className="material-symbols-outlined text-[22px]" style={{ color: !selectedFolder ? '#00d1ff' : '#859399', fontVariationSettings: `'FILL' ${!selectedFolder ? 1 : 0}` }}>folder_open</span>
            <span className="text-[10px] font-medium" style={{ color: !selectedFolder ? '#00d1ff' : '#859399' }}>Files</span>
          </button>

          {canContribute && (
            <button
              onClick={() => {
                if (selectedFolder) setUploadFolderId(String(selectedFolder.id))
                setShowUpload(true)
              }}
              className="flex-1 flex flex-col items-center py-2.5 gap-0.5 active:bg-white/5 transition-colors"
            >
              <span className="material-symbols-outlined text-[22px]" style={{ color: '#859399' }}>upload_file</span>
              <span className="text-[10px] font-medium" style={{ color: '#859399' }}>Upload</span>
            </button>
          )}

          {canContribute && (
            <button
              onClick={() => setShowCreateFolder(true)}
              className="flex-1 flex flex-col items-center py-2.5 gap-0.5 active:bg-white/5 transition-colors"
            >
              <span className="material-symbols-outlined text-[22px]" style={{ color: '#859399' }}>create_new_folder</span>
              <span className="text-[10px] font-medium" style={{ color: '#859399' }}>Folder</span>
            </button>
          )}

          {isAdmin && (
            <button
              onClick={() => router.push('/admin')}
              className="flex-1 flex flex-col items-center py-2.5 gap-0.5 active:bg-white/5 transition-colors"
            >
              <span className="material-symbols-outlined text-[22px]" style={{ color: '#859399' }}>dashboard</span>
              <span className="text-[10px] font-medium" style={{ color: '#859399' }}>Admin</span>
            </button>
          )}

          <button
            onClick={handleLogout}
            className="flex-1 flex flex-col items-center py-2.5 gap-0.5 active:bg-white/5 transition-colors"
          >
            <span className="material-symbols-outlined text-[22px]" style={{ color: '#859399' }}>logout</span>
            <span className="text-[10px] font-medium" style={{ color: '#859399' }}>Logout</span>
          </button>
        </div>
      </nav>

      {/* ── MODALS ──────────────────────────────────────────────────────── */}
      {showCreateFolder && (
        <Modal title="Create Virtual Folder" onClose={() => { setShowCreateFolder(false); setFolderError('') }}>
          <form onSubmit={handleCreateFolder} className="space-y-5">
            <FormField label="Folder Name">
              <input
                type="text" value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="e.g. Research Papers" required
                className="w-full px-3 py-2.5 rounded-xl text-sm text-white bg-transparent outline-none transition-all"
                style={{ border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)' }}
                onFocus={(e) => (e.target.style.borderColor = '#00d1ff')}
                onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
              />
            </FormField>
            <label className="flex items-center gap-3 cursor-pointer">
              <div
                className="relative rounded-full transition-colors cursor-pointer flex-shrink-0"
                style={{ background: newFolderPublic ? '#00d1ff' : 'rgba(255,255,255,0.1)', height: '22px', width: '40px' }}
                onClick={() => setNewFolderPublic(!newFolderPublic)}
              >
                <div className="absolute rounded-full bg-white transition-all" style={{ width: '18px', height: '18px', left: newFolderPublic ? '20px' : '2px', top: '2px' }} />
              </div>
              <div>
                <p className="text-sm text-white">Allow regular users to see this folder</p>
                <p className="text-[11px] mt-0.5" style={{ color: '#859399' }}>
                  {newFolderPublic ? 'All authenticated users can view' : 'Contributors and admins only'}
                </p>
              </div>
            </label>
            {folderError && <p className="text-sm" style={{ color: '#ffb4ab' }}>{folderError}</p>}
            <ModalActions onCancel={() => { setShowCreateFolder(false); setFolderError('') }} loading={folderLoading} label="Create Folder" />
          </form>
        </Modal>
      )}

      {showUpload && (
        <Modal title="Upload File" onClose={() => { setShowUpload(false); setUploadFile(null); setUploadError('') }}>
          <form onSubmit={handleUpload} className="space-y-5">
            <FormField label="Target Folder">
              <select
                value={uploadFolderId} onChange={(e) => setUploadFolderId(e.target.value)} required
                className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#dfe2f1' }}
              >
                <option value="" style={{ background: '#1c1f2a' }}>Select a folder...</option>
                {folders.map((f) => <option key={f.id} value={f.id} style={{ background: '#1c1f2a' }}>{f.name}</option>)}
              </select>
            </FormField>
            <FormField label="File">
              <label
                className="flex flex-col items-center p-6 rounded-xl cursor-pointer transition-all"
                style={{
                  border: `2px dashed ${uploadFile ? 'rgba(0,209,255,0.5)' : 'rgba(255,255,255,0.1)'}`,
                  background: uploadFile ? 'rgba(0,209,255,0.04)' : 'rgba(255,255,255,0.02)',
                }}
              >
                <input type="file" className="hidden" onChange={(e) => setUploadFile(e.target.files[0])} />
                <span className="material-symbols-outlined text-3xl mb-2" style={{ color: uploadFile ? '#00d1ff' : '#859399' }}>
                  {uploadFile ? 'check_circle' : 'cloud_upload'}
                </span>
                <p className="text-sm text-center" style={{ color: uploadFile ? '#00d1ff' : '#859399' }}>
                  {uploadFile ? uploadFile.name : 'Tap to select a file'}
                </p>
                {uploadFile && <p className="text-xs mt-1" style={{ color: '#859399' }}>{formatBytes(uploadFile.size)}</p>}
              </label>
            </FormField>
            {uploadLoading && (
              <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <div className="h-full rounded-full" style={{ background: '#00d1ff', width: '70%' }} />
              </div>
            )}
            {uploadError && <p className="text-sm" style={{ color: '#ffb4ab' }}>{uploadError}</p>}
            <ModalActions onCancel={() => { setShowUpload(false); setUploadFile(null) }} loading={uploadLoading} label="Upload File" />
          </form>
        </Modal>
      )}
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}>
      <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-6 pb-8 sm:pb-6" style={{ background: 'rgba(28,31,42,0.99)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 -8px 60px rgba(0,0,0,0.5)' }}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg transition-colors hover:bg-white/5">
            <span className="material-symbols-outlined text-[20px]" style={{ color: '#859399' }}>close</span>
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

function FormField({ label, children }) {
  return (
    <div>
      <label className="block text-[10px] uppercase tracking-[0.12em] font-medium mb-2" style={{ color: '#859399' }}>{label}</label>
      {children}
    </div>
  )
}

function ModalActions({ onCancel, loading, label }) {
  return (
    <div className="flex gap-3 pt-1">
      <button type="button" onClick={onCancel}
        className="flex-1 py-3 rounded-xl text-sm font-medium transition-all"
        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#bbc9cf' }}>
        Cancel
      </button>
      <button type="submit" disabled={loading}
        className="flex-1 py-3 rounded-xl text-sm font-bold transition-all active:scale-[0.98] disabled:opacity-50"
        style={{ background: '#00d1ff', color: '#003543' }}>
        {loading ? 'Processing...' : label}
      </button>
    </div>
  )
}

function EmptyState({ title, subtitle, icon }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 md:py-28 text-center">
      <span className="material-symbols-outlined text-6xl mb-4" style={{ color: '#859399', opacity: 0.3, fontVariationSettings: "'FILL' 0, 'wght' 200" }}>{icon}</span>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-sm max-w-xs" style={{ color: '#859399' }}>{subtitle}</p>
    </div>
  )
}

function FolderCard({ folder, userId, isAdmin, canContribute, onOpen, onDelete, onToggle }) {
  const totalSize = folder.files?.reduce((acc, f) => acc + (f.size || 0), 0) || 0
  const canDelete = isAdmin || (canContribute && folder.createdById === userId)
  return (
    <div
      className="rounded-2xl p-4 md:p-5 cursor-pointer group transition-all relative"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
      onClick={onOpen}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(0,209,255,0.3)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
    >
      <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
        {isAdmin && (
          <button onClick={onToggle} className="p-1.5 rounded-lg transition-colors hover:bg-white/10">
            <span className="material-symbols-outlined text-[16px]" style={{ color: folder.isPublic ? '#4ade80' : '#fb923c', fontVariationSettings: "'FILL' 0, 'wght' 300" }}>
              {folder.isPublic ? 'visibility' : 'visibility_off'}
            </span>
          </button>
        )}
        {canDelete && (
          <button onClick={onDelete} className="p-1.5 rounded-lg transition-colors hover:bg-red-500/10">
            <span className="material-symbols-outlined text-[16px]" style={{ color: '#ffb4ab', fontVariationSettings: "'FILL' 0, 'wght' 300" }}>delete</span>
          </button>
        )}
      </div>

      <div className="flex items-start gap-3 mb-3 md:mb-4">
        <div className="w-11 h-11 md:w-12 md:h-12 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(255,213,156,0.12)', border: '1px solid rgba(255,213,156,0.15)' }}>
          <span className="material-symbols-outlined text-[24px] md:text-[28px]" style={{ color: '#ffd59c', fontVariationSettings: "'FILL' 1, 'wght' 400" }}>folder</span>
        </div>
        <div className="min-w-0 pt-1">
          <h3 className="text-[14px] md:text-[15px] font-semibold text-white truncate">{folder.name}</h3>
          <p className="text-xs mt-0.5" style={{ color: '#859399' }}>by {folder.createdBy?.name}</p>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <span className="text-[11px] font-mono" style={{ color: '#859399' }}>
          {folder.files?.length || 0} files · {formatBytes(totalSize)}
        </span>
        <span
          className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full uppercase"
          style={folder.isPublic
            ? { background: 'rgba(74,222,128,0.08)', color: '#4ade80' }
            : { background: 'rgba(251,146,60,0.08)', color: '#fb923c' }}>
          {folder.isPublic ? 'Public' : 'Private'}
        </span>
      </div>
    </div>
  )
}

function FileCard({ file, userId, isAdmin, canContribute, downloading, onDownload, onDelete }) {
  const { icon, color, bg } = getMimeIcon(file.mimeType)
  const canDelete = isAdmin || (canContribute && file.uploadedById === userId)
  const date = new Date(file.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  return (
    <div
      className="rounded-2xl overflow-hidden group transition-all relative"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(0,209,255,0.3)'; e.currentTarget.style.boxShadow = '0 0 20px rgba(0,209,255,0.05)' }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.boxShadow = 'none' }}
    >
      <div className="p-4 md:p-5 pb-3 md:pb-4">
        <div className="flex justify-between items-start mb-3 md:mb-4">
          <div className="w-11 h-11 md:w-12 md:h-12 rounded-xl flex items-center justify-center" style={{ background: bg }}>
            <span className="material-symbols-outlined text-[24px] md:text-[28px]" style={{ color, fontVariationSettings: "'FILL' 0, 'wght' 300" }}>{icon}</span>
          </div>
          {canDelete && (
            <button onClick={onDelete} className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg transition-all hover:bg-red-500/10">
              <span className="material-symbols-outlined text-[16px]" style={{ color: '#ffb4ab', fontVariationSettings: "'FILL' 0, 'wght' 300" }}>delete</span>
            </button>
          )}
        </div>

        <h4 className="text-[13px] md:text-[14px] font-semibold text-white truncate mb-1" title={file.originalName}>{file.originalName}</h4>
        <p className="text-[11px] md:text-[12px] font-mono" style={{ color: '#859399' }}>
          {file.mimeType?.split('/')[1]?.toUpperCase() || 'FILE'} · {formatBytes(file.size)}
        </p>

        <div className="mt-2 md:mt-3 flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
            style={{ background: 'rgba(74,222,128,0.08)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.15)' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" style={{ boxShadow: '0 0 4px #4ade80' }} />
            Synced
          </div>
        </div>
      </div>

      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="px-4 md:px-5 py-2.5 md:py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold"
              style={{ background: 'rgba(0,209,255,0.12)', color: '#00d1ff' }}>
              {file.uploadedBy?.name?.charAt(0)?.toUpperCase()}
            </div>
            <span className="text-[11px]" style={{ color: '#859399' }}>{file.uploadedBy?.name}</span>
          </div>
          <span className="text-[10px]" style={{ color: '#859399', opacity: 0.6 }}>{date}</span>
        </div>
        <div className="px-4 md:px-5 pb-4">
          <button
            onClick={onDownload}
            disabled={downloading}
            className="w-full py-2.5 rounded-xl text-xs font-mono uppercase tracking-wider transition-all flex items-center justify-center gap-2 hover:brightness-110 disabled:opacity-50 active:scale-[0.98]"
            style={{ background: 'rgba(255,255,255,0.05)', color: '#bbc9cf', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            {downloading ? (
              <><span className="w-3 h-3 rounded-full border border-current border-t-transparent animate-spin" />Downloading...</>
            ) : (
              <><span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 0, 'wght' 300" }}>download</span>Download</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
