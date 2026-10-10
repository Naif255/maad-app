import { motion } from 'motion/react'

export const HANGER_PATH =
  'M26.6 13.2C25.4 8.6 28.6 4.6 32.6 4.6c4.2 0 6.9 3.4 5.8 7.2-.8 2.7-3.9 4.4-6.4 6.4v1.6L6.3 35.9c-2.6 1.6-1.5 4 1.2 4h49c2.7 0 3.8-2.4 1.2-4L34.2 21'

export function LogoMark({ size = 40, color = 'currentColor', draw = false, strokeWidth = 3.2 }: { size?: number; color?: string; draw?: boolean; strokeWidth?: number }) {
  return (
    <svg width={size} height={(size * 46) / 64} viewBox="0 0 64 46" fill="none" aria-hidden>
      <motion.path
        d={HANGER_PATH}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={draw ? { pathLength: 0 } : false}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.4, ease: [0.65, 0, 0.35, 1] }}
      />
      <motion.path
        d="M23.6 10.6l3 2.8 3.2-2.4"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={draw ? { opacity: 0 } : false}
        animate={{ opacity: 1 }}
        transition={{ delay: draw ? 1.2 : 0, duration: 0.3 }}
      />
    </svg>
  )
}

export function Logo({ size = 28, color = 'currentColor', tone = 'ink' }: { size?: number; color?: string; tone?: 'ink' | 'light' }) {
  return (
    <div className="flex items-center gap-2" style={{ color }}>
      <LogoMark size={size * 1.35} color={tone === 'light' ? '#fff' : 'var(--color-loop)'} />
      <span className="font-display font-semibold tracking-tight" style={{ fontSize: size, lineHeight: 1 }}>
        مَعاد
      </span>
    </div>
  )
}
