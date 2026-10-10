import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import type { Neighborhood } from '@/domain/types'

const ROADS = [
  'M-20 330 C 200 300, 420 340, 600 320 S 900 280, 1020 300',
  'M470 -20 C 480 160, 520 300, 540 420 S 600 620, 640 720',
  'M120 120 C 300 200, 420 260, 560 300 S 820 420, 980 520',
  'M80 600 C 240 520, 380 480, 520 470 S 760 430, 980 380',
  'M260 -20 C 250 120, 230 260, 250 420 S 300 620, 280 720',
  'M760 -20 C 740 160, 760 320, 800 460 S 860 620, 900 720',
]

export function CityMap({
  neighborhoods,
  heat,
  children,
  dark = false,
  className,
}: {
  neighborhoods: Neighborhood[]
  heat?: Record<string, number>
  children?: ReactNode
  dark?: boolean
  className?: string
}) {
  const max = heat ? Math.max(1, ...Object.values(heat)) : 1
  const land = dark ? '#17221D' : '#ECE6DA'
  const road = dark ? 'rgba(255,255,255,0.07)' : 'rgba(15,23,20,0.07)'
  const label = dark ? 'rgba(255,255,255,0.45)' : 'rgba(15,23,20,0.45)'
  return (
    <svg viewBox="0 0 1000 700" className={className} preserveAspectRatio="xMidYMid slice">
      <defs>
        <radialGradient id="hood-heat">
          <stop offset="0" stopColor="#0FA36B" stopOpacity="0.55" />
          <stop offset="1" stopColor="#0FA36B" stopOpacity="0" />
        </radialGradient>
        <pattern id="map-dots" width="18" height="18" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1" fill={dark ? 'rgba(255,255,255,0.05)' : 'rgba(15,23,20,0.06)'} />
        </pattern>
      </defs>
      <rect width="1000" height="700" fill={land} />
      <rect width="1000" height="700" fill="url(#map-dots)" />
      {ROADS.map((d, i) => (
        <path key={i} d={d} stroke={road} strokeWidth={i < 2 ? 14 : 8} fill="none" strokeLinecap="round" />
      ))}
      <path d="M560 640 h180 v60 h-180z" fill={dark ? 'rgba(255,255,255,0.03)' : 'rgba(15,23,20,0.04)'} />
      {neighborhoods.map((n) => {
        const h = heat ? (heat[n.id] ?? 0) / max : 0
        return (
          <g key={n.id}>
            {heat && <motion.circle cx={n.x} cy={n.y} fill="url(#hood-heat)" initial={false} animate={{ r: 50 + h * 90 }} transition={{ type: 'spring', stiffness: 60, damping: 14 }} />}
            <text x={n.x} y={n.y + 46} textAnchor="middle" fontSize="20" fontWeight="600" fill={label} style={{ fontFamily: 'var(--font-sans)' }}>
              {n.name}
            </text>
          </g>
        )
      })}
      {children}
    </svg>
  )
}
