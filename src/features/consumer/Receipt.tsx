import { motion } from 'motion/react'
import { useNavigate, useParams } from 'react-router-dom'
import { byId, groupBookings } from '@/domain/services'
import type { Booking } from '@/domain/types'
import { countdown, date, hangers, num, time } from '@/lib/format'
import { useStore } from '@/store/store'
import { Icon } from '@/ui/Icon'
import { Button, cx, LaundryBadge, Pill, QR, TopBar } from '@/ui/kit'
import { useTicker } from './hooks'

export function loyaltyQrValue(userId: string) {
  return `MAAD:U:${userId}`
}

const STEPS = ['تم الحجز', 'بانتظار التسليم', 'استلمتها المغسلة', 'وصلتك المكافأة']

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
  const usable = legs.reduce((a, b) => a + b.usable, 0)
  const damaged = legs.reduce((a, b) => a + b.damaged, 0)
  const step = Math.min(...legs.map(stepOf))
  const expired = legs.every((b) => b.status === 'expired')
  const awaiting = legs.filter((b) => b.status === 'awaiting')
  const left = awaiting.length ? Math.min(...awaiting.map((b) => b.expiresAt)) - now : 0

  return (
    <div className="min-h-full bg-ink pb-10 text-white">
      <TopBar dark back="/c" title="إيصال الإرجاع" sub={`${date(legs[0].createdAt)} · ${time(legs[0].createdAt)}`} />
      <div className="px-4">
        <motion.div initial={{ y: 30, opacity: 0, rotateX: 20 }} animate={{ y: 0, opacity: 1, rotateX: 0 }} transition={{ type: 'spring', stiffness: 120, damping: 16 }} className="relative overflow-hidden rounded-[28px] bg-paper text-ink" style={{ transformPerspective: 900 }}>
          <div className="flex items-center justify-between px-5 pb-3 pt-5">
            <div>
              <div className="text-xs text-mute">رقم الحجز</div>
              <div className="num font-display text-xl font-semibold tracking-wide" dir="ltr">
                {legs.map((b) => b.code).join(' · ')}
              </div>
            </div>
            {expired ? <Pill tone="rust">انتهى الحجز</Pill> : step >= 4 ? <Pill tone="loop" icon="check">اكتمل</Pill> : <Pill tone="copper" icon="clock"><span className="num">{countdown(left)}</span></Pill>}
          </div>
          <div className="space-y-2 px-5">
            {legs.map((b) => {
              const l = byId(db.laundries, b.laundryId)!
              return (
                <div key={b.id} className="flex items-center gap-3 rounded-2xl bg-sand p-3">
                  <LaundryBadge name={l.name} hue={l.hue} size={38} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{l.name}</div>
                    <div className="mt-0.5 flex gap-3 text-xs">
                      {b.usable > 0 && (
                        <span className="flex items-center gap-1 text-loop-700">
                          <span className="h-2 w-2 rounded-sm bg-loop" />
                          أخضر <span className="num font-semibold">{b.usable}</span>
                        </span>
                      )}
                      {b.damaged > 0 && (
                        <span className="flex items-center gap-1 text-steel-700">
                          <span className="h-2 w-2 rounded-sm bg-steel" />
                          رمادي <span className="num font-semibold">{b.damaged}</span>
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-[11px] text-mute">{b.method === 'dropoff' ? 'تسليم بنفسي' : 'مع الطلب'}</div>
                </div>
              )
            })}
          </div>

          <div className="relative my-5 flex items-center">
            <div className="absolute -right-3 h-6 w-6 rounded-full bg-ink" />
            <div className="mx-5 w-full border-t-2 border-dashed border-ink/10" />
            <div className="absolute -left-3 h-6 w-6 rounded-full bg-ink" />
          </div>

          <div className="flex flex-col items-center px-5 pb-6">
            <div className={cx('rounded-3xl bg-white p-4 ring-1 ring-ink/5', expired && 'opacity-30')}>
              <QR value={loyaltyQrValue(user.id)} size={176} accent="#0FA36B" />
            </div>
            <div className="mt-3 text-center text-sm font-semibold">رمزك الشخصي</div>
            <div className="mt-0.5 text-center text-xs text-mute">نفس الرمز لكل التسليمات والكوبونات. اعرضه للموظف.</div>
          </div>
        </motion.div>

        <div className="mt-5 rounded-[24px] bg-ink-2 p-5 ring-1 ring-white/5">
          <div className="mb-4 text-sm font-semibold text-white/80">حالة الإرجاع</div>
          {expired ? (
            <div className="text-sm leading-6 text-white/60">انتهت مهلة الـ48 ساعة، ورجع العدد للمغسلة عشان يستفيد منه غيرك. تقدر تفحص وتحجز من جديد بأي وقت.</div>
          ) : (
            <div className="relative">
              {STEPS.map((s, i) => {
                const doneStep = i < step || (i === 0 && step >= 1) || step >= 4
                const active = i === step && step < 4
                return (
                  <div key={s} className="relative flex gap-3 pb-5 last:pb-0">
                    {i < STEPS.length - 1 && <div className={cx('absolute start-[11px] top-6 h-[calc(100%-12px)] w-0.5', i < step ? 'bg-loop' : 'bg-white/10')} />}
                    <div className="relative">
                      <motion.div
                        initial={false}
                        animate={{ scale: doneStep ? 1 : 0.85, backgroundColor: doneStep ? '#0FA36B' : active ? 'rgba(217,130,43,1)' : 'rgba(255,255,255,0.08)' }}
                        className="grid h-6 w-6 place-items-center rounded-full"
                      >
                        {doneStep ? <Icon name="check" size={14} strokeWidth={3} /> : <span className="h-1.5 w-1.5 rounded-full bg-white/50" />}
                      </motion.div>
                      {active && <span className="absolute inset-0 rounded-full bg-copper" style={{ animation: 'pulse-ring 1.8s ease-out infinite' }} />}
                    </div>
                    <div className={cx('text-sm', doneStep ? 'text-white' : active ? 'font-semibold text-white' : 'text-white/40')}>
                      {s}
                      {i === 1 && active && <div className="mt-0.5 text-xs font-normal text-white/50">صالح لين {time(Math.min(...awaiting.map((b) => b.expiresAt)))}، {date(Math.min(...awaiting.map((b) => b.expiresAt)))}</div>}
                      {i === 3 && step >= 4 && (
                        <div className="mt-0.5 text-xs text-white/50">
                          +<span className="num">{num(legs.reduce((a, b) => a + b.points, 0))}</span> نقطة{legs.some((b) => b.couponIds.length) ? ' وكوبون جديد' : ''}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
          <Tip tone="loop" t="الكرتون الأخضر" d={`${hangers(usable)} صالحة، الموظف يحتفظ فيها`} />
          <Tip tone="steel" t="الكرتون الرمادي" d={`${hangers(damaged)}، تنحط في صندوق مَعاد`} />
        </div>

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

function Tip({ tone, t, d }: { tone: 'loop' | 'steel'; t: string; d: string }) {
  return (
    <div className="rounded-2xl bg-ink-2 p-4 ring-1 ring-white/5">
      <div className="flex items-center gap-2 font-semibold">
        <span className={cx('h-3 w-3 rounded', tone === 'loop' ? 'bg-loop' : 'bg-steel-300')} />
        {t}
      </div>
      <div className="mt-1 text-xs leading-5 text-white/55">{d}</div>
    </div>
  )
}
