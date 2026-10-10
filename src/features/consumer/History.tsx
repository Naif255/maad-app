import { motion } from 'motion/react'
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { kgFromHangers } from '@/config/economics'
import { byId, userBookings } from '@/domain/services'
import type { Booking } from '@/domain/types'
import { date, kg, num } from '@/lib/format'
import { useStore } from '@/store/store'
import { Card, cx, LaundryBadge, Pill } from '@/ui/kit'
import { useMe } from './hooks'

const STATUS: Record<Booking['status'], { label: string; tone: 'loop' | 'copper' | 'mute' | 'rust' }> = {
  awaiting: { label: 'بانتظار التسليم', tone: 'copper' },
  received: { label: 'استلمتها المغسلة', tone: 'loop' },
  credited: { label: 'وصلت المكافأة', tone: 'loop' },
  expired: { label: 'انتهى الحجز', tone: 'mute' },
}

export function History() {
  const me = useMe()
  const db = useStore((s) => s.db)
  const nav = useNavigate()
  const list = useMemo(() => (me ? userBookings(db, me.id) : []), [db, me])
  if (!me) return null
  const done = list.filter((b) => b.status === 'credited')
  const total = done.reduce((a, b) => a + b.usable + b.damaged, 0)
  const pts = done.reduce((a, b) => a + b.points, 0)

  return (
    <div className="pb-10">
      <header className="px-5 pb-2 pt-safe">
        <div className="font-display text-2xl font-semibold">رجّعاتي</div>
      </header>
      <div className="mx-4 grid grid-cols-3 divide-x divide-x-reverse divide-ink/5 rounded-[22px] bg-ink py-4 text-center text-white">
        <div>
          <div className="num text-2xl font-semibold">{num(total)}</div>
          <div className="text-[11px] text-white/55">علاقة</div>
        </div>
        <div>
          <div className="num text-2xl font-semibold">{kg(kgFromHangers(total))}</div>
          <div className="text-[11px] text-white/55">كجم حديد</div>
        </div>
        <div>
          <div className="num text-2xl font-semibold text-copper-100">{num(pts)}</div>
          <div className="text-[11px] text-white/55">نقطة كسبتها</div>
        </div>
      </div>
      <div className="mt-5 space-y-2.5 px-4">
        {list.map((b, i) => {
          const l = byId(db.laundries, b.laundryId)!
          const s = STATUS[b.status]
          return (
            <motion.div key={b.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 8) * 0.04 }}>
              <Card className={cx('p-4', b.status === 'expired' && 'opacity-60')} onClick={() => nav(b.status === 'credited' ? `/c/reward/${b.groupId}` : `/c/receipt/${b.groupId}`)}>
                <div className="flex items-center gap-3">
                  <LaundryBadge name={l.name} hue={l.hue} size={40} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{l.name}</div>
                    <div className="text-xs text-mute">{date(b.createdAt)}</div>
                  </div>
                  <Pill tone={s.tone}>{s.label}</Pill>
                </div>
                <div className="mt-3 flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-loop" />
                    <span className="num font-semibold">{b.usable}</span> صالحة
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-steel" />
                    <span className="num font-semibold">{b.damaged}</span> للتدوير
                  </span>
                  {b.points > 0 && <span className="num ms-auto font-semibold text-copper-700">+{num(b.points)} نقطة</span>}
                </div>
              </Card>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
