import { chromium } from 'playwright'
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 1400 } })
await page.goto('http://localhost:5174/login', { waitUntil: 'networkidle' })
await page.waitForTimeout(1000)
await page.fill('#email', 'demo@cpareviewer.test')
await page.fill('#password', 'password123')
await page.click('button[type=submit]')
await page.waitForURL('**/app/dashboard', { timeout: 10000 })
await page.goto('http://localhost:5174/app/exam-setup', { waitUntil: 'networkidle' })
await page.waitForTimeout(1000)
const info = await page.$eval('[data-slot=switch]', el => {
  const cs = getComputedStyle(el)
  const thumb = el.querySelector('[data-slot=switch-thumb]')
  const tcs = thumb ? getComputedStyle(thumb) : null
  const rect = el.getBoundingClientRect()
  return {
    rect,
    bg: cs.backgroundColor,
    className: el.className,
    thumbBg: tcs?.backgroundColor,
    thumbTransform: tcs?.transform,
  }
})
console.log(JSON.stringify(info, null, 2))
await browser.close()
