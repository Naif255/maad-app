import { expect, test } from '@playwright/test'

test.use({
  launchOptions: { args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] },
  permissions: ['camera'],
})

test('live camera scan runs with the live detector', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.goto('/?demo=1')
  await page.evaluate(() => localStorage.clear())
  await page.goto('/?demo=1#/c')
  await page.getByRole('button', { name: 'الكاميرا' }).click()
  await page.goto('/?demo=1#/c/scan')
  await expect(page.getByText('فرّش العلاقات على قماش سادة ووجّه الكاميرا').or(page.getByText(/نعدّ|ثبّت/))).toBeVisible({ timeout: 15_000 })
  await expect(page.getByText('ما قدرنا نفتح الكاميرا')).toHaveCount(0)
  await expect(page.getByText('الكاميرا ما اشتغلت')).toHaveCount(0)
  await page.waitForTimeout(2500)
  expect(errors).toEqual([])
})
