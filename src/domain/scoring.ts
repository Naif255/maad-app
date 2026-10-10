import { appConfig } from '@/config/app'
import { CRITERIA, type Criteria, type HangerVerdict, type ScanStats } from './types'

export const DEFECT_BELOW = 70

export function fitnessScore(c: Criteria): number {
  const w = appConfig.scan.criteriaWeights
  let s = 0
  for (const k of CRITERIA) s += c[k] * w[k]
  const { breakCap, hookCap } = appConfig.scan
  if (c.breaks < breakCap.below) s = Math.min(s, breakCap.maxScore)
  if (c.hook < hookCap.below) s = Math.min(s, hookCap.maxScore)
  return Math.round(Math.max(0, Math.min(100, s)))
}

export const isUsable = (score: number) => score >= appConfig.fitnessThreshold

export function verdict(id: string, criteria: Criteria, materialConfidence: number): HangerVerdict {
  const score = fitnessScore(criteria)
  return { id, score, usable: isUsable(score), criteria, materialConfidence }
}

export function emptyCriteria(): Criteria {
  return { straightness: 0, hook: 0, rust: 0, coating: 0, breaks: 0 }
}

export function statsFrom(hangers: HangerVerdict[]): ScanStats {
  const histogram = new Array(10).fill(0)
  const defects = emptyCriteria()
  let sum = 0
  let conf = 0
  for (const h of hangers) {
    sum += h.score
    conf += h.materialConfidence
    histogram[Math.min(9, Math.floor(h.score / 10))]++
    for (const k of CRITERIA) if (h.criteria[k] < DEFECT_BELOW) defects[k]++
  }
  const n = Math.max(1, hangers.length)
  return {
    avgScore: Math.round(sum / n),
    histogram,
    defects,
    purity: Math.round((conf / n) * 1000) / 10,
  }
}

export function mergeStats(list: ScanStats[], weights: number[]): ScanStats {
  const histogram = new Array(10).fill(0)
  const defects = emptyCriteria()
  let total = 0
  let avg = 0
  let purity = 0
  list.forEach((s, i) => {
    const w = weights[i] ?? 0
    total += w
    avg += s.avgScore * w
    purity += s.purity * w
    s.histogram.forEach((v, j) => (histogram[j] += v))
    for (const k of CRITERIA) defects[k] += s.defects[k]
  })
  const n = Math.max(1, total)
  return { avgScore: Math.round(avg / n), histogram, defects, purity: Math.round((purity / n) * 10) / 10 }
}
