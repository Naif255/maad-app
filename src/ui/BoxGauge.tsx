import { motion } from 'motion/react'
import { HANGER_PATH } from './Logo'

export function BoxGauge({ ratio, size = 132, full }: { ratio: number; size?: number; full?: boolean }) {
  const r = Math.max(0, Math.min(1, ratio))
  const top = 30
  const bottom = 104
  const level = bottom - r * (bottom - top)
  const stroke = full ? '#D9822B' : '#0F1714'
  return (
    <svg width={size} height={size} viewBox="0 0 120 120">
      <defs>
        <clipPath id="gauge-in">
          <rect x="18" y={top} width="84" height={bottom - top} rx="8" />
        </clipPath>
        <linearGradient id="gauge-steel" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#C9D1D8" />
          <stop offset="0.45" stopColor="#9AA6B1" />
          <stop offset="1" stopColor="#6E7A85" />
        </linearGradient>
        <pattern id="gauge-hatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
          <line x1="0" y1="0" x2="0" y2="7" stroke="rgba(255,255,255,0.28)" strokeWidth="1.4" />
        </pattern>
      </defs>
      <rect x="18" y={top} width="84" height={bottom - top} rx="8" fill="rgba(15,23,20,0.05)" />
      <g clipPath="url(#gauge-in)">
        <motion.g initial={false} animate={{ y: level - top }} transition={{ type: 'spring', stiffness: 45, damping: 13 }}>
          <path d={`M18 ${top + 3} Q 40 ${top - 3}, 60 ${top + 2} T 102 ${top + 1} V 140 H 18 Z`} fill="url(#gauge-steel)" />
          <path d={`M18 ${top + 3} Q 40 ${top - 3}, 60 ${top + 2} T 102 ${top + 1} V 140 H 18 Z`} fill="url(#gauge-hatch)" />
          <path d={`M18 ${top + 3} Q 40 ${top - 3}, 60 ${top + 2} T 102 ${top + 1}`} stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" fill="none" />
        </motion.g>
      </g>
      <rect x="18" y={top} width="84" height={bottom - top} rx="8" fill="none" stroke={stroke} strokeWidth="2.5" />
      <rect x="44" y={top - 7} width="32" height="5" rx="2.5" fill={stroke} />
      <g transform="translate(46 80) scale(0.44)" opacity={r > 0.35 ? 0.9 : 0.35}>
        <path d={HANGER_PATH} stroke={r > 0.35 ? '#fff' : '#0F1714'} strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <text x="60" y={r > 0.55 ? 72 : Math.min(level - 8, 80)} textAnchor="middle" fontSize="19" fontWeight="700" fill={r > 0.55 ? '#fff' : '#0F1714'} style={{ fontFamily: 'var(--font-display)' }}>
        {Math.round(r * 100)}%
      </text>
    </svg>
  )
}
