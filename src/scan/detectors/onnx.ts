import { CRITERIA, type Criteria } from '@/domain/types'
import type { Detection, Frame, HangerDetector } from '../types'

interface OrtTensor {
  data: Float32Array
  dims: number[]
}

interface OrtSession {
  inputNames: string[]
  outputNames: string[]
  run(feeds: Record<string, unknown>): Promise<Record<string, OrtTensor>>
}

interface Ort {
  InferenceSession: { create(url: string, opts?: unknown): Promise<OrtSession> }
  Tensor: new (type: string, data: Float32Array, dims: number[]) => unknown
}

export interface OnnxOptions {
  modelUrl: string
  runtimeUrl: string
  inputSize?: number
  scoreThreshold?: number
  iouThreshold?: number
}

const ortOf = () => (window as unknown as { ort?: Ort }).ort

function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    if (ortOf()) return resolve()
    const s = document.createElement('script')
    s.src = src
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('ort-load-failed'))
    document.head.appendChild(s)
  })
}

export class OnnxDetector implements HangerDetector {
  readonly id = 'onnx'
  private session?: OrtSession
  private ort?: Ort
  private canvas = document.createElement('canvas')
  private ctx = this.canvas.getContext('2d', { willReadFrequently: true })!
  private size: number

  constructor(private readonly opts: OnnxOptions) {
    this.size = opts.inputSize ?? 640
    this.canvas.width = this.size
    this.canvas.height = this.size
  }

  async init() {
    await loadScript(this.opts.runtimeUrl)
    this.ort = ortOf()
    if (!this.ort) throw new Error('ort-missing')
    this.session = await this.ort.InferenceSession.create(this.opts.modelUrl, { executionProviders: ['webgpu', 'wasm'] })
  }

  async detect(frame: Frame): Promise<Detection[]> {
    if (!this.session || !this.ort) return []
    const s = this.size
    const scale = Math.min(s / frame.width, s / frame.height)
    this.ctx.fillStyle = '#727272'
    this.ctx.fillRect(0, 0, s, s)
    this.ctx.drawImage(frame.image, 0, 0, frame.width * scale, frame.height * scale)
    const px = this.ctx.getImageData(0, 0, s, s).data
    const plane = s * s
    const input = new Float32Array(3 * plane)
    for (let i = 0; i < plane; i++) {
      input[i] = px[i * 4] / 255
      input[plane + i] = px[i * 4 + 1] / 255
      input[2 * plane + i] = px[i * 4 + 2] / 255
    }
    const tensor = new this.ort.Tensor('float32', input, [1, 3, s, s])
    const result = await this.session.run({ [this.session.inputNames[0]]: tensor })
    const out = result[this.session.outputNames[0]]
    return nms(decode(out, scale, frame.width, frame.height, this.opts.scoreThreshold ?? 0.45), this.opts.iouThreshold ?? 0.5)
  }

  dispose() {
    this.session = undefined
  }
}

function decode(t: OrtTensor, scale: number, fw: number, fh: number, thr: number): Detection[] {
  const [, rows, cols] = t.dims
  const out: Detection[] = []
  for (let r = 0; r < rows; r++) {
    const o = r * cols
    const conf = t.data[o + 4]
    if (conf < thr) continue
    const cx = t.data[o] / scale
    const cy = t.data[o + 1] / scale
    const w = t.data[o + 2] / scale
    const h = t.data[o + 3] / scale
    const criteria = {} as Criteria
    CRITERIA.forEach((k, i) => (criteria[k] = Math.round((t.data[o + 6 + i] ?? 1) * 100)))
    out.push({
      bbox: { x: (cx - w / 2) / fw, y: (cy - h / 2) / fh, w: w / fw, h: h / fh },
      material: t.data[o + 5] > 0.5 ? 'plastic' : 'wire',
      materialConfidence: conf,
      criteria,
    })
  }
  return out
}

function nms(list: Detection[], thr: number) {
  const keep: Detection[] = []
  for (const d of list.sort((a, b) => b.materialConfidence - a.materialConfidence)) {
    if (keep.every((k) => overlap(k, d) < thr)) keep.push(d)
  }
  return keep
}

function overlap(a: Detection, b: Detection) {
  const x1 = Math.max(a.bbox.x, b.bbox.x)
  const y1 = Math.max(a.bbox.y, b.bbox.y)
  const x2 = Math.min(a.bbox.x + a.bbox.w, b.bbox.x + b.bbox.w)
  const y2 = Math.min(a.bbox.y + a.bbox.h, b.bbox.y + b.bbox.h)
  const inter = Math.max(0, x2 - x1) * Math.max(0, y2 - y1)
  return inter / (a.bbox.w * a.bbox.h + b.bbox.w * b.bbox.h - inter)
}
