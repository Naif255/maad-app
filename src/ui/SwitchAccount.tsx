import { useNavigate } from 'react-router-dom'
import { useStore } from '@/store/store'
import { Icon } from './Icon'
import { cx } from './kit'

export function SwitchAccount({ className }: { className?: string }) {
  const nav = useNavigate()
  const setAccount = useStore((s) => s.setAccount)
  return (
    <button
      onClick={() => {
        setAccount(undefined)
        nav('/start')
      }}
      className={cx('flex w-full items-center gap-3 rounded-2xl bg-paper px-4 py-4 text-start text-sm font-semibold shadow-card ring-1 ring-ink/5', className)}
    >
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-sand-2">
        <Icon name="replay" size={18} />
      </span>
      <span className="flex-1">تبديل الحساب</span>
      <Icon name="chevron" size={18} className="text-mute" />
    </button>
  )
}
