import { expect, test, type Page } from '@playwright/test'

async function fresh(page: Page, path = '/#/c') {
  await page.goto('/?demo=1')
  await page.evaluate(() => localStorage.clear())
  await page.goto(`/?demo=1${path.slice(1)}`)
}

async function signInConsumer(page: Page) {
  await expect(page.getByText('مين أنت؟')).toBeVisible()
  await page.getByRole('button', { name: /عندي علاقات/ }).click()
  await page.getByRole('button', { name: 'أرسل الرمز' }).click()
  await expect(page.getByText('وين ساكن؟')).toBeVisible({ timeout: 6000 })
  await page.getByRole('button', { name: /الصفراء/ }).click()
  await page.getByRole('button', { name: 'يلا نبدأ' }).click()
  await expect(page.getByText('مغاسل قريبة تحتاج علاقات')).toBeVisible()
}

async function scanOnce(page: Page) {
  await expect(page.getByText('تم التحقق').last()).toBeVisible({ timeout: 30_000 })
  await expect(page.getByRole('button', { name: 'كمّل للفرز' })).toBeVisible({ timeout: 10_000 })
}

async function signInAndBook(page: Page) {
  await page.getByRole('button', { name: 'احجز التسليم' }).click()
  await page.getByRole('button', { name: 'ثبّت الحجز' }).click({ timeout: 10_000 })
  await expect(page.getByText('رمزك الشخصي')).toBeVisible()
}

test('camera failure falls back to the demo video', async ({ page }) => {
  await fresh(page)
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'mediaDevices', { value: { getUserMedia: () => Promise.reject(new Error('denied')) } })
  })
  await page.reload()
  await page.getByRole('button', { name: 'الكاميرا' }).click()
  await page.goto('/?demo=1#/c/scan')
  await expect(page.getByText('الكاميرا ما اشتغلت، كمّلنا بالفيديو المسجّل')).toBeVisible({ timeout: 15_000 })
  await scanOnce(page)
})

test('two batches add up, then I-have-hangers suggests laundries', async ({ page }) => {
  await fresh(page)
  await page.getByRole('link', { name: 'افحص' }).click()
  await scanOnce(page)
  await page.getByRole('button', { name: 'دفعة ثانية' }).click()
  await expect(page.getByRole('button', { name: 'كمّل للفرز' })).toBeHidden()
  await scanOnce(page)
  await expect(page.getByText('المجموع 40 علاقة')).toBeVisible()
  await page.getByRole('button', { name: 'كمّل للفرز' }).click()
  await expect(page.getByText('من 2 دفعات')).toBeVisible()
  await expect(page.getByText('مغاسل ثانية تحتاج')).toBeVisible()
  await expect(page.getByText('28 علاقة صالحة').or(page.getByText(/علاقة صالحة/).first())).toBeVisible()
})

test('bookings expire after 48 hours and return quantity', async ({ page }) => {
  await fresh(page)
  await page.getByText('مغسلة نَدى').first().click()
  await expect(page.getByText('تحتاج الحين')).toBeVisible()
  const before = await page.getByTestId('remaining').innerText()
  await page.getByRole('button', { name: /افحص علاقاتك/ }).click()
  await scanOnce(page)
  await page.getByRole('button', { name: 'كمّل للفرز' }).click()
  await signInAndBook(page)
  await page.getByRole('button', { name: /48 ساعة/ }).click()
  await expect(page.getByText('انتهى الحجز').first()).toBeVisible()
  await page.goto('/?demo=1#/c/request/r-nada')
  await expect(page.getByTestId('remaining')).toHaveText(String(Number(before) + 12))
})

test('no nearby requests shows notify option', async ({ page }) => {
  await fresh(page)
  await page.getByTitle('محاكاة: ما فيه طلبات قريبة').click()
  await expect(page.getByText('ما فيه طلبات قريبة الحين')).toBeVisible()
  await expect(page.getByRole('button', { name: 'نبّهني إذا مغسلة قريبة احتاجت' })).toBeVisible()
})

test('laundry posts a request in three steps', async ({ page }) => {
  await fresh(page, '/#/l/new')
  await page.getByRole('button', { name: 'التالي' }).click()
  await page.getByText('خصم 15٪ على طلبك').click()
  await page.getByRole('button', { name: 'التالي' }).click()
  await page.getByRole('button', { name: 'انشر الطلب' }).click()
  await expect(page.getByText('انتشر طلبك')).toBeVisible()
  await expect(page.getByText('لوحة المغسلة')).toBeVisible({ timeout: 5000 })
  await expect(page.getByText('خصم 15٪ على طلبك')).toBeVisible()
})

test('usable-only laundry routes damaged hangers to another laundry', async ({ page }) => {
  await fresh(page, '/#/l/settings')
  await page.getByRole('switch').click()
  await expect(page.getByRole('switch')).toHaveAttribute('aria-checked', 'true')
  await page.goto('/?demo=1#/c/request/r-nada')
  await expect(page.getByText('هالمغسلة تستقبل العلاقات الصالحة فقط.', { exact: false })).toBeVisible()
  await page.getByRole('button', { name: /افحص علاقاتك/ }).click()
  await scanOnce(page)
  await page.getByRole('button', { name: 'كمّل للفرز' }).click()
  await expect(page.getByText('محطة 2')).toBeVisible()
  await expect(page.getByText(/وجّهنا الرمادي/)).toBeVisible()
})

test('first launch: welcome, sign-in, neighborhood, then straight into the last role', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => {
    localStorage.clear()
    sessionStorage.clear()
  })
  await page.goto('/')
  await expect(page.getByText('مين أنت؟')).toBeVisible()
  await expect(page.getByText('فيديو العرض')).toHaveCount(0)
  await page.getByRole('button', { name: /عندي مغسلة/ }).click()
  await expect(page.getByText('دخول المغاسل')).toBeVisible()
  await page.getByRole('button', { name: 'دخول' }).click()
  await expect(page.getByText('لوحة المغسلة')).toBeVisible()
  await page.goto('/')
  await expect(page.getByText('لوحة المغسلة')).toBeVisible()
  await page.getByRole('link', { name: 'الإعدادات' }).click()
  await page.getByRole('button', { name: 'تبديل الحساب' }).click()
  await signInConsumer(page)
  await expect(page.getByText('ريم')).toHaveCount(0)
  await page.getByRole('button', { name: 'غيّر الحي' }).click()
  await page.getByRole('button', { name: /الخليج/ }).click()
  await expect(page.getByRole('button', { name: 'غيّر الحي' })).toContainText('الخليج')
  await page.goto('/')
  await expect(page.getByText('مغاسل قريبة تحتاج علاقات')).toBeVisible()
  await page.getByRole('link', { name: 'حسابي' }).click()
  await expect(page.getByText('055 123 4567')).toBeVisible()
  await page.getByRole('button', { name: 'تبديل الحساب' }).click()
  await page.getByRole('button', { name: /عندي مغسلة/ }).click()
  await expect(page.getByText('لوحة المغسلة')).toBeVisible()
})

test('a role route without a session goes to sign-in, not the app', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => {
    localStorage.clear()
    sessionStorage.clear()
  })
  await page.goto('/#/f')
  await expect(page.getByText('مين أنت؟')).toBeVisible()
})

test('demo reset brings back the welcome page and story jumps bypass sign-in', async ({ page }) => {
  await fresh(page)
  await expect(page.getByText('مغاسل قريبة تحتاج علاقات')).toBeVisible()
  await page.getByRole('button', { name: 'إعادة العرض' }).click()
  await expect(page.getByText('مين أنت؟')).toBeVisible()
  await page.getByRole('button', { name: 'المصنع' }).first().click()
  await expect(page.getByText('صندوقين جاهزين للاستلام')).toBeVisible()
  await page.getByRole('button', { name: 'المغسلة' }).first().click()
  await expect(page.getByText('لوحة المغسلة')).toBeVisible()
})

test('without demo mode a camera failure shows a retry, not a fake video', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'mediaDevices', { value: { getUserMedia: () => Promise.reject(new Error('denied')) } })
  })
  await page.goto('/')
  await page.evaluate(() => {
    localStorage.clear()
    sessionStorage.clear()
  })
  await page.goto('/')
  await signInConsumer(page)
  await page.goto('/#/c/scan')
  await expect(page.getByText('ما قدرنا نفتح الكاميرا')).toBeVisible({ timeout: 15_000 })
  await expect(page.getByRole('button', { name: 'حاول مرة ثانية' })).toBeVisible()
})
