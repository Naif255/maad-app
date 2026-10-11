import { motion } from 'motion/react'
import { useNavigate, useParams } from 'react-router-dom'
import { byId, groupBookings } from '@/domain/services'
import type { Booking } from '@/domain/types'
import { date, deadline, hangers, hoursLeft, num, time } from '@/lib/format'
import { useStore } from '@/store/store'
import { Icon } from '@/ui/Icon'
import { Button, cx, LaundryBadge, QR, TopBar } from '@/ui/kit'
import { useTicker } from './hooks'

export function loyaltyQrValue(userId: string) {
  return `MAAD:U:${userId}`
}

const STEPS = ['انحجزت', 'بانتظارك', 'استلموها', 'المكافأة']

function stepOf(b: Booking) {
  if (b.status === 'credited') return 4
  if (b.status === 'received') return 3
  if (b.status === 'expired') return -1
  return 1
}

export function Receipt() {
  const { groupId = '' } = useParams()
  const db = useStore((s) => s.db)
  const nav = useNavigate()
  const now = useTicker(1000)
  const legs = groupBookings(db, groupId)
  if (!legs.length) return null
  const user = byId(db.users, legs[0].userId)!
  const step = Math.min(...legs.map(stepOf))
  const expired = legs.every((b) => b.status === 'expired')
  const awaiting = legs.filter((b) => b.status === 'awaiting')
  const until = awaiting.length ? Math.min(...awaiting.map((b) => b.expiresAt)) : 0
  const names = legs.map((b) => byId(db.laundries, b.laundryId)!.name)
  const points = legs.reduce((a, b) => a + b.points, 0)

  return (
    <div className="min-h-full bg-ink pb-10 text-white">
      <TopBar dark back="/c" title="إيصال الإرجاع" sub={`${date(legs[0].createdAt)} · ${time(legs[0].createdAt)}`} />
      <div className="px-4">
        <div className="px-1 pb-5 pt-1">
          {expired ? (
            <>
              <div className="font-display text-[24px] font-semibold">انتهى الحجز</div>
              <div className="mt-1 text-sm leading-6 text-white/60">مرّت 48 ساعة، ورجع العدد للمغسلة عشان يستفيد منه غيرك. تقدر تفحص وتحجز من جديد بأي وقت.</div>
            </>
          ) : step >= 4 ? (
            <>
              <div className="flex items-center gap-2 font-display text-[24px] font-semibold">
                <Icon name="check" size={24} strokeWidth={2.6} className="text-loop" />
                وصلتك المكافأة
              </div>
              <div className="mt-1 text-sm text-white/60">
                +<span className="num">{num(points)}</span> نقطة{legs.some((b) => b.couponIds.length) ? ' وكوبون جديد في محفظتك' : ''}
              </div>
            </>
          ) : step === 3 ? (
            <div className="font-display text-[24px] font-semibold">استلمتها المغسلة</div>
          ) : (
            <>
              <div className="font-display text-[24px] font-semibold leading-snug">سلّمها لـ{names.join(' و')}</div>
              <div className="mt-1.5 flex items-center gap-1.5 text-sm text-white/65">
                <Icon name="clock" size={16} />
                قبل {deadline(until, now)} · باقي {hoursLeft(until - now)}
              </div>
            </>
          )}
        </div>

        <motion.div initial={{ y: 30, opacity: 0, rotateX: 20 }} animate={{ y: 0, opacity: 1, rotateX: 0 }} transition={{ type: 'spring', stiffness: 120, damping: 16 }} className="relative overflow-hidden rounded-[28px] bg-paper text-ink" style={{ transformPerspective: 900 }}>
          <div className="flex flex-col items-center px-5 pb-5 pt-6">
            <div className={cx('rounded-3xl bg-white p-3 ring-1 ring-ink/5', expired && 'opacity-30')}>
              <QR value={loyaltyQrValue(user.id)} size={184} accent="#0FA36B" />
            </div>
            <div className="mt-3 text-center text-sm font-semibold">رمزك الشخصي</div>
            <div className="mt-0.5 text-center text-xs text-mute">اعرضه للموظف وقت التسليم</div>
            <div data-testid="booking-code" className="num mt-3 rounded-full bg-sand px-3.5 py-1 text-sm font-semibold tracking-wide" dir="ltr">
              {legs.map((b) => b.code).join(' · ')}
            </div>
          </div>

          <div className="relative flex items-center">
            <div className="absolute -right-3 h-6 w-6 rounded-full bg-ink" />
            <div className="mx-5 w-full border-t-2 border-dashed border-ink/10" />
            <div className="absolute -left-3 h-6 w-6 rounded-full bg-ink" />
          </div>

          <div className="space-y-3 px-5 pb-5 pt-4">
            {legs.map((b) => {
              const l = byId(db.laundries, b.laundryId)!
              return (
                <div key={b.id} className="flex items-center gap-3">
                  <LaundryBadge name={l.name} hue={l.hue} size={38} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{l.name}</div>
                    <div className="text-xs text-mute">{b.method === 'dropoff' ? 'تسلّمها بنفسك' : 'مع طلبك الجاي'}</div>
                  </div>
                  <div className="flex flex-col items-end gap-1 text-xs font-semibold">
                    {b.usable > 0 && (
                      <span className="flex items-center gap-1.5 text-loop-700">
                        <span className="h-2.5 w-2.5 rounded-[3px] bg-loop" />
                        {hangers(b.usable)} بالأخضر
                      </span>
                    )}
                    {b.damaged > 0 && (
                      <span className="flex items-center gap-1.5 text-steel-700">
                        <span className="h-2.5 w-2.5 rounded-[3px] bg-steel" />
                        {hangers(b.damaged)} بالرمادي
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>

        {!expired && <Timeline step={step} />}

        {step >= 4 ? (
          <Button className="mt-6 w-full" icon="spark" onClick={() => nav(`/c/reward/${groupId}`)}>
            شوف أثرك
          </Button>
        ) : (
          <Button variant="soft" className="mt-6 w-full border-white/10 bg-white/5 text-white" onClick={() => nav('/c')}>
            رجوع للرئيسية
          </Button>
        )}
      </div>
    </div>
  )
}

function Timeline({ step }: { step: number }) {
  return (
    <div className="mt-5 rounded-[22px] bg-ink-2 px-4 py-4 ring-1 ring-white/5">
      <div className="relative grid grid-cols-4">
        <div className="absolute inset-x-[12.5%] top-3 h-0.5 bg-white/10" />
        <motion.div className="absolute top-3 h-0.5 bg-loop" initial={false} animate={{ width: `${Math.min(3, step) * 25}%` }} style={{ insetInlineStart: '12.5%' }} />
        {STEPS.map((s, i) => {
          const done = i < step || step >= 4
          const active = i === step && step < 4
          return (
            <div key={s} className="relative flex flex-col items-center gap-2">
              <div className={cx('relative grid h-6 w-6 place-items-center rounded-full', done ? 'bg-loop' : active ? 'bg-white text-ink' : 'bg-ink-3 ring-1 ring-white/10')}>
                {done ? <Icon name="check" size={14} strokeWidth={3} /> : <span className={cx('h-1.5 w-1.5 rounded-full', active ? 'bg-ink' : 'bg-white/30')} />}
                {active && <span className="absolute inset-0 rounded-full bg-white" style={{ animation: 'pulse-ring 1.8s ease-out infinite' }} />}
              </div>
              <div className={cx('text-[11px]', done || active ? 'font-semibold text-white' : 'text-white/40')}>{s}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
