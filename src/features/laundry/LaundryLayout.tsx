import { NavLink, Outlet } from 'react-router-dom'
import { DEMO_LAUNDRY_ID } from '@/data/seed'
import { byId } from '@/domain/services'
import { useStore } from '@/store/store'
import { Icon, type IconName } from '@/ui/Icon'
import { cx } from '@/ui/kit'
import { useScrollReset } from '@/ui/useScrollReset'

export const useLaundry = () => {
  const db = useStore((s) => s.db)
  return byId(db.laundries, DEMO_LAUNDRY_ID)!
}

const TABS: { to: string; label: string; icon: IconName; end?: boolean }[] = [
  { to: '/l', label: 'اللوحة', icon: 'home', end: true },
  { to: '/l/new', label: 'طلب جديد', icon: 'plus' },
  { to: '/l/scan', label: 'امسح', icon: 'qr' },
  { to: '/l/history', label: 'السجل', icon: 'history' },
  { to: '/l/settings', label: 'الإعدادات', icon: 'settings' },
]

export function LaundryLayout() {
  const scrollRef = useScrollReset()
  return (
    <div className="flex h-full flex-col bg-[#F3F1EC]">
      <div ref={scrollRef} id="l-scroll" className="relative min-h-0 flex-1 overflow-y-auto overflow-x-hidden no-scrollbar">
        <Outlet />
      </div>
      <nav className="shrink-0 border-t border-ink/5 bg-paper/95 px-2 pb-[max(env(safe-area-inset-bottom),10px)] pt-1.5 backdrop-blur-xl">
        <div className="flex items-end justify-around">
          {TABS.map((t) =>
            t.icon === 'qr' ? (
              <NavLink key={t.to} to={t.to} className="-mt-6 flex flex-col items-center gap-1">
                <span className="grid h-14 w-14 place-items-center rounded-[20px] bg-loop text-white shadow-lift ring-4 ring-[#F3F1EC]">
                  <Icon name="qr" size={24} />
                </span>
                <span className="text-[11px] font-semibold">{t.label}</span>
              </NavLink>
            ) : (
              <NavLink key={t.to} to={t.to} end={t.end} className={({ isActive }) => cx('flex w-14 flex-col items-center gap-1 py-1 text-[11px] font-semibold', isActive ? 'text-ink' : 'text-faint')}>
                <Icon name={t.icon} size={22} />
                {t.label}
              </NavLink>
            ),
          )}
        </div>
      </nav>
    </div>
  )
}
