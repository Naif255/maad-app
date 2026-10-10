import { motion } from 'motion/react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useStore, type Account } from '@/store/store'
import { Icon, type IconName } from '@/ui/Icon'
import { cx } from '@/ui/kit'
import { LogoMark } from '@/ui/Logo'

export const ACCOUNT_HOME: Record<Account, string> = { consumer: '/c', laundry: '/l', factory: '/f' }

const OPTIONS: { id: Account; icon: IconName; title: string; text: string }[] = [
  { id: 'consumer', icon: 'user', title: 'فرد', text: 'رجّع علاقاتك واكسب كوبونات ونقاط' },
  { id: 'laundry', icon: 'store', title: 'مغسلة', text: 'استرجع علاقات صالحة وبع الخردة' },
  { id: 'factory', icon: 'factory', title: 'مصنع', text: 'استلم حديد مفروز بشهادة توريد' },
]

export function RootRedirect() {
  const account = useStore((s) => s.account)
  return <Navigate to={account ? ACCOUNT_HOME[account] : '/start'} replace />
}

export function Start() {
  const nav = useNavigate()
  const setAccount = useStore((s) => s.setAccount)
  const pick = (a: Account) => {
    setAccount(a)
    nav(ACCOUNT_HOME[a], { replace: true })
  }
  return (
    <div
      className="relative flex min-h-full flex-col overflow-hidden bg-ink px-6 text-white"
      style={{ paddingTop: 'calc(var(--status, 0px) + 64px)', paddingBottom: 'max(env(safe-area-inset-bottom), 28px)' }}
    >
      <div className="pointer-events-none absolute -left-28 top-[34%] opacity-[0.05]">
        <LogoMark size={420} color="#0FA36B" strokeWidth={1.4} />
      </div>
      <div className="relative">
        <LogoMark size={76} color="#0FA36B" draw strokeWidth={3} />
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="mt-6 font-display text-[44px] font-semibold leading-none">
          مَعاد
        </motion.h1>
        <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }} className="mt-3 max-w-[17rem] text-[15px] leading-7 text-white/60">
          علاقات الملابس ترجع للمغسلة، والتالف منها يصير حديد من جديد.
        </motion.p>
      </div>

      <div className="relative mt-auto pt-10">
        <div className="mb-3 text-sm font-semibold text-white/45">اختر نوع حسابك</div>
        <div className="space-y-2.5">
          {OPTIONS.map((o, i) => (
            <motion.button
              key={o.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.75 + i * 0.08 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => pick(o.id)}
              className={cx('flex w-full items-center gap-4 rounded-[22px] p-4 text-start', i === 0 ? 'bg-loop text-white' : 'bg-white/[0.06] ring-1 ring-white/10')}
            >
              <span className={cx('grid h-12 w-12 shrink-0 place-items-center rounded-2xl', i === 0 ? 'bg-white/20' : 'bg-white/10')}>
                <Icon name={o.icon} size={22} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-display text-lg font-semibold">{o.title}</span>
                <span className={cx('block text-[13px]', i === 0 ? 'text-white/80' : 'text-white/50')}>{o.text}</span>
              </span>
              <Icon name="chevron" size={20} className="shrink-0 opacity-60" />
            </motion.button>
          ))}
        </div>
        <Link to="/impact" className="mx-auto mt-6 flex w-fit items-center gap-1.5 text-sm font-semibold text-white/55 hover:text-white">
          <Icon name="chart" size={16} />
          أثر مَعاد في بريدة
        </Link>
      </div>
    </div>
  )
}
