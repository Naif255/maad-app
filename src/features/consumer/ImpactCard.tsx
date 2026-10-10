import { toBlob } from 'html-to-image'
import { motion } from 'motion/react'
import { useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { kgFromHangers } from '@/config/economics'
import { byId, groupBookings, tierOf } from '@/domain/services'
import { date, kg, num, TIER_LABEL } from '@/lib/format'
import { useStore } from '@/store/store'
import { Icon } from '@/ui/Icon'
import { Button, Toast, TopBar } from '@/ui/kit'
import { LogoMark } from '@/ui/Logo'

export function ImpactCard() {
  const { groupId = '' } = useParams()
  const db = useStore((s) => s.db)
  const nav = useNavigate()
  const ref = useRef<HTMLDivElement>(null)
  const [toast, setToast] = useState<string>()
  const legs = groupBookings(db, groupId)
  if (!legs.length) return null
  const user = byId(db.users, legs[0].userId)!
  const usable = legs.reduce((a, b) => a + b.usable, 0)
  const damaged = legs.reduce((a, b) => a + b.damaged, 0)
  const total = usable + damaged
  const lifetime = user.lifetimeUsable + user.lifetimeDamaged
  const laundry = byId(db.laundries, legs.find((b) => b.usable)?.laundryId ?? legs[0].laundryId)!
  const hood = byId(db.neighborhoods, user.neighborhoodId)!

  const share = async () => {
    if (!ref.current) return
    try {
      const blob = await toBlob(ref.current, { pixelRatio: 3, cacheBust: true })
      if (!blob) throw new Error('blob')
      const file = new File([blob], 'maad-impact.png', { type: 'image/png' })
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text: 'رجّعت علاقاتي مع مَعاد' })
      } else {
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = 'maad-impact.png'
        a.click()
        setToast('حفظنا البطاقة كصورة')
      }
    } catch {
      setToast('ما قدرنا نجهّز الصورة، جرّب مرة ثانية')
    }
    setTimeout(() => setToast(undefined), 2400)
  }

  return (
    <div className="min-h-full bg-ink pb-10 text-white">
      <TopBar dark back="/c" title="بطاقة أثرك" />
      <div className="px-5">
        <motion.div initial={{ scale: 0.9, opacity: 0, rotate: -2 }} animate={{ scale: 1, opacity: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 140, damping: 15 }}>
          <div ref={ref} className="relative aspect-[4/5] overflow-hidden rounded-[30px] p-7" style={{ background: 'linear-gradient(160deg, #0FA36B 0%, #0A7A50 55%, #064A31 100%)' }}>
            <svg className="absolute inset-0 h-full w-full" viewBox="0 0 400 500" preserveAspectRatio="none">
              <motion.path d="M-20 380 C 80 300, 180 460, 260 360 S 380 260, 440 320" stroke="rgba(255,255,255,0.18)" strokeWidth="2" fill="none" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.6, delay: 0.3 }} />
              <motion.path d="M-20 420 C 100 360, 160 500, 280 410 S 380 330, 440 370" stroke="rgba(255,255,255,0.1)" strokeWidth="2" fill="none" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.8, delay: 0.5 }} />
            </svg>
            <div className="pointer-events-none absolute -left-12 -top-6 opacity-15">
              <LogoMark size={260} color="#fff" strokeWidth={2} />
            </div>
            <div className="relative flex h-full flex-col">
              <div className="flex items-center gap-2">
                <LogoMark size={30} color="#fff" />
                <span className="font-display text-lg font-semibold">مَعاد</span>
                <span className="ms-auto text-xs text-white/70">{date(legs[0].createdAt)}</span>
              </div>
              <div className="mt-auto">
                <div className="text-sm text-white/80">رجّعت اليوم</div>
                <div className="flex items-baseline gap-2">
                  <span className="num font-display text-[84px] font-semibold leading-none">{total}</span>
                  <span className="text-xl font-semibold">علاقة</span>
                </div>
                <div className="mt-5 space-y-2.5 text-[15px]">
                  <div className="flex items-center gap-2.5">
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-white/20">
                      <Icon name="replay" size={15} />
                    </span>
                    <span>
                      <b className="num">{usable}</b> رجعت لـ{laundry.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-white/20">
                      <Icon name="factory" size={15} />
                    </span>
                    <span>
                      <b className="num">{damaged}</b> بتصير حديد من جديد
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-white/20">
                      <Icon name="scale" size={15} />
                    </span>
                    <span>
                      <b className="num">{num(Math.round(kgFromHangers(total) * 1000))}</b> جرام حديد ما راحت للمردم
                    </span>
                  </div>
                </div>
                <div className="mt-6 flex items-center justify-between border-t border-white/20 pt-4 text-xs text-white/80">
                  <span>
                    عضو {TIER_LABEL[tierOf(user)]} · <span className="num">{num(lifetime)}</span> علاقة ({kg(kgFromHangers(lifetime))} كجم)
                  </span>
                  <span>حي {hood.name}</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
        <Button className="mt-6 w-full" variant="soft" icon="share" onClick={share}>
          شارك البطاقة
        </Button>
        <button onClick={() => nav('/c/wallet')} className="mt-2 h-12 w-full text-sm font-semibold text-white/60">
          روح للمحفظة
        </button>
      </div>
      <Toast show={!!toast}>{toast}</Toast>
    </div>
  )
}
