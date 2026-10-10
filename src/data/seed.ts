import { economics } from '@/config/economics'
import { statsFrom, verdict } from '@/domain/scoring'
import { bookingCode, DAY, HOUR } from '@/domain/services'
import type { Activity, Booking, Certificate, Coupon, Criteria, Db, HangerRequest, Laundry, Listing, PickupRound, User } from '@/domain/types'

export function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const NEIGHBORHOODS = [
  { id: 'n-safra', name: 'الصفراء', x: 540, y: 190 },
  { id: 'n-fayziyah', name: 'الفايزية', x: 735, y: 300 },
  { id: 'n-rayyan', name: 'الريان', x: 330, y: 250 },
  { id: 'n-khaleej', name: 'الخليج', x: 790, y: 485 },
  { id: 'n-nahda', name: 'النهضة', x: 545, y: 380 },
  { id: 'n-iskan', name: 'الإسكان', x: 300, y: 470 },
  { id: 'n-shammas', name: 'الشماس', x: 165, y: 330 },
  { id: 'n-salmiya', name: 'السالمية', x: 570, y: 565 },
]

const LAUNDRIES: Omit<Laundry, 'scrapEarningsSar'>[] = [
  { id: 'l-nada', name: 'مغسلة نَدى', short: 'نَدى', neighborhoodId: 'n-safra', x: 560, y: 205, acceptsDamaged: true, boxCount: 395, stock: 1240, hue: 158 },
  { id: 'l-khuzama', name: 'مغسلة الخزامى', short: 'الخزامى', neighborhoodId: 'n-fayziyah', x: 720, y: 285, acceptsDamaged: true, boxCount: 214, stock: 860, hue: 268 },
  { id: 'l-sana', name: 'مغسلة سَنا', short: 'سَنا', neighborhoodId: 'n-rayyan', x: 350, y: 240, acceptsDamaged: true, boxCount: 133, stock: 640, hue: 38 },
  { id: 'l-rifq', name: 'مغسلة رِفق', short: 'رِفق', neighborhoodId: 'n-khaleej', x: 770, y: 470, acceptsDamaged: true, boxCount: 412, stock: 1510, hue: 200 },
  { id: 'l-dana', name: 'مغسلة دانة', short: 'دانة', neighborhoodId: 'n-nahda', x: 565, y: 395, acceptsDamaged: true, boxCount: 401, stock: 990, hue: 12 },
  { id: 'l-bayad', name: 'مغسلة البياض الناصع', short: 'البياض', neighborhoodId: 'n-iskan', x: 315, y: 455, acceptsDamaged: true, boxCount: 288, stock: 720, hue: 222 },
  { id: 'l-taif', name: 'مغسلة طَيف', short: 'طَيف', neighborhoodId: 'n-shammas', x: 180, y: 345, acceptsDamaged: false, boxCount: 0, stock: 410, hue: 320 },
  { id: 'l-lamsa', name: 'مغسلة لمسة', short: 'لمسة', neighborhoodId: 'n-salmiya', x: 590, y: 550, acceptsDamaged: true, boxCount: 176, stock: 580, hue: 90 },
]

export const DEMO_USER_ID = 'u-demo'
export const DEMO_LAUNDRY_ID = 'l-nada'
export const DEMO_FACTORY_ID = 'f-wadi'
export const DEMO_REQUEST_ID = 'r-nada'

function hangerCriteria(rnd: () => number, good: boolean): Criteria {
  const hi = () => 82 + Math.round(rnd() * 18)
  const mid = () => 45 + Math.round(rnd() * 40)
  const lo = () => 10 + Math.round(rnd() * 45)
  if (good) return { straightness: hi(), hook: hi(), rust: hi(), coating: 70 + Math.round(rnd() * 30), breaks: 92 + Math.round(rnd() * 8) }
  const c: Criteria = { straightness: hi(), hook: hi(), rust: hi(), coating: hi(), breaks: 95 }
  const r = rnd()
  if (r < 0.34) {
    c.straightness = lo()
    c.coating = mid()
  } else if (r < 0.6) {
    c.rust = lo()
    c.coating = lo()
  } else if (r < 0.8) {
    c.hook = lo()
  } else if (r < 0.92) {
    c.coating = lo()
    c.straightness = mid()
  } else {
    c.breaks = lo()
  }
  return c
}

export function syntheticStats(rnd: () => number, usable: number, damaged: number) {
  const hangers = []
  for (let i = 0; i < usable + damaged; i++) {
    const good = i < usable
    let v = verdict(String(i), hangerCriteria(rnd, good), 0.95 + rnd() * 0.05)
    let guard = 0
    while (v.usable !== good && guard++ < 6) v = verdict(String(i), hangerCriteria(rnd, good), 0.95 + rnd() * 0.05)
    hangers.push(v)
  }
  return statsFrom(hangers)
}

export function buildSeed(now: number = Date.now()): Db {
  const rnd = mulberry32(20261012)
  let seq = 1000
  const id = (p: string) => `${p}${++seq}`
  const laundries: Laundry[] = LAUNDRIES.map((l) => ({ ...l, scrapEarningsSar: 0 }))

  const users: User[] = [
    {
      id: DEMO_USER_ID,
      name: 'ريم',
      phone: '0551234567',
      neighborhoodId: 'n-safra',
      points: 690,
      lifetimeUsable: 0,
      lifetimeDamaged: 0,
      donatedPoints: 1500,
      carry: {},
      notifyNearby: false,
      createdAt: now - 80 * DAY,
    },
  ]
  for (let i = 0; i < 160; i++) {
    const hood = NEIGHBORHOODS[Math.floor(Math.pow(rnd(), 1.4) * NEIGHBORHOODS.length)]
    users.push({
      id: `u-${i}`,
      name: '',
      phone: '',
      neighborhoodId: hood.id,
      points: 0,
      lifetimeUsable: 0,
      lifetimeDamaged: 0,
      donatedPoints: 0,
      carry: {},
      notifyNearby: false,
      createdAt: now - 90 * DAY,
    })
  }

  const bookings: Booking[] = []
  const activity: Activity[] = []
  const coupons: Coupon[] = []
  const hoodLaundry = (hoodId: string) => {
    const own = laundries.filter((l) => l.neighborhoodId === hoodId && l.acceptsDamaged)
    return own[0] ?? laundries[Math.floor(rnd() * laundries.length)]
  }

  for (let day = 90; day >= 0; day--) {
    const ramp = 0.45 + (1 - day / 90) * 0.9
    const count = Math.round((5 + rnd() * 5) * ramp)
    for (let k = 0; k < count; k++) {
      const u = users[1 + Math.floor(rnd() * (users.length - 1))]
      const l = rnd() < 0.75 ? hoodLaundry(u.neighborhoodId) : laundries[Math.floor(rnd() * laundries.length)]
      const usable = 6 + Math.floor(rnd() * 26)
      const damaged = l.acceptsDamaged ? 1 + Math.floor(rnd() * 11) : 0
      const at = now - day * DAY - Math.floor(rnd() * 20 * HOUR) - (day === 0 ? 0 : 0)
      if (at > now - 4 * 60_000) continue
      seq++
      bookings.push({
        id: `b${seq}`,
        code: bookingCode(seq),
        groupId: `g${seq}`,
        userId: u.id,
        laundryId: l.id,
        usable,
        damaged,
        method: rnd() < 0.62 ? 'dropoff' : 'withOrder',
        status: 'credited',
        createdAt: at - 5 * HOUR,
        expiresAt: at + 43 * HOUR,
        receivedAt: at,
        creditedAt: at,
        points: usable * economics.usablePointsPerHanger + damaged * economics.damagedPointsPerHanger,
        couponIds: [],
        stats: syntheticStats(rnd, usable, damaged),
      })
      u.lifetimeUsable += usable
      u.lifetimeDamaged += damaged
      activity.push({ id: id('a'), at, kind: 'return', neighborhoodId: u.neighborhoodId, count: usable + damaged, laundryId: l.id })
    }
  }

  const demoHistory = [
    { daysAgo: 74, l: 'l-nada', u: 18, d: 6 },
    { daysAgo: 61, l: 'l-sana', u: 22, d: 4 },
    { daysAgo: 49, l: 'l-nada', u: 15, d: 9 },
    { daysAgo: 38, l: 'l-khuzama', u: 26, d: 3 },
    { daysAgo: 27, l: 'l-nada', u: 12, d: 7 },
    { daysAgo: 19, l: 'l-dana', u: 9, d: 11 },
    { daysAgo: 11, l: 'l-nada', u: 16, d: 5 },
    { daysAgo: 4, l: 'l-sana', u: 10, d: 1 },
  ]
  const demo = users[0]
  for (const h of demoHistory) {
    seq++
    const at = now - h.daysAgo * DAY - 3 * HOUR
    const b: Booking = {
      id: `b${seq}`,
      code: bookingCode(seq),
      groupId: `g${seq}`,
      userId: demo.id,
      laundryId: h.l,
      usable: h.u,
      damaged: h.d,
      method: h.daysAgo % 2 ? 'dropoff' : 'withOrder',
      status: 'credited',
      createdAt: at - 6 * HOUR,
      expiresAt: at + 42 * HOUR,
      receivedAt: at,
      creditedAt: at,
      points: h.u * economics.usablePointsPerHanger + h.d * economics.damagedPointsPerHanger,
      couponIds: [],
      stats: syntheticStats(rnd, h.u, h.d),
    }
    demo.lifetimeUsable += h.u
    demo.lifetimeDamaged += h.d
    bookings.push(b)
    activity.push({ id: id('a'), at, kind: 'return', neighborhoodId: demo.neighborhoodId, count: h.u + h.d, laundryId: h.l })
  }
  const demoCoupons: [string, number, number, HangerRequest['reward'], number | undefined][] = [
    ['l-nada', 11, 3, { kind: 'ironing', per: 10, value: 3 }, undefined],
    ['l-sana', 4, 26, { kind: 'wash', per: 15, value: 1 }, undefined],
    ['l-khuzama', 38, -8, { kind: 'discount', per: 25, value: 15 }, 30],
    ['l-nada', 49, -19, { kind: 'ironing', per: 10, value: 3 }, 45],
  ]
  for (const [laundryId, ago, left, reward, redeemedAgo] of demoCoupons) {
    const c: Coupon = {
      id: id('c'),
      userId: demo.id,
      laundryId,
      reward,
      createdAt: now - ago * DAY,
      expiresAt: now + left * DAY,
      redeemedAt: redeemedAgo !== undefined ? now - redeemedAgo * DAY : undefined,
    }
    coupons.push(c)
    const b = bookings.find((x) => x.userId === demo.id && x.laundryId === laundryId && Math.abs(x.receivedAt! - c.createdAt) < 2 * DAY)
    if (b) b.couponIds.push(c.id)
  }

  const requests: HangerRequest[] = [
    { id: DEMO_REQUEST_ID, laundryId: 'l-nada', target: 200, collected: 140, reward: { kind: 'ironing', per: 10, value: 3 }, createdAt: now - 6 * DAY },
    { id: 'r-khuzama', laundryId: 'l-khuzama', target: 300, collected: 96, reward: { kind: 'discount', per: 25, value: 15 }, createdAt: now - 9 * DAY },
    { id: 'r-sana', laundryId: 'l-sana', target: 150, collected: 121, reward: { kind: 'wash', per: 15, value: 1 }, createdAt: now - 12 * DAY },
    { id: 'r-rifq', laundryId: 'l-rifq', target: 250, collected: 64, reward: { kind: 'ironing', per: 20, value: 5 }, createdAt: now - 3 * DAY },
    { id: 'r-bayad', laundryId: 'l-bayad', target: 120, collected: 33, reward: { kind: 'discount', per: 20, value: 10 }, createdAt: now - 2 * DAY },
    { id: 'r-lamsa', laundryId: 'l-lamsa', target: 180, collected: 152, reward: { kind: 'wash', per: 20, value: 2 }, createdAt: now - 15 * DAY },
    { id: 'r-taif', laundryId: 'l-taif', target: 100, collected: 41, reward: { kind: 'ironing', per: 10, value: 2 }, createdAt: now - 5 * DAY },
    { id: 'r-old-1', laundryId: 'l-nada', target: 150, collected: 150, reward: { kind: 'ironing', per: 10, value: 3 }, createdAt: now - 40 * DAY, closedAt: now - 7 * DAY },
    { id: 'r-old-2', laundryId: 'l-dana', target: 200, collected: 200, reward: { kind: 'discount', per: 20, value: 10 }, createdAt: now - 30 * DAY, closedAt: now - 2 * DAY },
  ]

  const pending: [string, string, number, number, number][] = [
    ['u-12', DEMO_REQUEST_ID, 12, 0, 7],
    ['u-40', 'r-khuzama', 18, 4, 20],
    ['u-77', 'r-sana', 9, 2, 30],
  ]
  for (const [userId, requestId, usable, damaged, hoursAgo] of pending) {
    const req = requests.find((r) => r.id === requestId)!
    seq++
    bookings.push({
      id: `b${seq}`,
      code: bookingCode(seq),
      groupId: `g${seq}`,
      userId,
      laundryId: req.laundryId,
      requestId,
      usable,
      damaged,
      method: 'dropoff',
      status: 'awaiting',
      createdAt: now - hoursAgo * HOUR,
      expiresAt: now - hoursAgo * HOUR + 48 * HOUR,
      points: 0,
      couponIds: [],
      stats: syntheticStats(rnd, usable, damaged),
    })
  }

  const factory = { id: DEMO_FACTORY_ID, name: 'مصهر الوادي للحديد', pricePerKgSar: economics.scrapPricePerKgSar, x: 650, y: 660 }

  const listings: Listing[] = [
    { id: 'li-rifq', laundryId: 'l-rifq', count: 412, purity: 98.9, createdAt: now - 26 * HOUR, status: 'listed' },
    { id: 'li-dana', laundryId: 'l-dana', count: 401, purity: 98.4, createdAt: now - 9 * HOUR, status: 'listed' },
  ]
  const rounds: PickupRound[] = []
  const certificates: Certificate[] = []
  const pastRounds: [number, [string, number, number][]][] = [
    [52, [['l-nada', 404, 17.2], ['l-khuzama', 398, 16.5]]],
    [33, [['l-rifq', 410, 17.4], ['l-dana', 402, 16.8], ['l-lamsa', 400, 16.9]]],
    [14, [['l-bayad', 405, 17.1], ['l-nada', 401, 16.6]]],
  ]
  pastRounds.forEach(([ago, stops], i) => {
    const at = now - ago * DAY
    const rid = id('pr')
    const cid = id('ce')
    const roundStops = stops.map(([laundryId, count, kg]) => {
      const lid = id('li')
      listings.push({ id: lid, laundryId, count, purity: 98 + rnd() * 1.6, createdAt: at - 2 * DAY, status: 'collected', roundId: rid })
      const payout = Math.round(kg * factory.pricePerKgSar * 100) / 100
      laundries.find((l) => l.id === laundryId)!.scrapEarningsSar += payout
      activity.push({ id: id('a'), at, kind: 'pickup', neighborhoodId: laundries.find((l) => l.id === laundryId)!.neighborhoodId, count, laundryId })
      return { listingId: lid, laundryId, count, actualKg: kg, payoutSar: payout, collectedAt: at }
    })
    rounds.push({ id: rid, factoryId: factory.id, stops: roundStops, createdAt: at - DAY, completedAt: at, certificateId: cid })
    const hangers = roundStops.reduce((a, s) => a + s.count, 0)
    certificates.push({
      id: cid,
      number: `MAAD-${new Date(at).getFullYear()}-${String(38 + i).padStart(4, '0')}`,
      roundId: rid,
      factoryId: factory.id,
      date: at,
      hangers,
      kg: Math.round(roundStops.reduce((a, s) => a + s.actualKg, 0) * 10) / 10,
      purity: Math.round((98.2 + rnd() * 1.4) * 10) / 10,
      sources: roundStops.map((s) => ({ laundryId: s.laundryId, hangers: s.count, kg: s.actualKg, payoutSar: s.payoutSar })),
    })
  })
  activity.push({ id: id('a'), at: now - 26 * HOUR, kind: 'boxFull', neighborhoodId: 'n-khaleej', count: 412, laundryId: 'l-rifq' })
  activity.push({ id: id('a'), at: now - 9 * HOUR, kind: 'boxFull', neighborhoodId: 'n-nahda', count: 401, laundryId: 'l-dana' })

  activity.sort((a, b) => a.at - b.at)
  bookings.sort((a, b) => a.createdAt - b.createdAt)

  return {
    version: 1,
    seq: seq + 10,
    neighborhoods: NEIGHBORHOODS,
    laundries,
    requests,
    users,
    bookings,
    coupons,
    listings,
    rounds,
    certificates,
    factories: [factory],
    activity: activity.slice(-400),
  }
}
