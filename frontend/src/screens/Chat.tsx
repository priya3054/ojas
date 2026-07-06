import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Send, Shield } from 'lucide-react'
import { Card } from '../components/Card'
import { Mascot } from '../components/Mascot'
import { useChat, type ChatSource } from '../lib/hooks'

interface Message {
  role: 'user' | 'ojas'
  text: string
  sources?: ChatSource[]
  crisis?: boolean
}

const SUGGESTIONS = [
  'Why was my mood low last week?',
  'Did screen time affect my sleep?',
  'How is my medicine adherence trending?',
]

// A coloured dot per source type for the citation chips.
const SOURCE_COLORS: Record<string, string> = {
  Journal: '#4F93D9',
  DoseLog: '#4E9A7C',
  ScreenTime: '#C0879E',
  Habit: '#7B8CE8',
  Cycle: '#D98BAA',
}

export function Chat() {
  const chat = useChat()
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [searchParams, setSearchParams] = useSearchParams()
  const seeded = useRef(false)

  // If arrived via the top-bar search (?q=…) or a click-to-explain link, auto-send once.
  useEffect(() => {
    const q = searchParams.get('q')
    if (q && !seeded.current) {
      seeded.current = true
      ask(q)
      setSearchParams({}, { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  function ask(question: string) {
    if (!question.trim()) return
    setMessages((m) => [...m, { role: 'user', text: question }])
    setInput('')
    chat.mutate(question, {
      onSuccess: (data) => {
        setMessages((m) => [
          ...m,
          { role: 'ojas', text: data.answer, sources: data.sources, crisis: data.crisis },
        ])
      },
      onError: () => {
        setMessages((m) => [
          ...m,
          { role: 'ojas', text: 'Sorry, something went wrong reaching Ojas. Please try again.' },
        ])
      },
    })
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    ask(input)
  }

  return (
    <div className="animate-rise flex h-[calc(100vh-140px)] flex-col gap-4 lg:flex-row lg:gap-[18px]">
      {/* Conversation panel */}
      <Card className="flex flex-1 flex-col !p-0">
        {/* Header */}
        <div
          className="flex items-center gap-3 border-b px-5 py-3"
          style={{ borderColor: 'rgba(40,60,110,0.06)' }}
        >
          <div className="h-9 w-9">
            <Mascot size={36} />
          </div>
          <div className="flex-1">
            <div className="text-[15px] font-semibold text-ink">Ojas</div>
            <div className="flex items-center gap-1 text-[11.5px] text-success">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: '#4E9A7C' }} />
              Reasoning over your logged data
            </div>
          </div>
          <span
            className="rounded-full px-2.5 py-1 text-[10.5px] font-medium text-body-soft"
            style={{ background: '#F5F8FC' }}
          >
            Llama 3.3 · ChromaDB
          </span>
        </div>

        {/* Messages */}
        <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-5 py-4">
          {messages.length === 0 && (
            <div className="m-auto max-w-xs text-center text-[13px] text-muted">
              Ask Ojas anything about your mood, meds, habits, or screen time — grounded in your own logs.
            </div>
          )}

          {messages.map((m, i) =>
            m.role === 'user' ? (
              <div
                key={i}
                className="ml-auto max-w-[75%] rounded-[16px_16px_4px_16px] px-4 py-2.5 text-[14px] text-white"
                style={{ background: 'var(--accent-deep)' }}
              >
                {m.text}
              </div>
            ) : (
              <div key={i} className="mr-auto max-w-[80%]">
                <div
                  className="rounded-[4px_16px_16px_16px] border px-4 py-2.5 text-[14px] text-body"
                  style={{ background: '#F5F8FC', borderColor: 'rgba(40,60,110,0.06)' }}
                >
                  {m.text}
                </div>
                {m.sources && m.sources.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {m.sources.map((s, j) => (
                      <span
                        key={j}
                        className="flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] text-body-soft"
                        style={{ borderColor: 'rgba(40,60,110,0.08)', background: '#fff' }}
                      >
                        <span
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ background: SOURCE_COLORS[s.source] ?? '#93A0BC' }}
                        />
                        {s.source} · {s.date.slice(5)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ),
          )}

          {chat.isPending && (
            <div className="mr-auto flex gap-1 rounded-[4px_16px_16px_16px] border px-4 py-3" style={{ background: '#F5F8FC', borderColor: 'rgba(40,60,110,0.06)' }}>
              {[0, 1, 2].map((d) => (
                <span
                  key={d}
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: '#93A0BC', animation: `typing 1.2s ${d * 0.2}s infinite` }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Composer */}
        <div className="border-t px-5 py-3" style={{ borderColor: 'rgba(40,60,110,0.06)' }}>
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your mood, meds or habits…"
              className="flex-1 rounded-full border bg-soft px-4 py-2.5 text-[14px] outline-none"
              style={{ borderColor: 'rgba(40,60,110,0.07)' }}
            />
            <button
              type="submit"
              disabled={chat.isPending}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white disabled:opacity-50"
              style={{ background: 'var(--accent-deep)' }}
            >
              <Send size={17} />
            </button>
          </form>
          <p className="mt-2 text-[11px] text-muted">
            Answers are grounded in your own logs. Ojas does not give medical or diagnostic advice.
          </p>
        </div>
      </Card>

      {/* Side column */}
      <div className="flex w-full shrink-0 flex-col gap-4 lg:w-[280px] lg:gap-[18px]">
        <Card>
          <h3 className="mb-2 font-display text-[17px] font-semibold text-ink">Try asking</h3>
          <div className="flex flex-col gap-2">
            {SUGGESTIONS.map((q) => (
              <button
                key={q}
                onClick={() => ask(q)}
                disabled={chat.isPending}
                className="rounded-xl border px-3 py-2 text-left text-[12.5px] text-body hover:bg-soft disabled:opacity-50"
                style={{ borderColor: 'rgba(40,60,110,0.08)' }}
              >
                {q}
              </button>
            ))}
          </div>
        </Card>

        <Card>
          <div className="mb-1 flex items-center gap-2 text-accent-deep">
            <Shield size={16} />
            <h3 className="font-display text-[15px] font-semibold text-ink">Crisis-safe by design</h3>
          </div>
          <p className="text-[12px] leading-snug text-muted">
            If a message signals serious distress, Ojas replaces its AI response with a fixed, pre-verified
            helpline message — never an AI-generated therapeutic reply.
          </p>
        </Card>
      </div>
    </div>
  )
}
