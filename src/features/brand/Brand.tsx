import { motion } from 'motion/react'
import { useState } from 'react'
import { Carton } from '@/ui/Carton'
import { Icon, type IconName } from '@/ui/Icon'
import { Button, Odometer, Pill, QR, WireProgress } from '@/ui/kit'
import { LogoMark } from '@/ui/Logo'

const COLORS = [
  { name: 'حلقة', en: 'Loop Green', hex: '#0FA36B', role: 'الصالحة، الكرتون الأخضر، المغسلة', text: '#fff' },
  { name: 'فولاذ', en: 'Steel', hex: '#7D8A96', role: 'للتدوير، الكرتون الرمادي، المصنع', text: '#fff', sheen: true },
  { name: 'نحاس', en: 'Copper', hex: '#D9822B', role: 'المكافآت والنقاط والكوبونات', text: '#fff' },
  { name: 'صدأ', en: 'Rust', hex: '#C2502A', role: 'العيوب والتنبيهات فقط', text: '#fff' },
  { name: 'حبر', en: 'Ink', hex: '#0F1714', role: 'الأسطح الداكنة والفاحص', text: '#fff' },
  { name: 'رمل', en: 'Sand', hex: '#F6F2EA', role: 'الأسطح الفاتحة', text: '#0F1714' },
]

const PRINCIPLES: { icon: IconName; t: string; d: string }[] = [
  { icon: 'route', t: 'خط واحد ما ينقطع', d: 'العلاقة سلك واحد. الشعار، الأشرطة، والتحميل كلها نفس الخط.' },
  { icon: 'layers', t: 'اللون له معنى', d: 'الأخضر دايم للمغسلة، والفولاذ دايم للمصنع، والنحاس للمكافأة.' },
  { icon: 'scan', t: 'دقّة أداة قياس', d: 'الفاحص يحس إنه جهاز فحص صناعي: أرقام ثابتة وعلامات دقيقة.' },
  { icon: 'gift', t: 'دفء الحي', d: 'كلام قصير وودود، ولحظات احتفال صغيرة بعد كل إرجاع.' },
]

export function Brand() {
  const [n, setN] = useState(1284)
  const [k, setK] = useState(0)
  return (
    <div className="min-h-full bg-sand">
      <section className="relative overflow-hidden bg-ink px-8 pb-20 pt-16 text-white lg:px-16">
        <div className="pointer-events-none absolute -left-24 top-0 opacity-[0.07]">
          <LogoMark size={720} color="#0FA36B" strokeWidth={1.2} />
        </div>
        <div className="relative mx-auto max-w-6xl">
          <Pill tone="loop" className="bg-loop/20 text-loop-100">
            الهوية البصرية · لوحة المزاج
          </Pill>
          <div className="mt-10 flex flex-wrap items-center gap-10">
            <motion.div key={k} onClick={() => setK((x) => x + 1)} className="cursor-pointer">
              <LogoMark size={220} color="#0FA36B" draw strokeWidth={2.6} />
            </motion.div>
            <div>
              <div className="font-display text-[96px] font-semibold leading-none">مَعاد</div>
              <div className="mt-3 max-w-md text-lg leading-8 text-white/65">الحلقة المغلقة. علاقة الملابس سلك واحد ما ينقطع، وكل شي في مَعاد مرسوم بنفس الخط: يبدأ من البيت، ويرجع للمغسلة، أو يصير حديد من جديد.</div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-8 py-14 lg:px-16">
        <h2 className="font-display text-2xl font-semibold">الألوان، كل لون له وظيفة</h2>
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3">
          {COLORS.map((c, i) => (
            <motion.div key={c.hex} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }} className="overflow-hidden rounded-[24px] bg-paper shadow-card">
              <div className={c.sheen ? 'steel-sheen h-32' : 'h-32'} style={c.sheen ? undefined : { background: c.hex }}>
                <div className="flex h-full items-end justify-between p-4" style={{ color: c.text }}>
                  <span className="font-display text-xl font-semibold">{c.name}</span>
                  <span className="num text-xs opacity-80" dir="ltr">
                    {c.hex}
                  </span>
                </div>
              </div>
              <div className="p-4 text-sm text-mute">
                <div className="text-xs font-semibold text-ink/60" dir="ltr" style={{ textAlign: 'right' }}>
                  {c.en}
                </div>
                {c.role}
              </div>
            </motion.div>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-3 gap-4">
          {(['bronze', 'silver', 'gold'] as const).map((t) => (
            <div
              key={t}
              className="h-20 rounded-2xl p-4 font-display font-semibold text-white"
              style={{
                background: {
                  bronze: 'linear-gradient(135deg, #8A5A34, #C98F5E 40%, #7A4B28 70%, #B07A4C)',
                  silver: 'linear-gradient(135deg, #6F7A84, #D3DAE0 38%, #808B95 64%, #B8C1C9)',
                  gold: 'linear-gradient(135deg, #8C6A1C, #E8C766 40%, #9B7724 68%, #D6B04E)',
                }[t],
              }}
            >
              {{ bronze: 'برونزي', silver: 'فضي', gold: 'ذهبي' }[t]}
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-8 pb-14 lg:px-16">
        <h2 className="font-display text-2xl font-semibold">الخطوط</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-[24px] bg-paper p-8 shadow-card">
            <div className="text-xs font-semibold text-mute" dir="ltr" style={{ textAlign: 'right' }}>
              Readex Pro · Display & Numbers
            </div>
            <div className="mt-4 font-display text-5xl font-semibold">رجّع علاقاتك</div>
            <button onClick={() => setN((x) => x + 37)} className="mt-6 block">
              <Odometer value={n} className="text-7xl font-semibold text-loop" />
            </button>
            <div className="mt-2 text-xs text-mute">اضغط الرقم: العدّادات تدور مثل العدّاد الميكانيكي، بأرقام ثابتة العرض</div>
          </div>
          <div className="rounded-[24px] bg-paper p-8 shadow-card">
            <div className="text-xs font-semibold text-mute" dir="ltr" style={{ textAlign: 'right' }}>
              IBM Plex Sans Arabic · Interface
            </div>
            <div className="mt-4 text-2xl font-semibold">وجّه الكاميرا على العلاقات</div>
            <p className="mt-3 text-base leading-8 text-mute">نقيّم كل علاقة من 100 على خمسة معايير: استقامة الإطار، سلامة الخطّاف، الصدأ، تقشّر الطلاء، والكسور. فوق 80 ترجع للمغسلة، وتحتها تروح لمصنع الحديد.</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Pill tone="loop">صالحة</Pill>
              <Pill tone="steel">للتدوير</Pill>
              <Pill tone="copper">كوي 3 قطع مجانًا</Pill>
              <Pill tone="rust">صدأ</Pill>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-8 pb-14 lg:px-16">
        <h2 className="font-display text-2xl font-semibold">مكوّنات بنفس الروح</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-[24px] bg-paper p-6 shadow-card">
            <div className="text-sm font-semibold">شريط السلك</div>
            <WireProgress className="mt-5" value={140} reserved={12} max={200} height={10} />
            <div className="mt-2 text-xs text-mute">140 وصلت · 12 محجوزة بالطريق</div>
            <div className="mt-6 flex gap-2">
              <Button size="md">عندي علاقات</Button>
              <Button size="md" variant="soft">
                لاحقًا
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-center gap-2 rounded-[24px] bg-paper p-6 shadow-card">
            <Carton tone="green" count={14} size={120} />
            <Carton tone="grey" count={6} size={120} delay={0.1} />
          </div>
          <div className="flex flex-col items-center justify-center rounded-[24px] bg-ink p-6 text-white shadow-card">
            <div className="rounded-2xl bg-white p-3">
              <QR value="MAAD:U:demo" size={120} accent="#0FA36B" />
            </div>
            <div className="mt-3 text-xs text-white/60">رمز واحد لكل شي</div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-8 pb-20 lg:px-16">
        <h2 className="font-display text-2xl font-semibold">المبادئ</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-4">
          {PRINCIPLES.map((p) => (
            <div key={p.t} className="rounded-[24px] bg-paper p-6 shadow-card">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-loop-50 text-loop-700">
                <Icon name={p.icon} size={22} />
              </div>
              <div className="mt-4 font-semibold">{p.t}</div>
              <div className="mt-1 text-sm leading-6 text-mute">{p.d}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
