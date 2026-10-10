import { motion } from 'motion/react'
import { useNavigate, useParams } from 'react-router-dom'
import { byId } from '@/domain/services'
import { dateYear, kg, num, sar } from '@/lib/format'
import { useStore } from '@/store/store'
import { Icon } from '@/ui/Icon'
import { Card, QR, TopBar } from '@/ui/kit'
import { LogoMark } from '@/ui/Logo'

export function Certificates() {
  const db = useStore((s) => s.db)
  const nav = useNavigate()
  const list = [...db.certificates].sort((a, b) => b.date - a.date)
  return (
    <div className="pb-8">
      <TopBar title="شهادات التوريد" sub="لكل شحنة شهادة مصدر ونقاوة" />
      <div className="space-y-2.5 px-4">
        {list.map((c, i) => (
          <motion.div key={c.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="flex items-center gap-3 p-4" onClick={() => nav(`/f/cert/${c.id}`)}>
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-ink text-white">
                <Icon name="cert" size={22} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="num text-sm font-semibold" dir="ltr" style={{ textAlign: 'right' }}>
                  {c.number}
                </div>
                <div className="text-xs text-mute">
                  {dateYear(c.date)} · <span className="num">{c.sources.length}</span> مغاسل
                </div>
              </div>
              <div className="text-end">
                <div className="num text-sm font-semibold">{kg(c.kg)} كجم</div>
                <div className="num text-[11px] text-loop-700">نقاوة {c.purity}٪</div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export function CertificateView() {
  const { id = '' } = useParams()
  const db = useStore((s) => s.db)
  const c = byId(db.certificates, id)
  if (!c) return null
  const f = byId(db.factories, c.factoryId)!
  const payout = c.sources.reduce((a, s) => a + s.payoutSar, 0)
  return (
    <div className="min-h-full bg-ink pb-8">
      <TopBar dark back="/f/certs" title="شهادة توريد" />
      <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 120, damping: 16 }} className="relative mx-4 overflow-hidden rounded-[22px] bg-paper p-6 text-ink">
        <div className="pointer-events-none absolute -left-16 -top-10 opacity-[0.05]">
          <LogoMark size={300} color="#0F1714" />
        </div>
        <div className="relative">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[11px] font-semibold tracking-wide text-mute">شهادة توريد حديد معاد تدويره</div>
              <div className="num mt-1 font-display text-lg font-semibold" dir="ltr" style={{ textAlign: 'right' }}>
                {c.number}
              </div>
            </div>
            <LogoMark size={44} color="#0FA36B" />
          </div>
          <div className="my-5 h-px bg-[repeating-linear-gradient(90deg,rgba(15,23,20,0.15)_0_6px,transparent_6px_10px)]" />
          <div className="grid grid-cols-2 gap-y-5">
            <Field label="التاريخ" value={dateYear(c.date)} />
            <Field label="المستلم" value={f.name} />
            <Field label="الكمية" value={`${num(c.hangers)} علاقة`} />
            <Field label="الوزن الفعلي" value={`${kg(c.kg)} كجم`} />
          </div>
          <div className="mt-6 rounded-2xl bg-loop-50 p-4">
            <div className="flex items-end justify-between">
              <div>
                <div className="text-xs font-semibold text-loop-700">نسبة النقاوة</div>
                <div className="mt-0.5 text-[11px] text-loop-700/70">محسوبة من بيانات الفحص لكل علاقة</div>
              </div>
              <div className="num font-display text-3xl font-semibold text-loop-700">{c.purity}٪</div>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-loop-100">
              <motion.div className="h-full rounded-full bg-loop" initial={{ width: 0 }} animate={{ width: `${c.purity}%` }} transition={{ delay: 0.3, duration: 0.9 }} />
            </div>
          </div>
          <div className="mt-6 text-xs font-semibold text-mute">المصادر</div>
          <div className="mt-2 divide-y divide-ink/5">
            {c.sources.map((s) => {
              const l = byId(db.laundries, s.laundryId)!
              return (
                <div key={s.laundryId} className="flex items-center justify-between py-2.5 text-sm">
                  <div>
                    <div className="font-semibold">{l.name}</div>
                    <div className="text-[11px] text-mute">{byId(db.neighborhoods, l.neighborhoodId)!.name}، بريدة</div>
                  </div>
                  <div className="text-end">
                    <div className="num">{kg(s.kg)} كجم</div>
                    <div className="num text-[11px] text-mute">{sar(s.payoutSar)} ر.س</div>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="mt-5 flex items-end justify-between border-t border-ink/10 pt-5">
            <div>
              <div className="text-[11px] text-mute">إجمالي المدفوع للمغاسل</div>
              <div className="num font-display text-xl font-semibold">{sar(payout)} ر.س</div>
              <div className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold text-loop-700">
                <Icon name="check" size={14} strokeWidth={2.6} />
                موثّقة من منصة مَعاد
              </div>
            </div>
            <QR value={`MAAD:CERT:${c.number}`} size={84} />
          </div>
        </div>
      </motion.div>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] text-mute">{label}</div>
      <div className="num mt-0.5 text-sm font-semibold">{value}</div>
    </div>
  )
}
