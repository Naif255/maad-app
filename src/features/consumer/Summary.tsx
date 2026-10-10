import { motion } from 'motion/react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { economics } from '@/config/economics'
import { byId, distanceKm, planReturn, pointsFor, requestViews } from '@/domain/services'
import type { DeliveryMethod } from '@/domain/types'
import { hangers, num, rewardTitle } from '@/lib/format'
import { useStore } from '@/store/store'
import { Carton } from '@/ui/Carton'
import { Icon, type IconName } from '@/ui/Icon'
import { Button, Card, cx, LaundryBadge, Pill, Sheet, TopBar } from '@/ui/kit'
import { useHome } from './hooks'

export function Summary() {
  const db = useStore((s) => s.db)
  const batches = useStore((s) => s.batches)
  const scanRequestId = useStore((s) => s.scanRequestId)
  const setScanRequest = useStore((s) => s.setScanRequest)
  const userId = useStore((s) => s.userId)
  const book = useStore((s) => s.book)
  const home = useHome()
  const nav = useNavigate()
  const [method, setMethod] = useState(false)

  const all = batches.flatMap((b) => b.hangers)
  const usable = all.filter((h) => h.usable).length
  const damaged = all.length - usable
  const views = useMemo(() => requestViews(db, home), [db, home])
  const preferred = scanRequestId ?? views[0]?.request.id
  const plan = useMemo(() => planReturn(db, home, usable, damaged, preferred), [db, home, usable, damaged, preferred])

  if (!all.length)
    return (
      <div className="flex min-h-full flex-col items-center justify-center px-8 text-center">
        <div className="font-display text-xl font-semibold">ما فيه علاقات مفحوصة</div>
        <Button className="mt-5 w-full" icon="scan" onClick={() => nav('/c/scan')}>
          افحص علاقاتك
        </Button>
      </div>
    )

  const coupons = plan.legs.reduce((acc, leg) => {
    const req = leg.requestId ? byId(db.requests, leg.requestId) : undefined
    if (!req) return acc
    const carry = byId(db.users, userId)?.carry[leg.laundryId] ?? 0
    const n = Math.floor((carry + leg.usable) / req.reward.per)
    return n > 0 ? [...acc, { n, title: rewardTitle(req.reward) }] : acc
  }, [] as { n: number; title: string }[])
  const pts = pointsFor(
    plan.legs.reduce((a, l) => a + l.usable, 0),
    plan.legs.reduce((a, l) => a + l.damaged, 0),
  )

  const confirm = (m: DeliveryMethod) => {
    const groupId = book(plan, m)
    nav(`/c/receipt/${groupId}`, { replace: true })
  }

  return (
    <div className="min-h-full bg-sand">
      <TopBar back title="رتّبها في كرتونين" sub={`${hangers(all.length)} من ${batches.length > 1 ? `${batches.length} دفعات` : 'دفعة وحدة'}`} />
      <div className="px-4 pb-4">
        <div className="grid grid-cols-2 gap-3">
          <CartonCard tone="green" count={usable} title="الكرتون الأخضر" sub="الصالحة · ترجع للمغسلة" />
          <CartonCard tone="grey" count={damaged} title="الكرتون الرمادي" sub="التالفة · تصير حديد من جديد" delay={0.12} />
        </div>

        <div className="mb-3 mt-7 px-1 font-display text-[17px] font-semibold">وين تروح؟</div>
        <div className="space-y-3">
          {plan.legs.map((leg, i) => {
            const l = byId(db.laundries, leg.laundryId)!
            return (
              <motion.div key={leg.laundryId} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.08 }}>
                <Card className="p-4">
                  <div className="flex items-center gap-3">
                    <LaundryBadge name={l.name} hue={l.hue} size={42} />
                    <div className="min-w-0 flex-1">
                      <div className="font-display font-semibold">{l.name}</div>
                      <div className="num text-xs text-mute">{distanceKm(home, l).toFixed(1)} كم</div>
                    </div>
                    {plan.legs.length > 1 && <Pill className="num">محطة {i + 1}</Pill>}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {leg.usable > 0 && (
                      <Pill tone="loop" className="h-7 px-3 text-[13px]">
                        <span className="h-2 w-2 rounded-full bg-loop" />
                        {hangers(leg.usable)} صالحة
                      </Pill>
                    )}
                    {leg.damaged > 0 && (
                      <Pill tone="steel" className="h-7 px-3 text-[13px]">
                        <span className="h-2 w-2 rounded-full bg-steel" />
                        {hangers(leg.damaged)} للتدوير
                      </Pill>
                    )}
                  </div>
                  {leg.rerouted && <div className="mt-3 rounded-xl bg-steel-50 px-3 py-2 text-xs leading-5 text-steel-700">صندوق الحديد في المغسلة الأولى ما يستقبل الحين، فوجّهنا الرمادي لهنا لأنها الأقرب.</div>}
                </Card>
              </motion.div>
            )
          })}
          {plan.leftoverUsable > 0 && (
            <div className="flex gap-3 rounded-2xl bg-paper p-4 text-sm leading-6 text-mute ring-1 ring-ink/5">
              <Icon name="bell" size={20} className="shrink-0 text-copper" />
              <span>
                باقي عندك <b className="text-ink">{hangers(plan.leftoverUsable)} صالحة</b> ما تحتاجها المغاسل القريبة الحين. خلّها عندك، ونعلمك أول ما يطلبها أحد.
              </span>
            </div>
          )}
        </div>

        {!scanRequestId && views.length > 1 && (
          <>
            <div className="mb-3 mt-7 px-1 font-display text-[17px] font-semibold">مغاسل ثانية تحتاج</div>
            <div className="-mx-4 flex gap-2.5 overflow-x-auto px-4 pb-1 no-scrollbar">
              {views.slice(0, 5).map((v) => (
                <button
                  key={v.request.id}
                  onClick={() => setScanRequest(v.request.id)}
                  className={cx('w-40 shrink-0 rounded-2xl p-3 text-start ring-1 transition', preferred === v.request.id ? 'bg-loop-50 ring-loop' : 'bg-paper ring-ink/5')}
                >
                  <div className="truncate text-sm font-semibold">{v.laundry.name}</div>
                  <div className="num mt-0.5 text-xs text-mute">
                    {v.distance.toFixed(1)} كم · تحتاج {num(v.remaining)}
                  </div>
                  <div className="mt-2 truncate text-xs font-semibold text-copper-700">{rewardTitle(v.request.reward)}</div>
                </button>
              ))}
            </div>
          </>
        )}

        <Card className="mt-7 overflow-hidden">
          <div className="flex items-center gap-2 border-b border-ink/5 px-4 py-3 text-sm font-semibold">
            <Icon name="gift" size={18} className="text-copper" />
            بتحصل بعد التسليم
          </div>
          <div className="flex items-center gap-3 px-4 py-4">
            <div className="min-w-0 flex-1 space-y-1.5">
              {coupons.map((c) => (
                <div key={c.title} className="text-sm">
                  <span className="num font-semibold">{c.n}×</span> كوبون {c.title}
                </div>
              ))}
              {!coupons.length && plan.legs.some((l) => l.usable) && <div className="text-sm text-mute">تقرّبك من كوبونك الجاي</div>}
              <div className="text-sm">
                <span className="num font-semibold text-copper-700">+{num(pts)}</span> نقطة
              </div>
            </div>
            <div className="text-[11px] leading-4 text-mute">
              {economics.usablePointsPerHanger} للصالحة
              <br />
              {economics.damagedPointsPerHanger} للتالفة
            </div>
          </div>
        </Card>
      </div>

      <div className="sticky bottom-0 z-20 bg-gradient-to-t from-sand via-sand to-transparent px-4 pb-6 pt-6">
        <Button className="w-full" disabled={!plan.legs.length} onClick={() => setMethod(true)}>
          احجز التسليم
        </Button>
      </div>

      <MethodSheet open={method} onClose={() => setMethod(false)} onPick={confirm} />
    </div>
  )
}

function CartonCard({ tone, count, title, sub, delay = 0 }: { tone: 'green' | 'grey'; count: number; title: string; sub: string; delay?: number }) {
  return (
    <Card className={cx('flex flex-col items-center px-3 pb-4 pt-3 text-center', tone === 'green' ? 'bg-gradient-to-b from-loop-50 to-paper' : 'bg-gradient-to-b from-steel-50 to-paper')}>
      <Carton tone={tone} count={count} size={104} delay={delay} />
      <div className={cx('num font-display text-3xl font-semibold', tone === 'green' ? 'text-loop-700' : 'text-steel-700')}>{num(count)}</div>
      <div className="mt-0.5 text-sm font-semibold">{title}</div>
      <div className="mt-0.5 text-[11px] text-mute">{sub}</div>
    </Card>
  )
}

function MethodSheet({ open, onClose, onPick }: { open: boolean; onClose: () => void; onPick: (m: DeliveryMethod) => void }) {
  const [m, setM] = useState<DeliveryMethod>('dropoff')
  const opts: { id: DeliveryMethod; icon: IconName; t: string; d: string }[] = [
    { id: 'dropoff', icon: 'hand', t: 'أسلّمها بنفسي', d: 'مرّ على المغسلة خلال 48 ساعة' },
    { id: 'withOrder', icon: 'bag', t: 'مع طلبي الجاي', d: 'سلّمها للمندوب أو مع غسيلك' },
  ]
  return (
    <Sheet open={open} onClose={onClose}>
      <h3 className="font-display text-xl font-semibold">كيف بتسلّمها؟</h3>
      <p className="mt-1 text-sm text-mute">الحجز يمسك لك العدد 48 ساعة.</p>
      <div className="mt-5 space-y-2.5">
        {opts.map((o) => (
          <button key={o.id} onClick={() => setM(o.id)} className={cx('flex w-full items-center gap-3 rounded-2xl p-4 text-start ring-1 transition', m === o.id ? 'bg-loop-50 ring-2 ring-loop' : 'bg-sand ring-ink/5')}>
            <div className={cx('grid h-12 w-12 place-items-center rounded-2xl', m === o.id ? 'bg-loop text-white' : 'bg-paper text-ink')}>
              <Icon name={o.icon} size={22} />
            </div>
            <div className="flex-1">
              <div className="font-semibold">{o.t}</div>
              <div className="text-xs text-mute">{o.d}</div>
            </div>
            <div className={cx('grid h-6 w-6 place-items-center rounded-full ring-2', m === o.id ? 'bg-loop text-white ring-loop' : 'ring-ink/15')}>{m === o.id && <Icon name="check" size={14} strokeWidth={3} />}</div>
          </button>
        ))}
      </div>
      <Button className="mt-5 w-full" onClick={() => onPick(m)}>
        ثبّت الحجز
      </Button>
    </Sheet>
  )
}
