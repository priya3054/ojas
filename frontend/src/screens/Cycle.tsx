import { useState } from 'react'
import { Card } from '../components/Card'
import { Mascot } from '../components/Mascot'
import { useCycleStatus, useInsight, useLogCycle } from '../lib/hooks'

const PHASES = [
  { key: 'menstrual', label: 'Menstrual', color: '#D98BAA' },
  { key: 'follicular', label: 'Follicular', color: '#F0C3D4' },
  { key: 'ovulation', label: 'Ovulation', color: '#B0D9C8' },
  { key: 'luteal', label: 'Luteal', color: '#C9D3F0' },
]

const SYMPTOMS = ['Cramps', 'Fatigue', 'Headache', 'Bloating', 'Mood swings', 'Cravings', 'Tender']

function CycleRing({ day, length, phase }: { day: number; length: number; phase: string | null }) {
  const r = 62
  const c = 2 * Math.PI * r
  const pct = Math.min(day / length, 1)
  const phaseColor = PHASES.find((p) => p.key === phase)?.color ?? '#D98BAA'
  return (
    <div className="relative h-[160px] w-[160px]">
      <svg viewBox="0 0 160 160" className="h-full w-full -rotate-90">
        <circle cx="80" cy="80" r={r} fill="none" stroke="#F3E8EE" strokeWidth="12" />
        <circle cx="80" cy="80" r={r} fill="none" stroke={phaseColor} strokeWidth="12" strokeLinecap="round" strokeDasharray={`${pct * c} ${c}`} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-[11px] text-muted">Day</div>
        <div className="font-mono text-[30px] font-semibold text-ink">{day}</div>
        <div className="text-[11px] text-muted">of {length}</div>
      </div>
    </div>
  )
}

export function Cycle() {
  const status = useCycleStatus()
  const log = useLogCycle()
  const insight = useInsight('cycle')
  const [selected, setSelected] = useState<string[]>([])

  const day = status.data?.cycle_day ?? 0
  const length = status.data?.cycle_length_days ?? 28
  const phaseLabel = PHASES.find((p) => p.key === status.data?.phase)?.label ?? '—'

  function toggle(s: string) {
    setSelected((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]))
  }

  return (
    <div className="animate-rise flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1.3fr]">
        {/* Cycle ring */}
        <Card className="flex flex-col items-center gap-3">
          {status.data?.cycle_day == null ? (
            <div className="py-10 text-center text-[13px] text-muted">
              Log a period start below to begin tracking your cycle.
            </div>
          ) : (
            <>
              <CycleRing day={day} length={length} phase={status.data?.phase ?? null} />
              <div className="text-center">
                <div className="text-[15px] font-semibold text-ink">{phaseLabel} phase</div>
                <div className="text-[12.5px] text-muted">
                  Next period ~{status.data?.next_period_predicted?.slice(5) ?? '—'}
                </div>
              </div>
            </>
          )}
          <button
            onClick={() => log.mutate({ period_start: true })}
            disabled={log.isPending}
            className="mt-1 rounded-lg px-4 py-2 text-[12.5px] font-semibold text-white disabled:opacity-50"
            style={{ background: '#D98BAA' }}
          >
            Log period start (today)
          </button>
        </Card>

        {/* Right stack */}
        <div className="flex flex-col gap-4">
          <Card>
            <h3 className="mb-2 font-display text-[17px] font-semibold text-ink">This month</h3>
            <div className="flex h-6 overflow-hidden rounded-full">
              {PHASES.map((p) => (
                <div key={p.key} className="flex-1" style={{ background: p.color }} title={p.label} />
              ))}
            </div>
            <div className="mt-2 flex flex-wrap gap-3 text-[11.5px] text-muted">
              {PHASES.map((p) => (
                <span key={p.key} className="flex items-center gap-1">
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ background: p.color }} /> {p.label}
                </span>
              ))}
            </div>
          </Card>

          <Card>
            <h3 className="mb-2 font-display text-[16px] font-semibold text-ink">Log today's symptoms</h3>
            <div className="flex flex-wrap gap-2">
              {SYMPTOMS.map((s) => {
                const on = selected.includes(s)
                return (
                  <button
                    key={s}
                    onClick={() => toggle(s)}
                    className="rounded-full px-3 py-1.5 text-[12.5px] font-medium transition-colors"
                    style={{
                      background: on ? 'var(--accent-soft)' : '#F5F8FC',
                      color: on ? 'var(--accent-deep)' : 'var(--color-body)',
                      border: on ? '1px solid var(--accent)' : '1px solid transparent',
                    }}
                  >
                    {s}
                  </button>
                )
              })}
            </div>
            <button
              onClick={() => log.mutate({ symptoms: selected }, { onSuccess: () => setSelected([]) })}
              disabled={log.isPending || selected.length === 0}
              className="mt-3 rounded-lg px-4 py-2 text-[12.5px] font-semibold text-white disabled:opacity-50"
              style={{ background: 'var(--accent-deep)' }}
            >
              Save symptoms
            </button>
          </Card>
        </div>
      </div>

      {/* Insight */}
      <Card dark className="flex items-center gap-5">
        <Mascot size={70} />
        <div>
          <h3 className="mb-1 font-display text-[18px] font-semibold">Cycle × Mood</h3>
          <p className="text-[13.5px] leading-relaxed text-white/85">
            {insight.isLoading ? 'Looking gently at how your mood moves with your cycle…' : insight.data ?? 'Log your cycle and moods for a while and Ojas will notice gentle patterns — never a diagnosis.'}
          </p>
        </div>
      </Card>
    </div>
  )
}
