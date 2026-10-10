import type { Frame, FrameSource } from '../types'

function makeVideo() {
  const v = document.createElement('video')
  v.muted = true
  v.playsInline = true
  v.setAttribute('playsinline', '')
  v.setAttribute('muted', '')
  return v
}

function frameOf(v: HTMLVideoElement): Frame | undefined {
  if (v.readyState < 2 || !v.videoWidth) return undefined
  return { image: v, width: v.videoWidth, height: v.videoHeight, time: v.currentTime * 1000 }
}

export class CameraSource implements FrameSource {
  readonly kind = 'camera' as const
  readonly element = makeVideo()
  private stream?: MediaStream

  async start() {
    if (!navigator.mediaDevices?.getUserMedia) throw new Error('camera-unsupported')
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
    })
    this.element.srcObject = this.stream
    await this.element.play()
  }

  frame() {
    return frameOf(this.element)
  }

  pause() {
    this.element.pause()
  }

  resume() {
    void this.element.play()
  }

  stop() {
    this.stream?.getTracks().forEach((t) => t.stop())
    this.element.srcObject = null
  }
}

export async function videoAvailable(url: string) {
  if (!url) return false
  try {
    const r = await fetch(url, { method: 'HEAD' })
    return r.ok && (r.headers.get('content-type') ?? '').startsWith('video')
  } catch {
    return false
  }
}

export class VideoFileSource implements FrameSource {
  readonly kind = 'video' as const
  readonly element = makeVideo()
  constructor(private readonly url: string) {}

  async start() {
    this.element.src = this.url
    this.element.loop = false
    this.element.preload = 'auto'
    await new Promise<void>((resolve, reject) => {
      this.element.onloadeddata = () => resolve()
      this.element.onerror = () => reject(new Error('video-failed'))
    })
    await this.element.play()
  }

  frame() {
    return frameOf(this.element)
  }

  pause() {
    this.element.pause()
  }

  resume() {
    void this.element.play()
  }

  stop() {
    this.element.pause()
    this.element.removeAttribute('src')
    this.element.load()
  }
}
