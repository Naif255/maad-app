import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from 'motion/react'
import { useState } from 'react'
import { economics } from '@/config/economics'
import { byId, tierOf } from '@/domain/services'
import type { Coupon } from '@/domain/types'
import { date, daysLeft, num, rewardTitle, TIER_LABEL } from '@/lib/format'
import { useStore } from '@/store/store'
import { Icon } from '@/ui/Icon'
import { Button, Card, cx, Odometer, Pill, QR, SectionTitle, Sheet } from '@/ui/kit'
import { LogoMark } from '@/ui/Logo'
import { haptic, useMe } from './hooks'
import { loyaltyQrValue } from './Receipt'

const TIER_BG = {
  bronze: 'linear-gradient(135deg, #8A5A34 0%, #C98F5E 40%, #7A4B28 70%, #B07A4C 100%)',
  silver: 'linear-gradient(135deg, #6F7A84 0%, #D3DAE0 38%, #808B95 64%, #B8C1C9 100%)',
  gold: 'linear-gradient(135deg, #8C6A1C 0%, #E8C766 40%, #9B7724 68%, #D6B04E 100%)',
}

export function Wallet() {
  const me = useMe()
  const db = useStore((s) => s.db)
  const now = useStore((s) => s.now)()
  const donate = useStore((s) => s.donate)
  const [coupon, setCoupon] = useState<Coupon>()
  const [qr, setQr] = useState(false)
  const [donated, setDonated] = useState(false)
  if (!me) return null
  const tier = tierOf(me)
  const coupons = db.coupons.filter((c) => c.userId === me.id).sort((a, b) => Number(!!a.redeemedAt) - Number(!!b.redeemedAt) || a.expiresAt - b.expiresAt)
  const trees = Math.floor(me.donatedPoints / economics.pointsPerTree)

  return (
    <div className="pb-10">
      <header className="px-5 pb-3 pt-safe">
        <div className="font-display text-2xl font-semibold">المحفظة</div>
      </header>
      <div className="px-4">
        <Pass tier={tier} points={me.points} onQr={() => setQr(true)} userId={me.id} />

        <SectionTitle action={<span className="num text-xs text-mute">{coupons.filter((c) => !c.redeemedAt && c.expiresAt > now).length} فعّالة</span>}>كوبوناتك</SectionTitle>
        <div className="space-y-2.5">
          {coupons.map((c, i) => {
            const l = byId(db.laundries, c.laundryId)!
            const expired = c.expiresAt <= now
            const used = !!c.redeemedAt
            const soon = !used && !expired && c.expiresAt - now < 5 * 86400000
            return (
              <motion.button
                key={c.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => !used && !expired && setCoupon(c)}
                className={cx('relative flex w-full items-stretch overflow-hidden rounded-2xl bg-paper text-start shadow-card ring-1 ring-ink/5', (used || expired) && 'opacity-50')}
              >
                <div className="grid w-20 shrink-0 place-items-center bg-copper-50 text-copper">
                  <Icon name={c.reward.kind === 'discount' ? 'ticket' : c.reward.kind === 'wash' ? 'bag' : 'spark'} size={26} />
                </div>
                <div className="relative border-s-2 border-dashed border-ink/10" />
                <div className="min-w-0 flex-1 p-4">
                  <div className="font-semibold">{rewardTitle(c.reward)}</div>
                  <div className="mt-0.5 text-xs text-mute">{l.name}</div>
                </div>
                <div className="flex items-center pe-4">
                  {used ? <Pill>انصرف</Pill> : expired ? <Pill>انتهى</Pill> : <Pill tone={soon ? 'rust' : 'mute'}>{daysLeft(c.expiresAt, now)}</Pill>}
                </div>
              </motion.button>
            )
          })}
          {!coupons.length && <div className="rounded-2xl bg-paper p-5 text-center text-sm text-mute">أول كوبون يوصلك بعد أول تسليم</div>}
        </div>

        <SectionTitle>تبرّع بنقاطك</SectionTitle>
        <Card className="overflow-hidden">
          <div className="flex items-center gap-4 bg-gradient-to-l from-loop-50 to-paper p-5">
            <Trees count={trees} />
            <div className="flex-1">
              <div className="flex items-baseline gap-1.5">
                <Odometer value={trees} className="text-3xl font-semibold text-loop-700" />
                <span className="text-sm text-loop-700">{trees >= 3 && trees <= 10 ? 'أشجار' : 'شجرة'} باسمك</span>
              </div>
              <div className="mt-1 text-xs text-mute">كل {num(economics.pointsPerTree)} نقطة تزرع شجرة في القصيم</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4">
            <div className="flex-1 text-xs leading-5 text-mute">{me.points < economics.pointsPerTree ? 'تقدر تتبرع إذا وصل رصيدك ' + num(economics.pointsPerTree) + ' نقطة' : 'نقاطك تزرع شجرة باسمك'}</div>
            <Button
              size="md"
              disabled={me.points < economics.pointsPerTree}
              onClick={() => {
                donate(economics.pointsPerTree)
                haptic(12)
                setDonated(true)
                setTimeout(() => setDonated(false), 2200)
              }}
            >
              تبرّع بـ{num(economics.pointsPerTree)}
            </Button>
          </div>
          <AnimatePresence>
            {donated && (
              <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden bg-loop text-center text-sm font-semibold text-white">
                <div className="py-2.5">الله يجزاك خير، انزرعت شجرة جديدة</div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>

      </div>

      <Sheet open={!!coupon} onClose={() => setCoupon(undefined)}>
        {coupon && (
          <div className="text-center">
            <div className="font-display text-xl font-semibold">{rewardTitle(coupon.reward)}</div>
            <div className="mt-1 text-sm text-mute">
              {byId(db.laundries, coupon.laundryId)!.name} · ينتهي {date(coupon.expiresAt)}
            </div>
            <div className="mx-auto mt-5 inline-block rounded-3xl bg-white p-4 ring-1 ring-ink/5">
              <QR value={loyaltyQrValue(me.id)} size={190} accent="#D9822B" />
            </div>
            <div className="mt-3 text-sm text-mute">اعرض رمزك للموظف، ويصرف الكوبون من جهازه</div>
          </div>
        )}
      </Sheet>
      <Sheet open={qr} onClose={() => setQr(false)}>
        <div className="text-center">
          <div className="font-display text-xl font-semibold">رمزك في مَعاد</div>
          <div className="mt-1 text-sm text-mute">للتسليم وصرف الكوبونات</div>
          <div className="mx-auto mt-5 inline-block rounded-3xl bg-white p-4 ring-1 ring-ink/5">
            <QR value={loyaltyQrValue(me.id)} size={210} accent="#0FA36B" />
          </div>
          <div className="mt-3 text-xs text-mute">ما يتغير، وتقدر تضيفه لمحفظة جوالك</div>
        </div>
      </Sheet>
    </div>
  )
}

function Pass({ tier, points, onQr, userId }: { tier: 'bronze' | 'silver' | 'gold'; points: number; onQr: () => void; userId: string }) {
  const mx = useMotionValue(0.5)
  const my = useMotionValue(0.5)
  const rx = useSpring(useTransform(my, [0, 1], [7, -7]), { stiffness: 150, damping: 15 })
  const ry = useSpring(useTransform(mx, [0, 1], [-9, 9]), { stiffness: 150, damping: 15 })
  const shine = useTransform(mx, [0, 1], ['20%', '80%'])
  return (
    <motion.div
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect()
        mx.set((e.clientX - r.left) / r.width)
        my.set((e.clientY - r.top) / r.height)
      }}
      onPointerLeave={() => {
        mx.set(0.5)
        my.set(0.5)
      }}
      style={{ rotateX: rx, rotateY: ry, transformPerspective: 800, background: TIER_BG[tier] }}
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="relative overflow-hidden rounded-[24px] p-5 text-white shadow-lift"
    >
      <motion.div className="pointer-events-none absolute inset-0" style={{ background: useTransform(shine, (s) => `radial-gradient(circle at ${s} 0%, rgba(255,255,255,0.45), transparent 55%)`) }} />
      <div className="pointer-events-none absolute -bottom-10 -left-8 opacity-20">
        <LogoMark size={190} color="#fff" strokeWidth={2.2} />
      </div>
      <div className="relative flex items-start justify-between">
        <div className="flex items-center gap-2">
          <LogoMark size={30} color="#fff" />
          <span className="font-display text-lg font-semibold">مَعاد</span>
        </div>
        <div className="rounded-full bg-black/20 px-3 py-1 text-xs font-bold backdrop-blur">عضو {TIER_LABEL[tier]}</div>
      </div>
      <div className="relative mt-10 flex items-end justify-between">
        <div>
          <div className="text-xs font-semibold text-white/75">رصيدك</div>
          <div className="flex items-baseline gap-1">
            <Odometer value={points} className="text-5xl font-semibold" />
            <span className="text-sm text-white/80">نقطة</span>
          </div>
        </div>
        <button onClick={onQr} className="rounded-2xl bg-white p-2 shadow-lg" aria-label="عرض الرمز">
          <QR value={loyaltyQrValue(userId)} size={64} />
        </button>
      </div>
    </motion.div>
  )
}

function Trees({ count }: { count: number }) {
  const n = Math.min(5, Math.max(1, count))
  return (
    <div className="flex h-14 items-end">
      {Array.from({ length: n }, (_, i) => (
        <motion.svg key={i} width={i % 2 ? 22 : 28} height={i % 2 ? 40 : 52} viewBox="0 0 28 52" initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ delay: i * 0.08, type: 'spring' }} style={{ originY: 1 }} className="-ms-1.5">
          <rect x="12.5" y="34" width="3" height="18" rx="1.5" fill="#6B4F2E" />
          <circle cx="14" cy="22" r="13" fill={i % 2 ? '#3CC48D' : '#0FA36B'} />
          <circle cx="9" cy="17" r="4" fill="rgba(255,255,255,0.18)" />
        </motion.svg>
      ))}
    </div>
  )
}
