import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useMemo, useState } from 'react'
import { appConfig } from '@/config/app'
import { byId, impactTotals } from '@/domain/services'
import { CRITERIA, type Activity, type Db } from '@/domain/types'
import { ago, DEFECT_LABEL, num, num1 } from '@/lib/format'
import { useStore } from '@/store/store'
import { CityMap } from '@/ui/CityMap'
import { Icon } from '@/ui/Icon'
import { cx, Odometer } from '@/ui/kit'
import { Logo } from '@/ui/Logo'
import { useTicker } from '../consumer/hooks'

export function activityText(db: Db, a: Activity) {
  const hood = byId(db.neighborhoods, a.neighborhoodId)?.name ?? ''
  const l = a.laundryId ? byId(db.laundries, a.laundryId) : undefined
  if (a.kind === 'return') return { icon: 'replay' as const, tone: 'loop', text: `شخص في حي ${hood} رجّع ${a.count} ${a.count >= 3 && a.count <= 10 ? 'علاقات' : 'علاقة'}` }
  if (a.kind === 'pickup') return { icon: 'truck' as const, tone: 'steel', text: `المصنع استلم صندوق ${l?.name ?? ''} وانصرف لها مستحقها` }
  if (a.kind === 'boxFull') return { icon: 'box' as const, tone: 'copper', text: `امتلى صندوق ${l?.name ?? ''} في ${hood} وانعرض للمصانع` }
  return { icon: 'plus' as const, tone: 'loop', text: `${l?.name ?? ''} طلبت ${num(a.count)} علاقة من حي ${hood}` }
}

export function ImpactLive({ compact = false }: { compact?: boolean }) {
  const db = useStore((s) => s.db)
  const now = useTicker(1000)
  const t = useMemo(() => impactTotals(db), [db])
  const partners = db.laundries.length
  const homes = useMemo(() => new Set(db.bookings.filter((b) => b.status === 'credited').map((b) => b.userId)).size, [db])

  return (
    <div className={cx('relative min-h-full overflow-hidden bg-ink text-white', compact ? 'p-6' : 'p-8 lg:p-10')}>
      <div className="pointer-events-none absolute inset-0 opacity-60 grain" />
      <div className="relative">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {!compact && <Logo size={30} tone="light" />}
            <div>
              <div className={cx('font-display font-semibold', compact ? 'text-xl' : 'text-2xl')}>أثر مَعاد في بريدة</div>
              <div className="text-sm text-white/50">كل علاقة ترجع تنحسب هنا لحظة بلحظة</div>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-white/5 px-3 py-1.5 text-xs font-semibold ring-1 ring-white/10">
            <span className="relative flex h-2 w-2">
              <span className="absolute inset-0 rounded-full bg-loop" style={{ animation: 'pulse-ring 1.6s ease-out infinite' }} />
              <span className="relative h-2 w-2 rounded-full bg-loop" />
            </span>
            مباشر
          </div>
        </header>

        <div className={cx('mt-6 grid gap-3', compact ? 'grid-cols-3' : 'grid-cols-2 lg:grid-cols-4')}>
          <Hero label="علاقة رجعت للدورة" value={t.total} tone="loop" big />
          <Hero label="كجم حديد ما راح للمردم" value={Math.round(t.kg * 10) / 10} tone="steel" format={num1} />
          <Hero label="ريال وفّرتها المغاسل" value={Math.round(t.savings)} tone="copper" />
          {!compact && <Hero label={`بيت شارك · ${partners} مغاسل شريكة`} value={homes} tone="ink" />}
        </div>

        <div className={cx('mt-3 grid gap-3', compact ? 'grid-cols-2' : 'grid-cols-1 lg:grid-cols-3')}>
          <Panel title="مباشر من الأحياء" className={compact ? 'col-span-2' : 'lg:col-span-1 lg:row-span-2'}>
            <Ticker db={db} now={now} rows={compact ? 4 : 9} />
          </Panel>
          <Panel title="توزيع جودة العلاقات">
            <Histogram data={t.quality.histogram} />
          </Panel>
          <Panel title="أكثر العيوب">
            <Defects defects={t.quality.defects} />
          </Panel>
          {!compact && (
            <Panel title="خريطة الأحياء" className="lg:col-span-1">
              <div className="h-56 overflow-hidden rounded-2xl">
                <CityMap dark neighborhoods={db.neighborhoods} heat={Object.fromEntries(t.leaderboard.map((l) => [l.n.id, l.count]))} className="h-full w-full" />
              </div>
            </Panel>
          )}
          <Panel title="ترتيب الأحياء" className={compact ? 'col-span-2' : ''}>
            <Leaderboard rows={t.leaderboard.slice(0, compact ? 4 : 6)} />
          </Panel>
        </div>
      </div>
    </div>
  )
}

function Hero({ label, value, tone, big, format = num }: { label: string; value: number; tone: 'loop' | 'steel' | 'copper' | 'ink'; big?: boolean; format?: (n: number) => string }) {
  const accent = tone === 'loop' ? 'bg-loop' : tone === 'steel' ? 'bg-steel-300' : tone === 'copper' ? 'bg-copper' : 'bg-white/30'
  return (
    <div className="relative overflow-hidden rounded-[22px] bg-ink-2 p-5 ring-1 ring-white/5">
      <div className={cx('absolute inset-y-5 start-0 w-1 rounded-e-full', accent)} />
      <motion.div key={value} initial={{ opacity: 0.6 }} animate={{ opacity: 1 }}>
        <Odometer value={value} format={format} className={cx('font-semibold leading-none', big ? 'text-5xl' : 'text-4xl')} />
      </motion.div>
      <div className="mt-2 text-sm text-white/55">{label}</div>
    </div>
  )
}

function Panel({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cx('rounded-[22px] bg-ink-2 p-5 ring-1 ring-white/5', className)}>
      <div className="mb-4 text-sm font-semibold text-white/80">{title}</div>
      {children}
    </div>
  )
}

function Ticker({ db, now, rows }: { db: Db; now: number; rows: number }) {
  const recent = useMemo(() => [...db.activity].sort((a, b) => b.at - a.at).slice(0, 40), [db])
  const [offset, setOffset] = useState(0)
  const latest = recent[0]?.id
  useEffect(() => setOffset(0), [latest])
  useEffect(() => {
    const id = setInterval(() => setOffset((o) => (o + 1) % Math.max(1, recent.length - rows)), 4200)
    return () => clearInterval(id)
  }, [recent.length, rows])
  const fresh = recent.filter((a) => now - a.at < 10 * 60_000)
  const rotating = recent.slice(fresh.length).slice(offset, offset + rows - Math.min(fresh.length, rows))
  const list = [...fresh.slice(0, rows), ...rotating].slice(0, rows)
  return (
    <div className="space-y-2">
      <AnimatePresence initial={false} mode="popLayout">
        {list.map((a) => {
          const m = activityText(db, a)
          const isNew = now - a.at < 90_000
          return (
            <motion.div
              key={a.id}
              layout
              initial={{ opacity: 0, y: -14, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 30 }}
              transition={{ type: 'spring', stiffness: 260, damping: 26 }}
              className={cx('flex items-center gap-3 rounded-2xl px-3 py-2.5', isNew ? 'bg-loop/15 ring-1 ring-loop/40' : 'bg-white/[0.03]')}
            >
              <span className={cx('grid h-8 w-8 shrink-0 place-items-center rounded-xl', m.tone === 'loop' ? 'bg-loop/20 text-loop-100' : m.tone === 'copper' ? 'bg-copper/20 text-copper-100' : 'bg-white/10 text-steel-100')}>
                <Icon name={m.icon} size={16} />
              </span>
              <span className="min-w-0 flex-1 truncate text-sm">{m.text}</span>
              <span className="shrink-0 text-[11px] text-white/40">{ago(a.at, now)}</span>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}

function Histogram({ data }: { data: number[] }) {
  const max = Math.max(1, ...data)
  const total = data.reduce((a, b) => a + b, 0) || 1
  const usable = data.slice(appConfig.fitnessThreshold / 10).reduce((a, b) => a + b, 0)
  const [hover, setHover] = useState<number>()
  return (
    <div>
      <div className="flex items-baseline gap-2">
        <span className="num text-3xl font-semibold">{Math.round((usable / total) * 100)}٪</span>
        <span className="text-xs text-white/50">صالحة ترجع للمغاسل</span>
      </div>
      <div className="relative mt-4 flex h-28 items-end gap-[2px]" dir="ltr">
        {data.map((v, i) => {
          const ok = i * 10 >= appConfig.fitnessThreshold
          return (
            <div key={i} className="relative flex h-full flex-1 items-end" onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(undefined)}>
              <motion.div className="w-full rounded-t-[4px]" style={{ background: ok ? '#0FA36B' : '#7D8A96', opacity: hover === undefined || hover === i ? 1 : 0.5 }} initial={false} animate={{ height: `${Math.max(2, (v / max) * 100)}%` }} transition={{ type: 'spring', stiffness: 80, damping: 16 }} />
              {hover === i && (
                <div className="num absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-white px-2 py-1 text-[11px] font-semibold text-ink shadow-lg">
                  {i * 10}–{i * 10 + 9}: {num(v)}
                </div>
              )}
            </div>
          )
        })}
        <div className="pointer-events-none absolute inset-y-0 border-l border-dashed border-white/40" style={{ left: `${appConfig.fitnessThreshold}%` }} />
      </div>
      <div className="num mt-1.5 flex justify-between text-[10px] text-white/40" dir="ltr">
        <span>0</span>
        <span>{appConfig.fitnessThreshold}</span>
        <span>100</span>
      </div>
      <div className="mt-3 flex gap-4 text-[11px] text-white/60">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm bg-loop" />
          صالحة
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm bg-steel" />
          للتدوير
        </span>
      </div>
    </div>
  )
}

function Defects({ defects }: { defects: Record<(typeof CRITERIA)[number], number> }) {
  const rows = CRITERIA.map((k) => ({ k, v: defects[k] })).sort((a, b) => b.v - a.v)
  const max = Math.max(1, ...rows.map((r) => r.v))
  return (
    <div className="space-y-3">
      {rows.map((r) => (
        <div key={r.k} title={`${DEFECT_LABEL[r.k]}: ${num(r.v)}`}>
          <div className="flex justify-between text-xs">
            <span className="text-white/75">{DEFECT_LABEL[r.k]}</span>
            <span className="num text-white/50">{num(r.v)}</span>
          </div>
          <div className="mt-1.5 h-2 rounded-full bg-white/5">
            <motion.div className="h-full rounded-full bg-steel-300" initial={false} animate={{ width: `${(r.v / max) * 100}%` }} transition={{ type: 'spring', stiffness: 80, damping: 16 }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function Leaderboard({ rows }: { rows: { n: { id: string; name: string }; count: number }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.count))
  return (
    <div className="space-y-2.5">
      {rows.map((r, i) => (
        <motion.div layout key={r.n.id} className="flex items-center gap-3" title={`${r.n.name}: ${num(r.count)} علاقة`}>
          <span className={cx('num grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold', i === 0 ? 'bg-copper text-white' : 'bg-white/10 text-white/70')}>{i + 1}</span>
          <div className="min-w-0 flex-1">
            <div className="flex justify-between text-sm">
              <span>{r.n.name}</span>
              <span className="num text-white/60">{num(r.count)}</span>
            </div>
            <div className="mt-1 h-1.5 rounded-full bg-white/5">
              <motion.div className="h-full rounded-full bg-loop" initial={false} animate={{ width: `${(r.count / max) * 100}%` }} />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

export function ImpactPage() {
  return <ImpactLive />
}

