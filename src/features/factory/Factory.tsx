import { AnimatePresence, motion } from 'motion/react'
import { useMemo, useState } from 'react'
import { Navigate, NavLink, Outlet, useNavigate, useParams } from 'react-router-dom'
import { economics, kgFromHangers } from '@/config/economics'
import { DEMO_FACTORY_ID } from '@/data/seed'
import { activeRound, byId, lastRound, neighborhoodOf, proposeRound, readyByArea, readyListings, routeKm } from '@/domain/services'
import type { Db, Factory } from '@/domain/types'
import { ago, AREA_LABEL, kg, num, sar } from '@/lib/format'
import { useStore } from '@/store/store'
import { CityMap } from '@/ui/CityMap'
import { Icon, type IconName } from '@/ui/Icon'
import { Button, Card, cx, LaundryBadge, TopBar } from '@/ui/kit'
import { Group, Profile, Row, SwitchAccount } from '@/ui/SwitchAccount'
import { haptic, useTicker } from '../consumer/hooks'
import { useScrollReset } from '@/ui/useScrollReset'

const TABS: { to: string; label: string; icon: IconName; end?: boolean }[] = [
  { to: '/f', label: 'الصناديق', icon: 'box', end: true },
  { to: '/f/round', label: 'الجولة', icon: 'truck' },
  { to: '/f/certs', label: 'الشهادات', icon: 'cert' },
  { to: '/f/settings', label: 'الإعدادات', icon: 'settings' },
]

export const useFactory = () => byId(useStore((s) => s.db).factories, DEMO_FACTORY_ID)!

export function FactoryLayout() {
  const scrollRef = useScrollReset()
  const db = useStore((s) => s.db)
  const live = !!activeRound(db, DEMO_FACTORY_ID)
  return (
    <div className="flex h-full flex-col bg-steel-50">
      <div ref={scrollRef} id="f-scroll" className="relative min-h-0 flex-1 overflow-y-auto overflow-x-hidden no-scrollbar">
        <Outlet />
      </div>
      <nav className="shrink-0 border-t border-ink/5 bg-paper px-2 pb-[max(env(safe-area-inset-bottom),10px)] pt-2">
        <div className="flex justify-around">
          {TABS.map((t) => (
            <NavLink key={t.to} to={t.to} end={t.end} className={({ isActive }) => cx('relative flex w-16 flex-col items-center gap-1 py-1 text-[11px] font-semibold', isActive ? 'text-ink' : 'text-faint')}>
              <Icon name={t.icon} size={22} />
              {t.label}
              {t.to === '/f/round' && live && <span className="absolute right-4 top-0.5 h-2.5 w-2.5 rounded-full bg-loop ring-2 ring-paper" />}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}

function useStartRound() {
  const db = useStore((s) => s.db)
  const approve = useStore((s) => s.approveRound)
  const nav = useNavigate()
  const f = useFactory()
  const proposal = useMemo(() => proposeRound(db, f.id), [db, f.id])
  const start = () => {
    const id = approve(f.id, proposal)
    haptic(12)
    nav(`/f/round/${id}`)
  }
  return { proposal, start }
}

export function FactoryBoxes() {
  const db = useStore((s) => s.db)
  const f = useFactory()
  const nav = useNavigate()
  const now = useTicker(30000)
  const ready = readyListings(db)
  const groups = useMemo(() => readyByArea(db), [db])
  const active = activeRound(db, f.id)
  const { proposal, start } = useStartRound()
  const picked = proposal.map((id) => byId(db.listings, id)!)
  const pickedKg = kgFromHangers(picked.reduce((a, l) => a + l.count, 0))

  return (
    <div className="flex min-h-full flex-col">
      <header className="px-5 pb-4 pt-safe">
        <div className="text-sm text-mute">{f.name}</div>
        <h1 className="font-display text-[24px] font-semibold">{ready.length ? `${ready.length === 1 ? 'صندوق واحد جاهز' : ready.length === 2 ? 'صندوقين جاهزين' : `${num(ready.length)} صناديق جاهزة`} للاستلام` : 'ما فيه صناديق جاهزة'}</h1>
        <div className="mt-0.5 text-sm text-mute">
          سعرك <span className="num font-semibold text-copper-700">{sar(f.pricePerKgSar)}</span> ر.س للكيلو
        </div>
      </header>

      <div className="px-4">
        <div className="relative aspect-[10/7] overflow-hidden rounded-[24px] ring-1 ring-ink/5">
          <BoxMap db={db} f={f} highlight={proposal} />
          <div className="absolute left-2.5 top-2.5 flex gap-1.5 text-[11px] font-semibold">
            <span className="flex items-center gap-1 rounded-full bg-paper/90 px-2 py-1">
              <span className="h-2.5 w-2.5 rounded-full bg-steel-700" />
              جاهز
            </span>
            <span className="flex items-center gap-1 rounded-full bg-paper/90 px-2 py-1">
              <span className="h-2.5 w-2.5 rounded-full border-2 border-steel-300" />
              يتعبّى
            </span>
          </div>
        </div>

        {active && (
          <Card className="mt-3 flex items-center gap-3 bg-ink p-4 text-white" onClick={() => nav(`/f/round/${active.id}`)}>
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-loop">
              <Icon name="truck" size={22} />
            </span>
            <div className="flex-1">
              <div className="font-semibold">جولتك شغّالة</div>
              <div className="text-xs text-white/60">
                خلصت <span className="num">{active.stops.filter((s) => s.collectedAt).length}</span> من <span className="num">{active.stops.length}</span> محطات
              </div>
            </div>
            <Icon name="chevron" size={20} />
          </Card>
        )}

        {groups.map((g) => (
          <section key={g.area} className="mt-5">
            <h2 className="mb-2 px-2 text-[13px] font-semibold text-mute">{AREA_LABEL[g.area as keyof typeof AREA_LABEL]}</h2>
            <div className="divide-y divide-ink/[0.06] overflow-hidden rounded-[20px] bg-paper ring-1 ring-ink/5">
              {g.items.map(({ listing, laundry }) => {
                const kgs = kgFromHangers(listing.count)
                const later = !proposal.includes(listing.id)
                return (
                  <div key={listing.id} className="flex items-center gap-3 px-4 py-3.5">
                    <LaundryBadge name={laundry.name} hue={laundry.hue} size={40} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[15px] font-semibold">{laundry.name}</div>
                      <div className="text-xs text-mute">
                        {neighborhoodOf(db, laundry.neighborhoodId).name} · {later && !active ? 'للجولة الجاية' : `امتلى ${ago(listing.createdAt, now)}`}
                      </div>
                    </div>
                    <div className="shrink-0 text-end">
                      <div className="num text-[15px] font-semibold">{kg(kgs)} كجم</div>
                      <div className="num text-xs font-semibold text-copper-700">≈ {sar(kgs * f.pricePerKgSar)} ر.س</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        ))}

        {!ready.length && !active && (
          <div className="mt-5 rounded-[20px] bg-paper p-6 text-center ring-1 ring-ink/5">
            <div className="font-semibold">كل الصناديق تتعبّى الحين</div>
            <div className="mt-1 text-sm text-mute">أول ما يمتلي صندوق يظهر هنا، ونرتّب لك الجولة.</div>
          </div>
        )}
        <div className="h-6" />
      </div>

      {ready.length > 0 && !active && (
        <div className="sticky bottom-0 z-20 mt-auto bg-gradient-to-t from-steel-50 via-steel-50 to-transparent px-4 pb-4 pt-8">
          <Button className="w-full" icon="route" onClick={start}>
            جهّز جولة الاستلام
          </Button>
          <div className="mt-2 text-center text-xs text-mute">
            {picked.length === 1 ? 'صندوق واحد' : picked.length === 2 ? 'صندوقين' : `${num(picked.length)} صناديق`} متقاربة · <span className="num">{kg(pickedKg)}</span> كجم ·{' '}
            <span className="num font-semibold text-copper-700">≈ {sar(pickedKg * f.pricePerKgSar)} ر.س</span>
          </div>
        </div>
      )}
    </div>
  )
}

function BoxMap({ db, f, highlight }: { db: Db; f: Factory; highlight: string[] }) {
  const ready = readyListings(db)
  const route = highlight.map((id) => byId(db.laundries, byId(db.listings, id)!.laundryId)!)
  return (
    <CityMap neighborhoods={db.neighborhoods} className="absolute inset-0 h-full w-full">
      {route.length > 0 && <RouteLine points={[f, ...route]} faint />}
      {db.laundries.map((l) => {
        const listing = ready.find((x) => x.laundryId === l.id)
        const ratio = Math.min(1, l.boxCount / economics.boxCapacityHangers)
        if (listing)
          return (
            <g key={l.id}>
              <circle cx={l.x} cy={l.y} r="44" fill="#4E5A65" opacity="0.18" style={{ transformOrigin: `${l.x}px ${l.y}px`, animation: 'pulse-ring 2.2s ease-out infinite' }} />
              <circle cx={l.x} cy={l.y} r="34" fill="#4E5A65" stroke="#fff" strokeWidth="4" />
              <text x={l.x} y={l.y + 9} textAnchor="middle" fontSize="26" fontWeight="700" fill="#fff" style={{ fontFamily: 'var(--font-display)' }}>
                {Math.round(kgFromHangers(listing.count))}
              </text>
            </g>
          )
        if (!l.acceptsDamaged) return null
        return (
          <g key={l.id}>
            <circle cx={l.x} cy={l.y} r="17" fill="#fff" stroke="#DDE3E8" strokeWidth="4" />
            <circle cx={l.x} cy={l.y} r="9" fill="none" stroke="#9AA6B1" strokeWidth="6" strokeDasharray={`${ratio * 56.5} 70`} transform={`rotate(-90 ${l.x} ${l.y})`} />
          </g>
        )
      })}
      <FactoryPin f={f} />
    </CityMap>
  )
}

function FactoryPin({ f }: { f: { x: number; y: number } }) {
  return (
    <g>
      <rect x={f.x - 30} y={f.y - 30} width="60" height="60" rx="16" fill="#0F1714" />
      <path d={`M${f.x - 15} ${f.y + 13}v-15l9.5 5.5v-5.5l9.5 5.5v-12.5h5.5v22z`} fill="#fff" />
    </g>
  )
}

function RouteLine({ points, faint }: { points: { x: number; y: number }[]; faint?: boolean }) {
  const d = points.map((p, i) => `${i ? 'L' : 'M'}${p.x} ${p.y}`).join(' ')
  return (
    <>
      <path d={d} stroke="#0F1714" strokeOpacity={faint ? 0.08 : 0.14} strokeWidth="12" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <motion.path d={d} stroke="#0F1714" strokeOpacity={faint ? 0.45 : 1} strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="10 10" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1 }} style={{ animation: 'wire-flow 1s linear infinite' }} />
    </>
  )
}

export function RoundTab() {
  const db = useStore((s) => s.db)
  const f = useFactory()
  const nav = useNavigate()
  const active = activeRound(db, f.id)
  const last = lastRound(db, f.id)
  const ready = readyListings(db).length
  const { start } = useStartRound()
  if (active) return <Navigate to={`/f/round/${active.id}`} replace />
  return (
    <div className="flex min-h-full flex-col px-5 pb-8 pt-safe">
      <h1 className="font-display text-[24px] font-semibold">الجولة</h1>
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <div className="grid h-20 w-20 place-items-center rounded-[28px] bg-paper text-steel-700 shadow-card">
          <Icon name="truck" size={36} />
        </div>
        <div className="mt-5 font-display text-xl font-semibold">ما عندك جولة الحين</div>
        <p className="mt-1.5 max-w-[17rem] text-sm leading-6 text-mute">{ready ? 'نجمع لك الصناديق الجاهزة المتقاربة في جولة وحدة، بالترتيب الأقصر.' : 'أول ما يمتلي صندوق، تقدر تجهّز جولة بضغطة.'}</p>
        {ready > 0 && (
          <Button className="mt-6 w-full" icon="route" onClick={start}>
            جهّز جولة الاستلام
          </Button>
        )}
        {last?.certificateId && (
          <button onClick={() => nav(`/f/cert/${last.certificateId}`)} className="mt-4 flex items-center gap-1.5 text-sm font-semibold text-mute">
            <Icon name="cert" size={16} />
            شهادة آخر جولة
          </button>
        )}
      </div>
    </div>
  )
}

export function RoundView() {
  const { id = '' } = useParams()
  const db = useStore((s) => s.db)
  const collect = useStore((s) => s.collectStop)
  const f = useFactory()
  const nav = useNavigate()
  const round = byId(db.rounds, id)
  const [weights, setWeights] = useState<Record<string, number>>({})
  if (!round) return <Navigate to="/f/round" replace />
  const laundries = round.stops.map((s) => byId(db.laundries, s.laundryId)!)
  const dist = routeKm([f, ...laundries])
  const doneCount = round.stops.filter((s) => s.collectedAt).length
  const current = round.stops.findIndex((s) => !s.collectedAt)
  const cert = round.certificateId
  const paid = round.stops.reduce((a, s) => a + (s.payoutSar ?? 0), 0)

  return (
    <div className="min-h-full pb-10">
      <TopBar back="/f" title="جولة الاستلام" sub={`${round.stops.length === 2 ? 'محطتين' : `${round.stops.length} محطات`} · ${dist.toFixed(1)} كم`} />
      <div className="relative mx-4 aspect-[10/7] overflow-hidden rounded-[24px] ring-1 ring-ink/5">
        <CityMap neighborhoods={db.neighborhoods} className="h-full w-full">
          <RouteLine points={[f, ...laundries]} />
          {round.stops.map((s, i) => {
            const l = laundries[i]
            const done = !!s.collectedAt
            const now = i === current
            return (
              <g key={s.listingId}>
                {now && <circle cx={l.x} cy={l.y} r="44" fill="#0FA36B" opacity="0.25" style={{ transformOrigin: `${l.x}px ${l.y}px`, animation: 'pulse-ring 1.8s ease-out infinite' }} />}
                <circle cx={l.x} cy={l.y} r="32" fill={done || now ? '#0FA36B' : '#0F1714'} stroke="#fff" strokeWidth="4" />
                <text x={l.x} y={l.y + 10} textAnchor="middle" fontSize="28" fontWeight="700" fill="#fff" style={{ fontFamily: 'var(--font-display)' }}>
                  {done ? '✓' : i + 1}
                </text>
              </g>
            )
          })}
          <FactoryPin f={f} />
        </CityMap>
      </div>

      <div className="mt-5 px-5">
        <div className="font-display text-xl font-semibold">{cert ? 'اكتملت الجولة' : `المحطة ${num(current + 1)} من ${num(round.stops.length)}`}</div>
        <div className="mt-0.5 text-sm text-mute">{cert ? 'كل مغسلة انصرف لها مستحقها حسب الوزن الفعلي.' : 'أكّد الوزن الفعلي عند كل مغسلة، وينصرف لها مبلغها مباشرة.'}</div>
      </div>

      <div className="relative mt-4 px-4">
        <div className="absolute bottom-8 start-[38px] top-8 w-0.5 bg-ink/10" />
        <div className="space-y-2.5">
          {round.stops.map((s, i) => {
            const l = laundries[i]
            const est = Math.round(kgFromHangers(s.count) * 10) / 10
            const w = weights[s.listingId] ?? est
            const done = !!s.collectedAt
            const isNow = i === current
            const setW = (v: number) => setWeights((x) => ({ ...x, [s.listingId]: Math.max(0, Math.round(v * 10) / 10) }))
            return (
              <motion.div key={s.listingId} layout className={cx('relative rounded-[20px] ring-1', isNow ? 'bg-paper p-4 shadow-card ring-loop/40' : 'bg-paper/70 px-4 py-3 ring-ink/5')}>
                <div className="flex items-center gap-3">
                  <div className={cx('num relative z-10 grid h-9 w-9 shrink-0 place-items-center rounded-full font-bold text-white', done || isNow ? 'bg-loop' : 'bg-ink/80')}>{done ? <Icon name="check" size={18} strokeWidth={3} /> : i + 1}</div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold">{l.name}</div>
                    <div className="text-xs text-mute">
                      {neighborhoodOf(db, l.neighborhoodId).name} · {done ? <span className="num">{kg(s.actualKg!)} كجم</span> : <span className="num">≈ {kg(est)} كجم</span>}
                    </div>
                  </div>
                  {done && <span className="num shrink-0 text-sm font-semibold text-copper-700">+{sar(s.payoutSar!)} ر.س</span>}
                </div>
                <AnimatePresence initial={false}>
                  {isNow && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="overflow-hidden">
                      <div className="pt-4 text-xs font-semibold text-mute">الوزن على الميزان</div>
                      <div className="mt-2 flex items-center rounded-2xl bg-sand ring-1 ring-ink/10">
                        <button className="grid h-14 w-14 place-items-center" onClick={() => setW(w - 0.1)} aria-label="أنقص">
                          <Icon name="minus" size={20} />
                        </button>
                        <input
                          aria-label="الوزن بالكيلو"
                          dir="ltr"
                          inputMode="decimal"
                          className="num w-full bg-transparent text-center text-2xl font-semibold outline-none"
                          value={w}
                          onChange={(e) => setWeights((x) => ({ ...x, [s.listingId]: Number(e.target.value.replace(/[^\d.]/g, '')) || 0 }))}
                        />
                        <span className="text-sm text-mute">كجم</span>
                        <button className="grid h-14 w-14 place-items-center" onClick={() => setW(w + 0.1)} aria-label="زِد">
                          <Icon name="plus" size={20} />
                        </button>
                      </div>
                      <Button
                        className="mt-3 w-full"
                        icon="check"
                        onClick={() => {
                          collect(round.id, s.listingId, w)
                          haptic(10)
                        }}
                      >
                        أكّد الوزن
                      </Button>
                      <div className="mt-2 text-center text-xs text-mute">
                        ينصرف لـ{l.short} <span className="num font-semibold text-copper-700">{sar(w * f.pricePerKgSar)}</span> ر.س
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>
      </div>

      <AnimatePresence>
        {cert && (
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="mx-4 mt-4 overflow-hidden rounded-[24px] bg-ink p-5 text-white">
            <div className="flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-loop">
                <Icon name="cert" size={24} />
              </span>
              <div className="flex-1">
                <div className="font-display text-lg font-semibold">صدرت شهادة التوريد</div>
                <div className="text-xs text-white/60">
                  انصرف للمغاسل <span className="num font-semibold text-copper-100">{sar(paid)}</span> ر.س
                </div>
              </div>
            </div>
            <Button className="mt-4 w-full" onClick={() => nav(`/f/cert/${cert}`)}>
              شوف الشهادة
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
      {!cert && doneCount === 0 && <div className="mt-4 text-center text-xs text-mute">الترتيب محسوب لأقصر طريق من مصنعك</div>}
    </div>
  )
}

export function FactorySettings() {
  const f = useFactory()
  const setPrice = useStore((s) => s.setPrice)
  const step = (d: number) => setPrice(f.id, Math.max(0.1, Math.round((f.pricePerKgSar + d) * 100) / 100))
  return (
    <div className="px-4 pb-10 pt-safe">
      <Profile
        avatar={
          <div className="grid h-20 w-20 place-items-center rounded-[28px] bg-ink text-white">
            <Icon name="factory" size={34} />
          </div>
        }
        title={f.name}
        sub="القصيم"
      />
      <Group title="سعر الشراء" note="يطبّق على كل الصناديق الجديدة، وينصرف لكل مغسلة حسب الوزن الفعلي وقت الاستلام.">
        <div className="flex items-center gap-3 px-4 py-4">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-copper-50 text-copper-700">
            <Icon name="scale" size={18} />
          </span>
          <span className="flex-1 text-[15px] font-medium">ريال لكل كيلو</span>
          <button className="grid h-10 w-10 place-items-center rounded-full bg-sand" onClick={() => step(-0.05)} aria-label="أنقص السعر">
            <Icon name="minus" size={18} />
          </button>
          <span data-testid="price" className="num w-14 text-center font-display text-2xl font-semibold text-copper-700">
            {sar(f.pricePerKgSar)}
          </span>
          <button className="grid h-10 w-10 place-items-center rounded-full bg-sand" onClick={() => step(0.05)} aria-label="زِد السعر">
            <Icon name="plus" size={18} />
          </button>
        </div>
      </Group>
      <Group title="الحساب">
        <Row icon="user" label="البريد" value={<span dir="ltr">wadi@maad.sa</span>} />
      </Group>
      <div className="mt-6">
        <SwitchAccount />
      </div>
    </div>
  )
}
