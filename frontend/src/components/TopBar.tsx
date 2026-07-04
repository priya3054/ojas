import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Search, Download, Bell, ChevronDown, Menu } from 'lucide-react'
import { NAV_ITEMS } from '../data/nav'
import { MOODS, MOOD_ORDER } from '../data/theme'
import { useApp } from '../context/AppContext'

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
  const { mood, setMood } = useApp()
  const [moodOpen, setMoodOpen] = useState(false)

  const current = NAV_ITEMS.find((n) => location.pathname.startsWith(n.path))
  const title = current?.title ?? 'Ojas'
  const activeMood = MOODS[mood]

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
                      onClick={() => {
                        setMood(key)
                        setMoodOpen(false)
                      }}
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

        {/* Search affordance */}
        <button
          className="hidden items-center gap-2 rounded-full border bg-surface px-3 py-2 text-[13px] text-muted md:flex"
          style={{ borderColor: 'rgba(40,60,110,0.07)' }}
        >
          <Search size={15} />
          <span>Ask Ojas anything…</span>
        </button>

        {/* Export */}
        <button
          className="flex h-9 w-9 items-center justify-center rounded-full border bg-surface text-body"
          style={{ borderColor: 'rgba(40,60,110,0.07)' }}
          title="Export data (PDF)"
        >
          <Download size={17} strokeWidth={1.8} />
        </button>

        {/* Reminders bell with unread dot */}
        <button
          className="relative flex h-9 w-9 items-center justify-center rounded-full border bg-surface text-body"
          style={{ borderColor: 'rgba(40,60,110,0.07)' }}
          title="Reminders"
        >
          <Bell size={17} strokeWidth={1.8} />
          <span
            className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full"
            style={{ background: '#7B8CE8' }}
          />
        </button>
      </div>
    </header>
  )
}
