import { motion } from 'motion/react'
import { useNavigate, useParams } from 'react-router-dom'
import { economics } from '@/config/economics'
import { acceptsDamagedNow, byId, distanceKm, neighborhoodOf, reservedFor } from '@/domain/services'
import { hangers, num, points, rewardRule, rewardTitle } from '@/lib/format'
import { useStore } from '@/store/store'
import { Icon } from '@/ui/Icon'
import { Button, Card, LaundryBadge, TopBar, WireProgress } from '@/ui/kit'
import { useHome } from './hooks'

export function RequestDetail() {
  const { id } = useParams()
  const db = useStore((s) => s.db)
  const setScanRequest = useStore((s) => s.setScanRequest)
  const home = useHome()
  const nav = useNavigate()
  const r = byId(db.requests, id)
  if (!r) return null
  const l = byId(db.laundries, r.laundryId)!
  const reserved = reservedFor(db, r.id)
  const remaining = Math.max(0, r.target - r.collected - reserved)
  const damagedOk = acceptsDamagedNow(l)
  const steps = [
    { icon: 'scan' as const, t: 'افحص علاقاتك بالكاميرا', d: 'نقيّم كل علاقة من 100 خلال ثواني' },
    { icon: 'box' as const, t: 'افرزها في كرتونين', d: 'الأخضر للصالحة، والرمادي للتالفة' },
    { icon: 'store' as const, t: `سلّمها لـ${l.short}`, d: 'بنفسك أو مع طلبك الجاي' },
    { icon: 'gift' as const, t: 'استلم مكافأتك', d: 'كوبونات ونقاط توصلك أول ما يستلمونها' },
  ]

  return (
    <div className="min-h-full bg-sand">
      <div className="relative overflow-hidden pb-6" style={{ background: `linear-gradient(160deg, hsl(${l.hue} 40% 92%), var(--color-sand))` }}>
        <TopBar back="/c" />
        <div className="px-5">
          <LaundryBadge name={l.name} hue={l.hue} size={64} />
          <h1 className="mt-4 font-display text-[26px] font-semibold">{l.name}</h1>
          <div className="mt-1 flex items-center gap-2 text-sm text-mute">
            <Icon name="pin" size={15} />
            {neighborhoodOf(db, l.neighborhoodId).name} · <span className="num">{distanceKm(home, l).toFixed(1)}</span> كم عنك
          </div>
        </div>
      </div>

      <div className="space-y-3 px-4">
        <Card className="p-5">
          <div className="flex items-end justify-between">
            <div>
              <div className="text-xs text-mute">تحتاج الحين</div>
              <div className="num font-display text-4xl font-semibold">{num(remaining)}</div>
            </div>
            <div className="text-end text-xs text-mute">
              <span className="num font-semibold text-ink">{num(r.collected)}</span> من <span className="num">{num(r.target)}</span> وصلت
              {reserved > 0 && (
                <div className="mt-0.5">
                  <span className="num">{num(reserved)}</span> محجوزة بالطريق
                </div>
              )}
            </div>
          </div>
          <WireProgress className="mt-4" value={r.collected} reserved={reserved} max={r.target} height={10} />
          <div className="mt-3 text-xs text-mute">يقفل الطلب تلقائي أول ما يكتمل العدد</div>
        </Card>

        <Card className="overflow-hidden">
          <div className="flex items-center gap-3 bg-copper-50 p-5">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-copper text-white">
              <Icon name="gift" size={24} />
            </div>
            <div>
              <div className="font-display text-lg font-semibold text-copper-700">{rewardTitle(r.reward)}</div>
              <div className="text-sm text-copper-700/75">{rewardRule(r.reward)}</div>
            </div>
          </div>
          <div className="grid grid-cols-2 divide-x divide-x-reverse divide-ink/5 text-sm">
            <div className="p-4">
              <div className="flex items-center gap-1.5 font-semibold text-loop-700">
                <span className="h-2.5 w-2.5 rounded-full bg-loop" />
                الصالحة
              </div>
              <div className="mt-1 text-xs leading-5 text-mute">كوبونات + {points(economics.usablePointsPerHanger)} للعلاقة</div>
            </div>
            <div className="p-4">
              <div className="flex items-center gap-1.5 font-semibold text-steel-700">
                <span className="h-2.5 w-2.5 rounded-full bg-steel" />
                التالفة
              </div>
              <div className="mt-1 text-xs leading-5 text-mute">{damagedOk ? `${points(economics.damagedPointsPerHanger)} للعلاقة، تروح لمصنع الحديد` : 'نوجّهها لمغسلة قريبة ثانية'}</div>
            </div>
          </div>
        </Card>

        {!damagedOk && (
          <div className="flex gap-3 rounded-2xl bg-steel-50 p-4 text-sm text-steel-700">
            <Icon name="box" size={20} className="shrink-0" />
            <span>{l.acceptsDamaged ? 'صندوق الحديد عندهم ممتلئ وينتظر المصنع.' : 'هالمغسلة تستقبل العلاقات الصالحة فقط.'} التالفة نوجّهك فيها لأقرب مغسلة تستقبلها.</span>
          </div>
        )}

        <div className="pt-3">
          <div className="mb-3 px-1 font-display text-[17px] font-semibold">كيف تمشي؟</div>
          <div className="relative space-y-4 ps-1">
            <div className="absolute bottom-5 start-[21px] top-5 w-0.5 bg-ink/10" />
            {steps.map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.07 }} className="relative flex items-center gap-3">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-paper text-ink shadow-card">
                  <Icon name={s.icon} size={20} />
                </div>
                <div>
                  <div className="text-[15px] font-semibold">{s.t}</div>
                  <div className="text-xs text-mute">{s.d}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 z-20 mt-4 bg-gradient-to-t from-sand via-sand to-transparent px-4 pb-6 pt-8">
        <Button
          className="w-full"
          icon="scan"
          disabled={remaining === 0}
          onClick={() => {
            setScanRequest(r.id)
            nav(`/c/scan?for=${r.id}`)
          }}
        >
          {remaining === 0 ? 'اكتمل العدد' : `افحص علاقاتك${remaining < 20 ? ` · باقي ${hangers(remaining)}` : ''}`}
        </Button>
      </div>
    </div>
  )
}
