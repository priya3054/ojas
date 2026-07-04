import {
  LayoutDashboard,
  Sparkles,
  BookHeart,
  Pill,
  Target,
  MonitorSmartphone,
  CircleDot,
  Compass,
  Video,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  path: string
  label: string
  title: string
  icon: LucideIcon
  badge?: string
}

// One entry per screen — drives both the sidebar nav and the router (Phase 8/9).
export const NAV_ITEMS: NavItem[] = [
  { path: '/dashboard', label: 'Dashboard', title: 'Dashboard', icon: LayoutDashboard },
  { path: '/assistant', label: 'Ojas AI', title: 'Ojas AI', icon: Sparkles },
  { path: '/journal', label: 'Journal & Mood', title: 'Journal & Mood', icon: BookHeart },
  { path: '/medicine', label: 'Medicine', title: 'Medicine', icon: Pill },
  { path: '/habits', label: 'Habits', title: 'Habits', icon: Target },
  { path: '/screen-time', label: 'Screen Time', title: 'Screen Time', icon: MonitorSmartphone },
  { path: '/cycle', label: 'Cycle', title: 'Cycle', icon: CircleDot },
  { path: '/discover', label: 'Discover', title: 'Discover', icon: Compass },
  { path: '/day-recap', label: 'Day Recap', title: 'Day Recap', icon: Video, badge: 'NEW' },
]
