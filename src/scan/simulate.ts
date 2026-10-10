import type { Criteria } from '@/domain/types'

const PROFILES: Criteria[] = [
  { straightness: 92, hook: 96, rust: 94, coating: 88, breaks: 100 },
  { straightness: 88, hook: 90, rust: 91, coating: 80, breaks: 100 },
  { straightness: 30, hook: 92, rust: 88, coating: 70, breaks: 100 },
  { straightness: 95, hook: 93, rust: 97, coating: 92, breaks: 100 },
  { straightness: 86, hook: 89, rust: 84, coating: 76, breaks: 98 },
  { straightness: 90, hook: 94, rust: 25, coating: 40, breaks: 100 },
  { straightness: 91, hook: 97, rust: 90, coating: 86, breaks: 100 },
  { straightness: 84, hook: 88, rust: 93, coating: 90, breaks: 100 },
  { straightness: 93, hook: 20, rust: 90, coating: 85, breaks: 100 },
  { straightness: 89, hook: 92, rust: 87, coating: 83, breaks: 100 },
]

export function simulatedCriteria(seed: number, ordinal: number): Criteria {
  const base = PROFILES[(ordinal + seed * 3) % PROFILES.length]
  const wobble = ((ordinal * 37 + seed * 11) % 7) - 3
  const c = { ...base }
  for (const k of Object.keys(c) as (keyof Criteria)[]) c[k] = Math.max(0, Math.min(100, c[k] + wobble))
  return c
}
