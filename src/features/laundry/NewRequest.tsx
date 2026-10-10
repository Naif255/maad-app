import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { savingsSar } from '@/config/economics'
import { isOpen } from '@/domain/services'
import type { Reward } from '@/domain/types'
import { hangers, num, rewardRule, rewardTitle, sar } from '@/lib/format'
import { useStore } from '@/store/store'
import { Icon } from '@/ui/Icon'
import { Button, cx, Odometer, TopBar } from '@/ui/kit'
import { useLaundry } from './LaundryLayout'

export const TEMPLATES: Reward[] = [
  { kind: 'ironing', per: 10, value: 3 },
  { kind: 'ironing', per: 20, value: 5 },
  { kind: 'discount', per: 20, value: 10 },
  { kind: 'discount', per: 25, value: 15 },
  { kind: 'wash', per: 15, value: 1 },
  { kind: 'wash', per: 25, value: 2 },
]

export function NewRequest() {
  const l = useLaundry()
  const db = useStore((s) => s.db)
  const create = useStore((s) => s.createRequest)
  const nav = useNavigate()
  const [step, setStep] = useState(0)
  const [qty, setQty] = useState(200)
  const [tpl, setTpl] = useState(0)
  const [published, setPublished] = useState(false)
  const existing = db.requests.find((r) => r.laundryId === l.id && isOpen(r))
  const reward = TEMPLATES[tpl]

  const publish = () => {
    create(l.id, qty, reward)
    setPublished(true)
    setTimeout(() => nav('/l'), 1600)
  }

  return (
    <div className="flex min-h-full flex-col bg-[#F3F1EC]">
      <TopBar back="/l" title="طلب علاقات جديد" sub="ثلاث خطوات وينشر للحي" />
      <div className="flex gap-1.5 px-5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-1 flex-1 overflow-hidden rounded-full bg-ink/10">
            <motion.div className="h-full bg-loop" initial={false} animate={{ width: step >= i ? '100%' : '0%' }} />
          </div>
        ))}
      </div>
      <div className="relative flex-1 px-4 pt-6">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div key="q" initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30 }}>
              <div className="px-1 font-display text-xl font-semibold">كم علاقة تحتاج؟</div>
              <div className="mt-8 text-center">
                <Odometer value={qty} className="text-7xl font-semibold" />
                <div className="mt-1 text-sm text-mute">علاقة</div>
              </div>
              <input type="range" min={50} max={600} step={10} value={qty} onChange={(e) => setQty(Number(e.target.value))} className="mt-8 w-full accent-[#0FA36B]" />
              <div className="num mt-1 flex justify-between text-xs text-mute">
                <span>50</span>
                <span>600</span>
              </div>
              <div className="mt-6 flex items-center gap-3 rounded-2xl bg-loop-50 p-4 text-sm text-loop-900">
                <Icon name="spark" size={20} className="shrink-0 text-loop" />
                <span>
                  بتوفّر تقريبًا <b className="num">{sar(savingsSar(qty))}</b> ر.س من شراء علاقات جديدة
                </span>
              </div>
            </motion.div>
          )}
          {step === 1 && (
            <motion.div key="r" initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30 }}>
              <div className="px-1 font-display text-xl font-semibold">وش المكافأة؟</div>
              <div className="mt-1 px-1 text-sm text-mute">التالفة لها نقاط تلقائي من دخل الخردة</div>
              <div className="mt-5 grid grid-cols-2 gap-2.5">
                {TEMPLATES.map((t, i) => (
                  <button key={i} onClick={() => setTpl(i)} className={cx('rounded-2xl p-4 text-start ring-1 transition', tpl === i ? 'bg-copper-50 ring-2 ring-copper' : 'bg-paper ring-ink/5')}>
                    <Icon name={t.kind === 'discount' ? 'ticket' : t.kind === 'wash' ? 'bag' : 'spark'} size={20} className="text-copper" />
                    <div className="mt-2 text-sm font-semibold">{rewardTitle(t)}</div>
                    <div className="mt-0.5 text-xs text-mute">{rewardRule(t)}</div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
          {step === 2 && (
            <motion.div key="p" initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30 }}>
              <div className="px-1 font-display text-xl font-semibold">جاهز للنشر</div>
              <div className="mt-5 rounded-[24px] bg-paper p-5 shadow-card">
                <div className="text-xs text-mute">بيظهر للحي كذا</div>
                <div className="mt-2 font-display text-lg font-semibold">{l.name}</div>
                <div className="text-sm text-mute">تحتاج {hangers(qty)}</div>
                <div className="mt-3 rounded-xl bg-copper-50 px-3 py-2 text-sm font-semibold text-copper-700">
                  {rewardTitle(reward)} · <span className="font-normal">{rewardRule(reward)}</span>
                </div>
                <div className="mt-4 space-y-2 text-xs text-mute">
                  <div className="flex items-center gap-2">
                    <Icon name="check" size={14} className="text-loop" /> بدون مدة، يقفل تلقائي إذا وصل العدد
                  </div>
                  <div className="flex items-center gap-2">
                    <Icon name="check" size={14} className="text-loop" /> القبول تلقائي في حدود اللي باقي
                  </div>
                  {existing && (
                    <div className="flex items-center gap-2 text-copper-700">
                      <Icon name="alert" size={14} /> بيقفل طلبك الحالي ({num(existing.collected)} من {num(existing.target)})
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {published && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#F3F1EC]">
              <motion.div initial={{ scale: 0.4 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 14 }} className="grid h-20 w-20 place-items-center rounded-full bg-loop text-white">
                <Icon name="check" size={40} strokeWidth={2.6} />
              </motion.div>
              <div className="mt-4 font-display text-xl font-semibold">انتشر طلبك</div>
              <div className="mt-1 text-sm text-mute">وصل لكل اللي حولك</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div className="sticky bottom-0 flex gap-2 px-4 pb-6 pt-4">
        {step > 0 && (
          <Button variant="soft" className="w-24" onClick={() => setStep((s) => s - 1)}>
            رجوع
          </Button>
        )}
        <Button className="flex-1" onClick={() => (step < 2 ? setStep((s) => s + 1) : publish())} disabled={published}>
          {step < 2 ? 'التالي' : 'انشر الطلب'}
        </Button>
      </div>
    </div>
  )
}
