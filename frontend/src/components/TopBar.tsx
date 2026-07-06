import { useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Search, Download, Bell, ChevronDown, Menu } from 'lucide-react'
import { NAV_ITEMS } from '../data/nav'
import { MOODS, MOOD_ORDER, type MoodKey } from '../data/theme'
import { useApp } from '../context/AppContext'
import { api } from '../lib/api'
import { useHabits, useMedicineSummary, useUpdatePrefs } from '../lib/hooks'

function todayLabel(): string {
  return new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function TopBar({ onMenuClick }: { onMenuClick?: () => void }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { mood, setMood } = useApp()
  const updatePrefs = useUpdatePrefs()
  const medSummary = useMedicineSummary()
  const habits = useHabits()
  const [moodOpen, setMoodOpen] = useState(false)
  const [remindersOpen, setRemindersOpen] = useState(false)
  const [query, setQuery] = useState('')

  // Real reminders derived from the user's own data.
  const reminders: string[] = []
  if (medSummary.data?.next_dose_at) {
    const t = new Date(medSummary.data.next_dose_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    reminders.push(`Next medicine dose at ${t}`)
  }
  const pendingHabits = (habits.data ?? []).filter((h) => !h.checked_in_today)
  if (pendingHabits.length > 0) {
    reminders.push(`${pendingHabits.length} habit check-in${pendingHabits.length > 1 ? 's' : ''} pending today`)
  }

  const current = NAV_ITEMS.find((n) => location.pathname.startsWith(n.path))
  const title = current?.title ?? 'Ojas'
  const activeMood = MOODS[mood]

  function chooseMood(key: MoodKey) {
    setMood(key)
    updatePrefs.mutate({ current_mood: key }) // persist to backend
    setMoodOpen(false)
  }

  function submitSearch(e: FormEvent) {
    e.preventDefault()
    const q = query.trim()
    if (!q) return
    setQuery('')
    navigate(`/assistant?q=${encodeURIComponent(q)}`)
  }

  const [exporting, setExporting] = useState(false)
  async function exportPdf() {
    setExporting(true)
    try {
      const res = await api.post('/export', {}, { responseType: 'blob' })
      // If S3 is configured the backend returns JSON with a URL; otherwise a PDF blob.
      if (res.data.type === 'application/pdf') {
        const url = URL.createObjectURL(res.data)
        const a = document.createElement('a')
        a.href = url
        a.download = 'ojas-summary.pdf'
        a.click()
        URL.revokeObjectURL(url)
      } else {
        const text = await res.data.text()
        const { url } = JSON.parse(text)
        window.open(url, '_blank')
      }
    } finally {
      setExporting(false)
    }
  }

  return (
    <header
      className="sticky top-0 z-20 flex items-center justify-between px-4 py-3 sm:px-6 md:px-[34px] md:py-[18px]"
      style={{
        background: 'rgba(241,246,252,0.82)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(40,60,110,0.06)',
      }}
    >
      <div className="flex min-w-0 items-center gap-3">
        {/* Hamburger — mobile only */}
        <button
          onClick={onMenuClick}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border bg-surface text-body md:hidden"
          style={{ borderColor: 'rgba(40,60,110,0.07)' }}
          aria-label="Open menu"
        >
          <Menu size={18} />
        </button>
        <div className="min-w-0">
          <h1 className="truncate font-display text-[19px] font-semibold leading-tight text-ink md:text-[25px]">{title}</h1>
          <div className="hidden text-[12.5px] text-muted sm:block">{todayLabel()}</div>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        {/* Feeling / mood dropdown */}
        <div className="relative">
          <button
            onClick={() => setMoodOpen((v) => !v)}
            className="flex items-center gap-2 rounded-full border bg-surface px-3 py-2 text-[13px] font-medium text-body"
            style={{ borderColor: 'rgba(40,60,110,0.07)' }}
          >
            <span>{activeMood.emoji}</span>
            <span className="hidden sm:inline">{activeMood.label}</span>
            <ChevronDown size={15} className="text-faint" />
          </button>

          {moodOpen && (
            <>
              {/* click-outside scrim */}
              <div className="fixed inset-0 z-30" onClick={() => setMoodOpen(false)} />
              <div
                className="absolute right-0 z-40 mt-2 w-[196px] overflow-hidden rounded-2xl border bg-surface py-1 shadow-lg"
                style={{ borderColor: 'rgba(40,60,110,0.07)' }}
              >
                {MOOD_ORDER.map((key) => {
                  const m = MOODS[key]
                  const isActive = key === mood
                  return (
                    <button
                      key={key}
                      onClick={() => chooseMood(key)}
                      className="flex w-full items-center gap-3 px-4 py-2 text-left text-[13px] text-body hover:bg-soft"
                      style={{ background: isActive ? 'var(--accent-soft)' : undefined }}
                    >
                      <span className="text-base">{m.emoji}</span>
                      <span className={isActive ? 'font-semibold text-accent-deep' : ''}>{m.label}</span>
                    </button>
                  )
                })}
              </div>
            </>
          )}
        </div>

        {/* Search → Ojas AI */}
        <form
          onSubmit={submitSearch}
          className="hidden items-center gap-2 rounded-full border bg-surface px-3 py-2 md:flex"
          style={{ borderColor: 'rgba(40,60,110,0.07)' }}
        >
          <Search size={15} className="text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask Ojas anything…"
            className="w-40 bg-transparent text-[13px] text-body outline-none placeholder:text-muted"
          />
        </form>

        {/* Export */}
        <button
          onClick={exportPdf}
          disabled={exporting}
          className="flex h-9 w-9 items-center justify-center rounded-full border bg-surface text-body disabled:opacity-50"
          style={{ borderColor: 'rgba(40,60,110,0.07)' }}
          title="Export data (PDF)"
        >
          <Download size={17} strokeWidth={1.8} />
        </button>

        {/* Reminders bell with real derived items */}
        <div className="relative">
          <button
            onClick={() => setRemindersOpen((v) => !v)}
            className="relative flex h-9 w-9 items-center justify-center rounded-full border bg-surface text-body"
            style={{ borderColor: 'rgba(40,60,110,0.07)' }}
            title="Reminders"
          >
            <Bell size={17} strokeWidth={1.8} />
            {reminders.length > 0 && (
              <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full" style={{ background: '#7B8CE8' }} />
            )}
          </button>
          {remindersOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setRemindersOpen(false)} />
              <div
                className="absolute right-0 z-40 mt-2 w-[260px] overflow-hidden rounded-2xl border bg-surface py-1 shadow-lg"
                style={{ borderColor: 'rgba(40,60,110,0.07)' }}
              >
                <div className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-faint">Reminders</div>
                {reminders.length === 0 ? (
                  <div className="px-4 py-3 text-[13px] text-muted">You're all caught up 🎉</div>
                ) : (
                  reminders.map((r, i) => (
                    <div key={i} className="px-4 py-2 text-[13px] text-body">{r}</div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
