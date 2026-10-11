import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { appConfig } from '@/config/app'
import { CRITERIA, type HangerVerdict } from '@/domain/types'
import { CRITERION_LABEL, DEFECT_LABEL, hangers, num } from '@/lib/format'
import { lockSound, tick } from '@/lib/sound'
import { cameraPipeline, demoPipeline, ScanEngine, type Pipeline, type ScanState, type TrackView } from '@/scan'
import { useStore } from '@/store/store'
import { Icon } from '@/ui/Icon'
import { Button, cx, Odometer, Sheet } from '@/ui/kit'
import { haptic } from './hooks'

export function Scanner() {
  const [params] = useSearchParams()
  const forId = params.get('for') ?? undefined
  const record = params.get('record') === '1'
  const nav = useNavigate()
  const demo = useStore((s) => s.demo)
  const chosen = useStore((s) => s.scanSource)
  const source = demo ? chosen : 'camera'
  const [failed, setFailed] = useState(false)
  const batches = useStore((s) => s.batches)
  const addBatch = useStore((s) => s.addBatch)
  const setScanRequest = useStore((s) => s.setScanRequest)
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState<ScanState>()
  const [note, setNote] = useState<string>()
  const [selected, setSelected] = useState<HangerVerdict>()
  const [verified, setVerified] = useState(false)
  const [done, setDone] = useState(false)
  const hostRef = useRef<HTMLDivElement>(null)
  const engineRef = useRef<ScanEngine | undefined>(undefined)
  const size = useSize(hostRef)

  useEffect(() => {
    if (forId) setScanRequest(forId)
  }, [forId, setScanRequest])

  useEffect(() => {
    const host = hostRef.current!
    let stopped = false
    let engine: ScanEngine | undefined
    setState(undefined)
    setVerified(false)
    setDone(false)
    setFailed(false)
    const index = useStore.getState().batches.length
    const mount = (p: Pipeline) => {
      host.replaceChildren(p.source.element)
      Object.assign(p.source.element.style, { position: 'absolute', inset: '0', width: '100%', height: '100%', objectFit: 'cover' })
    }
    const make = (p: Pipeline) =>
      new ScanEngine({
        source: p.source,
        detector: p.detector,
        seed: index,
        idPrefix: `b${index}`,
        onState: (s) => {
          if (!stopped) flushSync(() => setState(s))
        },
        onConfirm: () => {
          haptic(6)
          tick()
        },
        onLock: (verdicts) => {
          if (stopped) return
          addBatch({ id: `batch-${index}-${Date.now()}`, hangers: verdicts, lockedAt: Date.now() })
          haptic([14, 40, 24])
          lockSound()
          setVerified(true)
          setTimeout(() => !stopped && setDone(true), 1900)
        },
      })
    const run = async () => {
      let p = source === 'camera' ? cameraPipeline() : await demoPipeline()
      if (stopped) return
      try {
        engine = make(p)
        engineRef.current = engine
        mount(p)
        await engine.start()
      } catch {
        engine?.stop()
        if (stopped) return
        if (!demo) {
          setFailed(true)
          return
        }
        p = await demoPipeline()
        if (stopped) return
        setNote('الكاميرا ما اشتغلت، كمّلنا بالفيديو المسجّل')
        engine = make(p)
        engineRef.current = engine
        mount(p)
        await engine.start()
      }
      if (stopped) engine?.stop()
    }
    void run()
    return () => {
      stopped = true
      engine?.stop()
      engineRef.current = undefined
    }
  }, [attempt, source, demo, addBatch])

  useEffect(() => {
    if (!note) return
    const id = setTimeout(() => setNote(undefined), 3500)
    return () => clearTimeout(id)
  }, [note])

  const prev = useMemo(() => {
    const done = verified ? batches.slice(0, -1) : batches
    const h = done.flatMap((b) => b.hangers)
    return { usable: h.filter((x) => x.usable).length, total: h.length }
  }, [batches, verified])

  const phase = state?.phase ?? 'starting'
  const tracks = state?.tracks.filter((t) => t.visible) ?? []
  const usable = state?.usable ?? 0
  const recyclable = state?.recyclable ?? 0
  const confirmed = usable + recyclable
  const quietRatio = phase === 'scanning' && confirmed > 0 ? Math.min(1, (state?.quietFor ?? 0) / appConfig.scan.lockQuietMs) : 0

  const hint =
    phase === 'starting'
      ? 'نجهّز الكاميرا…'
      : phase === 'locked'
        ? 'تم التحقق'
        : confirmed === 0
          ? state?.sourceKind === 'camera'
            ? 'فرّش العلاقات على قماش سادة ووجّه الكاميرا'
            : 'وجّه الكاميرا على العلاقات'
          : quietRatio > 0.45
            ? 'ثبّت شوي… بنقفل العدد'
            : 'نعدّ… حرّك الجوال على مهلك'

  const open = (t: TrackView) => {
    if (!t.verdict) return
    engineRef.current?.hold(true)
    setSelected(t.verdict)
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-black text-white">
      <div ref={hostRef} className="absolute inset-0" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(0,0,0,0.55))]" />
      {phase === 'scanning' && (
        <div className="pointer-events-none absolute inset-x-0 top-0 h-full overflow-hidden">
          <div className="h-24 w-full bg-gradient-to-b from-transparent via-loop/25 to-transparent" style={{ animation: 'scan-sweep 2.6s ease-in-out infinite' }}>
            <div className="mt-12 h-px w-full bg-loop/70 shadow-[0_0_12px_2px_rgba(15,163,107,0.6)]" />
          </div>
        </div>
      )}

      <Boxes tracks={tracks} state={state} size={size} locked={phase === 'locked'} onPick={open} />

      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 bg-gradient-to-b from-black/60 to-transparent px-3 pb-6 [&_button]:pointer-events-auto" style={{ paddingTop: 'calc(var(--status, 0px) + 12px)' }}>
        <div className="flex items-center gap-2">
          <button onClick={() => nav(-1)} className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-black/40 backdrop-blur-md" aria-label="إغلاق">
            <Icon name="close" size={20} />
          </button>
          <div className="flex h-11 min-w-0 flex-1 items-center gap-3 rounded-full bg-black/40 pe-4 ps-1.5 backdrop-blur-md">
            <span className="flex h-8 items-center gap-1.5 rounded-full bg-white/10 px-3">
              <motion.span key={confirmed} initial={{ scale: 1.2 }} animate={{ scale: 1 }}>
                <Odometer value={confirmed} className="text-xl font-semibold leading-none" />
              </motion.span>
              <span className="text-xs font-semibold text-white/80">{confirmed >= 3 && confirmed <= 10 ? 'علاقات' : 'علاقة'}</span>
            </span>
            <span className="ms-auto flex items-center gap-3 text-xs font-semibold">
              <Split label="صالحة" value={usable} tone="loop" />
              <Split label="للتدوير" value={recyclable} tone="steel" />
            </span>
          </div>
        </div>
        {prev.total > 0 && (
          <div className="mt-2 text-center text-xs text-white/70">
            + <span className="num">{num(prev.total)}</span> من الدفعات السابقة
          </div>
        )}
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex flex-col items-center gap-2 bg-gradient-to-t from-black/60 to-transparent px-5 pt-8" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 20px)' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={hint}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className={cx('flex items-center gap-2.5 rounded-full bg-black/45 px-4 py-2 text-sm font-semibold backdrop-blur-md', failed && 'hidden')}
          >
            {phase === 'scanning' && confirmed > 0 ? <LockRing ratio={quietRatio} /> : phase === 'starting' ? <Spinner /> : null}
            {hint}
          </motion.div>
        </AnimatePresence>
        {phase === 'scanning' && confirmed > 0 && (
          <button onClick={() => engineRef.current?.lock()} className="text-xs font-semibold text-white/60 underline-offset-4 hover:underline">
            خلصت؟ قفّل العدد الحين
          </button>
        )}
      </div>

      <AnimatePresence>{note && <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-x-4 top-24 z-20 rounded-2xl bg-copper px-4 py-3 text-sm font-semibold">{note}</motion.div>}</AnimatePresence>

      {failed && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-ink px-8 text-center">
          <div className="grid h-16 w-16 place-items-center rounded-3xl bg-white/10">
            <Icon name="camera" size={30} />
          </div>
          <div className="mt-5 font-display text-xl font-semibold">ما قدرنا نفتح الكاميرا</div>
          <p className="mt-2 text-sm leading-6 text-white/60">اسمح لمَعاد يستخدم الكاميرا من إعدادات المتصفح، وجرّب مرة ثانية.</p>
          <Button className="mt-6 w-full" icon="replay" onClick={() => setAttempt((a) => a + 1)}>
            حاول مرة ثانية
          </Button>
        </div>
      )}

      <AnimatePresence>{verified && !done && <Verified usable={usable} recyclable={recyclable} />}</AnimatePresence>

      <AnimatePresence>
        {done && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            className="absolute inset-x-0 bottom-0 z-30 rounded-t-[28px] bg-ink-2 px-5 pb-8 pt-5"
          >
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-loop">
                <Icon name="check" size={22} strokeWidth={2.6} />
              </div>
              <div className="flex-1">
                <div className="font-display text-lg font-semibold">
                  {batches.length > 1 ? `المجموع ${hangers(prev.total + confirmed)}` : `تم فحص ${hangers(confirmed)}`}
                </div>
                <div className="mt-0.5 flex items-center gap-3 text-[13px] text-white/70">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-loop" />
                    <span className="num font-semibold text-white">{num(prev.usable + usable)}</span> صالحة
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-steel-300" />
                    <span className="num font-semibold text-white">{num(prev.total + confirmed - prev.usable - usable)}</span> للتدوير
                  </span>
                </div>
              </div>
            </div>
            {record && (
              <button
                onClick={() => {
                  const data = engineRef.current?.annotation()
                  if (!data) return
                  const a = document.createElement('a')
                  a.href = URL.createObjectURL(new Blob([JSON.stringify(data)], { type: 'application/json' }))
                  a.download = 'sample.json'
                  a.click()
                }}
                className="mt-4 w-full rounded-xl bg-white/5 py-2 text-xs font-semibold text-white/60"
              >
                تصدير التعليقات (sample.json)
              </button>
            )}
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2 text-xs text-white/55">
              <Icon name="eye" size={15} className="shrink-0" />
              اضغط أي علاقة فوق تشوف ليش انحسبت كذا
            </div>
            <div className="mt-4 grid grid-cols-[1fr_1.4fr] gap-2.5">
              <Button variant="soft" className="border-white/10 bg-white/5 text-white hover:bg-white/10" icon="plus" onClick={() => setAttempt((a) => a + 1)}>
                دفعة ثانية
              </Button>
              <Button onClick={() => nav('/c/summary')}>كمّل للفرز</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <CriteriaSheet
        v={selected}
        onClose={() => {
          setSelected(undefined)
          engineRef.current?.hold(false)
        }}
      />
    </div>
  )
}

function useSize(ref: React.RefObject<HTMLDivElement | null>) {
  const [s, setS] = useState({ w: 0, h: 0 })
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(() => setS({ w: el.clientWidth, h: el.clientHeight }))
    ro.observe(el)
    setS({ w: el.clientWidth, h: el.clientHeight })
    return () => ro.disconnect()
  }, [ref])
  return s
}

function Split({ label, value, tone }: { label: string; value: number; tone: 'loop' | 'steel' }) {
  return (
    <span className="flex items-center gap-1.5" aria-label={`${value} ${label}`}>
      <span className={cx('h-2 w-2 shrink-0 rounded-full', tone === 'loop' ? 'bg-loop' : 'bg-steel-300')} />
      <Odometer value={value} className="text-sm" />
      <span className="text-white/60">{label}</span>
    </span>
  )
}

function Boxes({ tracks, state, size, locked, onPick }: { tracks: TrackView[]; state?: ScanState; size: { w: number; h: number }; locked: boolean; onPick: (t: TrackView) => void }) {
  if (!state || !size.w) return null
  const { width: fw, height: fh } = state.frameSize
  const scale = Math.max(size.w / fw, size.h / fh)
  const dx = (size.w - fw * scale) / 2
  const dy = (size.h - fh * scale) / 2
  return (
    <div className="absolute inset-0">
      <AnimatePresence>
        {tracks.map((t) => {
          const x = dx + t.bbox.x * fw * scale
          const y = dy + t.bbox.y * fh * scale
          const w = t.bbox.w * fw * scale
          const h = t.bbox.h * fh * scale
          const v = t.verdict
          const color = !v ? 'rgba(255,255,255,0.7)' : v.usable ? '#0FA36B' : '#B9C3CC'
          return (
            <motion.button
              key={t.id}
              onClick={() => onPick(t)}
              initial={{ opacity: 0, scale: 1.25 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="absolute left-0 top-0"
              style={{ x, y, width: w, height: h, originX: 0.5, originY: 0.5 }}
            >
              <Brackets color={color} dashed={!v} glow={!!v && locked} />
              {v && (
                <motion.span
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                  className="num absolute -top-3 right-2 flex h-6 items-center gap-1 rounded-full px-2 text-xs font-bold shadow-lg"
                  style={{ background: color, color: v.usable ? '#fff' : '#0F1714' }}
                >
                  {v.score}
                </motion.span>
              )}
            </motion.button>
          )
        })}
      </AnimatePresence>
    </div>
  )
}

function Brackets({ color, dashed, glow }: { color: string; dashed: boolean; glow: boolean }) {
  const corners = [
    'right-0 top-0 rounded-tr-[10px] border-r-[3px] border-t-[3px]',
    'left-0 top-0 rounded-tl-[10px] border-l-[3px] border-t-[3px]',
    'bottom-0 right-0 rounded-br-[10px] border-b-[3px] border-r-[3px]',
    'bottom-0 left-0 rounded-bl-[10px] border-b-[3px] border-l-[3px]',
  ]
  return (
    <>
      <span
        className="absolute inset-0 rounded-[10px] transition-colors"
        style={{ border: `1px ${dashed ? 'dashed' : 'solid'} ${color}`, opacity: dashed ? 0.55 : 0.4, background: glow ? `${color}26` : dashed ? 'transparent' : `${color}14` }}
      />
      {!dashed && corners.map((c) => <span key={c} className={`absolute h-4 w-4 ${c}`} style={{ borderColor: color }} />)}
    </>
  )
}

function LockRing({ ratio }: { ratio: number }) {
  const r = 8
  const c = 2 * Math.PI * r
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" className="-rotate-90">
      <circle cx="10" cy="10" r={r} stroke="rgba(255,255,255,0.2)" strokeWidth="2.5" fill="none" />
      <circle cx="10" cy="10" r={r} stroke="#0FA36B" strokeWidth="2.5" fill="none" strokeDasharray={c} strokeDashoffset={c * (1 - ratio)} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 120ms linear' }} />
    </svg>
  )
}

function Spinner() {
  return <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/25 border-t-white" />
}

function Verified({ usable, recyclable }: { usable: number; recyclable: number }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-20 grid place-items-center bg-black/55 backdrop-blur-[3px]">
      <div className="flex flex-col items-center">
        <div className="relative h-40 w-40">
          <svg viewBox="0 0 160 160" className="absolute inset-0 -rotate-90">
            <motion.circle cx="80" cy="80" r="70" stroke="#0FA36B" strokeWidth="5" fill="none" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.75, ease: [0.65, 0, 0.35, 1] }} />
          </svg>
          <motion.div initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.55, type: 'spring', stiffness: 380, damping: 16 }} className="absolute inset-4 grid place-items-center rounded-full bg-loop">
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none">
              <motion.path d="m5 12.5 4.5 4.5L19 7.5" stroke="white" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.75, duration: 0.35 }} />
            </svg>
          </motion.div>
          <motion.div className="absolute inset-0 rounded-full border-2 border-loop" initial={{ scale: 1, opacity: 0.8 }} animate={{ scale: 1.6, opacity: 0 }} transition={{ delay: 0.7, duration: 0.9 }} />
        </div>
        <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.85 }} className="mt-6 text-center">
          <div className="font-display text-2xl font-semibold">تم التحقق</div>
          <div className="mt-1 text-sm text-white/70">
            <span className="num font-semibold text-loop-100">{usable}</span> صالحة · <span className="num font-semibold text-steel-100">{recyclable}</span> للتدوير
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}

export function CriteriaSheet({ v, onClose }: { v?: HangerVerdict; onClose: () => void }) {
  const worst = v ? CRITERIA.reduce((a, k) => (v.criteria[k] < v.criteria[a] ? k : a), CRITERIA[0]) : undefined
  return (
    <Sheet open={!!v} onClose={onClose} dark>
      {v && (
        <div>
          <div className="flex items-center gap-4">
            <ScoreRing score={v.score} usable={v.usable} />
            <div>
              <div className={cx('font-display text-xl font-semibold', v.usable ? 'text-loop-100' : 'text-steel-100')}>{v.usable ? 'صالحة' : 'للتدوير'}</div>
              <div className="mt-0.5 text-sm text-white/60">{v.usable ? 'ترجع للمغسلة وتنعلّق عليها ثياب من جديد' : 'تروح لمصنع الحديد وتنصهر من جديد'}</div>
              {!v.usable && worst && (
                <div className="mt-2 inline-flex rounded-full bg-rust/20 px-2.5 py-1 text-xs font-semibold text-[#F3A58A]">السبب: {DEFECT_LABEL[worst]}</div>
              )}
            </div>
          </div>
          <div className="mt-6 space-y-3.5">
            {CRITERIA.map((k, i) => {
              const val = v.criteria[k]
              const bad = val < 70
              return (
                <div key={k}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/80">{CRITERION_LABEL[k]}</span>
                    <span className={cx('num font-semibold', bad ? 'text-[#F3A58A]' : 'text-white')}>{val}</span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
                    <motion.div className="h-full rounded-full" style={{ background: bad ? '#C2502A' : '#0FA36B' }} initial={{ width: 0 }} animate={{ width: `${val}%` }} transition={{ delay: 0.1 + i * 0.06, type: 'spring', stiffness: 90, damping: 18 }} />
                  </div>
                </div>
              )
            })}
          </div>
          <div className="mt-6 rounded-2xl bg-white/5 p-3 text-xs leading-5 text-white/55">
            العلاقة تُعتبر صالحة إذا جابت <span className="num font-semibold text-white">{appConfig.fitnessThreshold}</span> أو أكثر. الكسور والخطّاف المكسور يحسمونها للتدوير مباشرة.
          </div>
        </div>
      )}
    </Sheet>
  )
}

function ScoreRing({ score, usable }: { score: number; usable: boolean }) {
  const r = 34
  const c = 2 * Math.PI * r
  const color = usable ? '#0FA36B' : '#B9C3CC'
  return (
    <div className="relative h-20 w-20 shrink-0">
      <svg viewBox="0 0 80 80" className="absolute inset-0 -rotate-90">
        <circle cx="40" cy="40" r={r} stroke="rgba(255,255,255,0.1)" strokeWidth="6" fill="none" />
        <motion.circle cx="40" cy="40" r={r} stroke={color} strokeWidth="6" fill="none" strokeLinecap="round" strokeDasharray={c} initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c * (1 - score / 100) }} transition={{ duration: 0.8, ease: 'easeOut' }} />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <div className="num text-2xl font-semibold leading-none">{score}</div>
          <div className="num text-[10px] text-white/50">/100</div>
        </div>
      </div>
    </div>
  )
}
