import { MOODS, type MoodKey } from '../data/theme'
import { useApp } from '../context/AppContext'

// Per-mood eye + mouth SVG paths give the orb its expression.
const FACES: Record<MoodKey, { eyes: string; mouth: string }> = {
  excited: { eyes: 'M -14 -4 a4 4 0 1 0 0.1 0 M 14 -4 a4 4 0 1 0 0.1 0', mouth: 'M -12 8 Q 0 20 12 8' },
  good:    { eyes: 'M -14 -4 a3.5 3.5 0 1 0 0.1 0 M 14 -4 a3.5 3.5 0 1 0 0.1 0', mouth: 'M -11 8 Q 0 16 11 8' },
  calm:    { eyes: 'M -17 -3 Q -14 -6 -11 -3 M 11 -3 Q 14 -6 17 -3', mouth: 'M -9 9 Q 0 13 9 9' },
  sleepy:  { eyes: 'M -17 -2 L -11 -2 M 11 -2 L 17 -2', mouth: 'M -6 10 Q 0 12 6 10' },
  sad:     { eyes: 'M -14 -3 a3 3 0 1 0 0.1 0 M 14 -3 a3 3 0 1 0 0.1 0', mouth: 'M -9 12 Q 0 6 9 12' },
  anxious: { eyes: 'M -14 -3 a3 3 0 1 0 0.1 0 M 14 -3 a3 3 0 1 0 0.1 0', mouth: 'M -9 10 Q 0 8 9 12' },
}

interface MascotProps {
  size?: number
}

export function Mascot({ size = 94 }: MascotProps) {
  const { mood, ambientMotion, showMascot } = useApp()
  if (!showMascot) return null

  const m = MOODS[mood]
  const face = FACES[mood]
  const playState = ambientMotion ? 'running' : 'paused'

  return (
    <div
      style={{
        width: size,
        height: size,
        position: 'relative',
        animation: `floaty var(--mascot-float) ease-in-out infinite`,
        animationPlayState: playState,
      }}
    >
      {/* Aura glow behind the orb */}
      <div
        style={{
          position: 'absolute',
          inset: '-18%',
          borderRadius: '50%',
          background: `radial-gradient(circle at 50% 55%, ${m.glow}88, transparent 70%)`,
          filter: 'blur(8px)',
          animation: 'glowpulse var(--mascot-breathe) ease-in-out infinite',
          animationPlayState: playState,
        }}
      />
      {/* The orb body */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          background: `radial-gradient(circle at 38% 30%, #ffffff, #eaf3fc 42%, ${m.glow} 130%)`,
          boxShadow: `inset -6px -8px 16px ${m.glow}55, 0 8px 20px rgba(40,60,110,0.12)`,
          animation: 'breathe var(--mascot-breathe) ease-in-out infinite',
          animationPlayState: playState,
        }}
      >
        <svg viewBox="-47 -47 94 94" width="100%" height="100%">
          <g
            fill="none"
            stroke="#2f4374"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ animation: 'blink 5.5s infinite', animationPlayState: playState, transformOrigin: 'center' }}
          >
            <path d={face.eyes} />
            <path d={face.mouth} />
          </g>
        </svg>
      </div>
    </div>
  )
}
