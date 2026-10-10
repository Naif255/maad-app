import { AnimatePresence, motion } from 'motion/react'
import { useMemo, useState } from 'react'
import { NavLink, Outlet, useNavigate, useParams } from 'react-router-dom'
import { economics, kgFromHangers } from '@/config/economics'
import { DEMO_FACTORY_ID } from '@/data/seed'
import { byId, distanceKm, proposeRound, readyListings } from '@/domain/services'
import { ago, date, kg, num, sar } from '@/lib/format'
import { useStore } from '@/store/store'
import { CityMap } from '@/ui/CityMap'
import { Icon, type IconName } from '@/ui/Icon'
import { Button, Card, cx, Pill, TopBar } from '@/ui/kit'
import { haptic, useTicker } from '../consumer/hooks'

const TABS: { to: string; label: string; icon: IconName; end?: boolean }[] = [
  { to: '/f', label: 'الخريطة', icon: 'map', end: true },
  { to: '/f/rounds', label: 'الجولات', icon: 'truck' },
  { to: '/f/certs', label: 'الشهادات', icon: 'cert' },
  { to: '/f/settings', label: 'السعر', icon: 'settings' },
]

export const useFactory = () => byId(useStore((s) => s.db).factories, DEMO_FACTORY_ID)!

export function FactoryLayout() {
  return (
    <div className="flex h-full flex-col bg-steel-50">
      <div className="relative min-h-0 flex-1 overflow-y-auto overflow-x-hidden no-scrollbar">
        <Outlet />
      </div>
      <nav className="shrink-0 border-t border-ink/5 bg-paper px-2 pb-[max(env(safe-area-inset-bottom),10px)] pt-2">
        <div className="flex justify-around">
          {TABS.map((t) => (
            <NavLink key={t.to} to={t.to} end={t.end} className={({ isActive }) => cx('flex w-16 flex-col items-center gap-1 py-1 text-[11px] font-semibold', isActive ? 'text-ink' : 'text-faint')}>
              <Icon name={t.icon} size={22} />
              {t.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}

export function FactoryMap() {
  const db = useStore((s) => s.db)
  const f = useFactory()
  const approve = useStore((s) => s.approveRound)
  const nav = useNavigate()
  const now = useTicker(5000)
  const ready = readyListings(db)
  const proposal = useMemo(() => proposeRound(db, f.id), [db, f.id])
  const [picked, setPicked] = useState<string[] | undefined>()
  const sel = picked ?? proposal
  const active = db.rounds.find((r) => r.factoryId === f.id && !r.completedAt)
  const selListings = sel.map((id) => byId(db.listings, id)!).filter(Boolean)
  const count = selListings.reduce((a, l) => a + l.count, 0)
  const estKg = kgFromHangers(count)

  const toggle = (id: string) => setPicked((p) => ((p ?? proposal).includes(id) ? (p ?? proposal).filter((x) => x !== id) : [...(p ?? proposal), id]))

  return (
    <div>
      <div className="relative h-[46vh] min-h-[280px] overflow-hidden">
        <CityMap neighborhoods={db.neighborhoods} className="absolute inset-0 h-full w-full">
          {sel.length > 1 && <RouteLine points={[f, ...selListings.map((li) => byId(db.laundries, li.laundryId)!)]} />}
          {db.laundries.map((l) => {
            const listing = ready.find((x) => x.laundryId === l.id)
            const ratio = Math.min(1, l.boxCount / economics.boxCapacityHangers)
            const on = listing && sel.includes(listing.id)
            return (
              <g key={l.id} onClick={() => listing && toggle(listing.id)} style={{ cursor: listing ? 'pointer' : 'default' }}>
                {listing && <circle cx={l.x} cy={l.y} r="26" fill="#D9822B" opacity="0.25" style={{ transformOrigin: `${l.x}px ${l.y}px`, animation: 'pulse-ring 2s ease-out infinite' }} />}
                <circle cx={l.x} cy={l.y} r={listing ? 20 : 13} fill={listing ? (on ? '#D9822B' : '#fff') : '#fff'} stroke={listing ? '#D9822B' : '#B9C3CC'} strokeWidth="3" />
                {!listing && l.acceptsDamaged && (
                  <circle cx={l.x} cy={l.y} r="8" fill="none" stroke="#7D8A96" strokeWidth="5" strokeDasharray={`${ratio * 50.3} 60`} transform={`rotate(-90 ${l.x} ${l.y})`} />
                )}
                {listing && (
                  <text x={l.x} y={l.y + 5} textAnchor="middle" fontSize="13" fontWeight="700" fill={on ? '#fff' : '#D9822B'} style={{ fontFamily: 'var(--font-display)' }}>
                    {Math.round(kgFromHangers(listing.count))}
                  </text>
                )}
              </g>
            )
          })}
          <g>
            <rect x={f.x - 22} y={f.y - 22} width="44" height="44" rx="12" fill="#0F1714" />
            <path d={`M${f.x - 11} ${f.y + 9}v-11l7 4v-4l7 4v-9h4v16z`} fill="#fff" />
          </g>
        </CityMap>
        <div className="absolute inset-x-0 top-0 bg-gradient-to-b from-steel-50 via-steel-50/70 to-transparent px-5 pb-8 pt-12">
          <div className="text-sm text-mute">{f.name}</div>
          <div className="font-display text-xl font-semibold">صناديق جاهزة للاستلام</div>
        </div>
        <div className="absolute bottom-3 right-4 flex gap-2 text-[11px] font-semibold">
          <span className="flex items-center gap-1 rounded-full bg-paper/90 px-2 py-1">
            <span className="h-2.5 w-2.5 rounded-full bg-copper" />
            ممتلئ
          </span>
          <span className="flex items-center gap-1 rounded-full bg-paper/90 px-2 py-1">
            <span className="h-2.5 w-2.5 rounded-full border-2 border-steel" />
            يتعبّى
          </span>
        </div>
      </div>

      <div className="relative -mt-4 space-y-3 rounded-t-[28px] bg-steel-50 px-4 pt-5">
        {active && (
          <Card className="flex items-center gap-3 bg-ink p-4 text-white" onClick={() => nav(`/f/round/${active.id}`)}>
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-copper">
              <Icon name="truck" size={22} />
            </div>
            <div className="flex-1">
              <div className="font-semibold">جولة جارية</div>
              <div className="text-xs text-white/60">
                {active.stops.filter((s) => s.collectedAt).length} من {active.stops.length} محطات
              </div>
            </div>
            <Icon name="chevron" size={20} />
          </Card>
        )}

        <div className="grid grid-cols-3 gap-2.5">
          <Mini label="صناديق ممتلئة" value={num(ready.length)} />
          <Mini label="وزن تقديري" value={`${kg(kgFromHangers(ready.reduce((a, l) => a + l.count, 0)))}`} unit="كجم" />
          <Mini label="سعرك للكيلو" value={sar(f.pricePerKgSar)} unit="ر.س" />
        </div>

        {ready.length ? (
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between px-4 pb-2 pt-4">
              <div className="font-display font-semibold">الجولة المقترحة</div>
              <Pill tone="copper">صناديق متقاربة</Pill>
            </div>
            <div className="divide-y divide-ink/5">
              {ready.map((li) => {
                const l = byId(db.laundries, li.laundryId)!
                const on = sel.includes(li.id)
                return (
                  <button key={li.id} onClick={() => toggle(li.id)} className="flex w-full items-center gap-3 px-4 py-3 text-start">
                    <div className={cx('grid h-6 w-6 place-items-center rounded-lg ring-2', on ? 'bg-copper text-white ring-copper' : 'ring-ink/15')}>{on && <Icon name="check" size={14} strokeWidth={3} />}</div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold">{l.name}</div>
                      <div className="text-xs text-mute">
                        {byId(db.neighborhoods, l.neighborhoodId)!.name} · امتلى {ago(li.createdAt, now)}
                      </div>
                    </div>
                    <div className="text-end">
                      <div className="num text-sm font-semibold">{kg(kgFromHangers(li.count))} كجم</div>
                      <div className="num text-[11px] text-mute">
                        {num(li.count)} علاقة · نقاوة {li.purity.toFixed(1)}٪
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
            <div className="flex items-center justify-between bg-sand px-4 py-3 text-sm">
              <span className="text-mute">
                <span className="num font-semibold text-ink">{sel.length}</span> محطات · <span className="num font-semibold text-ink">{kg(estKg)}</span> كجم
              </span>
              <span className="num font-semibold">≈ {sar(estKg * f.pricePerKgSar)} ر.س</span>
            </div>
          </Card>
        ) : (
          <Card className="p-6 text-center text-sm text-mute">ما فيه صناديق ممتلئة الحين. نعلمك أول ما يمتلي واحد.</Card>
        )}
        <div className="sticky bottom-0 bg-gradient-to-t from-steel-50 via-steel-50 to-transparent pb-5 pt-3">
          <Button
            variant="ink"
            className="w-full"
            icon="route"
            disabled={!sel.length || !!active}
            onClick={() => {
              const id = approve(f.id, sel)
              setPicked(undefined)
              haptic(12)
              nav(`/f/round/${id}`)
            }}
          >
            {active ? 'عندك جولة جارية' : 'اعتمد جولة الاستلام'}
          </Button>
        </div>
      </div>
    </div>
  )
}

function RouteLine({ points }: { points: { x: number; y: number }[] }) {
  const d = points.map((p, i) => `${i ? 'L' : 'M'}${p.x} ${p.y}`).join(' ')
  return (
    <>
      <path d={d} stroke="#0F1714" strokeOpacity="0.15" strokeWidth="10" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <motion.path d={d} stroke="#0F1714" strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="10 10" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1 }} style={{ animation: 'wire-flow 1s linear infinite' }} />
    </>
  )
}

function Mini({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="rounded-2xl bg-paper p-3 ring-1 ring-ink/5">
      <div className="num text-lg font-semibold leading-none">
        {value}
        {unit && <span className="ms-0.5 text-[10px] font-normal text-mute">{unit}</span>}
      </div>
      <div className="mt-1.5 text-[11px] text-mute">{label}</div>
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
  if (!round) return null
  const pts = [f, ...round.stops.map((s) => byId(db.laundries, s.laundryId)!)]
  let dist = 0
  for (let i = 1; i < pts.length; i++) dist += distanceKm(pts[i - 1], pts[i])
  const doneCount = round.stops.filter((s) => s.collectedAt).length
  const cert = round.certificateId

  return (
    <div className="min-h-full pb-8">
      <TopBar back="/f" title="جولة الاستلام" sub={`${round.stops.length} محطات · ${dist.toFixed(1)} كم`} />
      <div className="mx-4 h-44 overflow-hidden rounded-[24px] ring-1 ring-ink/5">
        <CityMap neighborhoods={db.neighborhoods} className="h-full w-full">
          <RouteLine points={pts} />
          {round.stops.map((s, i) => {
            const l = byId(db.laundries, s.laundryId)!
            return (
              <g key={s.listingId}>
                <circle cx={l.x} cy={l.y} r="20" fill={s.collectedAt ? '#0FA36B' : '#D9822B'} />
                <text x={l.x} y={l.y + 6} textAnchor="middle" fontSize="17" fontWeight="700" fill="#fff">
                  {i + 1}
                </text>
              </g>
            )
          })}
          <rect x={f.x - 18} y={f.y - 18} width="36" height="36" rx="10" fill="#0F1714" />
        </CityMap>
      </div>
      <div className="mt-4 space-y-3 px-4">
        {round.stops.map((s, i) => {
          const l = byId(db.laundries, s.laundryId)!
          const est = Math.round(kgFromHangers(s.count) * 10) / 10
          const w = weights[s.listingId] ?? est
          return (
            <Card key={s.listingId} className={cx('p-4', !!s.collectedAt && 'bg-loop-50/60')}>
              <div className="flex items-center gap-3">
                <div className={cx('num grid h-9 w-9 place-items-center rounded-full font-bold text-white', s.collectedAt ? 'bg-loop' : 'bg-copper')}>{s.collectedAt ? <Icon name="check" size={18} strokeWidth={3} /> : i + 1}</div>
                <div className="flex-1">
                  <div className="font-semibold">{l.name}</div>
                  <div className="num text-xs text-mute">
                    {num(s.count)} علاقة · تقديري {kg(est)} كجم
                  </div>
                </div>
                {s.collectedAt && (
                  <Pill tone="loop" className="num">
                    {sar(s.payoutSar!)} ر.س
                  </Pill>
                )}
              </div>
              {!s.collectedAt && (
                <div className="mt-4 flex items-center gap-2">
                  <div className="flex flex-1 items-center rounded-2xl bg-sand ring-1 ring-ink/10">
                    <button className="grid h-12 w-12 place-items-center" onClick={() => setWeights((x) => ({ ...x, [s.listingId]: Math.max(0, Math.round((w - 0.1) * 10) / 10) }))}>
                      <Icon name="minus" size={18} />
                    </button>
                    <input
                      dir="ltr"
                      inputMode="decimal"
                      className="num w-full bg-transparent text-center text-lg font-semibold outline-none"
                      value={w}
                      onChange={(e) => setWeights((x) => ({ ...x, [s.listingId]: Number(e.target.value.replace(/[^\d.]/g, '')) || 0 }))}
                    />
                    <button className="grid h-12 w-12 place-items-center" onClick={() => setWeights((x) => ({ ...x, [s.listingId]: Math.round((w + 0.1) * 10) / 10 }))}>
                      <Icon name="plus" size={18} />
                    </button>
                  </div>
                  <span className="text-sm text-mute">كجم</span>
                  <Button
                    size="md"
                    variant="ink"
                    onClick={() => {
                      collect(round.id, s.listingId, w)
                      haptic(10)
                    }}
                  >
                    استلمت
                  </Button>
                </div>
              )}
              {!s.collectedAt && (
                <div className="mt-2 text-[11px] text-mute">
                  تندفع للمغسلة: <span className="num font-semibold text-ink">{sar(w * f.pricePerKgSar)}</span> ر.س
                </div>
              )}
            </Card>
          )
        })}
        <AnimatePresence>
          {cert && (
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
              <Card className="flex items-center gap-3 bg-ink p-4 text-white" onClick={() => nav(`/f/cert/${cert}`)}>
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-loop">
                  <Icon name="cert" size={24} />
                </div>
                <div className="flex-1">
                  <div className="font-semibold">صدرت شهادة التوريد</div>
                  <div className="text-xs text-white/60">كل المغاسل انصرف لها مستحقها</div>
                </div>
                <Icon name="chevron" size={20} />
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
        {!cert && <div className="text-center text-xs text-mute">{doneCount ? `باقي ${round.stops.length - doneCount} محطات` : 'أدخل الوزن الفعلي عند كل محطة'}</div>}
      </div>
    </div>
  )
}

export function Rounds() {
  const db = useStore((s) => s.db)
  const nav = useNavigate()
  const rounds = [...db.rounds].sort((a, b) => b.createdAt - a.createdAt)
  return (
    <div className="pb-8">
      <TopBar title="الجولات" />
      <div className="space-y-2.5 px-4">
        {rounds.map((r) => {
          const kgs = r.stops.reduce((a, s) => a + (s.actualKg ?? kgFromHangers(s.count)), 0)
          return (
            <Card key={r.id} className="flex items-center gap-3 p-4" onClick={() => nav(r.certificateId ? `/f/cert/${r.certificateId}` : `/f/round/${r.id}`)}>
              <div className={cx('grid h-11 w-11 place-items-center rounded-xl', r.completedAt ? 'bg-loop-50 text-loop-700' : 'bg-copper-50 text-copper')}>
                <Icon name={r.completedAt ? 'check' : 'truck'} size={20} />
              </div>
              <div className="flex-1">
                <div className="font-semibold">{date(r.createdAt)}</div>
                <div className="num text-xs text-mute">
                  {r.stops.length} محطات · {kg(kgs)} كجم
                </div>
              </div>
              <Pill tone={r.completedAt ? 'loop' : 'copper'}>{r.completedAt ? 'مكتملة' : 'جارية'}</Pill>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

export function FactorySettings() {
  const f = useFactory()
  const setPrice = useStore((s) => s.setPrice)
  return (
    <div className="pb-8">
      <TopBar title="سعر الكيلو" />
      <div className="px-4">
        <Card className="p-6 text-center">
          <div className="text-sm text-mute">سعرك المعلن للمغاسل</div>
          <div className="mt-4 flex items-center justify-center gap-4">
            <button className="grid h-12 w-12 place-items-center rounded-full bg-sand" onClick={() => setPrice(f.id, Math.max(0.1, Math.round((f.pricePerKgSar - 0.05) * 100) / 100))}>
              <Icon name="minus" />
            </button>
            <div className="num font-display text-5xl font-semibold">{sar(f.pricePerKgSar)}</div>
            <button className="grid h-12 w-12 place-items-center rounded-full bg-sand" onClick={() => setPrice(f.id, Math.round((f.pricePerKgSar + 0.05) * 100) / 100)}>
              <Icon name="plus" />
            </button>
          </div>
          <div className="mt-1 text-sm text-mute">ريال لكل كيلو</div>
          <div className="mt-5 rounded-2xl bg-steel-50 p-3 text-xs leading-5 text-steel-700">السعر يطبّق على كل الصناديق الجديدة، ويندفع لكل مغسلة حسب الوزن الفعلي وقت الاستلام.</div>
        </Card>
      </div>
    </div>
  )
}
