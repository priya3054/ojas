import { useState } from 'react'
import { Bar, BarChart, Cell, ReferenceLine, ResponsiveContainer, XAxis, Tooltip } from 'recharts'
import { Card } from '../components/Card'
import { Mascot } from '../components/Mascot'
import {
  useLogScreenTime,
  useScreenTimeLogs,
  useScreenTimeToday,
  useUpdateScreenGoal,
} from '../lib/hooks'

// Ring showing today's hours vs goal.
function GoalRing({ hours, goal }: { hours: number; goal: number }) {
  const r = 54
  const c = 2 * Math.PI * r
  const pct = Math.min(hours / (goal * 1.6 || 1), 1)
  const over = hours > goal
  return (
    <div className="relative h-[140px] w-[140px]">
      <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90">
        <circle cx="70" cy="70" r={r} fill="none" stroke="#EDF2FA" strokeWidth="12" />
        <circle cx="70" cy="70" r={r} fill="none" stroke={over ? '#C0879E' : 'var(--accent)'} strokeWidth="12" strokeLinecap="round" strokeDasharray={`${pct * c} ${c}`} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="font-mono text-[26px] font-semibold text-ink">{hours}h</div>
        <div className="text-[11px] text-muted">goal {goal}h</div>
      </div>
    </div>
  )
}

export function ScreenTime() {
  const today = useScreenTimeToday()
  const logs = useScreenTimeLogs(7)
  const updateGoal = useUpdateScreenGoal()
  const logToday = useLogScreenTime()
  const [logValue, setLogValue] = useState('')

  const goal = today.data?.goal_hours ?? 3.5
  const hours = today.data?.hours ?? 0

  const chartData = (logs.data ?? []).map((l) => ({
    date: new Date(l.date).toLocaleDateString('en-US', { weekday: 'short' }),
    hours: l.hours,
    over: l.hours > goal,
  }))

  return (
    <div className="animate-rise flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1.5fr]">
        {/* Today vs goal */}
        <Card className="flex flex-col items-center gap-3">
          <h3 className="self-start font-display text-[18px] font-semibold text-ink">Today vs goal</h3>
          <GoalRing hours={hours} goal={goal} />
          <div className="text-[12.5px]" style={{ color: today.data?.over_goal ? '#C0879E' : '#4E9A7C' }}>
            {today.data?.over_goal ? `▲ ${(hours - goal).toFixed(1)}h over goal` : 'within goal today'}
          </div>

          <div className="mt-2 w-full">
            <div className="mb-1 flex justify-between text-[11.5px] text-muted">
              <span>Daily goal</span>
              <span className="font-mono">{goal}h</span>
            </div>
            <input
              type="range" min={1} max={8} step={0.5} value={goal}
              onChange={(e) => updateGoal.mutate(Number(e.target.value))}
              className="w-full accent-[var(--accent-deep)]"
            />
          </div>
        </Card>

        {/* This week */}
        <Card>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-display text-[18px] font-semibold text-ink">This week</h3>
            <div className="flex items-center gap-2">
              <input
                type="number" step="0.1" min="0" placeholder="hrs" value={logValue}
                onChange={(e) => setLogValue(e.target.value)}
                className="w-16 rounded-lg border bg-soft px-2 py-1 text-[12.5px] outline-none"
                style={{ borderColor: 'rgba(40,60,110,0.1)' }}
              />
              <button
                onClick={() => { if (logValue) { logToday.mutate(Number(logValue)); setLogValue('') } }}
                disabled={logToday.isPending || !logValue}
                className="rounded-lg px-3 py-1.5 text-[12.5px] font-semibold text-white disabled:opacity-50"
                style={{ background: 'var(--accent-deep)' }}
              >
                Log today
              </button>
            </div>
          </div>
          {chartData.length === 0 ? (
            <div className="flex h-[180px] items-center justify-center text-[13px] text-muted">No screen-time logs yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9AA6BE' }} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: 'rgba(40,60,110,0.04)' }} />
                <ReferenceLine y={goal} stroke="#93A0BC" strokeDasharray="4 4" />
                <Bar dataKey="hours" radius={[4, 4, 0, 0]} isAnimationActive={false}>
                  {chartData.map((d, i) => (
                    <Cell key={i} fill={d.over ? '#E7B0C0' : 'var(--accent)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* Weekly insight */}
      <Card dark className="flex items-center gap-5">
        <Mascot size={70} />
        <div>
          <h3 className="mb-1 font-display text-[18px] font-semibold">Weekly insight</h3>
          <p className="text-[13.5px] leading-relaxed text-white/85">
            Your highest screen-time days this week lined up with your shortest sleep — and the next
            morning's mood tended to dip. Correlated across your screen-time, journal and habit logs. A
            pattern, not a diagnosis.
          </p>
        </div>
      </Card>
    </div>
  )
}
