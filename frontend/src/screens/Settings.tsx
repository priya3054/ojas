import { Card } from '../components/Card'
import { useApp } from '../context/AppContext'
import { ACCENTS, type AccentKey } from '../data/theme'
import { useUpdatePrefs } from '../lib/hooks'

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      className="relative h-6 w-11 rounded-full transition-colors"
      style={{ background: on ? 'var(--accent-deep)' : '#D4DCEA' }}
      aria-pressed={on}
    >
      <span
        className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all"
        style={{ left: on ? '22px' : '2px' }}
      />
    </button>
  )
}

export function Settings() {
  const { accent, setAccent, ambientMotion, setAmbientMotion, showMascot, setShowMascot } = useApp()
  const updatePrefs = useUpdatePrefs()

  function pickAccent(key: AccentKey) {
    setAccent(key) // applies instantly via context
    updatePrefs.mutate({ accent_theme: key }) // persists to backend
  }
  function toggleMotion(v: boolean) {
    setAmbientMotion(v)
    updatePrefs.mutate({ ambient_motion: v })
  }
  function toggleMascot(v: boolean) {
    setShowMascot(v)
    updatePrefs.mutate({ show_mascot: v })
  }

  return (
    <div className="animate-rise mx-auto flex max-w-2xl flex-col gap-4">
      <h2 className="font-display text-[22px] font-semibold text-ink">Settings</h2>

      <Card>
        <h3 className="mb-1 font-display text-[17px] font-semibold text-ink">Accent theme</h3>
        <p className="mb-3 text-[12.5px] text-muted">Tints buttons, charts, and highlights across the app.</p>
        <div className="flex flex-wrap gap-3">
          {(Object.values(ACCENTS)).map((a) => (
            <button
              key={a.key}
              onClick={() => pickAccent(a.key)}
              className="flex items-center gap-2 rounded-xl border px-3 py-2 text-[13px] font-medium transition-colors"
              style={{
                borderColor: accent === a.key ? a.deep : 'rgba(40,60,110,0.13)',
                background: accent === a.key ? a.soft : '#fff',
                color: accent === a.key ? a.deep : 'var(--color-body)',
              }}
            >
              <span className="h-4 w-4 rounded-full" style={{ background: a.accent }} />
              {a.label}
            </button>
          ))}
        </div>
      </Card>

      <Card className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-[16px] font-semibold text-ink">Ambient motion</h3>
          <p className="text-[12.5px] text-muted">Gentle background and mascot animations.</p>
        </div>
        <Toggle on={ambientMotion} onChange={toggleMotion} />
      </Card>

      <Card className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-[16px] font-semibold text-ink">Show mascot</h3>
          <p className="text-[12.5px] text-muted">The glowing Ojas orb companion.</p>
        </div>
        <Toggle on={showMascot} onChange={toggleMascot} />
      </Card>

      {updatePrefs.isError && (
        <p className="text-[12.5px] text-caution">Couldn't save to the server, but the change is applied locally.</p>
      )}
    </div>
  )
}
