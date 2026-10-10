import { appConfig } from '@/config/app'
import { HeuristicDetector } from './detectors/heuristic'
import { OnnxDetector } from './detectors/onnx'
import { ScriptedDetector, type Annotation } from './detectors/scripted'
import { CameraSource, VideoFileSource, videoAvailable } from './sources/media'
import { SyntheticSource } from './sources/synthetic'
import type { FrameSource, HangerDetector } from './types'

export interface Pipeline {
  source: FrameSource
  detector: HangerDetector
}

function liveDetector(): HangerDetector {
  if (appConfig.onnxModelUrl) return new OnnxDetector({ modelUrl: appConfig.onnxModelUrl, runtimeUrl: appConfig.onnxRuntimeUrl })
  return new HeuristicDetector()
}

async function loadAnnotation(url: string): Promise<Annotation | undefined> {
  try {
    const r = await fetch(url.replace(/\.[a-z0-9]+$/i, '.json'))
    if (!r.ok || !(r.headers.get('content-type') ?? '').includes('json')) return undefined
    return (await r.json()) as Annotation
  } catch {
    return undefined
  }
}

export async function demoPipeline(): Promise<Pipeline> {
  if (await videoAvailable(appConfig.sampleVideoUrl)) {
    const annotation = await loadAnnotation(appConfig.sampleVideoUrl)
    return {
      source: new VideoFileSource(appConfig.sampleVideoUrl),
      detector: annotation ? new ScriptedDetector(annotation) : liveDetector(),
    }
  }
  return { source: new SyntheticSource(), detector: new ScriptedDetector() }
}

export function syntheticPipeline(): Pipeline {
  return { source: new SyntheticSource(), detector: new ScriptedDetector() }
}

export function cameraPipeline(): Pipeline {
  return { source: new CameraSource(), detector: liveDetector() }
}

export * from './types'
export { ScanEngine } from './engine'
