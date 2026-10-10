import { motion } from 'motion/react'
import { useMemo } from 'react'

export function BoxGauge({ ratio, size = 132, full }: { ratio: number; size?: number; full?: boolean }) {
  const r = Math.max(0, Math.min(1, ratio))
  const wires = useMemo(
    () =>
      Array.from({ length: 26 }, (_, i) => ({
        y: 96 - (i / 26) * 70,
        x: 18 + ((i * 37) % 30),
        rot: ((i * 53) % 40) - 20,
        w: 34 + ((i * 17) % 18),
      })),
    [],
  )
  const level = 96 - r * 72
  return (
    <svg width={size} height={size} viewBox="0 0 120 120">
      <defs>
        <clipPath id="box-in">
          <path d="M16 30h88v66a6 6 0 0 1-6 6H22a6 6 0 0 1-6-6z" />
        </clipPath>
        <linearGradient id="steel-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#C9D1D8" />
          <stop offset="1" stopColor="#7D8A96" />
        </linearGradient>
      </defs>
      <path d="M16 30h88v66a6 6 0 0 1-6 6H22a6 6 0 0 1-6-6z" fill="rgba(15,23,20,0.05)" />
      <g clipPath="url(#box-in)">
        <motion.rect x="16" width="88" height="80" fill="url(#steel-fill)" initial={false} animate={{ y: level }} transition={{ type: 'spring', stiffness: 50, damping: 14 }} />
        {wires.map((w, i) => (
          <motion.path
            key={i}
            d={`M${w.x} ${w.y} l${w.w / 2} -8 l${w.w / 2} 8 z`}
            fill="none"
            stroke="rgba(255,255,255,0.55)"
            strokeWidth="1.4"
            strokeLinejoin="round"
            transform={`rotate(${w.rot} ${w.x + w.w / 2} ${w.y})`}
            initial={false}
            animate={{ opacity: w.y > level + 6 ? 1 : 0 }}
          />
        ))}
      </g>
      <path d="M16 30h88v66a6 6 0 0 1-6 6H22a6 6 0 0 1-6-6z" fill="none" stroke={full ? '#D9822B' : '#0F1714'} strokeWidth="2.5" />
      <path d="M10 30h100" stroke={full ? '#D9822B' : '#0F1714'} strokeWidth="3.5" strokeLinecap="round" />
      <path d="M50 22h20" stroke={full ? '#D9822B' : '#0F1714'} strokeWidth="3.5" strokeLinecap="round" />
      <text x="60" y="70" textAnchor="middle" fontSize="18" fontWeight="700" fill={r > 0.55 ? '#fff' : '#0F1714'} style={{ fontFamily: 'var(--font-display)' }}>
        {Math.round(r * 100)}%
      </text>
    </svg>
  )
}
