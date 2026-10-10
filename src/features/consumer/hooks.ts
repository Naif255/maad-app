import { useEffect, useState } from 'react'
import { byId, neighborhoodOf } from '@/domain/services'
import { useStore } from '@/store/store'

export function useMe() {
  const db = useStore((s) => s.db)
  const userId = useStore((s) => s.userId)
  return userId ? byId(db.users, userId) : undefined
}

export function useHome() {
  const db = useStore((s) => s.db)
  const me = useMe()
  return neighborhoodOf(db, me?.neighborhoodId ?? 'n-safra')
}

export function useTicker(ms = 1000) {
  const now = useStore((s) => s.now)
  const [t, setT] = useState(() => now())
  useEffect(() => {
    const id = setInterval(() => setT(now()), ms)
    return () => clearInterval(id)
  }, [ms, now])
  return t
}

export function haptic(pattern: number | number[] = 10) {
  try {
    navigator.vibrate?.(pattern)
  } catch {
    return
  }
}
