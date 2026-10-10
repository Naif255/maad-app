import type { Criteria, HangerVerdict } from '@/domain/types'

export interface BBox {
  x: number
  y: number
  w: number
  h: number
}

export type Material = 'wire' | 'plastic'

export interface Detection {
  bbox: BBox
  material: Material
  materialConfidence: number
  criteria?: Criteria
  key?: string
}

export interface Frame {
  image: CanvasImageSource
  width: number
  height: number
  time: number
  truth?: Detection[]
}

export interface HangerDetector {
  readonly id: string
  init(): Promise<void>
  detect(frame: Frame): Promise<Detection[]>
  dispose(): void
}

export interface FrameSource {
  readonly kind: 'camera' | 'video' | 'synthetic'
  readonly element: HTMLVideoElement | HTMLCanvasElement
  start(): Promise<void>
  frame(): Frame | undefined
  pause(): void
  resume(): void
  stop(): void
  busy?(): boolean
}

export interface TrackView {
  id: string
  bbox: BBox
  visible: boolean
  confirmed: boolean
  verdict?: HangerVerdict
  bornAt: number
}

export type ScanPhase = 'starting' | 'scanning' | 'locked' | 'failed'

export interface ScanState {
  phase: ScanPhase
  tracks: TrackView[]
  usable: number
  recyclable: number
  elapsed: number
  quietFor: number
  sourceKind?: FrameSource['kind']
  frameSize: { width: number; height: number }
  error?: string
}
