// The auth-page orb, built to the login spec's exact values (fixed sky-blue, not mood-tinted).
export function AuthMascot({ size = 46 }: { size?: number }) {
  return (
    <div style={{ width: size, height: size, position: 'relative' }}>
      {/* Aura */}
      <div
        style={{
          position: 'absolute',
          inset: -8,
          borderRadius: '50%',
          background: 'radial-gradient(circle, #6FC0E8, transparent 70%)',
          opacity: 0.5,
          animation: 'glowpulse 5s ease-in-out infinite',
        }}
      />
      {/* Body */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          background: 'radial-gradient(140% 140% at 32% 28%, #CDEBFB 0%, #4F93D9 58%, #2F6DB0 100%)',
          boxShadow: 'inset 0 -3px 8px rgba(0,0,0,0.12)',
          animation: 'breathe 4.5s ease-in-out infinite',
        }}
      >
        {/* Two eyes, scaled to the size (spec values are for 46px) */}
        {[15, 27].map((left) => (
          <span
            key={left}
            style={{
              position: 'absolute',
              top: `${(18 / 46) * 100}%`,
              left: `${(left / 46) * 100}%`,
              width: `${(4 / 46) * size}px`,
              height: `${(7 / 46) * size}px`,
              background: '#1c3050',
              borderRadius: 3,
              animation: 'blink 6s infinite',
            }}
          />
        ))}
      </div>
    </div>
  )
}
