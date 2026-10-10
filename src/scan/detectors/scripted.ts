import type { Criteria } from '@/domain/types'
import type { BBox, Detection, Frame, HangerDetector } from '../types'

export interface Annotation {
  tracks: { key: string; criteria?: Criteria; keyframes: [number, number, number, number, number][] }[]
}

function sample(kf: Annotation['tracks'][number]['keyframes'], t: number): BBox | undefined {
  if (!kf.length || t < kf[0][0] || t > kf[kf.length - 1][0]) return undefined
  for (let i = 0; i < kf.length - 1; i++) {
    const [ta, ...a] = kf[i]
    const [tb, ...b] = kf[i + 1]
    if (t >= ta && t <= tb) {
      const k = tb === ta ? 0 : (t - ta) / (tb - ta)
      return { x: a[0] + (b[0] - a[0]) * k, y: a[1] + (b[1] - a[1]) * k, w: a[2] + (b[2] - a[2]) * k, h: a[3] + (b[3] - a[3]) * k }
    }
  }
  const [, x, y, w, h] = kf[kf.length - 1]
  return { x, y, w, h }
}

export class ScriptedDetector implements HangerDetector {
  readonly id = 'scripted'
  private seen = new Map<string, number>()
  constructor(
    private readonly annotation?: Annotation,
    private readonly latencyMs = 260,
  ) {}

  async init() {}

  async detect(frame: Frame): Promise<Detection[]> {
    const truth = frame.truth ?? this.fromAnnotation(frame.time)
    const out: Detection[] = []
    for (const d of truth) {
      const key = d.key ?? ''
      const first = this.seen.get(key) ?? frame.time
      this.seen.set(key, first)
      const stagger = (key.charCodeAt(key.length - 1) % 5) * 45
      if (frame.time - first < this.latencyMs + stagger) continue
      const j = Math.sin(frame.time / 90 + key.length) * 0.0025
      out.push({ ...d, bbox: { x: d.bbox.x + j, y: d.bbox.y - j, w: d.bbox.w, h: d.bbox.h } })
    }
    for (const k of [...this.seen.keys()]) if (!truth.some((d) => d.key === k)) this.seen.delete(k)
    return out
  }

  private fromAnnotation(t: number): Detection[] {
    if (!this.annotation) return []
    const out: Detection[] = []
    for (const tr of this.annotation.tracks) {
      const bbox = sample(tr.keyframes, t)
      if (bbox) out.push({ bbox, key: tr.key, material: 'wire', materialConfidence: 0.97, criteria: tr.criteria })
    }
    return out
  }

  dispose() {
    this.seen.clear()
  }
}
