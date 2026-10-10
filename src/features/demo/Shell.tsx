import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useStore, type Role } from '@/store/store'
import { Icon, type IconName } from '@/ui/Icon'
import { cx } from '@/ui/kit'
import { Logo } from '@/ui/Logo'
import { ImpactLive } from '../impact/ImpactLive'
import { STORY, storyIndex } from './story'

export function useMedia(q: string) {
  const [m, setM] = useState(() => window.matchMedia(q).matches)
  useEffect(() => {
    const mq = window.matchMedia(q)
    const f = () => setM(mq.matches)
    mq.addEventListener('change', f)
    return () => mq.removeEventListener('change', f)
  }, [q])
  return m
}

export const ROLES: { id: Role; label: string; icon: IconName; path: string }[] = [
  { id: 'consumer', label: 'المستهلك', icon: 'user', path: '/c' },
  { id: 'laundry', label: 'المغسلة', icon: 'store', path: '/l' },
  { id: 'factory', label: 'المصنع', icon: 'factory', path: '/f' },
  { id: 'impact', label: 'الأثر', icon: 'chart', path: '/impact' },
]

export function roleOf(path: string): Role {
  if (path.startsWith('/l')) return 'laundry'
  if (path.startsWith('/f')) return 'factory'
  if (path.startsWith('/impact')) return 'impact'
  return 'consumer'
}

export function Shell({ children }: { children: ReactNode }) {
  const wide = useMedia('(min-width: 1100px)')
  const loc = useLocation()
  const full = loc.pathname.startsWith('/impact') || loc.pathname.startsWith('/brand')
  const stage = new URLSearchParams(loc.search).get('stage') !== '0'

  if (!wide) {
    return (
      <div className="relative h-dvh w-full overflow-hidden bg-sand" style={{ ['--status' as string]: 'env(safe-area-inset-top, 0px)' }}>
        <Frame>{children}</Frame>
        {!full && <RoleFab />}
      </div>
    )
  }
  if (full) {
    return (
      <div className="flex h-dvh flex-col bg-ink">
        <Director />
        <div className="relative min-h-0 flex-1 overflow-y-auto">
          {children}
          <div id="overlay-root" className="pointer-events-none fixed inset-0 z-50" />
        </div>
      </div>
    )
  }
  return (
    <div className="flex h-dvh flex-col bg-ink">
      <Director />
      <div className="flex min-h-0 flex-1 gap-6 p-5">
        <PhoneFrame>{children}</PhoneFrame>
        {stage && (
          <div className="min-w-0 flex-1 overflow-hidden rounded-[28px] bg-ink-2 ring-1 ring-white/5">
            <ImpactLive compact />
          </div>
        )}
      </div>
    </div>
  )
}

function Frame({ children }: { children: ReactNode }) {
  return (
    <div className="relative h-full w-full overflow-hidden">
      {children}
      <div id="overlay-root" className="pointer-events-none absolute inset-0 z-50" />
    </div>
  )
}

function PhoneFrame({ children }: { children: ReactNode }) {
  const [h, setH] = useState(() => Math.min(860, window.innerHeight - 104))
  useEffect(() => {
    const f = () => setH(Math.min(860, window.innerHeight - 104))
    window.addEventListener('resize', f)
    return () => window.removeEventListener('resize', f)
  }, [])
  const w = Math.round((h * 400) / 860)
  return (
    <div className="relative shrink-0 rounded-[48px] bg-[#050806] p-[10px] shadow-[0_40px_80px_-30px_rgba(0,0,0,0.8),inset_0_0_0_1.5px_rgba(255,255,255,0.08)]" style={{ width: w + 20, height: h + 20 }}>
      <div className="relative h-full w-full overflow-hidden rounded-[38px] bg-sand" style={{ transform: 'translateZ(0)', ['--status' as string]: '34px' }}>
        <Frame>{children}</Frame>
        <div className="pointer-events-none absolute left-1/2 top-2 z-[60] h-[26px] w-[96px] -translate-x-1/2 rounded-full bg-black" />
      </div>
    </div>
  )
}

function Director() {
  const nav = useNavigate()
  const loc = useLocation()
  const role = roleOf(loc.pathname)
  const reset = useStore((s) => s.reset)
  const advance = useStore((s) => s.advanceClock)
  const source = useStore((s) => s.scanSource)
  const setSource = useStore((s) => s.setScanSource)
  const offset = useStore((s) => s.clockOffset)
  const hideNearby = useStore((s) => s.hideNearby)
  const setHideNearby = useStore((s) => s.setHideNearby)
  const [flash, setFlash] = useState(false)
  const idx = storyIndex(loc.pathname)

  const doReset = () => {
    reset()
    nav('/c')
    setFlash(true)
    setTimeout(() => setFlash(false), 900)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest('input,textarea')) return
      if (e.key === 'r' && e.shiftKey) doReset()
      const n = Number(e.key)
      if (e.altKey && n >= 1 && n <= ROLES.length) nav(ROLES[n - 1].path)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return (
    <div className="relative flex h-16 shrink-0 items-center gap-5 border-b border-white/5 bg-ink px-5 text-white">
      <Logo size={22} tone="light" />
      <div className="flex rounded-2xl bg-white/5 p-1">
        {ROLES.map((r) => (
          <button
            key={r.id}
            onClick={() => nav(r.path)}
            className={cx('relative flex h-9 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold transition-colors', role === r.id ? 'text-ink' : 'text-white/60 hover:text-white')}
          >
            {role === r.id && <motion.span layoutId="role-pill" className="absolute inset-0 rounded-xl bg-white" transition={{ type: 'spring', stiffness: 400, damping: 34 }} />}
            <Icon name={r.icon} size={16} className="relative" />
            <span className="relative">{r.label}</span>
          </button>
        ))}
      </div>
      <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto no-scrollbar">
        {STORY.map((s, i) => (
          <button
            key={s.id}
            onClick={() => nav(s.path)}
            title={s.hint}
            className={cx(
              'flex h-8 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold transition-colors',
              i === idx ? 'bg-loop text-white' : i < idx ? 'text-loop-100/80 hover:bg-white/5' : 'text-white/45 hover:bg-white/5',
            )}
          >
            <span className={cx('num grid h-5 w-5 place-items-center rounded-full text-[11px]', i === idx ? 'bg-white/20' : 'bg-white/10')}>{i + 1}</span>
            {i === idx && s.title}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <div className="flex rounded-xl bg-white/5 p-0.5 text-xs font-semibold">
          {(['demo', 'camera'] as const).map((s) => (
            <button key={s} onClick={() => setSource(s)} className={cx('flex h-8 items-center gap-1 rounded-[10px] px-2.5', source === s ? 'bg-white/15 text-white' : 'text-white/50')}>
              <Icon name={s === 'demo' ? 'film' : 'camera'} size={14} />
              {s === 'demo' ? 'فيديو العرض' : 'الكاميرا'}
            </button>
          ))}
        </div>
        <button
          onClick={() => setHideNearby(!hideNearby)}
          className={cx('grid h-9 w-9 place-items-center rounded-xl', hideNearby ? 'bg-copper text-white' : 'bg-white/5 text-white/60 hover:text-white')}
          title="محاكاة: ما فيه طلبات قريبة"
        >
          <Icon name="bell" size={16} />
        </button>
        <button onClick={() => advance(48)} className="flex h-9 items-center gap-1.5 rounded-xl bg-white/5 px-3 text-xs font-semibold text-white/70 hover:text-white" title="قدّم الوقت 48 ساعة">
          <Icon name="forward" size={14} />
          48 ساعة
          {offset > 0 && <span className="num rounded-full bg-copper px-1.5 text-[10px] text-white">+{Math.round(offset / 3600000)}</span>}
        </button>
        <button onClick={doReset} className="flex h-9 items-center gap-1.5 rounded-xl bg-white px-3 text-xs font-bold text-ink hover:bg-loop-50" title="Shift+R">
          <Icon name="replay" size={15} />
          إعادة العرض
        </button>
      </div>
      <AnimatePresence>
        {flash && (
          <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.6 }} className="absolute inset-x-0 bottom-0 h-0.5 origin-right bg-loop" />
        )}
      </AnimatePresence>
    </div>
  )
}

function RoleFab() {
  const [open, setOpen] = useState(false)
  const nav = useNavigate()
  const reset = useStore((s) => s.reset)
  const loc = useLocation()
  const role = roleOf(loc.pathname)
  return (
    <div dir="ltr" className="absolute left-0 top-[42%] z-[70] flex items-start">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            dir="rtl"
            className="order-2 ml-2 w-44 overflow-hidden rounded-2xl bg-ink p-1.5 text-white shadow-lift"
          >
            {ROLES.map((r) => (
              <button
                key={r.id}
                onClick={() => {
                  nav(r.path)
                  setOpen(false)
                }}
                className={cx('flex h-10 w-full items-center gap-2 rounded-xl px-3 text-sm font-semibold', role === r.id ? 'bg-white text-ink' : 'text-white/75')}
              >
                <Icon name={r.icon} size={16} />
                {r.label}
              </button>
            ))}
            <button
              onClick={() => {
                reset()
                nav('/c')
                setOpen(false)
              }}
              className="mt-1 flex h-10 w-full items-center gap-2 rounded-xl px-3 text-sm font-semibold text-copper-100"
            >
              <Icon name="replay" size={16} />
              إعادة العرض
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      <button onClick={() => setOpen((o) => !o)} className="order-1 grid h-12 w-6 place-items-center rounded-r-xl bg-ink/70 text-white/90 shadow-lift backdrop-blur" aria-label="تبديل الدور">
        <Icon name={open ? 'close' : 'layers'} size={14} />
      </button>
    </div>
  )
}
