import { AnimatePresence, motion } from 'motion/react'
import QRCode from 'qrcode'
import { useEffect, useMemo, useState, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { num } from '@/lib/format'
import { Icon, type IconName } from './Icon'

export const cx = (...c: (string | false | undefined | null)[]) => c.filter(Boolean).join(' ')

type Variant = 'primary' | 'ink' | 'ghost' | 'soft' | 'copper' | 'steel' | 'danger'

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-loop text-white shadow-[0_10px_24px_-10px_rgba(15,163,107,0.7)] hover:bg-loop-700',
  ink: 'bg-ink text-white hover:bg-ink-2',
  ghost: 'bg-transparent text-ink hover:bg-ink/5',
  soft: 'bg-paper text-ink border border-ink/8 hover:bg-white',
  copper: 'bg-copper text-white shadow-[0_10px_24px_-10px_rgba(217,130,43,0.7)]',
  steel: 'steel-sheen text-ink',
  danger: 'bg-rust-50 text-rust',
}

export function Button({
  variant = 'primary',
  size = 'lg',
  icon,
  className,
  children,
  ...rest
}: { variant?: Variant; size?: 'sm' | 'md' | 'lg'; icon?: IconName } & ButtonHTMLAttributes<HTMLButtonElement>) {
  const sizes = { sm: 'h-9 px-3.5 text-sm rounded-xl gap-1.5', md: 'h-11 px-4 text-[15px] rounded-2xl gap-2', lg: 'h-14 px-5 text-base rounded-2xl gap-2.5' }
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      className={cx(
        'inline-flex select-none items-center justify-center font-semibold transition-colors disabled:pointer-events-none disabled:opacity-40',
        sizes[size],
        VARIANTS[variant],
        className,
      )}
      {...(rest as object)}
    >
      {icon && <Icon name={icon} size={size === 'sm' ? 16 : 20} />}
      {children}
    </motion.button>
  )
}

export function Card({ className, children, onClick }: { className?: string; children: ReactNode; onClick?: () => void }) {
  const Comp = onClick ? motion.button : motion.div
  return (
    <Comp
      onClick={onClick}
      whileTap={onClick ? { scale: 0.985 } : undefined}
      className={cx('block w-full rounded-xl3 bg-paper text-start shadow-card ring-1 ring-ink/5', className)}
    >
      {children}
    </Comp>
  )
}

export function Odometer({ value, className, format = num }: { value: number; className?: string; format?: (n: number) => string }) {
  const s = format(value)
  return (
    <span className={cx('num inline-flex items-baseline', className)} dir="ltr" aria-label={s}>
      {[...s].map((ch, i) => {
        const key = s.length - i
        return /\d/.test(ch) ? <Digit key={key} d={Number(ch)} /> : <span key={`s${key}`} aria-hidden>{ch}</span>
      })}
    </span>
  )
}

function Digit({ d }: { d: number }) {
  return (
    <span aria-hidden className="relative inline-block overflow-hidden" style={{ height: '1em', lineHeight: 1 }}>
      <motion.span
        className="flex flex-col"
        initial={false}
        animate={{ y: `${-d}em` }}
        transition={{ type: 'spring', stiffness: 120, damping: 18, mass: 0.8 }}
      >
        {Array.from({ length: 10 }, (_, i) => (
          <span key={i} style={{ height: '1em', lineHeight: 1 }}>
            {i}
          </span>
        ))}
      </motion.span>
    </span>
  )
}

export function WireProgress({
  value,
  reserved = 0,
  max,
  tone = 'loop',
  height = 8,
  className,
}: {
  value: number
  reserved?: number
  max: number
  tone?: 'loop' | 'steel' | 'copper'
  height?: number
  className?: string
}) {
  const p = Math.min(1, value / max)
  const r = Math.min(1 - p, reserved / max)
  const color = tone === 'loop' ? 'var(--color-loop)' : tone === 'copper' ? 'var(--color-copper)' : 'var(--color-steel)'
  return (
    <div className={cx('relative w-full overflow-hidden rounded-full bg-ink/[0.07]', className)} style={{ height }}>
      <motion.div
        className="absolute inset-y-0 start-0 rounded-full"
        style={{ background: color }}
        initial={false}
        animate={{ width: `${p * 100}%` }}
        transition={{ type: 'spring', stiffness: 80, damping: 18 }}
      />
      {r > 0 && (
        <motion.div
          className="absolute inset-y-0 rounded-full"
          style={{
            insetInlineStart: `${p * 100}%`,
            backgroundImage: `repeating-linear-gradient(-45deg, ${color} 0 3px, transparent 3px 6px)`,
            opacity: 0.55,
          }}
          initial={false}
          animate={{ width: `${r * 100}%` }}
        />
      )}
    </div>
  )
}

export function Pill({ children, tone = 'mute', className, icon }: { children: ReactNode; tone?: 'mute' | 'loop' | 'steel' | 'copper' | 'rust' | 'ink'; className?: string; icon?: IconName }) {
  const tones = {
    mute: 'bg-ink/[0.06] text-ink/70',
    loop: 'bg-loop-50 text-loop-700',
    steel: 'bg-steel-50 text-steel-700',
    copper: 'bg-copper-50 text-copper-700',
    rust: 'bg-rust-50 text-rust',
    ink: 'bg-ink text-white',
  }
  return (
    <span className={cx('inline-flex h-6 items-center gap-1 whitespace-nowrap rounded-full px-2.5 text-[12px] font-semibold', tones[tone], className)}>
      {icon && <Icon name={icon} size={13} strokeWidth={2.2} />}
      {children}
    </span>
  )
}

export function useOverlayRoot() {
  const [el, setEl] = useState<HTMLElement | null>(null)
  useEffect(() => setEl(document.getElementById('overlay-root')), [])
  return el
}

export function Sheet({
  open,
  onClose,
  children,
  dark = false,
  className,
}: {
  open: boolean
  onClose: () => void
  children: ReactNode
  dark?: boolean
  className?: string
}) {
  const root = useOverlayRoot()
  if (!root) return null
  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="pointer-events-auto absolute inset-0 z-40 flex items-end">
          <motion.div
            className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className={cx(
              'relative max-h-[88%] w-full overflow-y-auto rounded-t-[28px] px-5 pb-8 pt-3 no-scrollbar',
              dark ? 'bg-ink-2 text-white' : 'bg-paper',
              className,
            )}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 36 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, i) => {
              if (i.offset.y > 120 || i.velocity.y > 600) onClose()
            }}
          >
            <div className={cx('mx-auto mb-4 h-1.5 w-10 rounded-full', dark ? 'bg-white/20' : 'bg-ink/10')} />
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    root,
  )
}

export function TopBar({ title, back, right, dark = false, sub }: { title?: ReactNode; back?: boolean | string; right?: ReactNode; dark?: boolean; sub?: ReactNode }) {
  const nav = useNavigate()
  return (
    <div className={cx('sticky top-0 z-20 flex items-center gap-2 px-3 backdrop-blur-xl', dark ? 'bg-ink/70 text-white' : 'bg-sand/80')} style={{ paddingTop: 'var(--status, 0px)', height: 'calc(3.5rem + var(--status, 0px))' }}>
      {back ? (
        <button
          onClick={() => (typeof back === 'string' ? nav(back) : nav(-1))}
          className={cx('grid h-10 w-10 place-items-center rounded-full', dark ? 'hover:bg-white/10' : 'hover:bg-ink/5')}
          aria-label="رجوع"
        >
          <Icon name="back" />
        </button>
      ) : (
        <div className="w-2" />
      )}
      <div className="min-w-0 flex-1">
        {title && <div className="truncate font-display text-[17px] font-semibold">{title}</div>}
        {sub && <div className={cx('truncate text-xs', dark ? 'text-white/60' : 'text-mute')}>{sub}</div>}
      </div>
      {right}
    </div>
  )
}

export function QR({ value, size = 168, color = '#0F1714', accent }: { value: string; size?: number; color?: string; accent?: string }) {
  const { n, cells } = useMemo(() => {
    const q = QRCode.create(value, { errorCorrectionLevel: 'M' })
    const n = q.modules.size
    const cells: [number, number][] = []
    for (let y = 0; y < n; y++)
      for (let x = 0; x < n; x++) {
        const finder = (x < 7 && y < 7) || (x >= n - 7 && y < 7) || (x < 7 && y >= n - 7)
        if (!finder && q.modules.get(x, y)) cells.push([x, y])
      }
    return { n, cells }
  }, [value])
  const finders = [
    [0, 0],
    [n - 7, 0],
    [0, n - 7],
  ]
  return (
    <svg width={size} height={size} viewBox={`-1 -1 ${n + 2} ${n + 2}`} aria-label="رمز QR">
      {cells.map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x + 0.1} y={y + 0.1} width={0.8} height={0.8} rx={0.38} fill={color} />
      ))}
      {finders.map(([x, y]) => (
        <g key={`${x}-${y}`}>
          <rect x={x + 0.5} y={y + 0.5} width={6} height={6} rx={1.8} fill="none" stroke={color} strokeWidth={1} />
          <rect x={x + 2} y={y + 2} width={3} height={3} rx={0.9} fill={accent ?? color} />
        </g>
      ))}
    </svg>
  )
}

export function LaundryBadge({ name, hue, size = 44 }: { name: string; hue: number; size?: number }) {
  const letter = name.replace('مغسلة ', '').replace(/[ًٌٍَُِّْ]/g, '').trim()[0] ?? 'م'
  return (
    <div
      className="grid shrink-0 place-items-center rounded-2xl font-display font-semibold text-white"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.42,
        background: `linear-gradient(140deg, hsl(${hue} 46% 46%), hsl(${(hue + 30) % 360} 52% 34%))`,
      }}
    >
      {letter}
    </div>
  )
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-3 mt-7 flex items-end justify-between px-1">
      <h2 className="font-display text-[17px] font-semibold">{children}</h2>
      {action}
    </div>
  )
}

export function Stat({ label, value, hint, tone }: { label: string; value: ReactNode; hint?: ReactNode; tone?: 'loop' | 'steel' | 'copper' }) {
  const c = tone === 'loop' ? 'text-loop-700' : tone === 'copper' ? 'text-copper-700' : tone === 'steel' ? 'text-steel-700' : 'text-ink'
  return (
    <div>
      <div className="text-xs text-mute">{label}</div>
      <div className={cx('num mt-1 text-2xl font-semibold', c)}>{value}</div>
      {hint && <div className="mt-0.5 text-[11px] text-mute">{hint}</div>}
    </div>
  )
}

export function Toast({ show, children, tone = 'ink' }: { show: boolean; children: ReactNode; tone?: 'ink' | 'loop' }) {
  const root = useOverlayRoot()
  if (!root) return null
  return createPortal(
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          className={cx(
            'pointer-events-auto absolute inset-x-4 top-4 z-50 flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-white shadow-lift',
            tone === 'loop' ? 'bg-loop' : 'bg-ink',
          )}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>,
    root,
  )
}
