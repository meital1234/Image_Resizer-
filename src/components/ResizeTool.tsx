'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  initialCredits: number
  name: string
}

interface ResizeResults {
  cover: string
  contain: string
  dimensions: { width: number; height: number }
}

export default function ResizeTool({ initialCredits, name }: Props) {
  const router = useRouter()

  // ── Credits (updated locally after each resize) ───────────────────────────
  const [credits, setCredits] = useState(initialCredits)

  // ── View: which panel is shown ────────────────────────────────────────────
  const [view, setView] = useState<'input' | 'results'>('input')
  const [results, setResults] = useState<ResizeResults | null>(null)
  const [strategy, setStrategy] = useState<'cover' | 'contain'>('cover')

  // ── Image source ──────────────────────────────────────────────────────────
  const [inputType, setInputType] = useState<'url' | 'file'>('url')
  const [url, setUrl] = useState('')
  const [file, setFile] = useState<File | null>(null)
  // Shown in the "Original" panel on the results page
  const [originalPreview, setOriginalPreview] = useState('')

  // ── Resize options ────────────────────────────────────────────────────────
  const [sizeMode, setSizeMode] = useState<'dimensions' | 'ratio'>('dimensions')
  const [targetWidth, setTargetWidth] = useState('800')
  const [targetHeight, setTargetHeight] = useState('600')
  const [aspectW, setAspectW] = useState('16')
  const [aspectH, setAspectH] = useState('9')
  const [bgColor, setBgColor] = useState('#ffffff')

  // ── UI state ──────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  // ── Refs ──────────────────────────────────────────────────────────────────
  // Tracks the current object URL so we can revoke it and avoid memory leaks
  const objectUrlRef = useRef<string | null>(null)
  // Wraps the avatar button + dropdown for click-outside detection
  const menuRef = useRef<HTMLDivElement>(null)

  // Revoke the object URL when the component unmounts
  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current)
    }
  }, [])

  // Close the dropdown when the user clicks anywhere outside it
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [menuOpen])

  // ── Avatar ────────────────────────────────────────────────────────────────
  const initial = name.trim()[0]?.toUpperCase() ?? '?'

  // ── Handlers ─────────────────────────────────────────────────────────────
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null
    setFile(f)
    if (f) {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current)
      const objUrl = URL.createObjectURL(f)
      objectUrlRef.current = objUrl
      setOriginalPreview(objUrl)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (inputType === 'url' && !url.trim()) {
      setError('Please enter an image URL.')
      return
    }
    if (inputType === 'file' && !file) {
      setError('Please select an image file.')
      return
    }
    const w = parseInt(targetWidth, 10)
    if (!w || w <= 0) {
      setError('Please enter a valid width.')
      return
    }
    if (sizeMode === 'dimensions') {
      const h = parseInt(targetHeight, 10)
      if (!h || h <= 0) {
        setError('Please enter a valid height.')
        return
      }
    } else {
      const aw = parseInt(aspectW, 10)
      const ah = parseInt(aspectH, 10)
      if (!aw || aw <= 0 || !ah || ah <= 0) {
        setError('Please enter valid aspect ratio values.')
        return
      }
    }

    setLoading(true)

    const form = new FormData()

    if (inputType === 'url') {
      form.append('url', url.trim())
      setOriginalPreview(url.trim())
    } else {
      form.append('file', file!)
      // originalPreview was already set in handleFileChange
    }

    form.append('targetWidth', targetWidth)
    if (sizeMode === 'dimensions') {
      form.append('targetHeight', targetHeight)
    } else {
      form.append('aspectW', aspectW)
      form.append('aspectH', aspectH)
    }
    form.append('bgColor', bgColor)

    try {
      const res = await fetch('/api/resize', {
        method: 'POST',
        body: form,
        credentials: 'include',
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Something went wrong. Please try again.')
        return
      }

      setResults({ cover: data.cover, contain: data.contain, dimensions: data.dimensions })
      setCredits(data.newCredits)
      setStrategy('cover')
      setView('results')
    } catch {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  function handleReset() {
    setView('input')
    setResults(null)
    setError('')
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  async function handleDeleteAccount() {
    // Close the dropdown before showing the native confirm dialog
    setMenuOpen(false)

    const confirmed = window.confirm(
      'Are you sure you want to delete your account? This cannot be undone.'
    )
    if (!confirmed) return

    setDeleting(true)
    try {
      const res = await fetch('/api/users/me', {
        method: 'DELETE',
        credentials: 'include',
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Failed to delete account. Please try again.')
        setDeleting(false)
        return
      }

      router.push('/signup')
      router.refresh()
    } catch {
      setError('Network error. Please try again.')
      setDeleting(false)
    }
  }

  // ── Derived state ─────────────────────────────────────────────────────────
  const outOfCredits = credits === 0
  const almostOut = credits > 0 && credits < 2

  const inputClass =
    'w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
  const tabActiveClass = 'bg-blue-600 text-white'
  const tabInactiveClass = 'bg-gray-100 text-gray-700 hover:bg-gray-200'

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">Image Resizer</h1>

        <div className="flex items-center gap-4">
          {/* Credits count */}
          <span
            className={`text-sm font-semibold ${
              outOfCredits ? 'text-red-600' : almostOut ? 'text-orange-500' : 'text-gray-700'
            }`}
          >
            {credits} {credits === 1 ? 'credit' : 'credits'}
          </span>

          {/* Avatar button + dropdown — menuRef covers both so click-outside works */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(prev => !prev)}
              aria-label="Account menu"
              className="w-9 h-9 rounded-full bg-blue-600 text-white text-sm font-bold
                flex items-center justify-center
                hover:bg-blue-700 transition-colors
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {initial}
            </button>

            {menuOpen && (
              <div
                className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg
                  border border-gray-100 py-1 z-10"
              >
                {/* Full name — read-only label */}
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900 truncate">{name}</p>
                </div>

                {/* Log out */}
                <button
                  onClick={() => { setMenuOpen(false); handleLogout() }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700
                    hover:bg-gray-50 transition-colors"
                >
                  Log out
                </button>

                {/* Delete account */}
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleting}
                  className="w-full text-left px-4 py-2 text-sm text-red-600
                    hover:bg-red-50 disabled:opacity-50 transition-colors"
                >
                  {deleting ? 'Deleting…' : 'Delete account'}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-6">

        {/* ══════════════════════════════════════════════════════════════════
            INPUT VIEW
        ══════════════════════════════════════════════════════════════════ */}
        {view === 'input' && (
          <form onSubmit={handleSubmit} className="max-w-lg mx-auto">
            <h2 className="text-xl font-semibold mb-6">Resize an image</h2>

            {/* ── Image source ────────────────────────────────────────────── */}
            <div className="mb-6">
              <p className="text-sm font-medium text-gray-700 mb-2">Image source</p>
              <div className="flex gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => { setInputType('url'); setError('') }}
                  className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                    inputType === 'url' ? tabActiveClass : tabInactiveClass
                  }`}
                >
                  From URL
                </button>
                <button
                  type="button"
                  onClick={() => { setInputType('file'); setError('') }}
                  className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                    inputType === 'file' ? tabActiveClass : tabInactiveClass
                  }`}
                >
                  Upload file
                </button>
              </div>

              {inputType === 'url' ? (
                <>
                  <input
                    type="url"
                    value={url}
                    onChange={e => setUrl(e.target.value)}
                    placeholder="https://example.com/image.jpg or Amazon product URL"
                    className={inputClass}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Direct image URLs and Amazon product page URLs are supported.
                  </p>
                </>
              ) : (
                <>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-600
                      file:mr-3 file:py-1 file:px-3 file:rounded file:border-0
                      file:text-sm file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {file && (
                    <p className="mt-1 text-xs text-gray-500 truncate">{file.name}</p>
                  )}
                </>
              )}
            </div>

            {/* ── Output size ─────────────────────────────────────────────── */}
            <div className="mb-6">
              <p className="text-sm font-medium text-gray-700 mb-2">Output size</p>
              <div className="flex gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => { setSizeMode('dimensions'); setError('') }}
                  className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                    sizeMode === 'dimensions' ? tabActiveClass : tabInactiveClass
                  }`}
                >
                  Width × Height
                </button>
                <button
                  type="button"
                  onClick={() => { setSizeMode('ratio'); setError('') }}
                  className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                    sizeMode === 'ratio' ? tabActiveClass : tabInactiveClass
                  }`}
                >
                  Width + Ratio
                </button>
              </div>

              {sizeMode === 'dimensions' ? (
                <div className="flex items-end gap-3">
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1">Width (px)</label>
                    <input
                      type="number"
                      min="1"
                      max="4096"
                      value={targetWidth}
                      onChange={e => setTargetWidth(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <span className="text-gray-400 pb-2.5">×</span>
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1">Height (px)</label>
                    <input
                      type="number"
                      min="1"
                      max="4096"
                      value={targetHeight}
                      onChange={e => setTargetHeight(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>
              ) : (
                <div className="flex items-end gap-3">
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1">Width (px)</label>
                    <input
                      type="number"
                      min="1"
                      max="4096"
                      value={targetWidth}
                      onChange={e => setTargetWidth(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <span className="text-gray-400 pb-2.5 whitespace-nowrap text-sm">at ratio</span>
                  <div className="w-20">
                    <label className="block text-xs text-gray-500 mb-1">W</label>
                    <input
                      type="number"
                      min="1"
                      value={aspectW}
                      onChange={e => setAspectW(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <span className="text-gray-400 pb-2.5">:</span>
                  <div className="w-20">
                    <label className="block text-xs text-gray-500 mb-1">H</label>
                    <input
                      type="number"
                      min="1"
                      value={aspectH}
                      onChange={e => setAspectH(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* ── Letterbox background color ───────────────────────────────── */}
            <div className="mb-6">
              <p className="text-sm font-medium text-gray-700 mb-2">
                Letterbox background{' '}
                <span className="text-gray-400 font-normal">(used by Contain mode)</span>
              </p>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={bgColor}
                  onChange={e => setBgColor(e.target.value)}
                  className="h-10 w-14 rounded cursor-pointer border border-gray-300 p-0.5"
                />
                <span className="text-sm text-gray-500 font-mono">{bgColor}</span>
              </div>
            </div>

            {/* ── Credit warnings ──────────────────────────────────────────── */}
            {outOfCredits && (
              <p className="mb-4 text-sm font-medium text-red-600">
                Buy more credits.
              </p>
            )}
            {almostOut && (
              <p className="mb-4 text-sm font-medium text-orange-500">
                You&apos;re almost out of credits.
              </p>
            )}

            {error && <p role="alert" className="mb-4 text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={outOfCredits || loading}
              className="w-full bg-blue-600 text-white py-3 rounded font-medium
                hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed
                transition-colors"
            >
              {loading ? 'Processing…' : 'Resize  —  costs 1 credit'}
            </button>
          </form>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            RESULTS VIEW
        ══════════════════════════════════════════════════════════════════ */}
        {view === 'results' && results && (
          <div>
            {/* Controls row */}
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <div className="flex gap-2">
                <button
                  onClick={() => setStrategy('cover')}
                  className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                    strategy === 'cover' ? tabActiveClass : tabInactiveClass
                  }`}
                >
                  Cover
                </button>
                <button
                  onClick={() => setStrategy('contain')}
                  className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                    strategy === 'contain' ? tabActiveClass : tabInactiveClass
                  }`}
                >
                  Contain
                </button>
              </div>

              <div className="flex gap-2">
                <a
                  href={strategy === 'cover' ? results.cover : results.contain}
                  download={`resized-${strategy}-${results.dimensions.width}x${results.dimensions.height}.jpg`}
                  className="px-4 py-2 text-sm rounded bg-blue-600 text-white
                    hover:bg-blue-700 transition-colors"
                >
                  Download
                </a>
                <button
                  onClick={handleReset}
                  className="px-4 py-2 text-sm rounded border border-gray-300
                    text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  ← Resize another image
                </button>
              </div>
            </div>

            {/* Side-by-side panels */}
            <div className="grid grid-cols-2 gap-4">
              {/* Left: original */}
              <div className="bg-white rounded-lg border p-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                  Original
                </p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={originalPreview}
                  alt="Original"
                  className="w-full max-h-[420px] object-contain"
                  onError={e => {
                    ;(e.currentTarget as HTMLImageElement).alt = 'Could not load original image'
                  }}
                />
              </div>

              {/* Right: resized result */}
              <div className="bg-white rounded-lg border p-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                  {strategy === 'cover' ? 'Cover' : 'Contain'} —{' '}
                  {results.dimensions.width} × {results.dimensions.height} px
                </p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={strategy === 'cover' ? results.cover : results.contain}
                  alt={`Resized (${strategy})`}
                  className="w-full max-h-[420px] object-contain"
                />
              </div>
            </div>

            {/* Credit warnings after resize */}
            {outOfCredits && (
              <p className="mt-5 text-sm font-medium text-red-600 text-center">
                Buy more credits.
              </p>
            )}
            {almostOut && (
              <p className="mt-5 text-sm font-medium text-orange-500 text-center">
                You&apos;re almost out of credits.
              </p>
            )}
          </div>
        )}

      </main>
    </div>
  )
}
