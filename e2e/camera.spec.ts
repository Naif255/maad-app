import { expect, test } from '@playwright/test'

test.use({
  launchOptions: { args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] },
  permissions: ['camera'],
})

test('live camera scan runs with the live detector', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.goto('/#/c')
  await page.getByRole('button', { name: 'الكاميرا' }).click()
  await page.goto('/#/c/scan')
  await expect(page.getByText('مباشر', { exact: true })).toBeVisible({ timeout: 15_000 })
  await page.waitForTimeout(2500)
  expect(errors).toEqual([])
})
