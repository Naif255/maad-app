import { useNavigate } from 'react-router-dom'
import { economics } from '@/config/economics'
import { byId } from '@/domain/services'
import { hangers, sar } from '@/lib/format'
import { useStore } from '@/store/store'
import { LaundryBadge } from '@/ui/kit'
import { Group, Profile, Row, SwitchAccount, Toggle } from '@/ui/SwitchAccount'
import { useLaundry } from './LaundryLayout'

export function LaundrySettings() {
  const l = useLaundry()
  const set = useStore((s) => s.setAcceptsDamaged)
  const db = useStore((s) => s.db)
  const factory = db.factories[0]
  const nav = useNavigate()
  return (
    <div className="min-h-full bg-[#F3F1EC] px-4 pb-10 pt-safe">
      <Profile avatar={<LaundryBadge name={l.name} hue={l.hue} size={76} />} title={l.name} sub={`${byId(db.neighborhoods, l.neighborhoodId)!.name}، بريدة`} />

      <Group
        title="الاستقبال"
        note={l.acceptsDamaged ? 'تستقبل الصالحة في الكرتون الأخضر، والتالفة في الرمادي تنحط في صندوق مَعاد.' : 'العملاء يتوجهون لأقرب مغسلة ثانية للعلاقات التالفة.'}
      >
        <Row icon="check" tone="loop" label="نستقبل الصالحة فقط" right={<Toggle on={!l.acceptsDamaged} onChange={(v) => set(l.id, !v)} label="نستقبل الصالحة فقط" />} />
      </Group>

      <Group title="صندوق مَعاد والخردة" note="كل مغسلة تبيع خردتها باسمها، والمبلغ يوصلك بعد كل استلام حسب الوزن الفعلي.">
        <Row icon="box" tone="steel" label="سعة الصندوق" value={hangers(economics.boxCapacityHangers)} />
        <Row icon="factory" tone="steel" label="المصنع المشتري" value={factory.name} />
        <Row icon="scale" tone="copper" label="سعر الكيلو" value={`${sar(factory.pricePerKgSar)} ر.س`} />
        <Row icon="wallet" tone="copper" label="مدفوعات الخردة" onClick={() => nav('/l/history?tab=payouts')} />
      </Group>

      <Group title="الحساب">
        <Row icon="user" label="البريد" value={<span dir="ltr">nada@maad.sa</span>} />
        <Row icon="chart" label="أثر مَعاد في بريدة" onClick={() => nav('/impact')} />
      </Group>

      <div className="mt-6">
        <SwitchAccount />
      </div>
    </div>
  )
}
