import type { Detection, Frame, HangerDetector } from '../types'

const SW = 192

export class HeuristicDetector implements HangerDetector {
  readonly id = 'heuristic'
  private canvas = document.createElement('canvas')
  private ctx = this.canvas.getContext('2d', { willReadFrequently: true })!

  async init() {}

  async detect(frame: Frame): Promise<Detection[]> {
    const sh = Math.round((SW * frame.height) / frame.width)
    if (this.canvas.width !== SW || this.canvas.height !== sh) {
      this.canvas.width = SW
      this.canvas.height = sh
    }
    this.ctx.drawImage(frame.image, 0, 0, SW, sh)
    const { data } = this.ctx.getImageData(0, 0, SW, sh)
    const n = SW * sh
    const gray = new Float32Array(n)
    const sat = new Float32Array(n)
    for (let i = 0; i < n; i++) {
      const r = data[i * 4]
      const g = data[i * 4 + 1]
      const b = data[i * 4 + 2]
      const mx = Math.max(r, g, b)
      const mn = Math.min(r, g, b)
      gray[i] = 0.299 * r + 0.587 * g + 0.114 * b
      sat[i] = mx ? (mx - mn) / mx : 0
    }
    const bg = boxBlur(gray, SW, sh, 7)
    const ink = new Uint8Array(n)
    let contrast = 0
    for (let i = 0; i < n; i++) contrast += Math.abs(gray[i] - bg[i])
    const thr = Math.max(14, (contrast / n) * 3.2)
    for (let i = 0; i < n; i++) if (Math.abs(gray[i] - bg[i]) > thr) ink[i] = 1
    const mask = dilate(ink, SW, sh)
    const labels = new Int32Array(n)
    const out: Detection[] = []
    let label = 0
    const stack: number[] = []
    for (let s = 0; s < n; s++) {
      if (!mask[s] || labels[s]) continue
      label++
      labels[s] = label
      stack.push(s)
      let x1 = SW
      let y1 = sh
      let x2 = 0
      let y2 = 0
      let count = 0
      let raw = 0
      let satSum = 0
      while (stack.length) {
        const p = stack.pop()!
        const x = p % SW
        const y = (p - x) / SW
        count++
        if (ink[p]) {
          raw++
          satSum += sat[p]
        }
        if (x < x1) x1 = x
        if (x > x2) x2 = x
        if (y < y1) y1 = y
        if (y > y2) y2 = y
        for (let dy = -1; dy <= 1; dy++) {
          const yy = y + dy
          if (yy < 0 || yy >= sh) continue
          for (let dx = -1; dx <= 1; dx++) {
            const xx = x + dx
            if (xx < 0 || xx >= SW) continue
            const q = yy * SW + xx
            if (mask[q] && !labels[q]) {
              labels[q] = label
              stack.push(q)
            }
          }
        }
      }
      const w = x2 - x1 + 1
      const h = y2 - y1 + 1
      const area = w * h
      const fill = count / area
      const ratio = w / h
      if (area < n * 0.008 || area > n * 0.5) continue
      if (fill > 0.42 || ratio < 0.45 || ratio > 4.5) continue
      if (w < 14 || h < 8) continue
      const thickness = raw / Math.max(w, h)
      const avgSat = raw ? satSum / raw : 0
      const plastic = avgSat > 0.38 && thickness > 2.2
      out.push({
        bbox: { x: x1 / SW, y: y1 / sh, w: w / SW, h: h / sh },
        material: plastic ? 'plastic' : 'wire',
        materialConfidence: Math.max(0.8, Math.min(0.995, 1 - avgSat * 0.4)),
      })
    }
    return mergeOverlaps(out)
  }

  dispose() {}
}

function boxBlur(src: Float32Array, w: number, h: number, r: number) {
  const tmp = new Float32Array(src.length)
  const out = new Float32Array(src.length)
  for (let y = 0; y < h; y++) {
    let acc = 0
    const row = y * w
    for (let x = -r; x <= r; x++) acc += src[row + Math.min(w - 1, Math.max(0, x))]
    for (let x = 0; x < w; x++) {
      tmp[row + x] = acc / (2 * r + 1)
      acc += src[row + Math.min(w - 1, x + r + 1)] - src[row + Math.max(0, x - r)]
    }
  }
  for (let x = 0; x < w; x++) {
    let acc = 0
    for (let y = -r; y <= r; y++) acc += tmp[Math.min(h - 1, Math.max(0, y)) * w + x]
    for (let y = 0; y < h; y++) {
      out[y * w + x] = acc / (2 * r + 1)
      acc += tmp[Math.min(h - 1, y + r + 1) * w + x] - tmp[Math.max(0, y - r) * w + x]
    }
  }
  return out
}

function dilate(src: Uint8Array, w: number, h: number) {
  const out = new Uint8Array(src.length)
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      if (!src[y * w + x]) continue
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          const xx = x + dx
          const yy = y + dy
          if (xx >= 0 && yy >= 0 && xx < w && yy < h) out[yy * w + xx] = 1
        }
    }
  return out
}

function mergeOverlaps(list: Detection[]) {
  const out: Detection[] = []
  for (const d of list.sort((a, b) => b.bbox.w * b.bbox.h - a.bbox.w * a.bbox.h)) {
    const inside = out.some((o) => {
      const ix = Math.max(0, Math.min(o.bbox.x + o.bbox.w, d.bbox.x + d.bbox.w) - Math.max(o.bbox.x, d.bbox.x))
      const iy = Math.max(0, Math.min(o.bbox.y + o.bbox.h, d.bbox.y + d.bbox.h) - Math.max(o.bbox.y, d.bbox.y))
      return ix * iy > 0.6 * d.bbox.w * d.bbox.h
    })
    if (!inside) out.push(d)
  }
  return out
}
