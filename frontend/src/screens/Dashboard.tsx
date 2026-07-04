import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Sparkles } from 'lucide-react'
import { Card } from '../components/Card'
import { Mascot } from '../components/Mascot'
import { useApp } from '../context/AppContext'
import { MOODS } from '../data/theme'
import {
  useHabits,
  useMe,
  useMedicineSummary,
  useMoodSeries,
  useScreenTimeToday,
} from '../lib/hooks'

function greeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

function StatCard({ label, value, sub, subColor }: { label: string; value: string; sub?: string; subColor?: string }) {
  return (
    <Card className="!p-[18px] !rounded-[18px]">
      <div className="text-[12.5px] text-muted">{label}</div>
      <div className="mt-1 font-mono text-[30px] font-semibold text-ink">{value}</div>
      {sub && <div className="text-[11.5px]" style={{ color: subColor ?? 'var(--color-muted)' }}>{sub}</div>}
    </Card>
  )
}

// Small SVG donut ring with a value in the centre.
function Donut({ pct, center, sub }: { pct: number; center: string; sub: string }) {
  const r = 46
  const c = 2 * Math.PI * r
  const filled = (pct / 100) * c
  return (
    <div className="relative h-[120px] w-[120px]">
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" stroke="#EDF2FA" strokeWidth="12" />
        <circle
          cx="60" cy="60" r={r} fill="none" stroke="var(--accent)" strokeWidth="12"
          strokeLinecap="round" strokeDasharray={`${filled} ${c}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="font-mono text-[22px] font-semibold text-ink">{center}</div>
        <div className="text-[10.5px] text-muted">{sub}</div>
      </div>
    </div>
  )
}

export function Dashboard() {
  const navigate = useNavigate()
  const { mood } = useApp()
  const [range, setRange] = useState<14 | 30>(14)

  const me = useMe()
  const summary = useMedicineSummary()
  const habits = useHabits()
  const screen = useScreenTimeToday()
  const moodSeries = useMoodSeries(range)

  const name = me.data?.name ?? '—'
  const bestStreak = habits.data?.length ? Math.max(...habits.data.map((h) => h.streak)) : 0
  const adherence = summary.data?.adherence_pct
  const activeMood = MOODS[mood as keyof typeof MOODS] ?? MOODS.calm

  // Build chart data; sentiment (-1..1) → 0..100 scale for a friendlier axis.
  const chartData = (moodSeries.data ?? [])
    .filter((p) => p.avg_sentiment !== null)
    .map((p) => ({
      date: p.date.slice(5),
      score: Math.round(((p.avg_sentiment as number) + 1) * 50),
    }))

  return (
    <div className="animate-rise flex flex-col gap-4">
      {/* Hero greeting */}
      <div
        className="flex flex-col items-center gap-4 rounded-3xl p-5 text-center sm:flex-row sm:gap-6 sm:p-6 sm:text-left"
        style={{ background: 'linear-gradient(120deg,#fff,#EFF5FD)', border: '1px solid rgba(40,60,110,0.07)' }}
      >
        <Mascot size={94} />
        <div className="flex-1">
          <h2 className="font-display text-[25px] font-semibold leading-tight text-ink sm:text-[31px]">
            {greeting()}, {name}.
          </h2>
          <p className="mt-1 text-[14px] text-body-soft">
            You're feeling <b className="text-ink">{activeMood.label.toLowerCase()}</b> today
            {adherence != null && <> and holding <b className="text-ink">{adherence}%</b> med adherence.</>}
          </p>
        </div>
        <button
          onClick={() => navigate('/assistant')}
          className="flex shrink-0 items-center gap-2 rounded-xl px-4 py-3 text-[14px] font-semibold text-white"
          style={{ background: 'var(--accent-deep)' }}
        >
          <Sparkles size={17} /> Ask Ojas
        </button>
      </div>

      {/* 4 stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="!p-[18px] !rounded-[18px]">
          <div className="text-[12.5px] text-muted">Mood today</div>
          <div className="mt-1 flex items-center gap-2">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-full text-lg"
              style={{ background: `${activeMood.glow}33` }}
            >
              {activeMood.emoji}
            </span>
            <span className="text-[20px] font-semibold text-ink">{activeMood.label}</span>
          </div>
        </Card>
        <StatCard label="Med adherence" value={adherence != null ? `${adherence}%` : '—'} />
        <StatCard label="Best streak" value={`${bestStreak}`} sub={bestStreak === 1 ? 'day' : 'days'} />
        <StatCard
          label="Screen time"
          value={screen.data ? `${screen.data.hours}h` : '—'}
          sub={screen.data?.over_goal ? `▲ over ${screen.data.goal_hours}h goal` : screen.data ? 'within goal' : undefined}
          subColor={screen.data?.over_goal ? '#C0879E' : '#4E9A7C'}
        />
      </div>

      {/* Mood trend + AI insight */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.5fr_1fr]">
        <Card>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-display text-[19px] font-semibold text-ink">Mood trend</h3>
            <div className="flex gap-1">
              {([14, 30] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => setRange(d)}
                  className="rounded-full px-3 py-1 text-[12px] font-medium"
                  style={{
                    background: range === d ? 'var(--accent-soft)' : 'transparent',
                    color: range === d ? 'var(--accent-deep)' : 'var(--color-muted)',
                  }}
                >
                  {d}d
                </button>
              ))}
            </div>
          </div>
          {chartData.length === 0 ? (
            <div className="flex h-[180px] items-center justify-center text-[13px] text-muted">
              Journal a few entries to see your mood trend.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="moodFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9AA6BE' }} tickLine={false} axisLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#9AA6BE' }} tickLine={false} axisLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="score" stroke="var(--accent)" strokeWidth={2.5} fill="url(#moodFill)" isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card dark>
          <div className="mb-2 flex items-center gap-2 text-[13px] opacity-80">
            <Sparkles size={16} /> Ojas noticed
          </div>
          <p className="font-display text-[18px] leading-snug">
            {screen.data?.over_goal
              ? 'Your screen time is over goal today — evenings on your phone often line up with lighter journaling.'
              : 'You’re keeping a steady rhythm across your logs this week. Small consistency compounds.'}
          </p>
          <button
            onClick={() => navigate('/assistant')}
            className="mt-4 text-[13px] font-medium underline-offset-2 hover:underline"
          >
            Explore this with Ojas →
          </button>
        </Card>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <h3 className="mb-3 font-display text-[18px] font-semibold text-ink">Today's adherence</h3>
          <div className="flex items-center gap-4">
            <Donut
              pct={summary.data?.total ? (summary.data.taken / summary.data.total) * 100 : 0}
              center={summary.data?.total ? `${Math.round((summary.data.taken / summary.data.total) * 100)}%` : '—'}
              sub={summary.data ? `${summary.data.taken} of ${summary.data.total}` : ''}
            />
            <div className="text-[12.5px] text-muted">
              {summary.data?.next_dose_at
                ? `Next dose at ${new Date(summary.data.next_dose_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                : 'All doses done for today 🎉'}
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="mb-3 font-display text-[18px] font-semibold text-ink">Up next</h3>
          <ul className="flex flex-col gap-2 text-[13px] text-body">
            {summary.data?.next_dose_at && (
              <li className="flex justify-between"><span>Medicine dose</span><span className="text-muted">{new Date(summary.data.next_dose_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></li>
            )}
            <li className="flex justify-between"><span>Evening journal</span><span className="text-muted">9:00 PM</span></li>
            <li className="flex justify-between"><span>Wind-down video</span><span className="text-muted">again</span></li>
          </ul>
        </Card>

        <Card>
          <h3 className="mb-3 font-display text-[18px] font-semibold text-ink">Habit streaks</h3>
          <div className="flex flex-col gap-3">
            {(habits.data ?? []).slice(0, 3).map((h) => (
              <div key={h.id}>
                <div className="mb-1 flex justify-between text-[12.5px]">
                  <span className="text-body">{h.name}</span>
                  <span className="font-mono text-muted">{h.streak}d</span>
                </div>
                <div className="h-2 rounded-full" style={{ background: '#EDF2FA' }}>
                  <div className="h-2 rounded-full" style={{ width: `${Math.min(h.streak / 14, 1) * 100}%`, background: 'var(--accent)' }} />
                </div>
              </div>
            ))}
            {habits.data?.length === 0 && <div className="text-[13px] text-muted">No habits yet.</div>}
          </div>
        </Card>
      </div>
    </div>
  )
}
