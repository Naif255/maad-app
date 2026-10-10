import { chromium } from '@playwright/test'
import { readFileSync } from 'node:fs'

const svg = readFileSync('public/favicon.svg', 'utf8').replace('rx="16"', 'rx="0"')
const browser = await chromium.launch()
const page = await browser.newPage()
for (const size of [180, 192, 512]) {
  await page.setViewportSize({ width: size, height: size })
  await page.setContent(`<html><body style="margin:0">${svg.replace('<svg ', `<svg width="${size}" height="${size}" `)}</body></html>`)
  await page.screenshot({ path: `public/icon-${size}.png`, omitBackground: false })
}
await browser.close()
