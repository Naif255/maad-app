import { useNavigate, useParams } from 'react-router-dom'
import { acceptsDamagedNow, byId, distanceKm, neighborhoodOf, reservedFor } from '@/domain/services'
import { hangers, num, rewardRule, rewardTitle } from '@/lib/format'
import { useStore } from '@/store/store'
import { Icon } from '@/ui/Icon'
import { Button, Card, LaundryBadge, TopBar, WireProgress } from '@/ui/kit'
import { useHome } from './hooks'

export function RequestDetail() {
  const { id } = useParams()
  const db = useStore((s) => s.db)
  const setScanRequest = useStore((s) => s.setScanRequest)
  const home = useHome()
  const nav = useNavigate()
  const r = byId(db.requests, id)
  if (!r) return null
  const l = byId(db.laundries, r.laundryId)!
  const reserved = reservedFor(db, r.id)
  const remaining = Math.max(0, r.target - r.collected - reserved)
  const damagedOk = acceptsDamagedNow(l)

  return (
    <div className="flex min-h-full flex-col bg-sand">
      <div className="relative overflow-hidden pb-6" style={{ background: `linear-gradient(160deg, hsl(${l.hue} 40% 92%), var(--color-sand))` }}>
        <TopBar back="/c" />
        <div className="flex items-center gap-4 px-5">
          <LaundryBadge name={l.name} hue={l.hue} size={60} />
          <div>
            <h1 className="font-display text-[24px] font-semibold">{l.name}</h1>
            <div className="mt-0.5 flex items-center gap-1.5 text-sm text-mute">
              <Icon name="pin" size={15} />
              {neighborhoodOf(db, l.neighborhoodId).name} · <span className="num">{distanceKm(home, l).toFixed(1)}</span> كم عنك
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3 px-4">
        <Card className="p-5">
          <div className="text-sm text-mute">تحتاج الحين</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span data-testid="remaining" className="num font-display text-5xl font-semibold leading-none">
              {num(remaining)}
            </span>
            <span className="text-lg font-semibold">{remaining >= 3 && remaining <= 10 ? 'علاقات' : 'علاقة'}</span>
          </div>
          <WireProgress className="mt-5" value={r.collected} reserved={reserved} max={r.target} height={8} />
          <div className="mt-2 text-xs text-mute">
            وصلهم <span className="num font-semibold text-ink">{num(r.collected)}</span> من <span className="num">{num(r.target)}</span>، ويقفل الطلب أول ما يكتمل
          </div>
        </Card>

        <Card className="flex items-center gap-3.5 p-5">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-copper text-white">
            <Icon name="gift" size={24} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-display text-lg font-semibold text-copper-700">{rewardTitle(r.reward)}</div>
            <div className="text-sm text-mute">{rewardRule(r.reward)}، والتالفة لها نقاط</div>
          </div>
        </Card>

        {!damagedOk && (
          <div className="flex gap-3 rounded-2xl bg-steel-50 p-4 text-sm leading-6 text-steel-700">
            <Icon name="box" size={20} className="mt-0.5 shrink-0" />
            <span>{l.acceptsDamaged ? 'صندوق الحديد عندهم ممتلئ وينتظر المصنع.' : 'هالمغسلة تستقبل العلاقات الصالحة فقط.'} التالفة نوجّهك فيها لأقرب مغسلة تستقبلها.</span>
          </div>
        )}
      </div>

      <div className="sticky bottom-0 z-20 mt-auto bg-gradient-to-t from-sand via-sand to-transparent px-4 pb-6 pt-8">
        <Button
          className="w-full"
          icon="scan"
          disabled={remaining === 0}
          onClick={() => {
            setScanRequest(r.id)
            nav(`/c/scan?for=${r.id}`)
          }}
        >
          {remaining === 0 ? 'اكتمل العدد' : `افحص علاقاتك${remaining < 20 ? ` · باقي ${hangers(remaining)}` : ''}`}
        </Button>
        <div className="mt-2.5 text-center text-xs text-mute">ثواني بالكاميرا، ونقولك وش يرجع لهم ووش يصير حديد</div>
      </div>
    </div>
  )
}
