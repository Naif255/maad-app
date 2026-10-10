import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { appConfig } from '@/config/app'
import { buildSeed } from '@/data/seed'
import { statsFrom } from '@/domain/scoring'
import * as svc from '@/domain/services'
import type { Db, DeliveryMethod, Reward, ScanBatch } from '@/domain/types'

export type Role = 'consumer' | 'laundry' | 'factory' | 'impact'
export type ScanSource = 'demo' | 'camera'

export interface Celebration {
  groupId: string
  at: number
}

interface State {
  db: Db
  clockOffset: number
  userId?: string
  batches: ScanBatch[]
  scanRequestId?: string
  scanSource: ScanSource
  celebration?: Celebration
  hideNearby: boolean
  resetCount: number
  now: () => number
  reset: () => void
  signIn: (phone: string) => string
  signOut: () => void
  addBatch: (b: ScanBatch) => void
  clearScan: () => void
  setScanRequest: (id?: string) => void
  setScanSource: (s: ScanSource) => void
  book: (plan: svc.ReturnPlan, method: DeliveryMethod) => string
  receive: (bookingId: string, flagged: boolean) => void
  createRequest: (laundryId: string, target: number, reward: Reward) => void
  setAcceptsDamaged: (laundryId: string, v: boolean) => void
  redeemCoupon: (id: string) => boolean
  donate: (points: number) => void
  approveRound: (factoryId: string, listingIds: string[]) => string
  collectStop: (roundId: string, listingId: string, kg: number) => void
  setNotify: (v: boolean) => void
  advanceClock: (hours: number) => void
  dismissCelebration: () => void
  setHideNearby: (v: boolean) => void
  setPrice: (factoryId: string, price: number) => void
}

const seedNow = () => Date.now()

export const useStore = create<State>()(
  persist(
    (set, get) => {
      const mutate = <T>(fn: (db: Db, now: number) => T): T => {
        const db = structuredClone(get().db)
        const r = fn(db, get().now())
        set({ db })
        return r
      }
      return {
        db: buildSeed(seedNow()),
        clockOffset: 0,
        batches: [],
        scanSource: 'demo',
        hideNearby: false,
        resetCount: 0,
        now: () => Date.now() + get().clockOffset,
        reset: () =>
          set((s) => ({
            db: buildSeed(seedNow()),
            clockOffset: 0,
            userId: undefined,
            batches: [],
            scanRequestId: undefined,
            celebration: undefined,
            hideNearby: false,
            resetCount: s.resetCount + 1,
          })),
        signIn: (phone) => {
          const clean = phone.replace(/\D/g, '')
          let id = get().db.users.find((u) => u.phone === clean)?.id
          if (!id) {
            id = mutate((db, now) => {
              const uid = svc.nextId(db, 'u')
              db.users.push({
                id: uid,
                name: '',
                phone: clean,
                neighborhoodId: 'n-safra',
                points: 0,
                lifetimeUsable: 0,
                lifetimeDamaged: 0,
                donatedPoints: 0,
                carry: {},
                notifyNearby: false,
                createdAt: now,
              })
              return uid
            })
          }
          set({ userId: id })
          return id
        },
        signOut: () => set({ userId: undefined }),
        addBatch: (b) => set((s) => ({ batches: [...s.batches, b] })),
        clearScan: () => set({ batches: [], scanRequestId: undefined }),
        setScanRequest: (id) => set({ scanRequestId: id }),
        setScanSource: (scanSource) => set({ scanSource }),
        book: (plan, method) => {
          const { userId, batches } = get()
          if (!userId) throw new Error('auth')
          const stats = statsFrom(batches.flatMap((b) => b.hangers))
          const groupId = mutate((db, now) => svc.createBookings(db, userId, plan, method, stats, now))
          set({ batches: [], scanRequestId: undefined })
          return groupId
        },
        receive: (bookingId, flagged) => {
          const groupId = get().db.bookings.find((b) => b.id === bookingId)?.groupId
          mutate((db, now) => svc.receiveBooking(db, bookingId, flagged, now))
          if (groupId) set({ celebration: { groupId, at: get().now() } })
        },
        createRequest: (laundryId, target, reward) => mutate((db, now) => void svc.createRequest(db, laundryId, target, reward, now)),
        setAcceptsDamaged: (laundryId, v) =>
          mutate((db) => {
            const l = db.laundries.find((x) => x.id === laundryId)
            if (l) l.acceptsDamaged = v
          }),
        redeemCoupon: (id) => mutate((db, now) => svc.redeemCoupon(db, id, now)),
        donate: (points) => {
          const userId = get().userId
          if (userId) mutate((db) => svc.donatePoints(db, userId, points))
        },
        approveRound: (factoryId, listingIds) => mutate((db, now) => svc.approveRound(db, factoryId, listingIds, now).id),
        collectStop: (roundId, listingId, kg) => mutate((db, now) => svc.collectStop(db, roundId, listingId, kg, now)),
        setNotify: (v) => {
          const userId = get().userId
          mutate((db) => {
            const u = db.users.find((x) => x.id === userId)
            if (u) u.notifyNearby = v
          })
        },
        advanceClock: (hours) => {
          set((s) => ({ clockOffset: s.clockOffset + hours * svc.HOUR }))
          mutate((db, now) => svc.expireBookings(db, now))
        },
        dismissCelebration: () => set({ celebration: undefined }),
        setHideNearby: (hideNearby) => set({ hideNearby }),
        setPrice: (factoryId, price) =>
          mutate((db) => {
            const f = db.factories.find((x) => x.id === factoryId)
            if (f) f.pricePerKgSar = price
          }),
      }
    },
    {
      name: appConfig.storageKey,
      partialize: (s) => ({
        db: s.db,
        clockOffset: s.clockOffset,
        userId: s.userId,
        batches: s.batches,
        scanRequestId: s.scanRequestId,
        scanSource: s.scanSource,
        celebration: s.celebration,
        hideNearby: s.hideNearby,
        resetCount: s.resetCount,
      }),
    },
  ),
)

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === appConfig.storageKey) useStore.persist.rehydrate()
  })
}

export const useDb = () => useStore((s) => s.db)
export const useNow = () => useStore((s) => s.now)
