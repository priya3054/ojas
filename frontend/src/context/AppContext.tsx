import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { ACCENTS, MOODS, type AccentKey, type MoodKey } from '../data/theme'

interface AppState {
  mood: MoodKey
  setMood: (m: MoodKey) => void
  accent: AccentKey
  setAccent: (a: AccentKey) => void
  ambientMotion: boolean
  setAmbientMotion: (v: boolean) => void
  showMascot: boolean
  setShowMascot: (v: boolean) => void
}

const AppContext = createContext<AppState | null>(null)

// Small helper: read a persisted value from localStorage with a fallback default.
function persisted<T extends string>(key: string, fallback: T): T {
  return (localStorage.getItem(key) as T) || fallback
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [mood, setMoodState] = useState<MoodKey>(() => persisted('ojas_mood', 'calm'))
  const [accent, setAccentState] = useState<AccentKey>(() => persisted('ojas_accent', 'sky'))
  const [ambientMotion, setAmbientMotionState] = useState<boolean>(
    () => localStorage.getItem('ojas_ambient') !== 'false',
  )
  const [showMascot, setShowMascotState] = useState<boolean>(
    () => localStorage.getItem('ojas_mascot') !== 'false',
  )

  // Whenever mood changes, update the CSS variables that tint the whole app.
  useEffect(() => {
    const m = MOODS[mood]
    const root = document.documentElement.style
    root.setProperty('--mood-tint', m.tint)
    root.setProperty('--mood-glow', m.glow)
    root.setProperty('--mascot-float', m.float)
    root.setProperty('--mascot-breathe', m.breathe)
    localStorage.setItem('ojas_mood', mood)
  }, [mood])

  // Whenever accent changes, update the accent CSS variables.
  useEffect(() => {
    const a = ACCENTS[accent]
    const root = document.documentElement.style
    root.setProperty('--accent', a.accent)
    root.setProperty('--accent-deep', a.deep)
    root.setProperty('--accent-soft', a.soft)
    localStorage.setItem('ojas_accent', accent)
  }, [accent])

  useEffect(() => {
    localStorage.setItem('ojas_ambient', String(ambientMotion))
  }, [ambientMotion])

  useEffect(() => {
    localStorage.setItem('ojas_mascot', String(showMascot))
  }, [showMascot])

  return (
    <AppContext.Provider
      value={{
        mood,
        setMood: setMoodState,
        accent,
        setAccent: setAccentState,
        ambientMotion,
        setAmbientMotion: setAmbientMotionState,
        showMascot,
        setShowMascot: setShowMascotState,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

// Convenience hook so components can read/update app state with `useApp()`.
export function useApp(): AppState {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>')
  return ctx
}
