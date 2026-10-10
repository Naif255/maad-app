import { motion } from 'motion/react'

export function Carton({ tone, count, size = 96, delay = 0 }: { tone: 'green' | 'grey'; count: number; size?: number; delay?: number }) {
  const c = tone === 'green' ? { top: '#3CC48D', left: '#0FA36B', right: '#0A7A50', flap: '#5ED3A3' } : { top: '#CBD3DA', left: '#9AA6B1', right: '#7D8A96', flap: '#DCE2E7' }
  return (
    <motion.svg width={size} height={size} viewBox="0 0 100 100" initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay, type: 'spring', stiffness: 200, damping: 18 }}>
      <ellipse cx="50" cy="92" rx="34" ry="5" fill="rgba(15,23,20,0.12)" />
      <path d="M14 36 50 50v40L14 76z" fill={c.left} />
      <path d="M86 36 50 50v40l36-14z" fill={c.right} />
      <path d="M14 36 50 22l36 14-36 14z" fill={c.top} />
      <motion.path d="M14 36 4 26l36-14 10 10z" fill={c.flap} initial={{ rotate: 0 }} animate={{ rotate: [-0, -6, 0] }} transition={{ delay: delay + 0.4, duration: 0.6 }} style={{ originX: '14px', originY: '36px' }} />
      <path d="M86 36 96 26 60 12 50 22z" fill={c.flap} opacity="0.85" />
      <path d="M32 43.5 68 29.5" stroke="rgba(255,255,255,0.35)" strokeWidth="3" />
      <text x="32" y="70" textAnchor="middle" fontSize="15" fontWeight="700" fill="white" style={{ fontFamily: 'var(--font-display)' }} transform="skewY(21) translate(0 -12)">
        {count}
      </text>
    </motion.svg>
  )
}
