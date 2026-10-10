import { test } from '@playwright/test'

test.use({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true })

const dir = process.env.SHOTS ?? 'test-results/gallery'

test('mobile gallery', async ({ page }) => {
  const shot = async (name: string, path: string, wait = 800, full = false) => {
    await page.goto(path)
    await page.waitForTimeout(wait)
    await page.screenshot({ path: `${dir}/${name}.png`, fullPage: full })
  }
  await page.goto('/')
  await page.evaluate(() => {
    localStorage.clear()
    sessionStorage.clear()
  })
  await shot('m00-start', '/#/start', 1600)
  await shot('m01-home', '/#/c', 1200)
  await shot('m02-request', '/#/c/request/r-nada', 800)
  await shot('m04-wallet', '/#/c/wallet', 900)
  await page.evaluate(() => document.getElementById('c-scroll')?.scrollTo(0, 2000))
  await page.waitForTimeout(400)
  await page.screenshot({ path: `${dir}/m05-wallet-bottom.png` })
  await shot('m06-history', '/#/c/history')
  await shot('m07-me', '/#/c/me')
  await shot('m08-laundry', '/#/l')
  await shot('m09-new', '/#/l/new')
  await shot('m10-laundry-scan', '/#/l/scan', 1500)
  await shot('m11-laundry-settings', '/#/l/settings')
  await shot('m12-certs', '/#/f/certs')
  await shot('m13-factory', '/#/f', 1000)
  await shot('m14-impact', '/#/impact', 1200)
  await shot('m16-scan-error', '/#/c/scan', 3000)
  await shot('m15-scan', '/?demo=1#/c/scan', 4000)
  await page.waitForTimeout(6000)
  await page.screenshot({ path: `${dir}/m17-scan-done.png` })
})
