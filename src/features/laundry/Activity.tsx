import { motion } from 'motion/react'
import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { scrapValueSar } from '@/config/economics'
import { activeListing, byId, scrapPayouts } from '@/domain/services'
import { dateYear, groupByDay, hangers, kg, num, sar, time } from '@/lib/format'
import { useStore } from '@/store/store'
import { Icon } from '@/ui/Icon'
import { cx, Odometer } from '@/ui/kit'
import { useLaundry } from './LaundryLayout'

export function LaundryActivity() {
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') === 'payouts' ? 'payouts' : 'receipts'
  return (
    <div className="min-h-full bg-[#F3F1EC] pb-10">
      <header className="sticky top-0 z-20 bg-[#F3F1EC]/90 px-4 pb-3 backdrop-blur-xl" style={{ paddingTop: 'calc(var(--status, 0px) + 24px)' }}>
        <h1 className="px-1 font-display text-2xl font-semibold">السجل</h1>
        <div className="mt-3 grid grid-cols-2 rounded-2xl bg-ink/[0.06] p-1 text-sm font-semibold" role="tablist">
          {(
            [
              ['receipts', 'الاستلامات'],
              ['payouts', 'مدفوعات الخردة'],
            ] as const
          ).map(([id, label]) => (
            <button key={id} role="tab" aria-selected={tab === id} onClick={() => setParams(id === 'payouts' ? { tab: id } : {}, { replace: true })} className={cx('relative h-10 rounded-xl', tab === id ? 'text-ink' : 'text-mute')}>
              {tab === id && <motion.span layoutId="activity-tab" className="absolute inset-0 rounded-xl bg-paper shadow-card" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
              <span className="relative">{label}</span>
            </button>
          ))}
        </div>
      </header>
      <div className="px-4">{tab === 'receipts' ? <Receipts /> : <Payouts />}</div>
    </div>
  )
}

function Receipts() {
  const db = useStore((s) => s.db)
  const now = useStore((s) => s.now)()
  const l = useLaundry()
  const days = useMemo(() => {
    const list = db.bookings
      .filter((b) => b.laundryId === l.id && b.receivedAt)
      .sort((a, b) => b.receivedAt! - a.receivedAt!)
      .slice(0, 60)
    return groupByDay(list, (b) => b.receivedAt!, now)
  }, [db, l.id, now])
  if (!days.length) return <Empty text="أول استلام بيظهر هنا" />
  return (
    <div>
      {days.map((d) => (
        <section key={d.key} className="mt-4 first:mt-1">
          <div className="mb-2 flex items-baseline justify-between px-2">
            <h2 className="text-[13px] font-semibold text-mute">{d.label}</h2>
            <span className="text-xs text-faint">{hangers(d.items.reduce((a, b) => a + b.usable + b.damaged, 0))}</span>
          </div>
          <div className="divide-y divide-ink/[0.06] overflow-hidden rounded-[20px] bg-paper ring-1 ring-ink/5">
            {d.items.map((b) => (
              <div key={b.id} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="num text-[15px] font-semibold" dir="ltr">
                      {b.code}
                    </span>
                    {b.flagged && <span className="rounded-full bg-rust-50 px-2 py-0.5 text-[10px] font-semibold text-rust">العدد غير مطابق</span>}
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-xs font-semibold">
                    <span className="flex items-center gap-1.5 text-loop-700">
                      <span className="h-2 w-2 rounded-[3px] bg-loop" />
                      <span className="num">{b.usable}</span> صالحة
                    </span>
                    {b.damaged > 0 && (
                      <span className="flex items-center gap-1.5 text-steel-700">
                        <span className="h-2 w-2 rounded-[3px] bg-steel" />
                        <span className="num">{b.damaged}</span> للتدوير
                      </span>
                    )}
                  </div>
                </div>
                <span className="num shrink-0 text-xs text-mute">{time(b.receivedAt!)}</span>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

function Payouts() {
  const db = useStore((s) => s.db)
  const l = useLaundry()
  const payouts = scrapPayouts(db, l.id)
  const listing = activeListing(db, l.id)
  const factory = db.factories[0]
  return (
    <div className="pt-1">
      <div className="rounded-[24px] bg-paper p-5 ring-1 ring-ink/5">
        <div className="text-sm text-mute">دخلك من الخردة</div>
        <div className="mt-1 flex items-baseline gap-1.5 text-copper-700">
          <Odometer value={Math.round(l.scrapEarningsSar * 100) / 100} format={sar} className="font-display text-4xl font-semibold" />
          <span className="text-sm font-semibold">ر.س</span>
        </div>
        <div className="mt-1 text-xs text-mute">من {payouts.length > 2 ? `${num(payouts.length)} شحنات` : payouts.length === 2 ? 'شحنتين' : 'شحنة وحدة'} لـ{factory.name}</div>
      </div>

      {listing && (
        <div className="mt-3 flex items-center gap-3 rounded-[20px] bg-steel-50 px-4 py-3.5 ring-1 ring-steel-100">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-paper text-steel-700">
            <Icon name="truck" size={20} />
          </span>
          <div className="min-w-0 flex-1 text-sm">
            <div className="font-semibold text-ink">{listing.status === 'scheduled' ? 'المصنع جاي يستلم صندوقك' : 'صندوقك معروض على المصانع'}</div>
            <div className="text-xs text-steel-700">{hangers(listing.count)}، يوصلك المبلغ بعد الوزن</div>
          </div>
          <span className="num shrink-0 text-sm font-semibold text-copper-700">≈ {sar(scrapValueSar(listing.count, factory.pricePerKgSar))} ر.س</span>
        </div>
      )}

      <h2 className="mb-2 mt-6 px-2 text-[13px] font-semibold text-mute">الشحنات المدفوعة</h2>
      {payouts.length ? (
        <div className="divide-y divide-ink/[0.06] overflow-hidden rounded-[20px] bg-paper ring-1 ring-ink/5">
          {payouts.map((p) => (
            <div key={p.listingId} className="flex items-center gap-3 px-4 py-3.5">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-copper-50 text-copper">
                <Icon name="scale" size={19} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[15px] font-semibold">{dateYear(p.collectedAt!)}</div>
                <div className="text-xs text-mute">
                  <span className="num">{kg(p.actualKg ?? 0)}</span> كجم · {byId(db.factories, p.factoryId)?.name}
                </div>
              </div>
              <span className="num shrink-0 font-semibold text-copper-700">+{sar(p.payoutSar ?? 0)} ر.س</span>
            </div>
          ))}
        </div>
      ) : (
        <Empty text="أول دفعة توصلك لما يمتلي الصندوق ويستلمه المصنع" />
      )}
    </div>
  )
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-[20px] bg-paper p-6 text-center text-sm text-mute ring-1 ring-ink/5">{text}</div>
}
