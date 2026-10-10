import { expect, test } from '@playwright/test'

test('heuristic detector finds wire hangers and never counts plastic', async ({ page }) => {
  await page.goto('/#/brand')
  const result = await page.evaluate(async () => {
    const { SyntheticSource } = await import('/src/scan/sources/synthetic.ts')
    const { HeuristicDetector } = await import('/src/scan/detectors/heuristic.ts')
    const src = new SyntheticSource()
    await src.start()
    const det = new HeuristicDetector()
    const out: { truthWire: number; truthPlastic: number; found: number; plastic: number; matched: number; plasticCounted: number }[] = []
    for (let i = 0; i < 6; i++) {
      await new Promise((r) => setTimeout(r, 900))
      const f = src.frame()!
      const d = await det.detect(f)
      const truth = f.truth ?? []
      const iou = (a: any, b: any) => {
        const x1 = Math.max(a.x, b.x), y1 = Math.max(a.y, b.y)
        const x2 = Math.min(a.x + a.w, b.x + b.w), y2 = Math.min(a.y + a.h, b.y + b.h)
        const inter = Math.max(0, x2 - x1) * Math.max(0, y2 - y1)
        return inter / (a.w * a.h + b.w * b.h - inter)
      }
      out.push({
        truthWire: truth.filter((t) => t.material === 'wire').length,
        truthPlastic: truth.filter((t) => t.material === 'plastic').length,
        found: d.filter((x) => x.material === 'wire').length,
        plastic: d.filter((x) => x.material === 'plastic').length,
        matched: truth.filter((t) => t.material === 'wire' && d.some((x) => x.material === 'wire' && iou(x.bbox, t.bbox) > 0.3)).length,
        plasticCounted: truth.filter((t) => t.material === 'plastic' && d.some((x) => x.material === 'wire' && iou(x.bbox, t.bbox) > 0.3)).length,
      })
    }
    src.stop()
    return out
  })
  const tw = result.reduce((a, r) => a + r.truthWire, 0)
  const m = result.reduce((a, r) => a + r.matched, 0)
  expect(m / tw).toBeGreaterThan(0.75)
  expect(result.reduce((a, r) => a + r.plasticCounted, 0)).toBe(0)
})
