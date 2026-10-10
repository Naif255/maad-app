import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { economics } from '@/config/economics'
import { acceptsDamagedNow, byId } from '@/domain/services'
import { daysLeft, num, rewardTitle } from '@/lib/format'
import { useStore } from '@/store/store'
import { Carton } from '@/ui/Carton'
import { Icon } from '@/ui/Icon'
import { Button, Card, cx, Pill, TopBar } from '@/ui/kit'
import { haptic } from '../consumer/hooks'
import { useLaundry } from './LaundryLayout'

export function Customer() {
  const { userId = '' } = useParams()
  const db = useStore((s) => s.db)
  const now = useStore((s) => s.now)()
  const receive = useStore((s) => s.receive)
  const redeem = useStore((s) => s.redeemCoupon)
  const l = useLaundry()
  const nav = useNavigate()
  const [flag, setFlag] = useState(false)
  const [done, setDone] = useState<{ usable: number; damaged: number }>()
  const [redeemed, setRedeemed] = useState<string>()
  const bookings = db.bookings.filter((b) => b.userId === userId && b.laundryId === l.id && b.status === 'awaiting')
  const coupons = db.coupons.filter((c) => c.userId === userId && c.laundryId === l.id && !c.redeemedAt && c.expiresAt > now)
  const user = byId(db.users, userId)
  const usable = bookings.reduce((a, b) => a + b.usable, 0)
  const damaged = bookings.reduce((a, b) => a + b.damaged, 0)

  const confirm = () => {
    bookings.forEach((b) => receive(b.id, flag))
    haptic([10, 30, 20])
    setDone({ usable, damaged })
  }

  if (done) return <Received usable={done.usable} damaged={done.damaged} onBack={() => nav('/l')} />

  return (
    <div className="min-h-full bg-[#F3F1EC] pb-8">
      <TopBar back="/l/scan" title="تسليم عميل" sub={user?.phone ? `جوال ينتهي بـ ${user.phone.slice(-4)}` : undefined} />
      <div className="space-y-3 px-4">
        {bookings.length ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Card className="flex flex-col items-center bg-gradient-to-b from-loop-50 to-paper p-4 text-center">
                <Carton tone="green" count={usable} size={92} />
                <div className="num font-display text-3xl font-semibold text-loop-700">{usable}</div>
                <div className="text-sm font-semibold">الكرتون الأخضر</div>
                <div className="mt-1 text-xs text-mute">خلّه عندك، جاهز للاستخدام</div>
              </Card>
              <Card className="flex flex-col items-center bg-gradient-to-b from-steel-50 to-paper p-4 text-center">
                <Carton tone="grey" count={damaged} size={92} delay={0.1} />
                <div className="num font-display text-3xl font-semibold text-steel-700">{damaged}</div>
                <div className="text-sm font-semibold">الكرتون الرمادي</div>
                <div className="mt-1 text-xs text-mute">{damaged ? 'فضّه في صندوق مَعاد' : 'ما فيه'}</div>
              </Card>
            </div>
            <div className="flex items-center gap-2 rounded-2xl bg-paper px-4 py-3 text-xs text-mute ring-1 ring-ink/5">
              <Icon name="check" size={16} className="text-loop" />
              مفحوصة ومفروزة من العميل، ما يحتاج تفرزها
            </div>
            {!acceptsDamagedNow(l) && damaged > 0 && <div className="rounded-2xl bg-copper-50 px-4 py-3 text-xs text-copper-700">ملاحظة: الصندوق ممتلئ، بس هالحجز انقبل قبل ما يمتلي.</div>}
            <Button className="w-full" icon="check" onClick={confirm}>
              استلمت
            </Button>
            <button onClick={() => setFlag((f) => !f)} className={cx('mx-auto flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold', flag ? 'bg-rust-50 text-rust' : 'text-mute')}>
              <Icon name="flag" size={14} />
              {flag ? 'بنسجّل إن العدد مو مطابق' : 'العدد مو مطابق؟'}
            </button>
          </>
        ) : (
          <Card className="p-6 text-center">
            <div className="font-semibold">ما فيه تسليم محجوز لهالعميل عندكم</div>
            <div className="mt-1 text-xs text-mute">ممكن يكون حجزه انتهى أو لمغسلة ثانية</div>
          </Card>
        )}

        {coupons.length > 0 && (
          <>
            <div className="px-1 pt-4 font-display font-semibold">كوبونات العميل عندكم</div>
            {coupons.map((c) => (
              <Card key={c.id} className="flex items-center gap-3 p-4">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-copper-50 text-copper">
                  <Icon name="ticket" size={22} />
                </div>
                <div className="flex-1">
                  <div className="font-semibold">{rewardTitle(c.reward)}</div>
                  <div className="text-xs text-mute">{daysLeft(c.expiresAt, now)}</div>
                </div>
                {redeemed === c.id ? (
                  <Pill tone="loop" icon="check">
                    انصرف
                  </Pill>
                ) : (
                  <Button
                    size="sm"
                    variant="copper"
                    onClick={() => {
                      if (redeem(c.id)) setRedeemed(c.id)
                    }}
                  >
                    اصرفه
                  </Button>
                )}
              </Card>
            ))}
          </>
        )}
      </div>
    </div>
  )
}

function Received({ usable, damaged, onBack }: { usable: number; damaged: number; onBack: () => void }) {
  const l = useLaundry()
  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-ink px-6 text-center text-white">
      <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 16 }} className="grid h-24 w-24 place-items-center rounded-full bg-loop">
        <Icon name="check" size={48} strokeWidth={2.6} />
      </motion.div>
      <div className="mt-6 font-display text-2xl font-semibold">تم الاستلام</div>
      <div className="mt-1 text-sm text-white/60">وصلت مكافأة العميل على جواله</div>
      <div className="mt-8 grid w-full grid-cols-2 gap-3">
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
          <div className="text-xs text-white/50">المخزون</div>
          <div className="num mt-1 text-2xl font-semibold text-loop-100">+{num(usable)}</div>
          <div className="num text-xs text-white/40">صار {num(l.stock)}</div>
        </motion.div>
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
          <div className="text-xs text-white/50">صندوق مَعاد</div>
          <div className="num mt-1 text-2xl font-semibold text-steel-100">+{num(damaged)}</div>
          <div className="num text-xs text-white/40" dir="ltr">
            {num(l.boxCount)} / {economics.boxCapacityHangers}
          </div>
        </motion.div>
      </div>
      <AnimatePresence>
        {l.boxCount >= economics.boxCapacityHangers && (
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.8 }} className="mt-3 flex w-full items-center gap-3 rounded-2xl bg-copper px-4 py-3 text-start text-sm">
            <Icon name="truck" size={22} />
            <div>
              <div className="font-semibold">امتلى الصندوق!</div>
              <div className="text-xs text-white/80">عرضنا الخردة على المصانع تلقائي</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <Button variant="soft" className="mt-8 w-full border-white/10 bg-white/5 text-white" onClick={onBack}>
        رجوع للوحة
      </Button>
    </div>
  )
}
