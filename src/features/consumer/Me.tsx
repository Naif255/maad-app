import { byId } from '@/domain/services'
import { useStore } from '@/store/store'
import { Icon } from '@/ui/Icon'
import { Card } from '@/ui/kit'
import { SwitchAccount } from '@/ui/SwitchAccount'
import { Toggle } from '../laundry/Settings'
import { useMe } from './hooks'

export function Me() {
  const me = useMe()
  const db = useStore((s) => s.db)
  const setNotify = useStore((s) => s.setNotify)
  if (!me) return null
  return (
    <div className="px-4 pb-10 pt-safe">
      <div className="flex items-center gap-4 px-1">
        <div className="grid h-16 w-16 place-items-center rounded-3xl bg-ink font-display text-2xl font-semibold text-white">{(me.name || 'م')[0]}</div>
        <div>
          <div className="font-display text-xl font-semibold">{me.name || 'عضو مَعاد'}</div>
          <div className="text-sm text-mute">{byId(db.neighborhoods, me.neighborhoodId)?.name}، بريدة</div>
        </div>
      </div>
      <Card className="mt-6">
        <div className="flex items-center gap-3 p-4">
          <Icon name="bell" size={20} className="text-copper" />
          <div className="flex-1 text-sm">
            <div className="font-semibold">نبّهني بالطلبات القريبة</div>
            <div className="text-xs text-mute">أول ما تحتاج مغسلة قريبة علاقات</div>
          </div>
          <Toggle on={me.notifyNearby} onChange={setNotify} />
        </div>
      </Card>
      <SwitchAccount className="mt-3" />
    </div>
  )
}
