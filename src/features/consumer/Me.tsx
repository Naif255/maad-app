import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { byId, tierOf } from '@/domain/services'
import { phone, TIER_LABEL } from '@/lib/format'
import { useStore } from '@/store/store'
import { Icon } from '@/ui/Icon'
import { Group, Profile, Row, SwitchAccount, Toggle } from '@/ui/SwitchAccount'
import { HoodSheet } from './Home'
import { useMe } from './hooks'

export function Me() {
  const me = useMe()
  const db = useStore((s) => s.db)
  const setNotify = useStore((s) => s.setNotify)
  const nav = useNavigate()
  const [hood, setHood] = useState(false)
  if (!me) return null
  return (
    <div className="px-4 pb-10 pt-safe">
      <Profile
        avatar={
          <div className="grid h-20 w-20 place-items-center rounded-[28px] bg-ink text-white">
            <Icon name="user" size={34} />
          </div>
        }
        title={
          <span className="num" dir="ltr">
            {phone(me.phone) || 'عضو مَعاد'}
          </span>
        }
        sub={`عضو ${TIER_LABEL[tierOf(me)]} في مَعاد`}
      />
      <Group title="حيّك">
        <Row icon="pin" tone="loop" label="الحي" value={`${byId(db.neighborhoods, me.neighborhoodId)?.name}`} onClick={() => setHood(true)} />
      </Group>
      <Group title="التنبيهات" note="نرسل لك أول ما تحتاج مغسلة قريبة منك علاقات.">
        <Row icon="bell" label="الطلبات القريبة" right={<Toggle on={me.notifyNearby} onChange={setNotify} label="نبّهني بالطلبات القريبة" />} />
      </Group>
      <Group title="مَعاد">
        <Row icon="chart" label="أثر مَعاد في بريدة" onClick={() => nav('/impact')} />
      </Group>
      <div className="mt-6">
        <SwitchAccount />
      </div>
      <HoodSheet open={hood} onClose={() => setHood(false)} />
    </div>
  )
}
