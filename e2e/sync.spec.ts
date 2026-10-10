import { expect, test } from '@playwright/test'

test('phone and laptop stay in sync over the dev server', async ({ browser }) => {
  const laptop = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage()
  const phone = await (await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true })).newPage()
  await laptop.goto('/?sync=1#/c')
  await expect(laptop.getByText('متزامن')).toBeVisible()
  await laptop.getByRole('button', { name: 'إعادة العرض' }).click()
  await phone.goto('/?sync=1#/c')
  await expect(phone.getByText('مغاسل قريبة تحتاج علاقات')).toBeVisible()

  await phone.goto('/?sync=1#/c/scan?for=r-nada')
  await expect(phone.getByRole('button', { name: 'كمّل للفرز' })).toBeVisible({ timeout: 30_000 })
  await phone.getByRole('button', { name: 'كمّل للفرز' }).click()
  await phone.getByRole('button', { name: 'احجز التسليم' }).click()
  await phone.getByRole('button', { name: 'أرسل رمز التحقق' }).click({ timeout: 10_000 })
  await phone.getByRole('button', { name: 'ثبّت الحجز' }).click({ timeout: 10_000 })
  await expect(phone.getByText('رمزك الشخصي')).toBeVisible()

  await laptop.getByRole('button', { name: 'المغسلة' }).first().click()
  await expect(laptop.getByText('M-', { exact: false }).nth(1)).toBeVisible()
  await laptop.goto('/?sync=1#/l/customer/u-demo')
  await laptop.getByRole('button', { name: 'استلمت' }).click()
  await expect(laptop.getByText('امتلى الصندوق!')).toBeVisible()

  await expect(phone.getByText('وصلتك المكافأة')).toBeVisible({ timeout: 10_000 })
  await phone.goto('/?sync=1#/c')
  await expect(phone.getByText('وصلتك مكافأتك!')).toBeVisible({ timeout: 10_000 })
})
