import { useState } from 'react'
import { Target, Plus } from 'lucide-react'
import { Card } from '../components/Card'
import { Mascot } from '../components/Mascot'
import {
  useAddHabit,
  useCheckInHabit,
  useHabitWeek,
  useHabits,
  type HabitSummary,
} from '../lib/hooks'

// SVG streak ring with the day count in the centre.
function StreakRing({ streak }: { streak: number }) {
  const r = 34
  const c = 2 * Math.PI * r
  const filled = Math.min(streak / 21, 1) * c
  return (
    <div className="relative h-[86px] w-[86px]">
      <svg viewBox="0 0 86 86" className="h-full w-full -rotate-90">
        <circle cx="43" cy="43" r={r} fill="none" stroke="#EDF2FA" strokeWidth="8" />
        <circle cx="43" cy="43" r={r} fill="none" stroke="var(--accent)" strokeWidth="8" strokeLinecap="round" strokeDasharray={`${filled} ${c}`} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="font-mono text-[20px] font-semibold text-ink">{streak}</div>
        <div className="text-[9.5px] text-muted">day{streak === 1 ? '' : 's'}</div>
      </div>
    </div>
  )
}

function WeekRow({ habitId }: { habitId: number }) {
  const week = useHabitWeek(habitId)
  return (
    <div className="flex gap-1.5">
      {(week.data ?? []).map((d) => (
        <div
          key={d.date}
          title={d.date}
          className="h-6 w-6 rounded-md"
          style={{
            background: d.kept ? 'var(--accent)' : d.kept === false ? '#F1D6DE' : '#F5F8FC',
            border: d.is_today ? '1.5px dashed var(--accent-deep)' : '1px solid rgba(40,60,110,0.06)',
          }}
        />
      ))}
    </div>
  )
}

function HabitCard({ habit, active }: { habit: HabitSummary; active: boolean }) {
  const checkIn = useCheckInHabit()
  const [note, setNote] = useState('')

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-full" style={{ background: 'var(--accent-soft)' }}>
          <Target size={17} className="text-accent-deep" />
        </div>
        <div>
          <div className="text-[15px] font-semibold text-ink">{habit.name}</div>
          <div className="text-[11.5px] text-muted">{habit.goal}</div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <StreakRing streak={habit.streak} />
        <div className="flex flex-col gap-2">
          <span className="text-[11px] text-muted">This week</span>
          <WeekRow habitId={habit.id} />
        </div>
      </div>

      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Trigger note (e.g. bored after dinner)"
        className="rounded-lg border bg-soft px-3 py-2 text-[12.5px] outline-none"
        style={{ borderColor: 'rgba(40,60,110,0.08)' }}
      />

      {habit.checked_in_today ? (
        <div className="rounded-lg py-2 text-center text-[12.5px] font-medium text-success" style={{ background: '#EAF6F0' }}>
          ✓ Checked in for today
        </div>
      ) : (
        <div className="flex gap-2">
          <button
            onClick={() => checkIn.mutate({ habitId: habit.id, kept: true, trigger_note: note })}
            disabled={checkIn.isPending}
            className="flex-1 rounded-lg py-2 text-[12.5px] font-semibold text-white disabled:opacity-50"
            style={{ background: active ? 'var(--accent-deep)' : '#93A0BC' }}
          >
            Kept it
          </button>
          <button
            onClick={() => checkIn.mutate({ habitId: habit.id, kept: false, trigger_note: note })}
            disabled={checkIn.isPending}
            className="flex-1 rounded-lg border py-2 text-[12.5px] font-semibold text-body disabled:opacity-50"
            style={{ borderColor: 'rgba(40,60,110,0.13)' }}
          >
            Slipped
          </button>
        </div>
      )}
    </Card>
  )
}

export function Habits() {
  const habits = useHabits()
  const add = useAddHabit()
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [goal, setGoal] = useState('')

  return (
    <div className="animate-rise flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-[20px] font-semibold text-ink">Your habits</h2>
        <button
          onClick={() => setAdding((v) => !v)}
          className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] font-semibold text-white"
          style={{ background: 'var(--accent-deep)' }}
        >
          <Plus size={15} /> Add habit
        </button>
      </div>

      {adding && (
        <Card>
          <div className="flex flex-wrap items-end gap-2">
            <input className="flex-1 rounded-lg border bg-soft px-3 py-2 text-[13px] outline-none" style={{ borderColor: 'rgba(40,60,110,0.1)' }} placeholder="Habit name" value={name} onChange={(e) => setName(e.target.value)} />
            <input className="flex-1 rounded-lg border bg-soft px-3 py-2 text-[13px] outline-none" style={{ borderColor: 'rgba(40,60,110,0.1)' }} placeholder="Goal" value={goal} onChange={(e) => setGoal(e.target.value)} />
            <button
              onClick={() => add.mutate({ name, goal }, { onSuccess: () => { setAdding(false); setName(''); setGoal('') } })}
              disabled={add.isPending || !name.trim()}
              className="rounded-lg px-4 py-2 text-[12.5px] font-semibold text-white disabled:opacity-50"
              style={{ background: 'var(--accent-deep)' }}
            >
              Add
            </button>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {habits.data?.map((h, i) => <HabitCard key={h.id} habit={h} active={i === 0} />)}
        {habits.data?.length === 0 && (
          <div className="col-span-3 py-10 text-center text-[13px] text-muted">No habits yet — add one to start a streak.</div>
        )}
      </div>

      {/* Cross-domain insight */}
      <Card dark className="flex items-center gap-5">
        <Mascot size={70} />
        <div>
          <h3 className="mb-1 font-display text-[18px] font-semibold">A pattern, not a diagnosis</h3>
          <p className="text-[13.5px] leading-relaxed text-white/85">
            On days you slip on phone-scrolling, your sleep tends to run shorter — and the next morning's
            mood often dips with it. Ojas noticed this across your habit, screen-time and journal logs.
          </p>
        </div>
      </Card>
    </div>
  )
}
