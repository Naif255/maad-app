import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '@/store/store'
import { Icon, type IconName } from './Icon'
import { cx } from './kit'

export function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button onClick={() => onChange(!on)} className={cx('relative h-7 w-12 shrink-0 rounded-full transition-colors', on ? 'bg-loop' : 'bg-ink/15')} role="switch" aria-checked={on} aria-label={label}>
      <motion.span className="absolute top-0.5 h-6 w-6 rounded-full bg-white shadow" initial={false} animate={{ right: on ? 22 : 2 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }} />
    </button>
  )
}

export function Group({ title, note, children }: { title?: string; note?: ReactNode; children: ReactNode }) {
  return (
    <section className="mt-6 first:mt-0">
      {title && <h2 className="mb-2 px-4 text-[13px] font-semibold text-mute">{title}</h2>}
      <div className="divide-y divide-ink/[0.06] overflow-hidden rounded-[20px] bg-paper ring-1 ring-ink/5">{children}</div>
      {note && <p className="mt-2 px-4 text-xs leading-5 text-mute">{note}</p>}
    </section>
  )
}

export function Row({
  icon,
  label,
  value,
  sub,
  onClick,
  right,
  tone = 'ink',
}: {
  icon?: IconName
  label: ReactNode
  value?: ReactNode
  sub?: ReactNode
  onClick?: () => void
  right?: ReactNode
  tone?: 'ink' | 'loop' | 'copper' | 'steel' | 'rust'
}) {
  const tones = { ink: 'bg-ink/[0.06] text-ink', loop: 'bg-loop-50 text-loop-700', copper: 'bg-copper-50 text-copper-700', steel: 'bg-steel-50 text-steel-700', rust: 'bg-rust-50 text-rust' }
  const body = (
    <>
      {icon && (
        <span className={cx('grid h-9 w-9 shrink-0 place-items-center rounded-xl', tones[tone])}>
          <Icon name={icon} size={18} />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-medium">{label}</span>
        {sub && <span className="mt-0.5 block text-xs leading-5 text-mute">{sub}</span>}
      </span>
      {value !== undefined && <span className="num shrink-0 text-[15px] text-mute">{value}</span>}
      {right}
      {onClick && !right && <Icon name="chevron" size={18} className="shrink-0 text-faint" />}
    </>
  )
  const cls = 'flex min-h-[56px] w-full items-center gap-3 px-4 py-2.5 text-start'
  return onClick ? (
    <button onClick={onClick} className={cx(cls, 'active:bg-ink/[0.03]')}>
      {body}
    </button>
  ) : (
    <div className={cls}>{body}</div>
  )
}

export function Profile({ avatar, title, sub }: { avatar: ReactNode; title: ReactNode; sub?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col items-center pt-2 text-center">
      {avatar}
      <div className="mt-3 font-display text-xl font-semibold">{title}</div>
      {sub && <div className="mt-0.5 text-sm text-mute">{sub}</div>}
    </div>
  )
}

export function SwitchAccount() {
  const nav = useNavigate()
  const setAccount = useStore((s) => s.setAccount)
  return (
    <Group>
      <Row
        icon="replay"
        label="تبديل الحساب"
        onClick={() => {
          setAccount(undefined)
          nav('/welcome')
        }}
      />
    </Group>
  )
}
