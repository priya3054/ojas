import { NavLink } from 'react-router-dom'
import { Shield, ChevronRight } from 'lucide-react'
import { NAV_ITEMS } from '../data/nav'
import { Mascot } from './Mascot'

interface SidebarProps {
  open?: boolean
  onNavigate?: () => void
}

export function Sidebar({ open = false, onNavigate }: SidebarProps) {
  return (
    <aside
      className={
        'fixed inset-y-0 left-0 z-40 flex w-[248px] shrink-0 flex-col border-r px-4 py-[22px] ' +
        'transition-transform duration-300 md:static md:translate-x-0 ' +
        (open ? 'translate-x-0' : '-translate-x-full')
      }
      style={{
        background: 'linear-gradient(180deg, #ffffff, #eef4fc)',
        borderColor: 'rgba(40,60,110,0.07)',
      }}
    >
      {/* Logo lockup: orb mascot as the "O" in Ojas */}
      <div className="mb-6 flex items-center gap-2 px-1">
        <div className="h-8 w-8 shrink-0">
          <Mascot size={32} />
        </div>
        <span className="font-display text-[29px] font-semibold leading-none text-ink">jas</span>
        <div className="mx-1 h-7 w-px" style={{ background: 'rgba(40,60,110,0.12)' }} />
        <span className="text-[9.5px] uppercase leading-tight tracking-[2px] text-faint">
          Your
          <br />
          companion
        </span>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={onNavigate}
            className="group flex items-center gap-3 rounded-xl px-[13px] py-[11px] text-[14.5px] font-semibold transition-colors"
            style={({ isActive }) => ({
              backgroundColor: isActive ? 'var(--accent-soft)' : 'transparent',
              color: isActive ? 'var(--accent-deep)' : '#3A4A6B',
            })}
          >
            <item.icon size={19} strokeWidth={1.8} />
            <span className="flex-1">{item.label}</span>
            {item.badge && (
              <span
                className="rounded-full px-2 py-0.5 text-[9px] font-bold tracking-wide text-white"
                style={{ background: '#F2607D' }}
              >
                {item.badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="mt-auto flex flex-col gap-3">
        <div
          className="flex items-start gap-2 rounded-2xl p-3 text-[11.5px] leading-snug text-body-soft"
          style={{ background: 'var(--accent-soft)' }}
        >
          <Shield size={16} strokeWidth={1.8} className="mt-0.5 shrink-0 text-accent-deep" />
          <span>Not a medical device. No diagnoses. Crisis-safe support built in.</span>
        </div>
        <div className="flex items-center gap-2 rounded-2xl px-2 py-1.5">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold text-white"
            style={{ background: 'var(--accent-deep)' }}
          >
            P
          </div>
          <div className="flex-1 leading-tight">
            <div className="text-[13px] font-semibold text-ink">Priya</div>
            <div className="text-[11px] text-muted">Free plan</div>
          </div>
          <ChevronRight size={16} className="text-faint" />
        </div>
      </div>
    </aside>
  )
}
