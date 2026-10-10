import { useState } from 'react'
import { Icon } from '@/ui/Icon'
import { Button } from '@/ui/kit'
import { AuthSheet } from './AuthSheet'

export function SignInGate({ title, text }: { title: string; text: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="flex min-h-full flex-col items-center justify-center px-8 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-3xl bg-paper shadow-card">
        <Icon name="phone" size={28} />
      </div>
      <div className="mt-5 font-display text-xl font-semibold">{title}</div>
      <p className="mt-2 text-sm leading-6 text-mute">{text}</p>
      <Button className="mt-6 w-full" onClick={() => setOpen(true)}>
        ادخل برقم جوالك
      </Button>
      <AuthSheet open={open} onClose={() => setOpen(false)} onDone={() => setOpen(false)} />
    </div>
  )
}
