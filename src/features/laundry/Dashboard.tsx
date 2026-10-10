import { motion } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import { economics, scrapValueSar } from '@/config/economics'
import { activeListing, boxIsFull, byId, isOpen, laundryMonthStats, pendingForLaundry, reservedFor } from '@/domain/services'
import { ago, countdown, num, rewardRule, rewardTitle, sar } from '@/lib/format'
import { useStore } from '@/store/store'
import { BoxGauge } from '@/ui/BoxGauge'
import { Icon } from '@/ui/Icon'
import { Button, Card, cx, Odometer, Pill, SectionTitle, WireProgress } from '@/ui/kit'
import { useTicker } from '../consumer/hooks'
import { useLaundry } from './LaundryLayout'

export function LaundryDashboard() {
  const db = useStore((s) => s.db)
  const l = useLaundry()
  const nav = useNavigate()
  const now = useTicker(1000)
  const month = laundryMonthStats(db, l.id, now)
  const req = db.requests.find((r) => r.laundryId === l.id && isOpen(r))
  const pending = pendingForLaundry(db, l.id)
  const full = boxIsFull(l)
  const listing = activeListing(db, l.id)
  const ratio = l.boxCount / economics.boxCapacityHangers
  const factory = db.factories[0]
  const value = scrapValueSar(l.boxCount, factory.pricePerKgSar)

  return (
    <div className="pb-8">
      <header className="flex items-center justify-between px-5 pb-3 pt-12">
        <div>
          <div className="text-sm text-mute">لوحة المغسلة</div>
          <div className="font-display text-xl font-semibold">{l.name}</div>
        </div>
        <Pill tone="loop" icon="check">
          شريك مَعاد
        </Pill>
      </header>

      <div className="space-y-3 px-4">
        <Card className={cx('overflow-hidden', full && 'ring-2 ring-copper')}>
          <div className="flex items-center gap-4 p-5">
            <BoxGauge ratio={ratio} full={full} />
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-mute">صندوق مَعاد</div>
              <div className="mt-1 flex items-baseline gap-1">
                <Odometer value={l.boxCount} className="text-3xl font-semibold" />
                <span className="num text-sm text-mute" dir="ltr">/ {economics.boxCapacityHangers}</span>
              </div>
              <div className="mt-2 text-xs text-mute">قيمة تقديرية</div>
              <div className="flex items-baseline gap-1 text-copper-700">
                <Odometer value={Math.round(value * 100) / 100} format={sar} className="text-xl font-semibold" />
                <span className="text-xs">ر.س</span>
              </div>
            </div>
          </div>
          {full && listing ? (
            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} className="flex items-center gap-3 bg-copper-50 px-5 py-3 text-sm text-copper-700">
              <Icon name="truck" size={20} className="shrink-0" />
              <div className="flex-1">
                <div className="font-semibold">{listing.status === 'scheduled' ? 'المصنع جاي يستلم الصندوق' : 'الصندوق ممتلئ، عرضناه على المصانع'}</div>
                <div className="text-xs opacity-80">وقفنا استقبال التالفة مؤقتًا، والصالحة مستمرة عادي</div>
              </div>
            </motion.div>
          ) : (
            <div className="border-t border-ink/5 px-5 py-3 text-xs text-mute">
              {l.acceptsDamaged ? 'لما يمتلي، نعرضه على المصانع تلقائي وتنباع الخردة باسمك' : 'المغسلة تستقبل الصالحة فقط حسب إعداداتك'}
            </div>
          )}
        </Card>

        <div className="grid grid-cols-3 gap-2.5">
          <MiniStat icon="layers" label="مخزون العلاقات" value={num(l.stock)} />
          <MiniStat icon="spark" label="توفير الشهر" value={sar(month.savings)} unit="ر.س" tone="loop" />
          <MiniStat icon="scale" label="دخل الخردة" value={sar(l.scrapEarningsSar)} unit="ر.س" tone="copper" />
        </div>

        <SectionTitle action={<span className="num text-xs text-mute">{pending.length}</span>}>بانتظار التسليم</SectionTitle>
        {pending.length ? (
          <div className="space-y-2">
            {pending.map((b) => (
              <Card key={b.id} className="flex items-center gap-3 p-3.5" onClick={() => nav(`/l/customer/${b.userId}`)}>
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-sand-2">
                  <Icon name="user" size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="num text-sm font-semibold" dir="ltr" style={{ textAlign: 'right' }}>
                    {b.code}
                  </div>
                  <div className="mt-0.5 flex gap-2 text-xs">
                    <span className="text-loop-700">
                      أخضر <span className="num font-semibold">{b.usable}</span>
                    </span>
                    {b.damaged > 0 && (
                      <span className="text-steel-700">
                        رمادي <span className="num font-semibold">{b.damaged}</span>
                      </span>
                    )}
                    <span className="text-mute">· {ago(b.createdAt, now)}</span>
                  </div>
                </div>
                <div className="num text-[11px] text-mute">{countdown(b.expiresAt - now)}</div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl bg-paper p-4 text-center text-sm text-mute">ما فيه تسليمات معلقة</div>
        )}
        <Button className="mt-1 w-full" icon="qr" onClick={() => nav('/l/scan')}>
          امسح رمز العميل
        </Button>

        <SectionTitle>طلبك الحالي</SectionTitle>
        {req ? (
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold">{rewardTitle(req.reward)}</div>
                <div className="text-xs text-mute">{rewardRule(req.reward)}</div>
              </div>
              <Pill tone="loop">مفتوح</Pill>
            </div>
            <WireProgress className="mt-4" value={req.collected} reserved={reservedFor(db, req.id)} max={req.target} />
            <div className="mt-2 flex justify-between text-xs text-mute">
              <span>
                <span className="num font-semibold text-ink">{num(req.collected)}</span> من <span className="num">{num(req.target)}</span>
              </span>
              <span>
                محجوز <span className="num">{num(reservedFor(db, req.id))}</span>
              </span>
            </div>
          </Card>
        ) : (
          <Card className="p-5 text-center" onClick={() => nav('/l/new')}>
            <div className="font-semibold">ما عندك طلب مفتوح</div>
            <div className="mt-1 text-xs text-mute">انشر طلب بثلاث خطوات وخل الحي يرجّع لك علاقاتك</div>
          </Card>
        )}
        {byId(db.factories, factory.id) && <div className="pt-2 text-center text-[11px] text-faint">سعر الخردة الحالي من {factory.name}: <span className="num">{sar(factory.pricePerKgSar)}</span> ر.س/كجم</div>}
      </div>
    </div>
  )
}

function MiniStat({ icon, label, value, unit, tone }: { icon: 'layers' | 'spark' | 'scale'; label: string; value: string; unit?: string; tone?: 'loop' | 'copper' }) {
  return (
    <div className="rounded-2xl bg-paper p-3 shadow-card ring-1 ring-ink/5">
      <Icon name={icon} size={18} className={tone === 'loop' ? 'text-loop' : tone === 'copper' ? 'text-copper' : 'text-ink/60'} />
      <div className="num mt-2 text-lg font-semibold leading-none">
        {value}
        {unit && <span className="ms-0.5 text-[10px] font-normal text-mute">{unit}</span>}
      </div>
      <div className="mt-1 text-[11px] text-mute">{label}</div>
    </div>
  )
}
