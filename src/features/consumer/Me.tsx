import { useStore } from '@/store/store'
import { byId } from '@/domain/services'
import { Icon } from '@/ui/Icon'
import { Button, Card } from '@/ui/kit'
import { Toggle } from '../laundry/Settings'
import { useMe } from './hooks'
import { SignInGate } from './SignInGate'

export function Me() {
  const me = useMe()
  const db = useStore((s) => s.db)
  const setNotify = useStore((s) => s.setNotify)
  const signOut = useStore((s) => s.signOut)
  if (!me) return <SignInGate title="حسابك" text="رقم جوالك بس، وكل شي ثاني يمشي تلقائي." />
  return (
    <div className="px-4 pb-10 pt-12">
      <div className="flex items-center gap-4 px-1">
        <div className="grid h-16 w-16 place-items-center rounded-3xl bg-ink font-display text-2xl font-semibold text-white">{(me.name || 'م')[0]}</div>
        <div>
          <div className="font-display text-xl font-semibold">{me.name || 'عضو مَعاد'}</div>
          <div className="num text-sm text-mute" dir="ltr" style={{ textAlign: 'right' }}>
            {me.phone.replace(/^(\d{3})(\d{3})(\d{4})$/, '$1 $2 $3')}
          </div>
        </div>
      </div>
      <Card className="mt-6 divide-y divide-ink/5">
        <div className="flex items-center gap-3 p-4">
          <Icon name="pin" size={20} className="text-loop" />
          <div className="flex-1 text-sm">
            <div className="font-semibold">حيّك</div>
            <div className="text-xs text-mute">{byId(db.neighborhoods, me.neighborhoodId)?.name}، بريدة</div>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4">
          <Icon name="bell" size={20} className="text-copper" />
          <div className="flex-1 text-sm">
            <div className="font-semibold">نبّهني بالطلبات القريبة</div>
            <div className="text-xs text-mute">أول ما تحتاج مغسلة قريبة علاقات</div>
          </div>
          <Toggle on={me.notifyNearby} onChange={setNotify} />
        </div>
      </Card>
      <Button variant="soft" className="mt-6 w-full" onClick={signOut}>
        تسجيل خروج
      </Button>
    </div>
  )
}
