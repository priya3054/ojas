import { useEffect, useRef, useState } from 'react'
import { Area, AreaChart, ResponsiveContainer, XAxis } from 'recharts'
import { Mic, MicOff } from 'lucide-react'
import { Card } from '../components/Card'
import {
  useAnalyzeSentiment,
  useCreateJournal,
  useMoodSeries,
  useWeeklyReflection,
} from '../lib/hooks'

const MOOD_EMOJI: Record<string, string> = {
  good: '🙂', excited: '🤩', calm: '😌', sleepy: '😴', sad: '😔', anxious: '😟',
}

// Minimal Web Speech API wrapper (browser-native speech-to-text).
function useVoice(onText: (t: string) => void) {
  const recRef = useRef<any>(null)
  const [listening, setListening] = useState(false)

  const supported =
    typeof window !== 'undefined' &&
    ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)

  function toggle() {
    if (!supported) return
    if (listening) {
      recRef.current?.stop()
      return
    }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    const rec = new SR()
    rec.lang = 'en-US'
    rec.interimResults = false
    rec.onresult = (e: any) => {
      const text = Array.from(e.results).map((r: any) => r[0].transcript).join(' ')
      onText(text)
    }
    rec.onend = () => setListening(false)
    rec.start()
    recRef.current = rec
    setListening(true)
  }

  return { toggle, listening, supported }
}

export function Journal() {
  const [content, setContent] = useState('')
  const [reflection, setReflection] = useState('')
  const analyze = useAnalyzeSentiment()
  const create = useCreateJournal()
  const weekSeries = useMoodSeries(7)
  const weeklyReflection = useWeeklyReflection()

  const voice = useVoice((t) => setContent((c) => (c ? `${c} ${t}` : t)))

  // Debounced live sentiment — score 600ms after the user stops typing.
  useEffect(() => {
    if (content.trim().length < 8) return
    const id = setTimeout(() => analyze.mutate(content), 600)
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content])

  // Seed the editable reflection with the real Groq-generated one once it loads.
  useEffect(() => {
    if (weeklyReflection.data && !reflection) setReflection(weeklyReflection.data)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weeklyReflection.data])

  const chartData = (weekSeries.data ?? [])
    .filter((p) => p.avg_sentiment !== null)
    .map((p) => ({ date: p.date.slice(5), score: Math.round(((p.avg_sentiment as number) + 1) * 50) }))

  const live = analyze.data
  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })

  function save() {
    if (!content.trim()) return
    create.mutate(content, { onSuccess: () => setContent('') })
  }

  return (
    <div className="animate-rise grid grid-cols-1 gap-4 lg:grid-cols-[1.5fr_1fr]">
      {/* Editor */}
      <Card className="flex flex-col">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-[20px] font-semibold text-ink">{today}</h2>
          <button
            onClick={voice.toggle}
            disabled={!voice.supported}
            className="flex items-center gap-2 rounded-full border px-3 py-1.5 text-[12.5px] font-medium disabled:opacity-40"
            style={{
              borderColor: 'rgba(40,60,110,0.1)',
              color: voice.listening ? '#F2607D' : 'var(--color-body)',
            }}
            title={voice.supported ? 'Voice journaling' : 'Voice not supported in this browser'}
          >
            {voice.listening ? <MicOff size={15} /> : <Mic size={15} />}
            {voice.listening ? 'Listening…' : 'Voice'}
          </button>
        </div>

        <div
          className="mb-3 rounded-xl px-4 py-2.5 text-[13px] italic"
          style={{ background: 'var(--accent-soft)', color: 'var(--accent-deep)' }}
        >
          What felt lighter today than it did yesterday?
        </div>

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Start writing…"
          className="min-h-[220px] flex-1 resize-none rounded-xl border bg-soft p-4 text-[14.5px] leading-relaxed text-body outline-none"
          style={{ borderColor: 'rgba(40,60,110,0.07)' }}
        />

        <div className="mt-3 flex items-center gap-2">
          {live && (
            <span
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] font-medium"
              style={{ background: '#F5F8FC', color: 'var(--color-body)' }}
            >
              {MOOD_EMOJI[live.mood_label] ?? '🙂'} {live.mood_label} ·{' '}
              <span className="font-mono">{live.sentiment_score > 0 ? '+' : ''}{live.sentiment_score}</span>
            </span>
          )}
          {live?.emotion_tags?.map((t) => (
            <span key={t} className="rounded-full px-2.5 py-1 text-[11.5px]" style={{ background: 'var(--accent-soft)', color: 'var(--accent-deep)' }}>
              #{t}
            </span>
          ))}
          <button
            onClick={save}
            disabled={create.isPending || !content.trim()}
            className="ml-auto rounded-xl px-5 py-2.5 text-[13.5px] font-semibold text-white disabled:opacity-50"
            style={{ background: 'var(--accent-deep)' }}
          >
            {create.isPending ? 'Saving…' : 'Save entry'}
          </button>
        </div>
      </Card>

      {/* Right column */}
      <div className="flex flex-col gap-4">
        <Card>
          <h3 className="mb-2 font-display text-[17px] font-semibold text-ink">This week's mood</h3>
          {chartData.length === 0 ? (
            <div className="flex h-[120px] items-center justify-center text-[12.5px] text-muted">
              No entries this week yet.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={120}>
              <AreaChart data={chartData} margin={{ top: 6, right: 6, left: 6, bottom: 0 }}>
                <defs>
                  <linearGradient id="wkFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9AA6BE' }} tickLine={false} axisLine={false} />
                <Area type="monotone" dataKey="score" stroke="var(--accent)" strokeWidth={2} fill="url(#wkFill)" isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card dark className="flex-1">
          <h3 className="mb-2 font-display text-[17px] font-semibold">Weekly reflection</h3>
          <textarea
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            className="min-h-[120px] w-full resize-none rounded-xl border-none bg-white/10 p-3 text-[13.5px] leading-relaxed text-white outline-none placeholder:text-white/50"
            placeholder="Auto-generated from your entries — edit freely."
          />
          <p className="mt-2 text-[11px] text-white/60">Auto-generated from your recent entries. A reflection, not a diagnosis.</p>
        </Card>
      </div>
    </div>
  )
}
