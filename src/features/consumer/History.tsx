import { motion } from 'motion/react'
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { kgFromHangers } from '@/config/economics'
import { byId, nextTier, tierOf, userBookings } from '@/domain/services'
import type { Booking } from '@/domain/types'
import { date, kg, num, TIER_LABEL } from '@/lib/format'
import { useStore } from '@/store/store'
import { cx, LaundryBadge, Pill } from '@/ui/kit'
import { useMe } from './hooks'

const STATUS: Record<Booking['status'], { label: string; tone: 'loop' | 'ink' | 'mute' | 'rust' }> = {
  awaiting: { label: 'بانتظار التسليم', tone: 'ink' },
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
  const next = nextTier(me)
  const lifetime = me.lifetimeUsable + me.lifetimeDamaged

  return (
    <div className="pb-10">
      <header className="px-5 pb-2 pt-safe">
        <div className="font-display text-2xl font-semibold">رجّعاتي</div>
      </header>
      <div className="mx-4 rounded-[24px] bg-ink p-5 text-white">
        <div className="text-sm text-white/60">رجّعت لين الحين</div>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="num font-display text-5xl font-semibold leading-none">{num(total)}</span>
          <span className="text-lg font-semibold">علاقة</span>
        </div>
        <div className="mt-4 flex gap-5 text-sm text-white/70">
          <span>
            <span className="num font-semibold text-white">{kg(kgFromHangers(total))}</span> كجم حديد
          </span>
          <span>
            <span className="num font-semibold text-copper-100">{num(pts)}</span> نقطة كسبتها
          </span>
        </div>
        <div className="mt-5 border-t border-white/10 pt-4">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold">عضو {TIER_LABEL[tierOf(me)]}</span>
            <span className="text-white/55">{next ? `باقي ${num(next.missing)} علاقة وتصير ${TIER_LABEL[next.id]}` : 'وصلت أعلى مستوى'}</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
            <motion.div className="h-full rounded-full bg-copper" initial={{ width: 0 }} animate={{ width: `${next ? Math.min(100, (lifetime / (lifetime + next.missing)) * 100) : 100}%` }} transition={{ delay: 0.2, type: 'spring', stiffness: 80, damping: 18 }} />
          </div>
        </div>
      </div>
      <h2 className="mb-2 mt-6 px-6 text-[13px] font-semibold text-mute">كل رجّعاتك</h2>
      <div className="mx-4 divide-y divide-ink/[0.06] overflow-hidden rounded-[20px] bg-paper ring-1 ring-ink/5">
        {list.map((b, i) => {
          const l = byId(db.laundries, b.laundryId)!
          const s = STATUS[b.status]
          return (
            <motion.button
              key={b.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: Math.min(i, 8) * 0.03 }}
              onClick={() => nav(b.status === 'credited' ? `/c/reward/${b.groupId}` : `/c/receipt/${b.groupId}`)}
              className={cx('flex w-full items-center gap-3 px-4 py-3.5 text-start', b.status === 'expired' && 'opacity-60')}
            >
              <LaundryBadge name={l.name} hue={l.hue} size={40} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[15px] font-semibold">{l.name}</div>
                <div className="mt-0.5 flex items-center gap-2.5 text-xs text-mute">
                  <span>{date(b.createdAt)}</span>
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-[3px] bg-loop" />
                    <span className="num">{b.usable}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-[3px] bg-steel" />
                    <span className="num">{b.damaged}</span>
                  </span>
                </div>
              </div>
              {b.status === 'credited' ? <span className="num shrink-0 text-sm font-semibold text-copper-700">+{num(b.points)}</span> : <Pill tone={s.tone}>{s.label}</Pill>}
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
