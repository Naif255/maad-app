import { describe, expect, it } from 'vitest'
import { buildSeed, DEMO_FACTORY_ID, DEMO_LAUNDRY_ID, DEMO_REQUEST_ID, DEMO_USER_ID } from '@/data/seed'
import { fitnessScore, statsFrom, verdict } from './scoring'
import * as svc from './services'

const NOW = Date.UTC(2026, 9, 12, 9, 0, 0)

describe('scoring', () => {
  it('applies weights and caps', () => {
    expect(fitnessScore({ straightness: 100, hook: 100, rust: 100, coating: 100, breaks: 100 })).toBe(100)
    expect(fitnessScore({ straightness: 93, hook: 20, rust: 90, coating: 85, breaks: 100 })).toBe(60)
    expect(fitnessScore({ straightness: 84, hook: 90, rust: 86, coating: 80, breaks: 10 })).toBe(55)
  })
})

describe('demo story', () => {
  it('runs end to end deterministically', () => {
    const run = () => {
      const db = buildSeed(NOW)
      const user = svc.byId(db.users, DEMO_USER_ID)!
      const from = svc.neighborhoodOf(db, user.neighborhoodId)
      const hangers = [
        ...Array.from({ length: 14 }, (_, i) => verdict(`u${i}`, { straightness: 92, hook: 95, rust: 93, coating: 88, breaks: 100 }, 0.97)),
        ...Array.from({ length: 6 }, (_, i) => verdict(`d${i}`, { straightness: 30, hook: 92, rust: 88, coating: 70, breaks: 100 }, 0.97)),
      ]
      const plan = svc.planReturn(db, from, 14, 6, DEMO_REQUEST_ID)
      expect(plan.legs).toEqual([{ laundryId: DEMO_LAUNDRY_ID, requestId: DEMO_REQUEST_ID, usable: 14, damaged: 6 }])
      const groupId = svc.createBookings(db, user.id, plan, 'dropoff', statsFrom(hangers), NOW)
      const [booking] = svc.groupBookings(db, groupId)
      svc.receiveBooking(db, booking.id, false, NOW + 60_000)
      const laundry = svc.byId(db.laundries, DEMO_LAUNDRY_ID)!
      expect(svc.boxIsFull(laundry)).toBe(true)
      expect(svc.activeListing(db, DEMO_LAUNDRY_ID)?.status).toBe('listed')
      const ids = svc.proposeRound(db, DEMO_FACTORY_ID)
      expect(ids.length).toBe(3)
      const round = svc.approveRound(db, DEMO_FACTORY_ID, ids, NOW + 120_000)
      for (const s of round.stops) svc.collectStop(db, round.id, s.listingId, s.count * 0.042, NOW + 180_000)
      expect(db.certificates.at(-1)?.hangers).toBe(round.stops.reduce((a, s) => a + s.count, 0))
      return { totals: svc.impactTotals(db), user: svc.byId(db.users, DEMO_USER_ID), coupons: booking.couponIds.length }
    }
    const a = run()
    const b = run()
    expect(a).toEqual(b)
    expect(a.coupons).toBe(1)
  })

  it('routes damaged hangers when the box is full', () => {
    const db = buildSeed(NOW)
    const from = svc.byId(db.laundries, 'l-dana')!
    const plan = svc.planReturn(db, from, 5, 4, 'r-old-2')
    const damagedLeg = plan.legs.find((l) => l.damaged > 0)!
    expect(damagedLeg.laundryId).not.toBe('l-dana')
    expect(damagedLeg.laundryId).not.toBe('l-rifq')
  })

  it('expires bookings after 48 hours', () => {
    const db = buildSeed(NOW)
    const before = svc.remainingFor(db, svc.byId(db.requests, DEMO_REQUEST_ID)!)
    svc.expireBookings(db, NOW + 49 * svc.HOUR)
    expect(svc.remainingFor(db, svc.byId(db.requests, DEMO_REQUEST_ID)!)).toBe(before + 12)
  })

  it('orders a pickup round as the shortest hop-by-hop route from the factory', () => {
    const db = buildSeed(NOW)
    const from = svc.neighborhoodOf(db, 'n-safra')
    const damaged = Array.from({ length: 6 }, (_, i) => verdict(`d${i}`, { straightness: 30, hook: 92, rust: 88, coating: 70, breaks: 100 }, 0.97))
    const group = svc.createBookings(db, DEMO_USER_ID, svc.planReturn(db, from, 0, 6, DEMO_REQUEST_ID), 'dropoff', statsFrom(damaged), NOW)
    svc.receiveBooking(db, svc.groupBookings(db, group)[0].id, false, NOW)
    const f = svc.byId(db.factories, DEMO_FACTORY_ID)!
    const ids = svc.proposeRound(db, DEMO_FACTORY_ID)
    const stops = ids.map((id) => svc.byId(db.laundries, svc.byId(db.listings, id)!.laundryId)!)
    expect(stops.map((l) => l.id)).toEqual(['l-rifq', 'l-dana', 'l-nada'])
    let at: { x: number; y: number } = f
    for (const s of stops) {
      const rest = stops.slice(stops.indexOf(s))
      expect(Math.min(...rest.map((r) => svc.distanceKm(at, r)))).toBe(svc.distanceKm(at, s))
      at = s
    }
  })

  it('describes the laundry box in states', () => {
    const db = buildSeed(NOW)
    const l = svc.byId(db.laundries, DEMO_LAUNDRY_ID)!
    expect(svc.boxState(db, l)).toBe('almost')
    l.boxCount = 120
    expect(svc.boxState(db, l)).toBe('collecting')
    expect(svc.boxState(db, svc.byId(db.laundries, 'l-rifq')!)).toBe('listed')
    expect(svc.boxState(db, svc.byId(db.laundries, 'l-taif')!)).toBe('off')
  })

  it('groups ready boxes by area and keeps payouts consistent with laundry earnings', () => {
    const db = buildSeed(NOW)
    expect(svc.readyByArea(db).map((g) => g.area)).toEqual(['center', 'south'])
    for (const l of db.laundries) {
      const sum = svc.scrapPayouts(db, l.id).reduce((a, p) => a + (p.payoutSar ?? 0), 0)
      expect(Math.abs(sum - l.scrapEarningsSar)).toBeLessThan(0.001)
    }
  })

  it('stores the signed-in phone and neighborhood on the profile', () => {
    const db = buildSeed(NOW)
    svc.setProfile(db, DEMO_USER_ID, { phone: '0500000000', neighborhoodId: 'n-khaleej' })
    const u = svc.byId(db.users, DEMO_USER_ID)!
    expect(u.phone).toBe('0500000000')
    expect(u.neighborhoodId).toBe('n-khaleej')
    expect(u.name).toBe('')
  })
})
