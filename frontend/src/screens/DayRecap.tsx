import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Square, Sparkles, Smile, AudioLines, MessageSquareText, Loader2 } from 'lucide-react'
import { Card } from '../components/Card'
import { useAnalyzeRecap, useRecentRecaps, type RecapAnalysis } from '../lib/hooks'

function Meter({ label, value, level, color }: { label: string; value: number; level: string; color: string }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-[12px]">
        <span className="text-body">{label}</span>
        <span className="text-muted">{level}</span>
      </div>
      <div className="h-2 rounded-full" style={{ background: '#EDF2FA' }}>
        <div className="h-2 rounded-full" style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: color }} />
      </div>
    </div>
  )
}

export function DayRecap() {
  const navigate = useNavigate()
  const analyze = useAnalyzeRecap()
  const recents = useRecentRecaps()

  const [seconds, setSeconds] = useState(0)
  const [result, setResult] = useState<RecapAnalysis | null>(null)
  const [recording, setRecording] = useState(true)

  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  // Start camera + mic, show preview, and begin recording audio.
  function startRecording() {
    setResult(null)
    setSeconds(0)
    chunksRef.current = []
    navigator.mediaDevices
      ?.getUserMedia({ video: true, audio: true })
      .then((stream) => {
        streamRef.current = stream
        if (videoRef.current) videoRef.current.srcObject = stream
        const audioStream = new MediaStream(stream.getAudioTracks())
        const rec = new MediaRecorder(audioStream)
        rec.ondataavailable = (e) => e.data.size > 0 && chunksRef.current.push(e.data)
        rec.start()
        recorderRef.current = rec
        setRecording(true)
      })
      .catch(() => setRecording(true)) // no camera/mic — still allow the UI
  }

  useEffect(() => {
    startRecording()
    return () => streamRef.current?.getTracks().forEach((t) => t.stop())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // REC timer while recording.
  useEffect(() => {
    if (!recording) return
    const id = setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => clearInterval(id)
  }, [recording])

  function stopAndAnalyze() {
    const rec = recorderRef.current
    const duration = seconds
    setRecording(false)
    const finish = (blob: Blob) => {
      streamRef.current?.getTracks().forEach((t) => t.stop())
      analyze.mutate({ audio: blob, duration }, { onSuccess: (data) => setResult(data) })
    }
    if (rec && rec.state !== 'inactive') {
      rec.onstop = () => finish(new Blob(chunksRef.current, { type: 'audio/webm' }))
      rec.stop()
    } else {
      finish(new Blob(chunksRef.current, { type: 'audio/webm' }))
    }
  }

  const mmss = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
  const analyzing = analyze.isPending
  const done = !!result

  return (
    <div className="animate-rise flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Recorder */}
        <Card className="!p-0 overflow-hidden">
          <div className="relative flex aspect-video items-center justify-center" style={{ background: 'radial-gradient(circle at 50% 40%, #2b3550, #141a2b 75%)' }}>
            <video ref={videoRef} autoPlay muted playsInline className="h-full w-full object-cover opacity-90" />
            {recording && (
              <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-black/40 px-2.5 py-1 text-[11px] font-medium text-white">
                <span className="h-2 w-2 rounded-full" style={{ background: '#F2607D', animation: 'glowpulse 1.2s infinite' }} />
                REC <span className="font-mono">{mmss}</span>
              </div>
            )}
            <div className="absolute bottom-3 left-3 rounded-full bg-black/40 px-2.5 py-1 text-[10.5px] text-white/90">🎙 mic on</div>
          </div>

          <div className="flex flex-col items-center gap-3 p-4">
            {recording ? (
              <>
                <div className="flex items-center gap-2 text-[12.5px] text-muted">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full" style={{ background: '#FBE3E9' }}>
                    <Square size={15} className="text-record" fill="currentColor" />
                  </span>
                  Recording your day…
                </div>
                <button
                  onClick={stopAndAnalyze}
                  className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-[13.5px] font-semibold text-white"
                  style={{ background: 'var(--accent-deep)' }}
                >
                  <Sparkles size={16} /> Analyze with Ojas
                </button>
              </>
            ) : analyzing ? (
              <div className="flex items-center gap-2 py-2 text-[13px] text-body">
                <Loader2 size={16} className="animate-spin" /> Transcribing & reading your recap…
              </div>
            ) : (
              <button
                onClick={startRecording}
                className="rounded-xl border px-5 py-2.5 text-[13.5px] font-semibold text-body"
                style={{ borderColor: 'rgba(40,60,110,0.13)' }}
              >
                Re-record
              </button>
            )}
            <p className="text-center text-[11px] leading-snug text-muted">
              Your voice is transcribed and analysed. Only the summary is saved — never the footage.
            </p>
          </div>
        </Card>

        {/* Right panel */}
        {!done && !analyzing ? (
          <Card>
            <h3 className="mb-3 font-display text-[18px] font-semibold text-ink">What Ojas will look for</h3>
            <div className="flex flex-col gap-3">
              {[
                { icon: MessageSquareText, t: 'Your words', d: 'Real sentiment and themes in what you say (transcribed).' },
                { icon: AudioLines, t: 'Emotional tone', d: 'Emotion read from your spoken words.' },
                { icon: Smile, t: 'Overall read', d: 'A plain-language summary of how you seem.' },
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
        ) : analyzing ? (
          <Card className="flex items-center justify-center">
            <div className="flex flex-col items-center gap-2 py-10 text-[13px] text-muted">
              <Loader2 size={22} className="animate-spin text-accent-deep" /> Analysing your recap…
            </div>
          </Card>
        ) : result ? (
          <div className="flex flex-col gap-4">
            <Card dark>
              <span className="mb-2 inline-block rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-bold tracking-wide">
                {result.crisis ? 'SUPPORT' : 'VOICE + WORDS'}
              </span>
              <h3 className="mb-1 font-display text-[18px] font-semibold">Ojas read your recap</h3>
              <p className="text-[13.5px] leading-relaxed text-white/85">{result.overall_read}</p>
              {result.transcript_summary && (
                <p className="mt-2 text-[11px] italic text-white/50">"{result.transcript_summary.slice(0, 120)}…"</p>
              )}
            </Card>
            {!result.crisis && (
              <Card>
                <div className="mb-3 flex items-center justify-between">
                  <span className="rounded-full px-3 py-1 text-[12px] font-semibold text-accent-deep" style={{ background: 'var(--accent-soft)' }}>
                    Overall: {result.mood_label}
                  </span>
                  <span className="text-[12px] text-muted">confidence <span className="font-mono">{Math.round(result.confidence ?? 0)}%</span></span>
                </div>
                <div className="flex flex-col gap-3">
                  <Meter label="Stress" value={result.stress_score ?? 0} level={`${Math.round(result.stress_score ?? 0)}%`} color="#E7B0C0" />
                  <Meter label="Energy" value={result.energy_score ?? 0} level={`${Math.round(result.energy_score ?? 0)}%`} color="var(--accent)" />
                  <Meter label="Positivity of words" value={((result.positivity_score ?? 0) + 1) * 50} level={`${(result.positivity_score ?? 0) > 0 ? '+' : ''}${result.positivity_score ?? 0}`} color="#5BB98C" />
                </div>
                {result.themes.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {result.themes.map((t) => (
                      <span key={t} className="rounded-full px-2.5 py-1 text-[11.5px]" style={{ background: '#F5F8FC', color: 'var(--color-body)' }}>#{t}</span>
                    ))}
                  </div>
                )}
                <div className="mt-3 flex gap-2">
                  <button onClick={startRecording} className="flex-1 rounded-lg border py-2 text-[12.5px] font-semibold text-body" style={{ borderColor: 'rgba(40,60,110,0.13)' }}>Re-record</button>
                  <button onClick={() => navigate('/assistant')} className="flex-1 rounded-lg py-2 text-[12.5px] font-semibold text-white" style={{ background: 'var(--accent-deep)' }}>Talk to Ojas about it</button>
                </div>
                <p className="mt-2 text-[10.5px] text-muted">If a recap signals serious distress, Ojas shows a helpline instead of an AI reply.</p>
              </Card>
            )}
          </div>
        ) : null}
      </div>

      {/* Recent recaps */}
      <Card>
        <h3 className="mb-3 font-display text-[16px] font-semibold text-ink">Recent recaps</h3>
        {recents.data && recents.data.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {recents.data.map((r) => (
              <div key={r.id}>
                <div className="flex aspect-video items-end rounded-xl p-2" style={{ background: 'radial-gradient(circle at 50% 40%, #2b3550, #141a2b 80%)' }}>
                  <span className="rounded bg-black/40 px-1.5 py-0.5 font-mono text-[9.5px] text-white">
                    {String(Math.floor(r.duration_seconds / 60)).padStart(2, '0')}:{String(r.duration_seconds % 60).padStart(2, '0')}
                  </span>
                </div>
                <div className="mt-1.5 text-[11.5px] font-semibold text-ink">{r.date.slice(5)} · {r.mood_label}</div>
                <div className="line-clamp-2 text-[11px] leading-snug text-muted">{r.overall_read}</div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[13px] text-muted">No recaps yet — record your first one above.</p>
        )}
      </Card>
    </div>
  )
}
