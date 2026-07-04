import { Play } from 'lucide-react'
import { Card } from '../components/Card'
import { Mascot } from '../components/Mascot'
import { useApp } from '../context/AppContext'
import { MOODS } from '../data/theme'
import { useDiscover, type DiscoverVideo } from '../lib/hooks'

function VideoCard({ v }: { v: DiscoverVideo }) {
  const open = () => {
    if (v.video_id) window.open(`https://www.youtube.com/watch?v=${v.video_id}`, '_blank')
  }
  return (
    <button onClick={open} className="group text-left">
      <div
        className="relative flex aspect-video items-center justify-center overflow-hidden rounded-2xl"
        style={{
          background: v.thumbnail_url
            ? `center/cover url(${v.thumbnail_url})`
            : 'linear-gradient(135deg, var(--accent-soft), var(--accent))',
        }}
      >
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/85 shadow-sm transition-transform group-hover:scale-110">
          <Play size={18} className="ml-0.5 text-accent-deep" fill="currentColor" />
        </span>
      </div>
      <div className="mt-2 line-clamp-2 text-[13.5px] font-semibold leading-snug text-ink">{v.title}</div>
      <div className="text-[12px] text-muted">{v.channel}</div>
    </button>
  )
}

export function Discover() {
  const { mood } = useApp()
  const discover = useDiscover(mood)
  const activeMood = MOODS[mood as keyof typeof MOODS] ?? MOODS.calm

  return (
    <div className="animate-rise flex flex-col gap-4">
      {/* Header */}
      <Card className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-5">
        <Mascot size={70} />
        <div className="flex-1">
          <h2 className="font-display text-[20px] font-semibold text-ink sm:text-[22px]">
            Because you're feeling {activeMood.label.toLowerCase()} {activeMood.emoji}
          </h2>
          <p className="text-[13px] text-muted">Calming, mood-matched wellness content — pulled from YouTube.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {['Calming', 'Focus', 'Sleep'].map((c) => (
            <span key={c} className="rounded-full px-3 py-1.5 text-[12px] font-medium" style={{ background: 'var(--accent-soft)', color: 'var(--accent-deep)' }}>
              {c}
            </span>
          ))}
        </div>
      </Card>

      {/* Video grid */}
      {discover.isLoading ? (
        <div className="py-16 text-center text-[13px] text-muted">Finding videos for your mood…</div>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          {discover.data?.videos.map((v, i) => <VideoCard key={v.video_id || i} v={v} />)}
        </div>
      )}

      {discover.data?.videos.every((v) => v.is_stub) && (
        <p className="text-center text-[12px] text-muted">
          Showing sample cards. Add a YouTube API key to load real videos.
        </p>
      )}
    </div>
  )
}
