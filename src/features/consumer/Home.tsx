import { motion } from 'motion/react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { appConfig } from '@/config/app'
import { acceptsDamagedNow, impactTotals, nearbyRequestCount, requestViews, type RequestView } from '@/domain/services'
import { greeting, hangers, num, rewardRule, rewardTitle } from '@/lib/format'
import { useStore } from '@/store/store'
import { Icon } from '@/ui/Icon'
import { Button, Card, cx, LaundryBadge, Odometer, Sheet, WireProgress } from '@/ui/kit'
import { useHome, useMe } from './hooks'

export function Home() {
  const db = useStore((s) => s.db)
  const hide = useStore((s) => s.hideNearby)
  const now = useStore((s) => s.now)()
  const home = useHome()
  const nav = useNavigate()
  const [pick, setPick] = useState(false)
  const views = useMemo(() => (hide ? [] : requestViews(db, home, appConfig.nearbyRadiusKm)), [db, home, hide])
  const hood = useMemo(() => impactTotals(db).leaderboard.find((l) => l.n.id === home.id)?.count ?? 0, [db, home])

  return (
    <div className="pb-10">
      <header className="px-5 pb-1" style={{ paddingTop: 'calc(var(--status, 0px) + 28px)' }}>
        <div className="text-sm text-mute">{greeting(now)}</div>
        <button onClick={() => setPick(true)} className="-ms-1 mt-0.5 flex items-center gap-1 rounded-xl px-1 py-0.5 font-display text-[22px] font-semibold hover:bg-ink/5" aria-label="غيّر الحي">
          <Icon name="pin" size={19} className="text-loop" />
          {home.name}
          <Icon name="chevron" size={18} className="-rotate-90 text-mute" />
        </button>
        {hood > 0 && (
          <div className="mt-1 text-[13px] text-mute">
            جيرانك رجّعوا <Odometer value={hood} className="font-semibold text-loop-700" /> علاقة لين الحين
          </div>
        )}
      </header>

      <div className="px-4">
        <div className="mb-3 mt-6 px-1">
          <h1 className="font-display text-[19px] font-semibold">مغاسل قريبة تحتاج علاقات</h1>
        </div>

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
      <HoodSheet open={pick} onClose={() => setPick(false)} />
    </div>
  )
}

export function RequestCard({ v, i = 0, onClick }: { v: RequestView; i?: number; onClick?: () => void }) {
  const { request: r, laundry: l } = v
  const damagedOk = acceptsDamagedNow(l)
  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i }}>
      <Card onClick={onClick} className="p-4">
        <div className="flex items-center gap-3">
          <LaundryBadge name={l.name} hue={l.hue} size={46} />
          <div className="min-w-0 flex-1">
            <div className="truncate font-display text-[17px] font-semibold">{l.name}</div>
            <div className="mt-0.5 text-[13px] text-mute">
              تحتاج <span className="num font-semibold text-ink">{hangers(v.remaining)}</span>
            </div>
          </div>
          <div className="num shrink-0 self-start rounded-full bg-ink/[0.05] px-2.5 py-1 text-xs font-semibold text-mute">{v.distance.toFixed(1)} كم</div>
        </div>
        <WireProgress className="mt-3.5" value={r.collected} reserved={v.reserved} max={r.target} height={6} />
        <div className="mt-3.5 flex items-center gap-2.5">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-copper-50 text-copper">
            <Icon name="gift" size={17} />
          </span>
          <div className="min-w-0 flex-1 leading-5">
            <div className="truncate text-[14px] font-semibold text-copper-700">{rewardTitle(r.reward)}</div>
            <div className="truncate text-xs text-mute">
              {rewardRule(r.reward)}
              {!damagedOk && <span className="text-steel-700"> · الصالحة فقط</span>}
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}

export function HoodSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const db = useStore((s) => s.db)
  const set = useStore((s) => s.setNeighborhood)
  const home = useHome()
  return (
    <Sheet open={open} onClose={onClose}>
      <h3 className="font-display text-xl font-semibold">وين ساكن؟</h3>
      <p className="mt-1 text-sm text-mute">نوريك المغاسل القريبة من حيّك.</p>
      <div className="mt-4 divide-y divide-ink/5">
        {db.neighborhoods.map((n) => {
          const count = nearbyRequestCount(db, n.id, appConfig.nearbyRadiusKm)
          const on = n.id === home.id
          return (
            <button
              key={n.id}
              onClick={() => {
                set(n.id)
                onClose()
              }}
              className="flex w-full items-center gap-3 py-3.5 text-start"
            >
              <Icon name="pin" size={18} className={on ? 'text-loop' : 'text-faint'} />
              <span className="flex-1 font-semibold">{n.name}</span>
              <span className="text-xs text-mute">{count ? `${num(count)} قريبة` : 'ما فيه طلبات'}</span>
              <span className={cx('grid h-6 w-6 place-items-center rounded-full', on ? 'bg-loop text-white' : 'ring-2 ring-ink/10')}>{on && <Icon name="check" size={14} strokeWidth={3} />}</span>
            </button>
          )
        })}
      </div>
    </Sheet>
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
