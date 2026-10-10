import { appConfig } from '@/config/app'
import { economics, kgFromHangers, savingsSar, type TierId } from '@/config/economics'
import { mergeStats } from './scoring'
import type {
  Booking,
  Coupon,
  Db,
  DeliveryMethod,
  HangerRequest,
  Laundry,
  Listing,
  PickupRound,
  Reward,
  ScanStats,
  User,
} from './types'

const HOUR = 3600_000
const DAY = 24 * HOUR
const KM_PER_UNIT = 0.016

export function nextId(db: Db, prefix: string) {
  db.seq += 1
  return `${prefix}${db.seq}`
}

export function bookingCode(seq: number) {
  const n = (seq * 7919 + 1301) % 9000 + 1000
  return `M-${n}`
}

export const byId = <T extends { id: string }>(list: T[], id: string | undefined) =>
  list.find((x) => x.id === id)

export function distanceKm(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.hypot(a.x - b.x, a.y - b.y) * KM_PER_UNIT
}

export function neighborhoodOf(db: Db, id: string) {
  return byId(db.neighborhoods, id)!
}

export function reservedFor(db: Db, requestId: string) {
  let r = 0
  for (const b of db.bookings) if (b.requestId === requestId && b.status === 'awaiting') r += b.usable
  return r
}

export function remainingFor(db: Db, req: HangerRequest) {
  return Math.max(0, req.target - req.collected - reservedFor(db, req.id))
}

export const isOpen = (req: HangerRequest) => !req.closedAt

export function boxIsFull(l: Laundry) {
  return l.boxCount >= economics.boxCapacityHangers * economics.boxReadyRatio
}

export function acceptsDamagedNow(l: Laundry) {
  return l.acceptsDamaged && !boxIsFull(l)
}

export interface RequestView {
  request: HangerRequest
  laundry: Laundry
  distance: number
  reserved: number
  remaining: number
}

export function requestViews(db: Db, from: { x: number; y: number }, radiusKm = Infinity): RequestView[] {
  return db.requests
    .filter(isOpen)
    .map((request) => {
      const laundry = byId(db.laundries, request.laundryId)!
      const reserved = reservedFor(db, request.id)
      return {
        request,
        laundry,
        distance: distanceKm(from, laundry),
        reserved,
        remaining: Math.max(0, request.target - request.collected - reserved),
      }
    })
    .filter((v) => v.distance <= radiusKm && v.remaining > 0)
    .sort((a, b) => a.distance - b.distance)
}

export interface Leg {
  laundryId: string
  requestId?: string
  usable: number
  damaged: number
  rerouted?: boolean
}

export interface ReturnPlan {
  legs: Leg[]
  leftoverUsable: number
  leftoverDamaged: number
}

export function planReturn(
  db: Db,
  from: { x: number; y: number },
  usable: number,
  damaged: number,
  preferredRequestId?: string,
): ReturnPlan {
  const legs: Leg[] = []
  const views = requestViews(db, from)
  const ordered = preferredRequestId
    ? [...views.filter((v) => v.request.id === preferredRequestId), ...views.filter((v) => v.request.id !== preferredRequestId)]
    : views
  let left = usable
  for (const v of ordered) {
    if (left <= 0 || legs.length >= 2) break
    const take = Math.min(left, v.remaining)
    if (take <= 0) continue
    legs.push({ laundryId: v.laundry.id, requestId: v.request.id, usable: take, damaged: 0 })
    left -= take
  }
  let leftoverDamaged = 0
  if (damaged > 0) {
    const first = legs[0] && byId(db.laundries, legs[0].laundryId)
    if (first && acceptsDamagedNow(first)) {
      legs[0].damaged = damaged
    } else {
      const candidates = db.laundries
        .filter(acceptsDamagedNow)
        .map((l) => ({ l, d: distanceKm(from, l) + (legs.some((x) => x.laundryId === l.id) ? -100 : 0) }))
        .sort((a, b) => a.d - b.d)
      const target = candidates[0]?.l
      if (!target) leftoverDamaged = damaged
      else {
        const existing = legs.find((x) => x.laundryId === target.id)
        if (existing) existing.damaged = damaged
        else legs.push({ laundryId: target.id, usable: 0, damaged, rerouted: legs.length > 0 })
      }
    }
  }
  return { legs, leftoverUsable: left, leftoverDamaged }
}

export function createBookings(
  db: Db,
  userId: string,
  plan: ReturnPlan,
  method: DeliveryMethod,
  stats: ScanStats,
  now: number,
) {
  const groupId = nextId(db, 'g')
  for (const leg of plan.legs) {
    const id = nextId(db, 'b')
    const booking: Booking = {
      id,
      code: bookingCode(db.seq),
      groupId,
      userId,
      laundryId: leg.laundryId,
      requestId: leg.requestId,
      usable: leg.usable,
      damaged: leg.damaged,
      method,
      status: 'awaiting',
      createdAt: now,
      expiresAt: now + appConfig.bookingExpiryHours * HOUR,
      points: 0,
      couponIds: [],
      stats,
    }
    db.bookings.push(booking)
  }
  return groupId
}

export function expireBookings(db: Db, now: number) {
  let n = 0
  for (const b of db.bookings) {
    if (b.status === 'awaiting' && b.expiresAt <= now) {
      b.status = 'expired'
      n++
    }
  }
  return n
}

export function pointsFor(usable: number, damaged: number) {
  return usable * economics.usablePointsPerHanger + damaged * economics.damagedPointsPerHanger
}

export function receiveBooking(db: Db, bookingId: string, flagged: boolean, now: number) {
  const b = byId(db.bookings, bookingId)
  if (!b || b.status !== 'awaiting') return
  const laundry = byId(db.laundries, b.laundryId)!
  const user = byId(db.users, b.userId)!
  b.status = 'received'
  b.receivedAt = now
  b.flagged = flagged || undefined
  if (b.requestId) {
    const req = byId(db.requests, b.requestId)
    if (req) {
      req.collected += b.usable
      if (req.collected >= req.target && !req.closedAt) req.closedAt = now
    }
  }
  laundry.stock += b.usable
  const wasFull = boxIsFull(laundry)
  laundry.boxCount += b.damaged
  if (!wasFull && boxIsFull(laundry)) listBox(db, laundry, now)
  creditBooking(db, b, user, now)
  db.activity.push({
    id: nextId(db, 'a'),
    at: now,
    kind: 'return',
    neighborhoodId: user.neighborhoodId,
    count: b.usable + b.damaged,
    laundryId: laundry.id,
  })
}

function creditBooking(db: Db, b: Booking, user: User, now: number) {
  const req = b.requestId ? byId(db.requests, b.requestId) : undefined
  if (req && b.usable > 0) {
    const carried = (user.carry[b.laundryId] ?? 0) + b.usable
    const count = Math.floor(carried / req.reward.per)
    user.carry[b.laundryId] = carried % req.reward.per
    for (let i = 0; i < count; i++) {
      const c: Coupon = {
        id: nextId(db, 'c'),
        userId: user.id,
        laundryId: b.laundryId,
        reward: { ...req.reward },
        createdAt: now,
        expiresAt: now + economics.couponValidityDays * DAY,
      }
      db.coupons.push(c)
      b.couponIds.push(c.id)
    }
  }
  b.points = pointsFor(b.usable, b.damaged)
  user.points += b.points
  user.lifetimeUsable += b.usable
  user.lifetimeDamaged += b.damaged
  b.status = 'credited'
  b.creditedAt = now
}

function listBox(db: Db, laundry: Laundry, now: number) {
  const recent = db.bookings.filter((b) => b.laundryId === laundry.id && b.damaged > 0 && b.receivedAt).slice(-30)
  const purity = recent.length ? mergeStats(recent.map((b) => b.stats), recent.map((b) => b.damaged)).purity : 98.5
  const listing: Listing = {
    id: nextId(db, 'li'),
    laundryId: laundry.id,
    count: laundry.boxCount,
    purity,
    createdAt: now,
    status: 'listed',
  }
  db.listings.push(listing)
  db.activity.push({ id: nextId(db, 'a'), at: now, kind: 'boxFull', neighborhoodId: laundry.neighborhoodId, count: laundry.boxCount, laundryId: laundry.id })
  return listing
}

export function activeListing(db: Db, laundryId: string) {
  return db.listings.find((l) => l.laundryId === laundryId && l.status !== 'collected')
}

export function createRequest(db: Db, laundryId: string, target: number, reward: Reward, now: number) {
  const existing = db.requests.find((r) => r.laundryId === laundryId && isOpen(r))
  if (existing) existing.closedAt = now
  const req: HangerRequest = { id: nextId(db, 'r'), laundryId, target, collected: 0, reward, createdAt: now }
  db.requests.push(req)
  const l = byId(db.laundries, laundryId)!
  db.activity.push({ id: nextId(db, 'a'), at: now, kind: 'request', neighborhoodId: l.neighborhoodId, count: target, laundryId })
  return req
}

export function redeemCoupon(db: Db, couponId: string, now: number) {
  const c = byId(db.coupons, couponId)
  if (!c || c.redeemedAt || c.expiresAt < now) return false
  c.redeemedAt = now
  return true
}

export function donatePoints(db: Db, userId: string, points: number) {
  const u = byId(db.users, userId)
  if (!u) return
  const p = Math.min(points, u.points)
  u.points -= p
  u.donatedPoints += p
}

export function readyListings(db: Db) {
  return db.listings.filter((l) => l.status === 'listed')
}

export function proposeRound(db: Db, factoryId: string, radiusKm = 9) {
  const f = byId(db.factories, factoryId)!
  const ready = readyListings(db)
    .map((li) => ({ li, l: byId(db.laundries, li.laundryId)! }))
    .sort((a, b) => distanceKm(f, a.l) - distanceKm(f, b.l))
  if (!ready.length) return []
  const anchor = ready[0].l
  return ready.filter((r) => distanceKm(anchor, r.l) <= radiusKm).map((r) => r.li.id)
}

export function approveRound(db: Db, factoryId: string, listingIds: string[], now: number) {
  const round: PickupRound = {
    id: nextId(db, 'pr'),
    factoryId,
    createdAt: now,
    stops: listingIds.map((id) => {
      const li = byId(db.listings, id)!
      li.status = 'scheduled' as const
      return { listingId: id, laundryId: li.laundryId, count: li.count }
    }),
  }
  for (const li of db.listings) if (listingIds.includes(li.id)) li.roundId = round.id
  db.rounds.push(round)
  return round
}

export function collectStop(db: Db, roundId: string, listingId: string, actualKg: number, now: number) {
  const round = byId(db.rounds, roundId)
  if (!round) return
  const stop = round.stops.find((s) => s.listingId === listingId)
  if (!stop || stop.collectedAt) return
  const f = byId(db.factories, round.factoryId)!
  const li = byId(db.listings, listingId)!
  const l = byId(db.laundries, stop.laundryId)!
  stop.actualKg = Math.round(actualKg * 10) / 10
  stop.payoutSar = Math.round(stop.actualKg * f.pricePerKgSar * 100) / 100
  stop.collectedAt = now
  li.status = 'collected'
  l.scrapEarningsSar += stop.payoutSar
  l.boxCount = Math.max(0, l.boxCount - li.count)
  db.activity.push({ id: nextId(db, 'a'), at: now, kind: 'pickup', neighborhoodId: l.neighborhoodId, count: li.count, laundryId: l.id })
  if (round.stops.every((s) => s.collectedAt)) issueCertificate(db, round, now)
}

function issueCertificate(db: Db, round: PickupRound, now: number) {
  const listings = round.stops.map((s) => byId(db.listings, s.listingId)!)
  const hangers = round.stops.reduce((a, s) => a + s.count, 0)
  const kg = round.stops.reduce((a, s) => a + (s.actualKg ?? 0), 0)
  const purity =
    Math.round((listings.reduce((a, li) => a + li.purity * li.count, 0) / Math.max(1, hangers)) * 10) / 10
  const id = nextId(db, 'ce')
  const serial = db.certificates.length + 41
  db.certificates.push({
    id,
    number: `MAAD-${new Date(now).getFullYear()}-${String(serial).padStart(4, '0')}`,
    roundId: round.id,
    factoryId: round.factoryId,
    date: now,
    hangers,
    kg: Math.round(kg * 10) / 10,
    purity,
    sources: round.stops.map((s) => ({ laundryId: s.laundryId, hangers: s.count, kg: s.actualKg ?? 0, payoutSar: s.payoutSar ?? 0 })),
  })
  const r = byId(db.rounds, round.id)!
  r.completedAt = now
  r.certificateId = id
}

export function tierOf(user: User): TierId {
  const total = user.lifetimeUsable + user.lifetimeDamaged
  let t: TierId = 'bronze'
  for (const tier of economics.tiers) if (total >= tier.minHangers) t = tier.id
  return t
}

export function nextTier(user: User) {
  const total = user.lifetimeUsable + user.lifetimeDamaged
  const next = economics.tiers.find((t) => t.minHangers > total)
  return next ? { id: next.id as TierId, missing: next.minHangers - total } : undefined
}

export function laundryMonthStats(db: Db, laundryId: string, now: number) {
  const d = new Date(now)
  const start = new Date(d.getFullYear(), d.getMonth(), 1).getTime()
  let usable = 0
  let damaged = 0
  for (const b of db.bookings) {
    if (b.laundryId !== laundryId || !b.receivedAt || b.receivedAt < start) continue
    usable += b.usable
    damaged += b.damaged
  }
  return { usable, damaged, savings: savingsSar(usable) }
}

export function impactTotals(db: Db) {
  let usable = 0
  let damaged = 0
  const stats: ScanStats[] = []
  const weights: number[] = []
  const byHood = new Map<string, number>()
  for (const b of db.bookings) {
    if (b.status !== 'credited') continue
    usable += b.usable
    damaged += b.damaged
    stats.push(b.stats)
    weights.push(b.usable + b.damaged)
    const u = byId(db.users, b.userId)
    if (u) byHood.set(u.neighborhoodId, (byHood.get(u.neighborhoodId) ?? 0) + b.usable + b.damaged)
  }
  const total = usable + damaged
  const leaderboard = db.neighborhoods
    .map((n) => ({ n, count: byHood.get(n.id) ?? 0 }))
    .sort((a, b) => b.count - a.count)
  return {
    usable,
    damaged,
    total,
    kg: kgFromHangers(total),
    savings: savingsSar(usable),
    quality: mergeStats(stats, weights),
    leaderboard,
  }
}

export function userBookings(db: Db, userId: string) {
  return db.bookings.filter((b) => b.userId === userId).sort((a, b) => b.createdAt - a.createdAt)
}

export function groupBookings(db: Db, groupId: string) {
  return db.bookings.filter((b) => b.groupId === groupId)
}

export function pendingForLaundry(db: Db, laundryId: string) {
  return db.bookings.filter((b) => b.laundryId === laundryId && b.status === 'awaiting')
}

export { HOUR, DAY }
