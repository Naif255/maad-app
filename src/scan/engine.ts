import { appConfig } from '@/config/app'
import type { HangerVerdict } from '@/domain/types'
import { Tracker } from './tracker'
import type { FrameSource, HangerDetector, ScanState } from './types'

export interface EngineOptions {
  source: FrameSource
  detector: HangerDetector
  seed: number
  idPrefix: string
  onState: (s: ScanState) => void
  onConfirm?: (v: HangerVerdict) => void
  onLock?: (verdicts: HangerVerdict[]) => void
}

export class ScanEngine {
  private tracker: Tracker
  private raf = 0
  private busy = false
  private startedAt = 0
  private lastConfirmAt = 0
  private state: ScanState
  private held = false
  private stopped = false

  constructor(private readonly o: EngineOptions) {
    this.tracker = new Tracker(appConfig.scan.confirmFrames, o.seed, o.idPrefix)
    this.state = {
      phase: 'starting',
      tracks: [],
      usable: 0,
      recyclable: 0,
      elapsed: 0,
      quietFor: 0,
      sourceKind: o.source.kind,
      frameSize: { width: 720, height: 1280 },
    }
  }

  async start() {
    await this.o.detector.init()
    await this.o.source.start()
    if (this.stopped) return
    this.startedAt = performance.now()
    this.lastConfirmAt = this.startedAt
    this.emit({ phase: 'scanning' })
    const loop = () => {
      if (this.stopped) return
      this.raf = requestAnimationFrame(loop)
      void this.tick()
    }
    loop()
  }

  private async tick() {
    if (this.busy || this.held || this.state.phase !== 'scanning') return
    const frame = this.o.source.frame()
    if (!frame) return
    this.busy = true
    try {
      const dets = await this.o.detector.detect(frame)
      if (this.stopped || this.state.phase !== 'scanning') return
      const now = performance.now()
      const { views, newlyConfirmed } = this.tracker.update(dets, now)
      if (newlyConfirmed.length) {
        this.lastConfirmAt = now
        newlyConfirmed.forEach((v) => this.o.onConfirm?.(v))
      }
      const verdicts = this.tracker.verdicts()
      const usable = verdicts.filter((v) => v.usable).length
      const elapsed = now - this.startedAt
      const quietFor = now - this.lastConfirmAt
      this.emit({
        tracks: views,
        usable,
        recyclable: verdicts.length - usable,
        elapsed,
        quietFor,
        frameSize: { width: frame.width, height: frame.height },
      })
      if (verdicts.length > 0 && elapsed > appConfig.scan.minScanMs && quietFor > appConfig.scan.lockQuietMs && !this.o.source.busy?.()) this.lock()
    } finally {
      this.busy = false
    }
  }

  lock() {
    if (this.state.phase !== 'scanning') return
    this.o.source.pause()
    const verdicts = this.tracker.verdicts()
    this.emit({ phase: 'locked', tracks: this.state.tracks.filter((t) => t.confirmed) })
    this.o.onLock?.(verdicts)
  }

  hold(v: boolean) {
    this.held = v
    if (this.state.phase !== 'scanning') return
    if (v) this.o.source.pause()
    else this.o.source.resume()
  }

  stop() {
    this.stopped = true
    cancelAnimationFrame(this.raf)
    this.o.source.stop()
    this.o.detector.dispose()
  }

  private emit(patch: Partial<ScanState>) {
    this.state = { ...this.state, ...patch }
    this.o.onState(this.state)
  }
}
