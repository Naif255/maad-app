import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { appConfig } from '@/config/app'
import { useStore } from '@/store/store'
import { Icon } from '@/ui/Icon'
import { Button, cx, Sheet } from '@/ui/kit'

const pretty = (p: string) => p.replace(/^(\d{3})(\d{3})(\d{0,4}).*/, '$1 $2 $3').trim()

export function AuthSheet({ open, onClose, onDone }: { open: boolean; onClose: () => void; onDone: () => void }) {
  const signIn = useStore((s) => s.signIn)
  const [phone, setPhone] = useState('')
  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [otp, setOtp] = useState('')
  const [sms, setSms] = useState(false)
  const timers = useRef<number[]>([])

  useEffect(() => {
    if (!open) return
    setStep('phone')
    setOtp('')
    setSms(false)
    setPhone('')
    const digits = appConfig.demoPhone
    timers.current.forEach(clearTimeout)
    timers.current = [...digits].map((_, i) => window.setTimeout(() => setPhone(digits.slice(0, i + 1)), 350 + i * 55))
    return () => timers.current.forEach(clearTimeout)
  }, [open])

  const send = () => {
    setStep('otp')
    timers.current.push(window.setTimeout(() => setSms(true), 700))
    const code = appConfig.demoOtp
    ;[...code].forEach((_, i) => timers.current.push(window.setTimeout(() => setOtp(code.slice(0, i + 1)), 1500 + i * 110)))
  }

  const verify = () => {
    signIn(phone)
    onDone()
  }

  useEffect(() => {
    if (step === 'otp' && otp.length === 4) {
      const id = window.setTimeout(verify, 450)
      return () => clearTimeout(id)
    }
  })

  return (
    <Sheet open={open} onClose={onClose}>
      <div className="pb-2">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-loop-50 text-loop-700">
          <Icon name="phone" size={24} />
        </div>
        <AnimatePresence mode="wait">
          {step === 'phone' ? (
            <motion.div key="phone" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <h3 className="mt-4 font-display text-xl font-semibold">رقم جوالك بس</h3>
              <p className="mt-1 text-sm text-mute">عشان نثبّت حجزك ونوصّل لك مكافأتك. ما نطلب شي ثاني.</p>
              <label className="mt-5 flex h-14 items-center gap-3 rounded-2xl bg-sand px-4 ring-1 ring-ink/10 focus-within:ring-2 focus-within:ring-loop">
                <span className="num text-mute" dir="ltr">
                  +966
                </span>
                <span className="h-6 w-px bg-ink/10" />
                <input
                  dir="ltr"
                  inputMode="tel"
                  className="num w-full bg-transparent text-lg font-semibold tracking-wider outline-none"
                  value={pretty(phone)}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="05x xxx xxxx"
                />
              </label>
              <Button className="mt-4 w-full" disabled={phone.length < 10} onClick={send}>
                أرسل رمز التحقق
              </Button>
            </motion.div>
          ) : (
            <motion.div key="otp" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <h3 className="mt-4 font-display text-xl font-semibold">اكتب الرمز</h3>
              <p className="mt-1 text-sm text-mute">
                أرسلناه على <span className="num" dir="ltr">{pretty(phone)}</span>
              </p>
              <AnimatePresence>
                {sms && (
                  <motion.div initial={{ opacity: 0, y: -8, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }} className="mt-4 overflow-hidden">
                    <div className="flex items-center gap-3 rounded-2xl bg-ink px-4 py-3 text-sm text-white">
                      <Icon name="bell" size={18} className="text-loop" />
                      <span>
                        رمز مَعاد: <span className="num font-bold tracking-widest">{appConfig.demoOtp}</span>
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="mt-5 flex justify-center gap-3" dir="ltr">
                {[0, 1, 2, 3].map((i) => (
                  <motion.div
                    key={i}
                    animate={otp[i] ? { scale: [1, 1.08, 1] } : {}}
                    className={cx('num grid h-16 w-14 place-items-center rounded-2xl text-2xl font-semibold ring-1', otp[i] ? 'bg-loop-50 ring-loop' : 'bg-sand ring-ink/10', otp.length === i && 'ring-2 ring-loop')}
                  >
                    {otp[i] ?? ''}
                  </motion.div>
                ))}
              </div>
              <div className="mt-5 text-center text-xs text-mute">{otp.length === 4 ? 'نتحقق…' : 'نقرأ الرمز تلقائي من الرسائل'}</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Sheet>
  )
}
