import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { AmbientBackground } from './AmbientBackground'

// The persistent layout: sidebar + top bar wrap around whichever screen is routed
// into <Outlet />. On mobile the sidebar becomes a slide-in drawer toggled from the top bar.
export function AppShell() {
  const [navOpen, setNavOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden">
      <AmbientBackground />

      {/* Backdrop shown behind the drawer on mobile */}
      {navOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 md:hidden"
          onClick={() => setNavOpen(false)}
        />
      )}

      <Sidebar open={navOpen} onNavigate={() => setNavOpen(false)} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar onMenuClick={() => setNavOpen(true)} />
        <main className="flex-1 overflow-y-auto px-4 pb-12 pt-5 sm:px-6 md:px-[34px] md:pt-[26px]">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
