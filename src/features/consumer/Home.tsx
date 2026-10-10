import { motion } from 'motion/react'
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { appConfig } from '@/config/app'
import { acceptsDamagedNow, impactTotals, requestViews, type RequestView } from '@/domain/services'
import { num, rewardRule, rewardTitle } from '@/lib/format'
import { useStore } from '@/store/store'
import { Icon } from '@/ui/Icon'
import { Button, Card, LaundryBadge, Odometer, Pill, SectionTitle, WireProgress } from '@/ui/kit'
import { LogoMark } from '@/ui/Logo'
import { useHome, useMe } from './hooks'

export function Home() {
  const db = useStore((s) => s.db)
  const hide = useStore((s) => s.hideNearby)
  const me = useMe()
  const home = useHome()
  const nav = useNavigate()
  const views = useMemo(() => (hide ? [] : requestViews(db, home, appConfig.nearbyRadiusKm)), [db, home, hide])
  const hood = useMemo(() => impactTotals(db).leaderboard.find((l) => l.n.id === home.id)?.count ?? 0, [db, home])

  return (
    <div className="pb-10">
      <header className="px-5 pb-2" style={{ paddingTop: 'calc(var(--status, 0px) + 28px)' }}>
        <div className="text-sm text-mute">{me?.name ? `هلا ${me.name}` : 'هلا والله'}</div>
        <div className="mt-0.5 flex items-center gap-1 font-display text-lg font-semibold">
          <Icon name="pin" size={17} className="text-loop" />
          {home.name}، بريدة
        </div>
      </header>

      <div className="px-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative mt-3 overflow-hidden rounded-[30px] bg-ink p-6 text-white"
        >
          <div className="absolute -bottom-6 -left-12 opacity-[0.18]">
            <LogoMark size={210} color="#0FA36B" draw strokeWidth={2} />
          </div>
          <div className="relative">
            <Pill tone="loop" className="bg-loop/20 text-loop-100">
              يشتغل بالكاميرا
            </Pill>
            <h1 className="mt-3 font-display text-[26px] font-semibold leading-[1.25]">
              علاقات الملابس
              <br />
              مكدّسة عندك؟
            </h1>
            <p className="mt-2 max-w-[16rem] text-sm leading-6 text-white/65">وجّه الكاميرا عليها، ونقول لك وش يرجع للمغسلة ووش يصير حديد من جديد.</p>
            <div className="mt-5 flex items-center gap-2 text-[13px] font-semibold text-white/80">
              {(
                [
                  ['scan', 'افحص'],
                  ['box', 'افرز'],
                  ['gift', 'سلّم واكسب'],
                ] as const
              ).map(([icon, label], i) => (
                <span key={label} className="flex items-center gap-2">
                  {i > 0 && <span className="h-px w-4 bg-white/20" />}
                  <Icon name={icon} size={16} className="text-loop" />
                  {label}
                </span>
              ))}
            </div>
          </div>
        </motion.div>

        <div className="mt-3 flex items-center gap-3 rounded-2xl bg-loop-50 px-4 py-3 text-sm text-loop-900">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-loop text-white">
            <Icon name="spark" size={16} />
          </span>
          <span>
            حي {home.name} رجّع <Odometer value={hood} className="font-bold" /> علاقة لين الحين
          </span>
        </div>

        <SectionTitle action={<span className="text-xs text-mute">{views.length ? `${views.length} مغاسل` : ''}</span>}>مغاسل قريبة تحتاج علاقات</SectionTitle>

        {views.length ? (
          <div className="flex flex-col gap-3">
            {views.map((v, i) => (
              <RequestCard key={v.request.id} v={v} i={i} onClick={() => nav(`/c/request/${v.request.id}`)} />
            ))}
          </div>
        ) : (
          <NotifyCard />
        )}
      </div>
    </div>
  )
}

export function RequestCard({ v, i = 0, onClick }: { v: RequestView; i?: number; onClick?: () => void }) {
  const { request: r, laundry: l } = v
  const damagedOk = acceptsDamagedNow(l)
  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i }}>
      <Card onClick={onClick} className="p-4">
        <div className="flex items-start gap-3">
          <LaundryBadge name={l.name} hue={l.hue} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <div className="truncate font-display text-[16px] font-semibold">{l.name}</div>
              <div className="num shrink-0 text-xs text-mute">{v.distance.toFixed(1)} كم</div>
            </div>
            <div className="mt-0.5 text-xs text-mute">
              تحتاج <span className="num font-semibold text-ink">{num(v.remaining)}</span> {v.remaining <= 10 && v.remaining >= 3 ? 'علاقات' : 'علاقة'}
            </div>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2 rounded-2xl bg-copper-50 px-3 py-2.5">
          <Icon name="gift" size={18} className="shrink-0 text-copper" />
          <div className="min-w-0 flex-1 text-[13px]">
            <span className="font-semibold text-copper-700">{rewardTitle(r.reward)}</span>
            <span className="text-copper-700/70"> · {rewardRule(r.reward)}</span>
          </div>
        </div>
        <div className="mt-3.5">
          <WireProgress value={r.collected} reserved={v.reserved} max={r.target} />
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="text-mute">
              <span className="num font-semibold text-ink">{num(r.collected)}</span> وصلت
              {v.reserved > 0 && (
                <>
                  {' '}
                  · <span className="num">{num(v.reserved)}</span> بالطريق
                </>
              )}{' '}
              · من <span className="num">{num(r.target)}</span>
            </span>
            {!damagedOk && (
              <Pill tone="steel" className="h-5 text-[11px]">
                تستقبل الصالحة فقط
              </Pill>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  )
}

function NotifyCard() {
  const me = useMe()
  const setNotify = useStore((s) => s.setNotify)
  const on = me?.notifyNearby
  return (
    <Card className="p-6 text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-sand-2 text-mute">
        <Icon name="bell" size={26} />
      </div>
      <div className="mt-3 font-display text-lg font-semibold">ما فيه طلبات قريبة الحين</div>
      <p className="mx-auto mt-1 max-w-[16rem] text-sm leading-6 text-mute">أول ما تحتاج مغسلة قريبة منك علاقات، نرسل لك تنبيه.</p>
      <Button className="mt-4 w-full" variant={on ? 'soft' : 'primary'} icon={on ? 'check' : 'bell'} onClick={() => setNotify(!on)}>
        {on ? 'بننبهك أول ما يصير طلب' : 'نبّهني إذا مغسلة قريبة احتاجت'}
      </Button>
      <div className="mt-3 text-xs text-mute">تقدر تفحص علاقاتك الحين وتحفظ النتيجة لين يجي طلب</div>
    </Card>
  )
}

