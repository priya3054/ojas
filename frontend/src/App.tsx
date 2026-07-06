import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { RequireAuth } from './components/RequireAuth'
import { Login } from './screens/Login'
import { Placeholder } from './screens/Placeholder'
import { Dashboard } from './screens/Dashboard'
import { Chat } from './screens/Chat'
import { Journal } from './screens/Journal'
import { Medicine } from './screens/Medicine'
import { Habits } from './screens/Habits'
import { ScreenTime } from './screens/ScreenTime'
import { Cycle } from './screens/Cycle'
import { Discover } from './screens/Discover'
import { DayRecap } from './screens/DayRecap'
import { Settings } from './screens/Settings'
import { NAV_ITEMS } from './data/nav'

// Screens that have their real implementation wired up (the rest fall back to Placeholder).
const SCREENS: Record<string, React.ReactNode> = {
  '/dashboard': <Dashboard />,
  '/assistant': <Chat />,
  '/journal': <Journal />,
  '/medicine': <Medicine />,
  '/habits': <Habits />,
  '/screen-time': <ScreenTime />,
  '/cycle': <Cycle />,
  '/discover': <Discover />,
  '/day-recap': <DayRecap />,
}

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<Login />} />

      {/* Everything else requires a logged-in user */}
      <Route element={<RequireAuth />}>
        <Route element={<AppShell />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          {NAV_ITEMS.map((item) => (
            <Route
              key={item.path}
              path={item.path}
              element={SCREENS[item.path] ?? <Placeholder name={item.title} />}
            />
          ))}
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Route>
    </Routes>
  )
}
