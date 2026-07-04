import { useState, type FormEvent } from 'react'
import { Bar, BarChart, ResponsiveContainer, XAxis, Tooltip } from 'recharts'
import { Pill, Plus, Check, CalendarClock } from 'lucide-react'
import { Card } from '../components/Card'
import {
  useAddSchedule,
  useAdherence,
  useDosesToday,
  useMarkDoseTaken,
  useRefill,
  useRiskPattern,
} from '../lib/hooks'

function AddMedicineForm({ onDone }: { onDone: () => void }) {
  const add = useAddSchedule()
  const [name, setName] = useState('')
  const [dosage, setDosage] = useState('')
  const [time, setTime] = useState('09:00')
  const [pills, setPills] = useState(30)

  function submit(e: FormEvent) {
    e.preventDefault()
    add.mutate(
      { name, dosage, time_of_day: `${time}:00`, frequency: 'Daily', pill_count: pills },
      { onSuccess: onDone },
    )
  }

  const field = 'rounded-lg border bg-soft px-3 py-2 text-[13px] outline-none'
  const fb = { borderColor: 'rgba(40,60,110,0.1)' }

  return (
    <form onSubmit={submit} className="mb-3 grid grid-cols-1 gap-2 rounded-xl p-3 sm:grid-cols-2" style={{ background: '#F5F8FC' }}>
      <input className={field} style={fb} placeholder="Name (e.g. Vitamin D)" value={name} onChange={(e) => setName(e.target.value)} required />
      <input className={field} style={fb} placeholder="Dosage (e.g. 1000 IU)" value={dosage} onChange={(e) => setDosage(e.target.value)} required />
      <input className={field} style={fb} type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
      <input className={field} style={fb} type="number" min={0} placeholder="Pill count" value={pills} onChange={(e) => setPills(Number(e.target.value))} />
      <div className="col-span-2 flex gap-2">
        <button type="submit" disabled={add.isPending} className="rounded-lg px-3 py-1.5 text-[12.5px] font-semibold text-white disabled:opacity-50" style={{ background: 'var(--accent-deep)' }}>
          {add.isPending ? 'Adding…' : 'Add'}
        </button>
        <button type="button" onClick={onDone} className="rounded-lg px-3 py-1.5 text-[12.5px] text-muted">Cancel</button>
      </div>
    </form>
  )
}

export function Medicine() {
  const doses = useDosesToday()
  const mark = useMarkDoseTaken()
  const refill = useRefill()
  const risk = useRiskPattern()
  const adherence = useAdherence(14)
  const [adding, setAdding] = useState(false)

  const nextUntakenId = doses.data?.find((d) => !d.taken)?.id

  const chartData = (adherence.data ?? []).map((p, i, arr) => ({
    date: p.date.slice(5),
    taken: p.taken,
    missed: Math.max(p.total - p.taken, 0),
    isToday: i === arr.length - 1,
  }))

  return (
    <div className="animate-rise flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
        {/* Today's schedule */}
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-display text-[19px] font-semibold text-ink">Today's schedule</h3>
            <button
              onClick={() => setAdding((v) => !v)}
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] font-semibold text-white"
              style={{ background: 'var(--accent-deep)' }}
            >
              <Plus size={15} /> Add medicine
            </button>
          </div>

          {adding && <AddMedicineForm onDone={() => setAdding(false)} />}

          <div className="flex flex-col gap-2">
            {doses.data?.length === 0 && (
              <div className="py-8 text-center text-[13px] text-muted">No doses scheduled today. Add a medicine to begin.</div>
            )}
            {doses.data?.map((d) => {
              const isNext = d.id === nextUntakenId
              return (
                <div
                  key={d.id}
                  className="flex items-center gap-3 rounded-xl border px-4 py-3"
                  style={{
                    borderColor: isNext ? 'var(--accent)' : 'rgba(40,60,110,0.07)',
                    background: isNext ? 'var(--accent-soft)' : '#fff',
                  }}
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-full" style={{ background: '#F5F8FC' }}>
                    <Pill size={17} className="text-accent-deep" />
                  </div>
                  <div className="flex-1">
                    <div className="text-[14px] font-semibold text-ink">{d.name}</div>
                    <div className="text-[12px] text-muted">
                      {d.dosage} · {new Date(d.scheduled_for).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {d.frequency}
                    </div>
                  </div>
                  {d.taken ? (
                    <span className="flex items-center gap-1 text-[12.5px] font-medium text-success">
                      <Check size={15} /> Taken
                    </span>
                  ) : (
                    <button
                      onClick={() => mark.mutate(d.id)}
                      disabled={mark.isPending}
                      className="rounded-lg px-3 py-1.5 text-[12.5px] font-semibold text-white disabled:opacity-50"
                      style={{ background: isNext ? 'var(--accent-deep)' : '#93A0BC' }}
                    >
                      Mark taken
                    </button>
                  )}
                </div>
              )
            })}
          </div>

          <div className="mt-3 flex items-center gap-2 text-[11.5px] text-muted">
            <CalendarClock size={14} /> Synced to Google Calendar · auto-reschedules missed doses.
          </div>
        </Card>

        {/* Right stack */}
        <div className="flex flex-col gap-4">
          <Card dark>
            <h3 className="mb-2 font-display text-[17px] font-semibold">Refill prediction</h3>
            {refill.data && refill.data.length > 0 ? (
              refill.data.map((r) => (
                <div key={r.schedule_id} className="mb-2 text-[13px]">
                  <div className="font-medium">{r.name}</div>
                  <div className="text-white/70">
                    {r.pill_count} pills left ·{' '}
                    {r.estimated_run_out_date ? `runs out ~${r.estimated_run_out_date.slice(5)}` : 'add a pill count'}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-[13px] text-white/70">No active medicines to predict yet.</p>
            )}
            <button className="mt-2 rounded-lg bg-white/15 px-3 py-1.5 text-[12.5px] font-medium">
              Set refill reminder
            </button>
          </Card>

          <Card>
            <h3 className="mb-1.5 font-display text-[16px] font-semibold text-ink">Risk pattern</h3>
            {risk.data?.day_of_week ? (
              <p className="text-[13px] text-body">
                You most often miss the{' '}
                <b className="text-ink">{risk.data.hour}:00 dose</b> on{' '}
                <b className="text-ink">{risk.data.day_of_week}s</b>. Want a gentle nudge 15 min early?
              </p>
            ) : (
              <p className="text-[13px] text-muted">No missed-dose pattern detected yet — nice consistency.</p>
            )}
          </Card>
        </div>
      </div>

      {/* Adherence bar chart */}
      <Card>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="font-display text-[18px] font-semibold text-ink">Adherence · last 2 weeks</h3>
          <div className="flex items-center gap-4 text-[11.5px] text-muted">
            <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: 'var(--accent)' }} /> Taken</span>
            <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: '#EDF2FA' }} /> Missed</span>
          </div>
        </div>
        {chartData.length === 0 ? (
          <div className="flex h-[160px] items-center justify-center text-[13px] text-muted">No dose history yet.</div>
        ) : (
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }} barCategoryGap="25%">
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9AA6BE', fontFamily: 'JetBrains Mono' }} tickLine={false} axisLine={false} />
              <Tooltip cursor={{ fill: 'rgba(40,60,110,0.04)' }} />
              <Bar dataKey="taken" stackId="a" fill="var(--accent)" radius={[3, 3, 0, 0]} isAnimationActive={false} />
              <Bar dataKey="missed" stackId="a" fill="#EDF2FA" radius={[3, 3, 0, 0]} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>
    </div>
  )
}
