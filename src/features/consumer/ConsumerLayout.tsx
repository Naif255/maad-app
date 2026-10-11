import { motion } from 'motion/react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { Icon, type IconName } from '@/ui/Icon'
import { cx } from '@/ui/kit'
import { RewardLanded } from './RewardLanded'
import { useScrollReset } from '@/ui/useScrollReset'

const TABS: { to: string; label: string; icon: IconName; end?: boolean }[] = [
  { to: '/c', label: 'الرئيسية', icon: 'home', end: true },
  { to: '/c/wallet', label: 'المحفظة', icon: 'wallet' },
  { to: '/c/scan', label: 'افحص', icon: 'scan' },
  { to: '/c/history', label: 'رجّعاتي', icon: 'history' },
  { to: '/c/me', label: 'حسابي', icon: 'user' },
]

export function ConsumerLayout() {
  const scrollRef = useScrollReset()
  const loc = useLocation()
  const hideTabs = /^\/c\/(scan|summary|book|receipt|reward|request)/.test(loc.pathname)
  return (
    <div className="flex h-full flex-col">
      <div ref={scrollRef} id="c-scroll" className="relative min-h-0 flex-1 overflow-y-auto overflow-x-hidden no-scrollbar">
        <Outlet />
      </div>
      {!hideTabs && <TabBar />}
      <RewardLanded />
    </div>
  )
}

function TabBar() {
  return (
    <nav className="relative z-30 shrink-0 border-t border-ink/5 bg-paper/90 px-2 pb-[max(env(safe-area-inset-bottom),10px)] pt-1.5 backdrop-blur-xl">
      <div className="flex items-end justify-around">
        {TABS.map((t) =>
          t.icon === 'scan' ? (
            <NavLink key={t.to} to={t.to} className="-mt-6 flex flex-col items-center gap-1">
              <motion.span whileTap={{ scale: 0.92 }} className="grid h-14 w-14 place-items-center rounded-[20px] bg-ink text-white shadow-lift ring-4 ring-sand">
                <Icon name="scan" size={24} />
              </motion.span>
              <span className="text-[11px] font-semibold text-ink">{t.label}</span>
            </NavLink>
          ) : (
            <NavLink key={t.to} to={t.to} end={t.end} className={({ isActive }) => cx('flex w-14 flex-col items-center gap-1 py-1 text-[11px] font-semibold', isActive ? 'text-loop-700' : 'text-faint')}>
              {({ isActive }) => (
                <>
                  <Icon name={t.icon} size={22} strokeWidth={isActive ? 2.1 : 1.8} />
                  {t.label}
                </>
              )}
            </NavLink>
          ),
        )}
      </div>
    </nav>
  )
}
