import type { CSSProperties, ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  dark?: boolean
  style?: CSSProperties
}

// Standard surface card from the design tokens: white bg, hairline border, soft shadow,
// ~20px radius. `dark` variant is the gradient insight card (dark navy, white text).
export function Card({ children, className = '', dark = false, style }: CardProps) {
  return (
    <div
      className={`rounded-[20px] p-5 ${className}`}
      style={{
        background: dark ? 'linear-gradient(150deg, #22314F, #2F4374)' : '#ffffff',
        color: dark ? '#ffffff' : undefined,
        border: dark ? 'none' : '1px solid rgba(40,60,110,0.07)',
        boxShadow: '0 6px 18px rgba(40,60,110,0.03)',
        ...style,
      }}
    >
      {children}
    </div>
  )
}
