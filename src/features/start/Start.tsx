import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { appConfig } from '@/config/app'
import { DEMO_FACTORY_ID, DEMO_LAUNDRY_ID, DEMO_PHONE } from '@/data/seed'
import { byId, nearbyRequestCount } from '@/domain/services'
import { phone as fmtPhone } from '@/lib/format'
import { useStore, type Account } from '@/store/store'
import { Icon, type IconName } from '@/ui/Icon'
import { Button, cx, LaundryBadge, TopBar } from '@/ui/kit'
import { LogoMark } from '@/ui/Logo'

export const ACCOUNT_HOME: Record<Account, string> = { consumer: '/c', laundry: '/l', factory: '/f' }

const OPTIONS: { id: Account; icon: IconName; title: string; text: string }[] = [
  { id: 'consumer', icon: 'user', title: 'عندي علاقات في البيت', text: 'رجّعها واكسب كوبونات من مغسلتك' },
  { id: 'laundry', icon: 'store', title: 'عندي مغسلة', text: 'استلم علاقات صالحة وبع التالف خردة' },
  { id: 'factory', icon: 'factory', title: 'عندي مصنع حديد', text: 'استلم صناديق الخردة بجولة وحدة' },
]

const STEPS: { icon: IconName; t: string; tone: 'loop' | 'steel' }[] = [
  { icon: 'scan', t: 'افحصها بالكاميرا', tone: 'loop' },
  { icon: 'store', t: 'سلّمها للمغسلة', tone: 'loop' },
  { icon: 'factory', t: 'التالف يصير حديد', tone: 'steel' },
]

export function RootRedirect() {
  const account = useStore((s) => s.account)
  const signed = useStore((s) => (account ? s.signedIn.includes(account) : false))
  return <Navigate to={account && signed ? ACCOUNT_HOME[account] : '/welcome'} replace />
}

export function RequireSession({ role, children }: { role: Account; children: ReactNode }) {
  const signed = useStore((s) => s.signedIn.includes(role))
  const any = useStore((s) => s.signedIn.length > 0)
  const demo = useStore((s) => s.demo)
  const ensure = useStore((s) => s.ensureSession)
  useLayoutEffect(() => {
    if (!signed && demo) ensure(role)
  }, [signed, demo, ensure, role])
  if (signed) return children
  if (demo) return null
  return <Navigate to={any ? `/signin/${role}` : '/welcome'} replace />
}

export function Welcome() {
  const nav = useNavigate()
  const signedIn = useStore((s) => s.signedIn)
  const setAccount = useStore((s) => s.setAccount)
  const pick = (a: Account) => {
    if (signedIn.includes(a)) {
      setAccount(a)
      nav(ACCOUNT_HOME[a], { replace: true })
    } else nav(`/signin/${a}`)
  }
  return (
    <div className="relative flex h-full flex-col overflow-y-auto bg-ink px-6 text-white no-scrollbar" style={{ paddingTop: 'calc(var(--status, 0px) + 40px)', paddingBottom: 'max(env(safe-area-inset-bottom), 24px)' }}>
      <div className="pointer-events-none absolute -left-32 top-24 opacity-[0.045]">
        <LogoMark size={460} color="#0FA36B" strokeWidth={1.4} />
      </div>
      <div className="relative">
        <div className="flex items-center gap-2.5">
          <LogoMark size={42} color="#0FA36B" draw strokeWidth={3} />
          <span className="font-display text-2xl font-semibold">مَعاد</span>
        </div>
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="mt-7 font-display text-[30px] font-semibold leading-[1.3]">
          علاقات الملابس في بيتك
          <br />
          <span className="text-loop">لها رجعة.</span>
        </motion.h1>
      </div>

      <Steps />

      <div className="relative">
        <div className="mb-3 text-sm font-semibold text-white/50">مين أنت؟</div>
        <div className="space-y-2.5">
          {OPTIONS.map((o, i) => (
            <motion.button
              key={o.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 + i * 0.07 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => pick(o.id)}
              className={cx('flex w-full items-center gap-3.5 rounded-[20px] p-3.5 text-start', i === 0 ? 'bg-loop text-white' : 'bg-white/[0.06] ring-1 ring-white/10')}
            >
              <span className={cx('grid h-11 w-11 shrink-0 place-items-center rounded-2xl', i === 0 ? 'bg-white/20' : 'bg-white/10')}>
                <Icon name={o.icon} size={21} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-display text-[16px] font-semibold">{o.title}</span>
                <span className={cx('block text-[13px]', i === 0 ? 'text-white/80' : 'text-white/50')}>{o.text}</span>
              </span>
              <Icon name="chevron" size={20} className="shrink-0 opacity-60" />
            </motion.button>
          ))}
        </div>
        <Link to="/impact" className="mx-auto mt-5 flex w-fit items-center gap-1.5 py-1 text-sm font-semibold text-white/55 hover:text-white">
          <Icon name="chart" size={16} />
          شوف أثر مَعاد في بريدة
        </Link>
      </div>
    </div>
  )
}

function Steps() {
  const [on, setOn] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setOn((x) => (x + 1) % STEPS.length), 1600)
    return () => clearInterval(id)
  }, [])
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }} className="relative my-auto py-8">
      <div className="absolute inset-x-[16%] top-[64px] h-0.5 bg-[repeating-linear-gradient(90deg,rgba(255,255,255,0.18)_0_6px,transparent_6px_11px)]" />
      <div className="relative grid grid-cols-3 gap-2">
        {STEPS.map((s, i) => {
          const active = on === i
          const color = s.tone === 'loop' ? 'bg-loop' : 'steel-sheen'
          return (
            <div key={s.t} className="flex flex-col items-center text-center">
              <motion.div
                animate={{ scale: active ? 1.08 : 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 18 }}
                className={cx('relative grid h-16 w-16 place-items-center rounded-[20px] transition-colors duration-500', active ? cx(color, s.tone === 'steel' ? 'text-ink' : 'text-white') : 'bg-ink-3 text-white/70 ring-1 ring-white/10')}
              >
                <Icon name={s.icon} size={27} />
                <span className="num absolute -top-1.5 -right-1.5 grid h-5 w-5 place-items-center rounded-full bg-paper text-[11px] font-bold text-ink">{i + 1}</span>
              </motion.div>
              <div className={cx('mt-2.5 text-[13px] font-semibold leading-5 transition-colors duration-500', active ? 'text-white' : 'text-white/55')}>{s.t}</div>
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}

export function SignIn() {
  const { role = 'consumer' } = useParams()
  if (role === 'laundry' || role === 'factory') return <BusinessSignIn role={role} />
  return <ConsumerSignIn />
}

function ConsumerSignIn() {
  const nav = useNavigate()
  const signIn = useStore((s) => s.signIn)
  const [step, setStep] = useState<'phone' | 'otp' | 'hood'>('phone')
  const [num, setNum] = useState(fmtPhone(DEMO_PHONE))
  const [hood, setHood] = useState<string>()
  const digits = num.replace(/\D/g, '')
  const valid = /^05\d{8}$/.test(digits)
  const finish = () => {
    signIn('consumer', { phone: digits, neighborhoodId: hood })
    nav('/c', { replace: true })
  }
  return (
    <div id="signin-scroll" className="flex h-full flex-col overflow-y-auto bg-sand no-scrollbar">
      <TopBar back={step === 'phone' ? '/welcome' : () => setStep('phone')} right={<StepDots step={['phone', 'otp', 'hood'].indexOf(step)} />} />
      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 24 }} transition={{ duration: 0.22 }} className="flex flex-1 flex-col px-5 pt-4">
          {step === 'phone' && (
            <>
              <h1 className="font-display text-[26px] font-semibold">رقم جوالك</h1>
              <p className="mt-1.5 text-[15px] text-mute">نرسل لك رمز تحقق برسالة نصية.</p>
              <label className="mt-8 flex h-16 items-center gap-3 rounded-2xl bg-paper px-4 shadow-card ring-1 ring-ink/5 focus-within:ring-2 focus-within:ring-loop" dir="ltr">
                <span className="num border-e border-ink/10 pe-3 text-[17px] font-semibold text-mute">+966</span>
                <input
                  aria-label="رقم الجوال"
                  inputMode="tel"
                  value={num}
                  onChange={(e) => setNum(e.target.value.replace(/[^\d ]/g, '').slice(0, 12))}
                  className="num min-w-0 flex-1 bg-transparent text-xl font-semibold tracking-wide outline-none"
                />
              </label>
              <p className="mt-3 text-xs leading-5 text-faint">بالمتابعة توافق على شروط الاستخدام وسياسة الخصوصية.</p>
              <div className="mt-auto pb-6 pt-6">
                <Button className="w-full" disabled={!valid} onClick={() => setStep('otp')}>
                  أرسل الرمز
                </Button>
              </div>
            </>
          )}
          {step === 'otp' && <Otp phone={fmtPhone(digits)} onDone={() => setStep('hood')} />}
          {step === 'hood' && <HoodPicker value={hood} onChange={setHood} onDone={finish} />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

function StepDots({ step }: { step: number }) {
  return (
    <div className="flex gap-1.5 pe-3">
      {[0, 1, 2].map((i) => (
        <span key={i} className={cx('h-1.5 rounded-full transition-all', i === step ? 'w-5 bg-loop' : i < step ? 'w-1.5 bg-loop' : 'w-1.5 bg-ink/15')} />
      ))}
    </div>
  )
}

const CODE = '4827'

function Otp({ phone, onDone }: { phone: string; onDone: () => void }) {
  const [code, setCode] = useState('')
  const [sms, setSms] = useState(false)
  const done = useRef(onDone)
  done.current = onDone
  useEffect(() => {
    const timers = [setTimeout(() => setSms(true), 700)]
    for (let i = 1; i <= 4; i++) timers.push(setTimeout(() => setCode(CODE.slice(0, i)), 1100 + i * 140))
    timers.push(setTimeout(() => done.current(), 2200))
    return () => timers.forEach(clearTimeout)
  }, [])
  return (
    <>
      <h1 className="font-display text-[26px] font-semibold">رمز التحقق</h1>
      <p className="mt-1.5 text-[15px] text-mute">
        أرسلناه إلى{' '}
        <span className="num font-semibold text-ink" dir="ltr">
          {phone}
        </span>
      </p>
      <div className="mt-8 flex justify-center gap-3" dir="ltr">
        {[0, 1, 2, 3].map((i) => (
          <motion.div
            key={i}
            animate={{ scale: code.length === i + 1 ? [1, 1.08, 1] : 1 }}
            className={cx('num grid h-16 w-14 place-items-center rounded-2xl bg-paper text-3xl font-semibold shadow-card ring-1', code[i] ? 'ring-loop' : 'ring-ink/5')}
          >
            {code[i] ?? ''}
          </motion.div>
        ))}
      </div>
      <AnimatePresence>
        {sms && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mx-auto mt-6 flex items-center gap-2 rounded-full bg-loop-50 px-3.5 py-2 text-sm font-semibold text-loop-700">
            <Icon name="check" size={16} strokeWidth={2.4} />
            وصل الرمز وعبّيناه لك
          </motion.div>
        )}
      </AnimatePresence>
      <div className="mt-auto pb-6 pt-6">
        <Button className="w-full" disabled={code.length < 4} onClick={onDone}>
          تأكيد
        </Button>
      </div>
    </>
  )
}

function HoodPicker({ value, onChange, onDone }: { value?: string; onChange: (id: string) => void; onDone: () => void }) {
  const db = useStore((s) => s.db)
  const hoods = useMemo(() => db.neighborhoods.map((n) => ({ n, count: nearbyRequestCount(db, n.id, appConfig.nearbyRadiusKm) })), [db])
  return (
    <>
      <h1 className="font-display text-[26px] font-semibold">وين ساكن؟</h1>
      <p className="mt-1.5 text-[15px] text-mute">نوريك المغاسل اللي تحتاج علاقات قريب منك.</p>
      <div className="mt-6 grid grid-cols-2 gap-2.5">
        {hoods.map(({ n, count }) => {
          const on = value === n.id
          return (
            <motion.button
              key={n.id}
              whileTap={{ scale: 0.97 }}
              onClick={() => onChange(n.id)}
              className={cx('flex items-center gap-2.5 rounded-2xl p-3.5 text-start ring-1 transition-colors', on ? 'bg-loop-50 ring-2 ring-loop' : 'bg-paper ring-ink/5')}
            >
              <Icon name="pin" size={18} className={on ? 'text-loop' : 'text-faint'} />
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">{n.name}</span>
                <span className="block text-xs text-mute">{count ? `${count} ${count > 2 ? 'مغاسل' : count === 2 ? 'مغسلتين' : 'مغسلة'} قريبة` : 'ما فيه طلبات الحين'}</span>
              </span>
            </motion.button>
          )
        })}
      </div>
      <div className="sticky bottom-0 mt-auto bg-gradient-to-t from-sand via-sand to-transparent pb-6 pt-6">
        <Button className="w-full" disabled={!value} onClick={onDone}>
          يلا نبدأ
        </Button>
      </div>
    </>
  )
}

function BusinessSignIn({ role }: { role: 'laundry' | 'factory' }) {
  const nav = useNavigate()
  const db = useStore((s) => s.db)
  const signIn = useStore((s) => s.signIn)
  const [busy, setBusy] = useState(false)
  const laundry = byId(db.laundries, DEMO_LAUNDRY_ID)!
  const factory = byId(db.factories, DEMO_FACTORY_ID)!
  const isLaundry = role === 'laundry'
  const [email, setEmail] = useState(isLaundry ? 'nada@maad.sa' : 'wadi@maad.sa')
  const submit = () => {
    setBusy(true)
    setTimeout(() => {
      signIn(role)
      nav(ACCOUNT_HOME[role], { replace: true })
    }, 650)
  }
  return (
    <div id="signin-scroll" className="flex h-full flex-col overflow-y-auto bg-sand no-scrollbar">
      <TopBar back="/welcome" />
      <div className="flex flex-1 flex-col px-5 pt-4">
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-ink text-white">
          <Icon name={isLaundry ? 'store' : 'factory'} size={26} />
        </div>
        <h1 className="mt-5 font-display text-[26px] font-semibold">{isLaundry ? 'دخول المغاسل' : 'دخول المصانع'}</h1>
        <p className="mt-1.5 text-[15px] text-mute">ادخل بحساب منشأتك المسجّل في مَعاد.</p>
        <div className="mt-7 overflow-hidden rounded-2xl bg-paper shadow-card ring-1 ring-ink/5">
          <label className="block px-4 pb-3 pt-3">
            <span className="text-xs text-mute">البريد الإلكتروني</span>
            <input aria-label="البريد الإلكتروني" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} className="block w-full bg-transparent text-end text-[17px] font-semibold outline-none" />
          </label>
          <div className="mx-4 h-px bg-ink/5" />
          <label className="block px-4 pb-3 pt-3">
            <span className="text-xs text-mute">كلمة المرور</span>
            <input aria-label="كلمة المرور" type="password" dir="ltr" defaultValue="maad-2026" className="block w-full bg-transparent text-end text-[17px] font-semibold tracking-widest outline-none" />
          </label>
        </div>
        <div className="mt-3 flex items-center gap-3 rounded-2xl bg-loop-50 px-4 py-3">
          {isLaundry ? (
            <LaundryBadge name={laundry.name} hue={laundry.hue} size={36} />
          ) : (
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-ink text-white">
              <Icon name="factory" size={18} />
            </span>
          )}
          <div className="min-w-0 flex-1 text-sm">
            <div className="font-semibold text-ink">{isLaundry ? laundry.name : factory.name}</div>
            <div className="text-xs text-loop-700">{isLaundry ? `${byId(db.neighborhoods, laundry.neighborhoodId)!.name}، بريدة` : 'القصيم'}</div>
          </div>
          <Icon name="check" size={18} strokeWidth={2.4} className="text-loop" />
        </div>
        <div className="mt-auto pb-6 pt-6">
          <Button className="w-full" disabled={busy || !email.includes('@')} onClick={submit}>
            {busy ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : 'دخول'}
          </Button>
        </div>
      </div>
    </div>
  )
}
