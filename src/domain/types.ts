import type { TierId } from '@/config/economics'

export type CriterionKey = 'straightness' | 'hook' | 'rust' | 'coating' | 'breaks'

export const CRITERIA: CriterionKey[] = ['straightness', 'hook', 'rust', 'coating', 'breaks']

export type Criteria = Record<CriterionKey, number>

export type AreaId = 'north' | 'center' | 'south'

export interface Neighborhood {
  id: string
  name: string
  area: AreaId
  x: number
  y: number
}

export interface Laundry {
  id: string
  name: string
  short: string
  neighborhoodId: string
  x: number
  y: number
  acceptsDamaged: boolean
  boxCount: number
  stock: number
  scrapEarningsSar: number
  hue: number
}

export type RewardKind = 'ironing' | 'discount' | 'wash'

export interface Reward {
  kind: RewardKind
  per: number
  value: number
}

export interface HangerRequest {
  id: string
  laundryId: string
  target: number
  collected: number
  reward: Reward
  createdAt: number
  closedAt?: number
}

export interface User {
  id: string
  name: string
  phone: string
  neighborhoodId: string
  points: number
  lifetimeUsable: number
  lifetimeDamaged: number
  donatedPoints: number
  carry: Record<string, number>
  notifyNearby: boolean
  createdAt: number
}

export interface ScanStats {
  avgScore: number
  histogram: number[]
  defects: Criteria
  purity: number
}

export type DeliveryMethod = 'dropoff' | 'withOrder'

export type BookingStatus = 'awaiting' | 'received' | 'credited' | 'expired'

export interface Booking {
  id: string
  code: string
  groupId: string
  userId: string
  laundryId: string
  requestId?: string
  usable: number
  damaged: number
  method: DeliveryMethod
  status: BookingStatus
  createdAt: number
  expiresAt: number
  receivedAt?: number
  creditedAt?: number
  flagged?: boolean
  points: number
  couponIds: string[]
  stats: ScanStats
}

export interface Coupon {
  id: string
  userId: string
  laundryId: string
  reward: Reward
  createdAt: number
  expiresAt: number
  redeemedAt?: number
}

export type ListingStatus = 'listed' | 'scheduled' | 'collected'

export interface Listing {
  id: string
  laundryId: string
  count: number
  purity: number
  createdAt: number
  status: ListingStatus
  roundId?: string
}

export interface PickupStop {
  listingId: string
  laundryId: string
  count: number
  actualKg?: number
  payoutSar?: number
  collectedAt?: number
}

export interface PickupRound {
  id: string
  factoryId: string
  stops: PickupStop[]
  createdAt: number
  completedAt?: number
  certificateId?: string
}

export interface Certificate {
  id: string
  number: string
  roundId: string
  factoryId: string
  date: number
  hangers: number
  kg: number
  purity: number
  sources: { laundryId: string; hangers: number; kg: number; payoutSar: number }[]
}

export interface Factory {
  id: string
  name: string
  pricePerKgSar: number
  x: number
  y: number
}

export type ActivityKind = 'return' | 'pickup' | 'request' | 'boxFull'

export interface Activity {
  id: string
  at: number
  kind: ActivityKind
  neighborhoodId: string
  count: number
  laundryId?: string
}

export interface Db {
  version: number
  seq: number
  neighborhoods: Neighborhood[]
  laundries: Laundry[]
  requests: HangerRequest[]
  users: User[]
  bookings: Booking[]
  coupons: Coupon[]
  listings: Listing[]
  rounds: PickupRound[]
  certificates: Certificate[]
  factories: Factory[]
  activity: Activity[]
}

export interface HangerVerdict {
  id: string
  score: number
  usable: boolean
  criteria: Criteria
  materialConfidence: number
}

export interface ScanBatch {
  id: string
  hangers: HangerVerdict[]
  lockedAt: number
}

export type { TierId }
