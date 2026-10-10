import { expect, test, type Page } from '@playwright/test'

const shots = process.env.SHOTS ?? 'test-results/shots'
const snap = async (page: Page, name: string) => {
  if (shots) await page.screenshot({ path: `${shots}/${name}.png` })
}

test('demo story runs end to end', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))

  await page.goto('/?demo=1')
  await page.evaluate(() => localStorage.clear())
  await page.goto('/?demo=1#/c')
  await expect(page.getByText('مغاسل قريبة تحتاج علاقات')).toBeVisible()
  await snap(page, '01-home')

  await page.getByText('مغسلة نَدى').first().click()
  await snap(page, '02-request')
  await page.getByRole('button', { name: /افحص علاقاتك/ }).click()
  await page.waitForTimeout(3500)
  await snap(page, '03-scanning')
  await expect(page.getByText('تم التحقق').last()).toBeVisible({ timeout: 30_000 })
  await page.waitForTimeout(600)
  await snap(page, '04-verified')
  await expect(page.getByRole('button', { name: 'كمّل للفرز' })).toBeVisible({ timeout: 10_000 })
  const boxes = page.locator('button.absolute.left-0.top-0')
  let target = -1
  for (let i = 0; i < (await boxes.count()); i++) {
    const b = await boxes.nth(i).boundingBox()
    if (b && b.y + b.height / 2 > 380 && b.y + b.height / 2 < 640) target = i
  }
  if (target >= 0) {
    await boxes.nth(target).click()
    await expect(page.getByText('استقامة الإطار')).toBeVisible()
    await page.waitForTimeout(900)
    await snap(page, '04b-criteria')
    await page.locator('[class*="bg-ink/40"]').first().click({ position: { x: 40, y: 40 } })
    await expect(page.getByText('استقامة الإطار')).toBeHidden()
  }
  await page.getByRole('button', { name: 'كمّل للفرز' }).click({ timeout: 10_000 })
  await expect(page.getByText('الكرتون الأخضر').first()).toBeVisible()
  await page.waitForTimeout(500)
  await snap(page, '05-summary')
  await expect(page.getByText('14 علاقة صالحة')).toBeVisible()
  await expect(page.getByText('6 علاقات للتدوير')).toBeVisible()

  await page.getByRole('button', { name: 'احجز التسليم' }).click()
  await expect(page.getByText('كيف بتسلّمها؟')).toBeVisible({ timeout: 10_000 })
  await snap(page, '06-method')
  await page.getByRole('button', { name: 'ثبّت الحجز' }).click()
  await expect(page.getByText('رمزك الشخصي')).toBeVisible()
  await page.waitForTimeout(700)
  await snap(page, '07-receipt')
  const code = (await page.locator('.font-display.text-xl.tracking-wide').first().innerText()).trim()

  await page.getByRole('button', { name: 'المغسلة' }).first().click()
  await expect(page.getByText('لوحة المغسلة')).toBeVisible()
  await snap(page, '08-laundry')
  await page.getByRole('link', { name: 'امسح' }).click()
  await page.getByRole('button', { name: new RegExp(code) }).click()
  await snap(page, '09-dropoff')
  await page.getByRole('button', { name: 'استلمت' }).click()
  await expect(page.getByText('تم الاستلام')).toBeVisible()
  await page.waitForTimeout(1200)
  await snap(page, '10-received')
  await expect(page.getByText('امتلى الصندوق!')).toBeVisible()

  await page.getByRole('button', { name: 'المستهلك' }).first().click()
  await expect(page.getByText('وصلتك مكافأتك!')).toBeVisible()
  await page.waitForTimeout(1500)
  await snap(page, '11-reward')
  await page.getByRole('button', { name: 'شوف بطاقة أثرك' }).click()
  await page.waitForTimeout(1200)
  await snap(page, '12-impact-card')

  await page.getByRole('button', { name: 'المصنع' }).first().click()
  await expect(page.getByText('صناديق جاهزة للاستلام')).toBeVisible()
  await page.waitForTimeout(800)
  await snap(page, '13-factory')
  await page.getByRole('button', { name: 'اعتمد جولة الاستلام' }).click()
  await expect(page.getByText('جولة الاستلام')).toBeVisible()
  await snap(page, '14-round')
  await expect(page.getByText('3 محطات', { exact: false }).first()).toBeVisible()
  for (let i = 0; i < 3; i++) await page.getByRole('button', { name: 'استلمت', exact: true }).first().click()
  await page.getByText('صدرت شهادة التوريد').click()
  await page.waitForTimeout(900)
  await snap(page, '15-certificate')

  await page.getByRole('button', { name: 'الأثر' }).first().click()
  await page.waitForTimeout(1500)
  await snap(page, '16-impact')

  await page.goto('/?demo=1#/brand')
  await page.waitForTimeout(1600)
  await snap(page, '17-brand')

  expect(errors.filter((e) => !/favicon|Download the React DevTools/.test(e))).toEqual([])
})
