import type { Criteria } from '@/domain/types'
import type { BBox, Detection, Frame, FrameSource } from '../types'

type Damage = 'bend' | 'rust' | 'peel' | 'hook' | 'break' | 'rustBend'

interface Item {
  key: string
  x: number
  y: number
  rot: number
  scale: number
  plastic?: { color: string }
  coated: boolean
  tint: string
  damage?: Damage
  criteria?: Criteria
}

const W = 720
const H = 1280
const ROW = 230
const GOOD: Criteria[] = [
  { straightness: 92, hook: 96, rust: 94, coating: 88, breaks: 100 },
  { straightness: 88, hook: 93, rust: 90, coating: 84, breaks: 100 },
  { straightness: 95, hook: 91, rust: 96, coating: 90, breaks: 100 },
  { straightness: 90, hook: 97, rust: 89, coating: 80, breaks: 100 },
  { straightness: 78, hook: 85, rust: 80, coating: 72, breaks: 95 },
  { straightness: 93, hook: 94, rust: 92, coating: 91, breaks: 100 },
  { straightness: 87, hook: 90, rust: 95, coating: 86, breaks: 100 },
]
const DAMAGED: Record<Damage, Criteria> = {
  bend: { straightness: 30, hook: 92, rust: 88, coating: 70, breaks: 100 },
  rust: { straightness: 90, hook: 94, rust: 25, coating: 40, breaks: 100 },
  peel: { straightness: 90, hook: 95, rust: 55, coating: 15, breaks: 100 },
  hook: { straightness: 91, hook: 20, rust: 90, coating: 85, breaks: 100 },
  break: { straightness: 84, hook: 90, rust: 86, coating: 80, breaks: 10 },
  rustBend: { straightness: 45, hook: 92, rust: 30, coating: 85, breaks: 100 },
}
const LAYOUT: (Damage | 'good' | 'plastic')[] = [
  'good', 'good', 'good', 'bend', 'good', 'plastic', 'good', 'rust', 'good', 'good', 'peel',
  'good', 'good', 'hook', 'good', 'good', 'plastic', 'break', 'good', 'good', 'rustBend', 'good',
]

function rand(seed: number) {
  let a = seed
  return () => {
    a = (a * 16807) % 2147483647
    return (a - 1) / 2147483646
  }
}

export function buildScene(): Item[] {
  const r = rand(4242)
  let g = 0
  return LAYOUT.map((kind, i) => {
    const row = Math.floor(i / 2)
    const col = i % 2
    const base: Item = {
      key: `s${i}`,
      x: (col ? 500 : 220) + (r() - 0.5) * 20,
      y: 230 + row * ROW + (col ? ROW * 0.42 : 0) + (r() - 0.5) * 30,
      rot: (r() - 0.5) * 0.5,
      scale: 0.8 + r() * 0.06,
      coated: r() > 0.35,
      tint: ['#EEEAE2', '#F4F1EC', '#E6E1D6'][Math.floor(r() * 3)],
    }
    if (kind === 'plastic') return { ...base, plastic: { color: i < 8 ? '#7FB3E8' : '#F2A7C3' } }
    if (kind === 'good') return { ...base, criteria: GOOD[g++ % GOOD.length] }
    return { ...base, damage: kind, coated: kind === 'peel' || kind === 'rust' ? true : base.coated, criteria: DAMAGED[kind] }
  })
}

function hangerPath(d?: Damage) {
  const p = new Path2D()
  if (d === 'hook') {
    p.moveTo(0, -40)
    p.lineTo(0, -64)
    p.lineTo(22, -96)
  } else {
    p.moveTo(0, -40)
    p.lineTo(0, -68)
    p.bezierCurveTo(0, -98, 38, -98, 38, -70)
    p.bezierCurveTo(38, -56, 28, -50, 22, -54)
  }
  p.moveTo(-7, -42)
  p.lineTo(7, -36)
  p.moveTo(-7, -34)
  p.lineTo(7, -28)
  const sag = d === 'bend' ? 34 : d === 'rustBend' ? 20 : 0
  p.moveTo(-3, -30)
  if (d === 'bend') {
    p.quadraticCurveTo(-50, -2, -86, 12)
    p.lineTo(-104, 2)
    p.quadraticCurveTo(-120, 30, -146, 48)
  } else p.quadraticCurveTo(-62, 4, -146, 48)
  p.quadraticCurveTo(-154, 56, -140, 58)
  if (d === 'break') {
    p.lineTo(18, 58)
    p.lineTo(24, 54)
    p.moveTo(42, 63)
    p.lineTo(48, 58)
    p.lineTo(140, 58)
  } else p.quadraticCurveTo(0, 58 - sag, 140, 58)
  p.quadraticCurveTo(154, 56, 146, 48)
  p.quadraticCurveTo(62, 4, 3, -30)
  return p
}

function plasticPath() {
  const p = new Path2D()
  p.moveTo(0, -36)
  p.lineTo(0, -66)
  p.bezierCurveTo(0, -96, 36, -96, 36, -68)
  p.moveTo(-150, 40)
  p.bezierCurveTo(-110, 6, -40, -36, 0, -36)
  p.bezierCurveTo(40, -36, 110, 6, 150, 40)
  p.lineTo(150, 52)
  p.lineTo(-150, 52)
  p.closePath()
  return p
}

const LOCAL = [
  [-158, -100],
  [158, -100],
  [158, 66],
  [-158, 66],
]

export class SyntheticSource implements FrameSource {
  readonly kind = 'synthetic' as const
  readonly element: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private bg: HTMLCanvasElement
  private items = buildScene()
  private paths = new Map<string, Path2D>()
  private t0 = 0
  private pausedAt?: number
  private pausedTotal = 0
  private raf = 0
  private last?: Frame
  private readonly duration = 6200

  constructor() {
    this.element = document.createElement('canvas')
    this.element.width = W
    this.element.height = H
    this.ctx = this.element.getContext('2d')!
    this.bg = this.paintBackground()
    for (const it of this.items) this.paths.set(it.key, it.plastic ? plasticPath() : hangerPath(it.damage))
  }

  async start() {
    this.t0 = performance.now()
    const loop = () => {
      this.render()
      this.raf = requestAnimationFrame(loop)
    }
    loop()
  }

  private clock() {
    const now = this.pausedAt ?? performance.now()
    return now - this.t0 - this.pausedTotal
  }

  private camera(t: number) {
    const worldH = 230 + 11 * ROW + 160
    const span = worldH - H
    const k = Math.min(1, Math.max(0, (t - 500) / this.duration))
    const ease = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2
    const s = t / 1000
    return {
      x: Math.sin(s * 1.3) * 7,
      y: -ease * span + Math.sin(s * 2.1) * 4,
      rot: Math.sin(s * 0.9) * 0.006,
      zoom: 1 + Math.sin(s * 0.6) * 0.012,
    }
  }

  private render() {
    const t = this.clock()
    const cam = this.camera(t)
    const ctx = this.ctx
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.save()
    ctx.translate(W / 2, H / 2)
    ctx.rotate(cam.rot)
    ctx.scale(cam.zoom, cam.zoom)
    ctx.translate(-W / 2 + cam.x, -H / 2)
    const off = ((cam.y % 512) + 512) % 512
    for (let k = -1; k < 4; k++) ctx.drawImage(this.bg, -40, off + k * 512 - 40)
    ctx.translate(0, cam.y)
    const m = ctx.getTransform()
    const truth: Detection[] = []
    for (const it of this.items) {
      const sy = it.y + cam.y
      if (sy < -260 || sy > H + 260) continue
      this.drawItem(it)
      const bbox = this.bboxOf(it, m)
      if (bbox) {
        truth.push({
          bbox,
          key: it.key,
          material: it.plastic ? 'plastic' : 'wire',
          materialConfidence: it.plastic ? 0.97 : 0.96 + ((it.key.length * 7) % 4) / 100,
          criteria: it.criteria,
        })
      }
    }
    ctx.restore()
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    const v = ctx.createRadialGradient(W / 2, H / 2, H * 0.25, W / 2, H / 2, H * 0.75)
    v.addColorStop(0, 'rgba(0,0,0,0)')
    v.addColorStop(1, 'rgba(20,16,10,0.28)')
    ctx.fillStyle = v
    ctx.fillRect(0, 0, W, H)
    this.last = { image: this.element, width: W, height: H, time: t, truth }
  }

  private bboxOf(it: Item, m: DOMMatrix): BBox | undefined {
    const c = Math.cos(it.rot) * it.scale
    const s = Math.sin(it.rot) * it.scale
    let x1 = Infinity
    let y1 = Infinity
    let x2 = -Infinity
    let y2 = -Infinity
    for (const [lx, ly] of LOCAL) {
      const wx = it.x + lx * c - ly * s
      const wy = it.y + lx * s + ly * c
      const p = m.transformPoint(new DOMPoint(wx, wy))
      x1 = Math.min(x1, p.x)
      y1 = Math.min(y1, p.y)
      x2 = Math.max(x2, p.x)
      y2 = Math.max(y2, p.y)
    }
    if (x1 < 6 || y1 < 6 || x2 > W - 6 || y2 > H - 6) return undefined
    const pad = 0.06
    const w = x2 - x1
    const h = y2 - y1
    return { x: (x1 + w * pad) / W, y: (y1 + h * pad) / H, w: (w * (1 - 2 * pad)) / W, h: (h * (1 - 2 * pad)) / H }
  }

  private drawItem(it: Item) {
    const ctx = this.ctx
    const path = this.paths.get(it.key)!
    ctx.save()
    ctx.translate(it.x, it.y)
    ctx.rotate(it.rot)
    ctx.scale(it.scale, it.scale)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    if (it.plastic) {
      ctx.shadowColor = 'rgba(40,30,20,0.25)'
      ctx.shadowBlur = 14
      ctx.shadowOffsetX = 5
      ctx.shadowOffsetY = 9
      ctx.fillStyle = it.plastic.color
      ctx.strokeStyle = it.plastic.color
      ctx.lineWidth = 14
      ctx.stroke(path)
      ctx.shadowColor = 'transparent'
      ctx.strokeStyle = 'rgba(255,255,255,0.35)'
      ctx.lineWidth = 3
      ctx.stroke(path)
      ctx.restore()
      return
    }
    const base = it.coated ? it.tint : '#9AA3AA'
    ctx.shadowColor = 'rgba(40,30,20,0.32)'
    ctx.shadowBlur = 7
    ctx.shadowOffsetX = 4
    ctx.shadowOffsetY = 7
    ctx.strokeStyle = it.coated ? '#B9B3A8' : '#6E777E'
    ctx.lineWidth = 5.4
    ctx.stroke(path)
    ctx.shadowColor = 'transparent'
    ctx.strokeStyle = base
    ctx.lineWidth = 3.6
    ctx.stroke(path)
    ctx.strokeStyle = 'rgba(255,255,255,0.75)'
    ctx.lineWidth = 1.1
    ctx.save()
    ctx.translate(-0.7, -0.9)
    ctx.stroke(path)
    ctx.restore()
    if (it.damage === 'rust' || it.damage === 'rustBend' || it.damage === 'peel') {
      ctx.setLineDash(it.damage === 'peel' ? [26, 18, 8, 30] : [10, 16, 4, 22])
      ctx.lineDashOffset = it.key.length * 13
      ctx.strokeStyle = it.damage === 'peel' ? '#8C949A' : '#A4532A'
      ctx.lineWidth = it.damage === 'peel' ? 3.8 : 5
      ctx.stroke(path)
      if (it.damage !== 'peel') {
        ctx.setLineDash([3, 41])
        ctx.strokeStyle = '#6E3218'
        ctx.lineWidth = 6.5
        ctx.stroke(path)
      }
      ctx.setLineDash([])
    }
    ctx.restore()
  }

  private paintBackground() {
    const c = document.createElement('canvas')
    c.width = W + 80
    c.height = 512
    const g = c.getContext('2d')!
    g.fillStyle = '#E9E4DA'
    g.fillRect(0, 0, c.width, c.height)
    const r = rand(77)
    for (let i = 0; i < 9; i++) {
      const y = r() * 512
      const grad = g.createLinearGradient(0, y - 60, 0, y + 60)
      grad.addColorStop(0, 'rgba(255,255,255,0)')
      grad.addColorStop(0.5, r() > 0.5 ? 'rgba(255,255,255,0.35)' : 'rgba(120,100,70,0.08)')
      grad.addColorStop(1, 'rgba(255,255,255,0)')
      g.fillStyle = grad
      g.save()
      g.translate(0, y)
      g.rotate((r() - 0.5) * 0.3)
      g.fillRect(-100, -60, c.width + 200, 120)
      g.restore()
    }
    const img = g.getImageData(0, 0, c.width, c.height)
    for (let i = 0; i < img.data.length; i += 4) {
      const n = (r() - 0.5) * 10
      img.data[i] += n
      img.data[i + 1] += n
      img.data[i + 2] += n
    }
    g.putImageData(img, 0, 0)
    return c
  }

  frame() {
    return this.last
  }

  busy() {
    return this.clock() < this.duration + 900
  }

  pause() {
    if (this.pausedAt === undefined) this.pausedAt = performance.now()
  }

  resume() {
    if (this.pausedAt !== undefined) {
      this.pausedTotal += performance.now() - this.pausedAt
      this.pausedAt = undefined
    }
  }

  stop() {
    cancelAnimationFrame(this.raf)
  }
}
