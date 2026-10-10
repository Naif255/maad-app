import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { byId, groupBookings } from '@/domain/services'
import { hangers, num, rewardTitle } from '@/lib/format'
import { rewardSound } from '@/lib/sound'
import { useStore } from '@/store/store'
import { Icon } from '@/ui/Icon'
import { Button, Odometer } from '@/ui/kit'
import { haptic } from './hooks'

export function RewardLanded() {
  const celebration = useStore((s) => s.celebration)
  const dismiss = useStore((s) => s.dismissCelebration)
  const db = useStore((s) => s.db)
  const userId = useStore((s) => s.userId)
  const loc = useLocation()
  const nav = useNavigate()
  const legs = celebration ? groupBookings(db, celebration.groupId) : []
  const show = !!celebration && legs.length > 0 && legs[0].userId === userId && !loc.pathname.startsWith('/c/reward')
  const [pts, setPts] = useState(0)
  const total = legs.reduce((a, b) => a + b.points, 0)
  const coupons = legs.flatMap((b) => b.couponIds.map((id) => byId(db.coupons, id)!)).filter(Boolean)

  useEffect(() => {
    if (!show) return
    setPts(0)
    haptic([10, 30, 10, 30, 30])
    rewardSound()
    const id = setTimeout(() => setPts(total), 700)
    return () => clearTimeout(id)
  }, [show, total])

  return (
    <AnimatePresence>
      {show && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[45] flex flex-col items-center justify-center overflow-hidden bg-ink px-6 text-white">
          <Sparks />
          <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 220, damping: 14, delay: 0.1 }} className="relative grid h-20 w-20 place-items-center rounded-[26px] bg-copper shadow-[0_20px_60px_-10px_rgba(217,130,43,0.8)]">
            <Icon name="gift" size={38} />
          </motion.div>
          <motion.div initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="relative mt-6 text-center">
            <div className="font-display text-[28px] font-semibold">وصلتك مكافأتك!</div>
            <div className="mt-1 text-sm text-white/60">استلمت المغسلة {hangers(legs.reduce((a, b) => a + b.usable + b.damaged, 0))}</div>
          </motion.div>
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }} className="relative mt-7 w-full space-y-2.5">
            {coupons.map((c, i) => {
              const l = byId(db.laundries, c.laundryId)!
              return (
                <motion.div key={c.id} initial={{ rotate: -4, y: 30, opacity: 0 }} animate={{ rotate: 0, y: 0, opacity: 1 }} transition={{ delay: 0.6 + i * 0.12, type: 'spring', stiffness: 200, damping: 15 }} className="relative flex items-center gap-3 overflow-hidden rounded-2xl bg-paper p-4 text-ink">
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-copper-50 text-copper">
                    <Icon name="ticket" size={22} />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold">{rewardTitle(c.reward)}</div>
                    <div className="text-xs text-mute">كوبون من {l.name}</div>
                  </div>
                  <div className="absolute -left-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-ink" />
                </motion.div>
              )
            })}
            <div className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3.5 ring-1 ring-white/10">
              <span className="text-sm text-white/70">نقاط جديدة</span>
              <Odometer value={pts} className="text-2xl font-semibold text-copper-100" format={(n) => `+${num(n)}`} />
            </div>
          </motion.div>
          <div className="relative mt-8 w-full space-y-2">
            <Button
              className="w-full"
              icon="spark"
              onClick={() => {
                const g = celebration!.groupId
                dismiss()
                nav(`/c/reward/${g}`)
              }}
            >
              شوف بطاقة أثرك
            </Button>
            <button onClick={dismiss} className="h-11 w-full text-sm font-semibold text-white/55">
              لاحقًا
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function Sparks() {
  const items = Array.from({ length: 18 }, (_, i) => i)
  return (
    <div className="pointer-events-none absolute inset-0">
      {items.map((i) => {
        const a = (i / items.length) * Math.PI * 2
        const d = 140 + (i % 3) * 50
        return (
          <motion.span
            key={i}
            className="absolute left-1/2 top-[30%] h-1 w-5 rounded-full"
            style={{ background: i % 3 === 0 ? '#D9822B' : i % 3 === 1 ? '#0FA36B' : '#B9C3CC', rotate: `${(a * 180) / Math.PI}deg` }}
            initial={{ x: 0, y: 0, opacity: 0 }}
            animate={{ x: Math.cos(a) * d, y: Math.sin(a) * d, opacity: [0, 1, 0] }}
            transition={{ duration: 1.3, delay: 0.15 + (i % 4) * 0.04, ease: 'easeOut' }}
          />
        )
      })}
    </div>
  )
}
