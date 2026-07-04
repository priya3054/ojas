import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Square, Sparkles, Smile, AudioLines, MessageSquareText } from 'lucide-react'
import { Card } from '../components/Card'

function Meter({ label, value, level, color }: { label: string; value: number; level: string; color: string }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-[12px]">
        <span className="text-body">{label}</span>
        <span className="text-muted">{level} · {value}%</span>
      </div>
      <div className="h-2 rounded-full" style={{ background: '#EDF2FA' }}>
        <div className="h-2 rounded-full" style={{ width: `${value}%`, background: color }} />
      </div>
    </div>
  )
}

export function DayRecap() {
  const navigate = useNavigate()
  const [analyzed, setAnalyzed] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Tick the REC timer while recording (not analyzed).
  useEffect(() => {
    if (analyzed) return
    const id = setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => clearInterval(id)
  }, [analyzed])

  // Try to show a live camera preview; fall back silently to the dark placeholder.
  useEffect(() => {
    let cancelled = false
    navigator.mediaDevices?.getUserMedia({ video: true, audio: false })
      .then((stream) => {
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return }
        streamRef.current = stream
        if (videoRef.current) videoRef.current.srcObject = stream
      })
      .catch(() => {})
    return () => {
      cancelled = true
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  const mmss = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`

  return (
    <div className="animate-rise flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Recorder */}
        <Card className="!p-0 overflow-hidden">
          <div className="relative flex aspect-video items-center justify-center" style={{ background: 'radial-gradient(circle at 50% 40%, #2b3550, #141a2b 75%)' }}>
            <video ref={videoRef} autoPlay muted playsInline className="h-full w-full object-cover opacity-90" />
            {!analyzed && (
              <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-black/40 px-2.5 py-1 text-[11px] font-medium text-white">
                <span className="h-2 w-2 rounded-full" style={{ background: '#F2607D', animation: 'glowpulse 1.2s infinite' }} />
                REC <span className="font-mono">{mmss}</span>
              </div>
            )}
            <div className="absolute bottom-3 left-3 rounded-full bg-black/40 px-2.5 py-1 text-[10.5px] text-white/90">🎙 mic on</div>
          </div>

          <div className="flex flex-col items-center gap-3 p-4">
            {!analyzed ? (
              <>
                <div className="flex items-center gap-2 text-[12.5px] text-muted">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full" style={{ background: '#FBE3E9' }}>
                    <Square size={15} className="text-record" fill="currentColor" />
                  </span>
                  Recording your day…
                </div>
                <button
                  onClick={() => setAnalyzed(true)}
                  className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-[13.5px] font-semibold text-white"
                  style={{ background: 'var(--accent-deep)' }}
                >
                  <Sparkles size={16} /> Analyze with Ojas
                </button>
              </>
            ) : (
              <button
                onClick={() => { setAnalyzed(false); setSeconds(0) }}
                className="rounded-xl border px-5 py-2.5 text-[13.5px] font-semibold text-body"
                style={{ borderColor: 'rgba(40,60,110,0.13)' }}
              >
                Re-record
              </button>
            )}
            <p className="text-center text-[11px] leading-snug text-muted">
              Processed on-device for expression & voice cues. Only the summary is saved — never the footage.
            </p>
          </div>
        </Card>

        {/* Right panel */}
        {!analyzed ? (
          <Card>
            <h3 className="mb-3 font-display text-[18px] font-semibold text-ink">What Ojas will look for</h3>
            <div className="flex flex-col gap-3">
              {[
                { icon: Smile, t: 'Facial expression', d: 'Overall emotional tone from your expressions.' },
                { icon: AudioLines, t: 'Vocal tone', d: 'Energy and steadiness in how you speak.' },
                { icon: MessageSquareText, t: 'Your words', d: 'Sentiment and themes in what you say.' },
              ].map((r) => (
                <div key={r.t} className="flex items-start gap-3 rounded-xl border p-3" style={{ borderColor: 'rgba(40,60,110,0.07)' }}>
                  <span className="flex h-9 w-9 items-center justify-center rounded-full" style={{ background: 'var(--accent-soft)' }}>
                    <r.icon size={17} className="text-accent-deep" />
                  </span>
                  <div>
                    <div className="text-[14px] font-semibold text-ink">{r.t}</div>
                    <div className="text-[12px] text-muted">{r.d}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ) : (
          <div className="flex flex-col gap-4">
            <Card dark>
              <span className="mb-2 inline-block rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-bold tracking-wide">MULTIMODAL</span>
              <h3 className="mb-1 font-display text-[18px] font-semibold">Ojas read your recap</h3>
              <p className="text-[13.5px] leading-relaxed text-white/85">
                You sounded a little tired but steady — your words leaned positive when you talked about your
                walk. A calm, honest check-in.
              </p>
              <p className="mt-2 text-[11px] text-white/55">Grounded in this recording's expression, voice and words.</p>
            </Card>
            <Card>
              <div className="mb-3 flex items-center justify-between">
                <span className="rounded-full px-3 py-1 text-[12px] font-semibold text-accent-deep" style={{ background: 'var(--accent-soft)' }}>Overall: calm</span>
                <span className="text-[12px] text-muted">confidence <span className="font-mono">82%</span></span>
              </div>
              <div className="flex flex-col gap-3">
                <Meter label="Stress" value={28} level="Low" color="#8FD0A6" />
                <Meter label="Energy" value={61} level="Moderate" color="var(--accent)" />
                <Meter label="Positivity of words" value={73} level="+0.46" color="#5BB98C" />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {['walk', 'tired', 'hopeful'].map((t) => (
                  <span key={t} className="rounded-full px-2.5 py-1 text-[11.5px]" style={{ background: '#F5F8FC', color: 'var(--color-body)' }}>#{t}</span>
                ))}
              </div>
              <div className="mt-3 flex gap-2">
                <button onClick={() => { setAnalyzed(false); setSeconds(0) }} className="flex-1 rounded-lg border py-2 text-[12.5px] font-semibold text-body" style={{ borderColor: 'rgba(40,60,110,0.13)' }}>Re-record</button>
                <button onClick={() => navigate('/assistant')} className="flex-1 rounded-lg py-2 text-[12.5px] font-semibold text-white" style={{ background: 'var(--accent-deep)' }}>Talk to Ojas about it</button>
              </div>
              <p className="mt-2 text-[10.5px] text-muted">If a recap signals serious distress, Ojas shows a helpline instead of an AI reply.</p>
            </Card>
          </div>
        )}
      </div>

      {/* Recent recaps */}
      <Card>
        <h3 className="mb-3 font-display text-[16px] font-semibold text-ink">Recent recaps</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { day: 'Thu', mood: 'good', read: 'Upbeat, talked about progress.' },
            { day: 'Wed', mood: 'calm', read: 'Even and steady.' },
            { day: 'Tue', mood: 'sad', read: 'Quieter, lower energy.' },
            { day: 'Mon', mood: 'calm', read: 'Reflective and honest.' },
          ].map((r, i) => (
            <div key={i}>
              <div className="flex aspect-video items-end rounded-xl p-2" style={{ background: 'radial-gradient(circle at 50% 40%, #2b3550, #141a2b 80%)' }}>
                <span className="rounded bg-black/40 px-1.5 py-0.5 font-mono text-[9.5px] text-white">0:47</span>
              </div>
              <div className="mt-1.5 text-[11.5px] font-semibold text-ink">{r.day} · {r.mood}</div>
              <div className="text-[11px] leading-snug text-muted">{r.read}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
