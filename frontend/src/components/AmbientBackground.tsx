import { useApp } from '../context/AppContext'

// Two large blurred radial blobs drifting behind the workspace (mood glow + periwinkle).
export function AmbientBackground() {
  const { ambientMotion } = useApp()
  const playState = ambientMotion ? 'running' : 'paused'

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div
        style={{
          position: 'absolute',
          top: '-10%',
          left: '55%',
          width: 520,
          height: 520,
          borderRadius: '50%',
          background: 'radial-gradient(circle, var(--mood-glow), transparent 65%)',
          opacity: 0.28,
          filter: 'blur(40px)',
          animation: 'floaty 16s ease-in-out infinite',
          animationPlayState: playState,
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-15%',
          left: '10%',
          width: 460,
          height: 460,
          borderRadius: '50%',
          background: 'radial-gradient(circle, #B8C2F0, transparent 65%)',
          opacity: 0.25,
          filter: 'blur(40px)',
          animation: 'floaty 22s ease-in-out infinite',
          animationPlayState: playState,
        }}
      />
    </div>
  )
}
