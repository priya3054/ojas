import { Mascot } from '../components/Mascot'

// Temporary screen used for all 9 routes in Phase 8. Phase 9 replaces each of these
// with the real, data-wired screen matching its reference screenshot.
export function Placeholder({ name }: { name: string }) {
  return (
    <div className="animate-rise flex flex-col items-center justify-center gap-4 py-24 text-center">
      <Mascot size={80} />
      <h2 className="font-display text-[22px] font-semibold text-ink">{name}</h2>
      <p className="max-w-sm text-[13.5px] text-muted">
        This screen's layout and data wiring come in Phase 9. The app shell, theming, mood tinting, and
        navigation around it are live now.
      </p>
    </div>
  )
}
