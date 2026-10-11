import { motion } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import { economics, scrapValueSar } from '@/config/economics'
import { boxState, isOpen, laundryMonthStats, pendingForLaundry, reservedFor, type BoxState } from '@/domain/services'
import { hangers, hoursLeft, num, rewardRule, rewardTitle, sar } from '@/lib/format'
import { useStore } from '@/store/store'
import { BoxGauge } from '@/ui/BoxGauge'
import { Icon, type IconName } from '@/ui/Icon'
import { Button, Card, cx, Odometer, WireProgress } from '@/ui/kit'
import { useTicker } from '../consumer/hooks'
import { useLaundry } from './LaundryLayout'

function boxCopy(state: BoxState, left: number) {
  if (state === 'off') return { t: 'ما عندك صندوق خردة', d: 'تستقبل الصالحة فقط حسب إعداداتك.' }
  if (state === 'scheduled') return { t: 'المصنع جاي يستلم صندوقك', d: 'خلّه جاهز عند الباب. المبلغ يوصلك بعد الوزن.' }
  if (state === 'listed') return { t: 'صندوقك ممتلئ', d: 'عرضناه على المصانع، والتالفة موقوفة لين يستلمونه.' }
  if (state === 'almost') return { t: 'صندوقك قرب يمتلي', d: `باقي ${hangers(left)} وينعرض على المصانع تلقائي.` }
  return { t: 'صندوقك يتعبّى', d: `باقي ${hangers(left)} ويمتلي، وبعدها نبيعه لك.` }
}

export function LaundryDashboard() {
  const db = useStore((s) => s.db)
  const l = useLaundry()
  const nav = useNavigate()
  const now = useTicker(1000)
  const month = laundryMonthStats(db, l.id, now)
  const req = db.requests.find((r) => r.laundryId === l.id && isOpen(r))
  const pending = pendingForLaundry(db, l.id)
  const state = boxState(db, l)
  const ratio = l.boxCount / economics.boxCapacityHangers
  const factory = db.factories[0]
  const value = scrapValueSar(l.boxCount, factory.pricePerKgSar)
  const copy = boxCopy(state, Math.max(0, economics.boxCapacityHangers - l.boxCount))
  const ready = state === 'listed' || state === 'scheduled'

  return (
    <div className="pb-8">
      <header className="px-5 pb-4 pt-safe">
        <div className="text-sm text-mute">لوحة المغسلة</div>
        <div className="font-display text-[22px] font-semibold">{l.name}</div>
      </header>

      <div className="space-y-3 px-4">
        <Card className={cx('overflow-hidden', ready && 'ring-2 ring-steel')}>
          <div className="flex items-center gap-4 p-5">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-mute">
                <Icon name="box" size={14} />
                صندوق مَعاد
              </div>
              <div className="mt-1.5 font-display text-[21px] font-semibold leading-snug">{copy.t}</div>
              <div className="mt-1 text-[13px] leading-5 text-mute">{copy.d}</div>
            </div>
            {state !== 'off' && <BoxGauge ratio={ratio} full={ready} size={104} />}
          </div>
          {state !== 'off' && (
            <div className="flex items-center justify-between border-t border-ink/5 px-5 py-3 text-sm">
              <span className="text-mute">
                <span className="num font-semibold text-ink">{num(l.boxCount)}</span> من <span className="num">{economics.boxCapacityHangers}</span> علاقة
              </span>
              <span className="flex items-baseline gap-1 text-copper-700">
                <span className="text-xs">قيمته تقريبًا</span>
                <Odometer value={Math.round(value * 100) / 100} format={sar} className="font-semibold" />
                <span className="text-xs">ر.س</span>
              </span>
            </div>
          )}
        </Card>

        {pending.length > 0 ? (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="overflow-hidden">
              <div className="flex items-center gap-3 px-4 pb-2 pt-4">
                <span className="relative grid h-10 w-10 place-items-center rounded-xl bg-loop-50 text-loop-700">
                  <Icon name="hand" size={20} />
                  <span className="num absolute -top-1 -left-1 grid h-5 min-w-5 place-items-center rounded-full bg-loop px-1 text-[11px] font-bold text-white">{pending.length}</span>
                </span>
                <div className="flex-1">
                  <div className="font-semibold">{pending.length === 1 ? 'عميل جاي يسلّم علاقاته' : `${pending.length} عملاء جايين يسلّمون`}</div>
                  <div className="text-xs text-mute">امسح رمزه لما يوصل، ما يحتاج تفرز شي</div>
                </div>
              </div>
              <div className="divide-y divide-ink/5 px-4">
                {pending.slice(0, 3).map((b) => (
                  <button key={b.id} onClick={() => nav(`/l/customer/${b.userId}`)} className="flex w-full items-center gap-3 py-2.5 text-start">
                    <span className="num text-sm font-semibold" dir="ltr">
                      {b.code}
                    </span>
                    <span className="flex flex-1 items-center gap-2.5 text-xs font-semibold">
                      <span className="flex items-center gap-1 text-loop-700">
                        <span className="h-2 w-2 rounded-[3px] bg-loop" />
                        <span className="num">{b.usable}</span>
                      </span>
                      {b.damaged > 0 && (
                        <span className="flex items-center gap-1 text-steel-700">
                          <span className="h-2 w-2 rounded-[3px] bg-steel" />
                          <span className="num">{b.damaged}</span>
                        </span>
                      )}
                    </span>
                    <span className="text-[11px] text-mute">باقي {hoursLeft(b.expiresAt - now)}</span>
                  </button>
                ))}
              </div>
              <div className="p-4 pt-2">
                <Button size="md" className="w-full" icon="qr" onClick={() => nav('/l/scan')}>
                  امسح رمز العميل
                </Button>
              </div>
            </Card>
          </motion.div>
        ) : (
          !req && (
            <NextStep icon="plus" title="ما عندك طلب مفتوح" text="انشر طلب وخلّ الحي يرجّع لك علاقاتك" action="انشر طلب جديد" onClick={() => nav('/l/new')} />
          )
        )}

        {req && (
          <Card className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xs font-semibold text-mute">طلبك الحالي</div>
                <div className="mt-1 truncate font-semibold">{rewardTitle(req.reward)}</div>
                <div className="text-xs text-mute">{rewardRule(req.reward)}</div>
              </div>
              <div className="shrink-0 text-end">
                <div className="num font-display text-2xl font-semibold leading-none">
                  {num(req.collected)}
                  <span className="text-sm font-normal text-mute"> من {num(req.target)}</span>
                </div>
                <div className="mt-1 text-[11px] text-mute">وصلت</div>
              </div>
            </div>
            <WireProgress className="mt-3.5" value={req.collected} reserved={reservedFor(db, req.id)} max={req.target} />
          </Card>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Tile icon="layers" label="علاقات عندك" value={num(l.stock)} />
          <Tile icon="spark" label="وفّرت هالشهر" value={sar(month.savings)} unit="ر.س" money />
        </div>
      </div>
    </div>
  )
}

function NextStep({ icon, title, text, action, onClick }: { icon: IconName; title: string; text: string; action: string; onClick: () => void }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-loop-50 text-loop-700">
          <Icon name={icon} size={20} />
        </span>
        <div className="flex-1">
          <div className="font-semibold">{title}</div>
          <div className="text-xs text-mute">{text}</div>
        </div>
      </div>
      <Button size="md" className="mt-3.5 w-full" onClick={onClick}>
        {action}
      </Button>
    </Card>
  )
}

function Tile({ icon, label, value, unit, money }: { icon: IconName; label: string; value: string; unit?: string; money?: boolean }) {
  return (
    <div className="rounded-[20px] bg-paper p-4 shadow-card ring-1 ring-ink/5">
      <div className="flex items-center gap-1.5 text-xs text-mute">
        <Icon name={icon} size={15} className={money ? 'text-copper' : 'text-ink/50'} />
        {label}
      </div>
      <div className={cx('num mt-2 text-2xl font-semibold leading-none', money && 'text-copper-700')}>
        {value}
        {unit && <span className="ms-1 text-xs font-normal text-mute">{unit}</span>}
      </div>
    </div>
  )
}
