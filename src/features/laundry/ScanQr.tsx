import QrScanner from 'qr-scanner'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { pendingForLaundry } from '@/domain/services'
import { num } from '@/lib/format'
import { useStore } from '@/store/store'
import { Icon } from '@/ui/Icon'
import { TopBar } from '@/ui/kit'
import { useLaundry } from './LaundryLayout'

export function parseQr(v: string) {
  const m = /^MAAD:U:(.+)$/.exec(v.trim())
  return m?.[1]
}

export function ScanQr() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const nav = useNavigate()
  const db = useStore((s) => s.db)
  const l = useLaundry()
  const [cam, setCam] = useState<'on' | 'off' | 'starting'>('starting')
  const pending = pendingForLaundry(db, l.id)
  const users = [...new Set(pending.map((b) => b.userId))]

  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    let done = false
    const scanner = new QrScanner(
      v,
      (r) => {
        const id = parseQr(r.data)
        if (id && !done) {
          done = true
          nav(`/l/customer/${id}`)
        }
      },
      { preferredCamera: 'environment', highlightScanRegion: false, returnDetailedScanResult: true },
    )
    scanner
      .start()
      .then(() => setCam('on'))
      .catch(() => setCam('off'))
    return () => {
      scanner.stop()
      scanner.destroy()
    }
  }, [nav])

  return (
    <div className="flex min-h-full flex-col bg-ink text-white">
      <TopBar dark back="/l" title="امسح رمز العميل" sub="يقرأ رمز الإيصال أو بطاقة الولاء" />
      <div className="px-5">
        <div className="relative mx-auto aspect-square w-full max-w-[300px] overflow-hidden rounded-[28px] bg-black">
          <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
          {cam !== 'on' && (
            <div className="absolute inset-0 grid place-items-center p-6 text-center text-sm text-white/50">
              {cam === 'starting' ? 'نشغّل الكاميرا…' : 'الكاميرا غير متاحة على هالجهاز. اختر من التسليمات تحت.'}
            </div>
          )}
          <div className="pointer-events-none absolute inset-8 rounded-3xl">
            {['right-0 top-0 border-r-4 border-t-4 rounded-tr-3xl', 'left-0 top-0 border-l-4 border-t-4 rounded-tl-3xl', 'bottom-0 right-0 border-b-4 border-r-4 rounded-br-3xl', 'bottom-0 left-0 border-b-4 border-l-4 rounded-bl-3xl'].map((c) => (
              <span key={c} className={`absolute h-10 w-10 border-loop ${c}`} />
            ))}
          </div>
        </div>
      </div>
      <div className="mt-6 flex-1 rounded-t-[28px] bg-paper px-4 pb-8 pt-5 text-ink">
        <div className="mb-3 flex items-center justify-between px-1">
          <div className="font-display font-semibold">أو اختر من التسليمات المحجوزة</div>
        </div>
        <div className="space-y-2">
          {users.map((uid) => {
            const bs = pending.filter((b) => b.userId === uid)
            return (
              <button key={uid} onClick={() => nav(`/l/customer/${uid}`)} className="flex w-full items-center gap-3 rounded-2xl bg-sand p-3.5 text-start ring-1 ring-ink/5 hover:ring-loop">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-ink text-white">
                  <Icon name="qr" size={18} />
                </div>
                <div className="flex-1">
                  <div className="num text-sm font-semibold">{bs.map((b) => b.code).join(' · ')}</div>
                  <div className="text-xs text-mute">
                    <span className="num">{num(bs.reduce((a, b) => a + b.usable + b.damaged, 0))}</span> علاقة
                  </div>
                </div>
                <Icon name="chevron" size={18} className="text-mute" />
              </button>
            )
          })}
          {!users.length && <div className="rounded-2xl bg-sand p-4 text-center text-sm text-mute">ما فيه تسليمات معلقة</div>}
        </div>
      </div>
    </div>
  )
}
