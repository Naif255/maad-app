import { verdict } from '@/domain/scoring'
import type { HangerVerdict } from '@/domain/types'
import { simulatedCriteria } from './simulate'
import type { BBox, Detection, TrackView } from './types'

interface Track extends TrackView {
  key?: string
  hits: number
  misses: number
  conf: number
  criteria?: Detection['criteria']
}

export function iou(a: BBox, b: BBox) {
  const x1 = Math.max(a.x, b.x)
  const y1 = Math.max(a.y, b.y)
  const x2 = Math.min(a.x + a.w, b.x + b.w)
  const y2 = Math.min(a.y + a.h, b.y + b.h)
  const inter = Math.max(0, x2 - x1) * Math.max(0, y2 - y1)
  const u = a.w * a.h + b.w * b.h - inter
  return u > 0 ? inter / u : 0
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t

export class Tracker {
  private tracks: Track[] = []
  private seq = 0
  private confirmedCount = 0
  constructor(
    private readonly confirmFrames: number,
    private readonly seed: number,
    private readonly idPrefix: string,
  ) {}

  update(dets: Detection[], now: number): { views: TrackView[]; newlyConfirmed: HangerVerdict[] } {
    const wire = dets.filter((d) => d.material === 'wire')
    const used = new Set<number>()
    for (const t of this.tracks) {
      let best = -1
      let score = 0
      wire.forEach((d, i) => {
        if (used.has(i)) return
        const s = t.key !== undefined && d.key !== undefined ? (t.key === d.key ? 1 : 0) : iou(t.bbox, d.bbox)
        if (s > score) {
          score = s
          best = i
        }
      })
      if (best >= 0 && score >= 0.25) {
        used.add(best)
        const d = wire[best]
        const k = d.key !== undefined ? 0.9 : 0.55
        t.bbox = {
          x: lerp(t.bbox.x, d.bbox.x, k),
          y: lerp(t.bbox.y, d.bbox.y, k),
          w: lerp(t.bbox.w, d.bbox.w, k),
          h: lerp(t.bbox.h, d.bbox.h, k),
        }
        t.hits++
        t.misses = 0
        t.visible = true
        t.conf = Math.max(t.conf, d.materialConfidence)
        if (d.criteria) t.criteria = d.criteria
      } else {
        t.misses++
        if (t.misses > 2) t.visible = false
      }
    }
    wire.forEach((d, i) => {
      if (used.has(i)) return
      this.tracks.push({
        id: `${this.idPrefix}-${++this.seq}`,
        key: d.key,
        bbox: { ...d.bbox },
        hits: 1,
        misses: 0,
        visible: true,
        confirmed: false,
        conf: d.materialConfidence,
        criteria: d.criteria,
        bornAt: now,
      })
    })
    const newlyConfirmed: HangerVerdict[] = []
    for (const t of this.tracks) {
      if (!t.confirmed && t.hits >= this.confirmFrames) {
        t.confirmed = true
        const criteria = t.criteria ?? simulatedCriteria(this.seed, this.confirmedCount)
        this.confirmedCount++
        t.verdict = verdict(t.id, criteria, t.conf)
        newlyConfirmed.push(t.verdict)
      }
    }
    this.tracks = this.tracks.filter((t) => t.confirmed || t.misses < 6)
    return { views: this.tracks.map(({ id, bbox, visible, confirmed, verdict, bornAt }) => ({ id, bbox, visible, confirmed, verdict, bornAt })), newlyConfirmed }
  }

  verdicts() {
    return this.tracks.filter((t) => t.confirmed && t.verdict).map((t) => t.verdict!)
  }
}
