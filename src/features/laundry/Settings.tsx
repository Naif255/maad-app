import { motion } from 'motion/react'
import { economics } from '@/config/economics'
import { ago, date, hangers, num, sar } from '@/lib/format'
import { useStore } from '@/store/store'
import { Icon } from '@/ui/Icon'
import { Card, cx, Pill, TopBar } from '@/ui/kit'
import { SwitchAccount } from '@/ui/SwitchAccount'
import { useLaundry } from './LaundryLayout'

export function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!on)} className={cx('relative h-7 w-12 shrink-0 rounded-full transition-colors', on ? 'bg-loop' : 'bg-ink/15')} role="switch" aria-checked={on}>
      <motion.span className="absolute top-0.5 h-6 w-6 rounded-full bg-white shadow" initial={false} animate={{ right: on ? 22 : 2 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }} />
    </button>
  )
}

export function LaundrySettings() {
  const l = useLaundry()
  const set = useStore((s) => s.setAcceptsDamaged)
  const factory = useStore((s) => s.db.factories[0])
  return (
    <div className="min-h-full bg-[#F3F1EC] pb-8">
      <TopBar title="الإعدادات" />
      <div className="space-y-3 px-4">
        <Card className="p-5">
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <div className="font-semibold">نستقبل الصالحة فقط</div>
              <div className="mt-1 text-xs leading-5 text-mute">إذا فعّلته، ما نستقبل علاقات تالفة ولا يكون عندك صندوق مَعاد. العملاء يتوجهون لمغسلة ثانية للتالفة.</div>
            </div>
            <Toggle on={!l.acceptsDamaged} onChange={(v) => set(l.id, !v)} />
          </div>
        </Card>
        <Card className="divide-y divide-ink/5">
          <Row label="سعة صندوق مَعاد" value={hangers(economics.boxCapacityHangers)} />
          <Row label="المصنع المتعاقد" value={factory.name} />
          <Row label="سعر الكيلو" value={`${sar(factory.pricePerKgSar)} ر.س`} />
          <Row label="الدفع" value="لكل مغسلة على حدة" />
        </Card>
        <SwitchAccount />
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-5 py-4 text-sm">
      <span className="text-mute">{label}</span>
      <span className="num font-semibold">{value}</span>
    </div>
  )
}

export function LaundryHistory() {
  const db = useStore((s) => s.db)
  const now = useStore((s) => s.now)()
  const l = useLaundry()
  const list = db.bookings.filter((b) => b.laundryId === l.id && b.receivedAt).sort((a, b) => b.receivedAt! - a.receivedAt!).slice(0, 40)
  const payouts = db.rounds.flatMap((r) => r.stops.filter((s) => s.laundryId === l.id && s.collectedAt).map((s) => ({ ...s, round: r.id })))
  return (
    <div className="min-h-full bg-[#F3F1EC] pb-8">
      <TopBar title="الاستلامات والمدفوعات" />
      <div className="px-4">
        {payouts.length > 0 && (
          <>
            <div className="mb-2 px-1 text-sm font-semibold">مدفوعات الخردة</div>
            <div className="mb-5 space-y-2">
              {payouts
                .sort((a, b) => b.collectedAt! - a.collectedAt!)
                .map((p) => (
                  <Card key={p.listingId} className="flex items-center gap-3 p-3.5">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-copper-50 text-copper">
                      <Icon name="scale" size={18} />
                    </div>
                    <div className="flex-1 text-sm">
                      <div className="font-semibold">
                        <span className="num">{p.actualKg}</span> كجم · <span className="num">{num(p.count)}</span> علاقة
                      </div>
                      <div className="text-xs text-mute">{date(p.collectedAt!)}</div>
                    </div>
                    <Pill tone="copper" className="num">
                      {sar(p.payoutSar!)} ر.س
                    </Pill>
                  </Card>
                ))}
            </div>
          </>
        )}
        <div className="mb-2 px-1 text-sm font-semibold">آخر الاستلامات</div>
        <div className="space-y-2">
          {list.map((b) => (
            <div key={b.id} className="flex items-center gap-3 rounded-2xl bg-paper px-4 py-3 text-sm ring-1 ring-ink/5">
              <div className="flex-1">
                <span className="text-loop-700">
                  <span className="num font-semibold">{b.usable}</span> صالحة
                </span>
                {b.damaged > 0 && (
                  <span className="text-steel-700">
                    {' '}
                    · <span className="num font-semibold">{b.damaged}</span> تالفة
                  </span>
                )}
                {b.flagged && <Pill tone="rust" className="ms-2 h-5 text-[10px]">عدد غير مطابق</Pill>}
              </div>
              <span className="text-xs text-mute">{ago(b.receivedAt!, now)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
