const assert = require('node:assert/strict');
const { chromium } = require('playwright');

const base = process.env.NOCTE_URL || 'http://127.0.0.1:8123/restaurant/';
const pages = ['index.html', 'menu.html', 'space.html', 'reserve.html'];

(async () => {
  const browser = await chromium.launch({ headless: true, ...(process.env.NOCTE_BROWSER ? { executablePath: process.env.NOCTE_BROWSER } : {}) });
  const errors = [];
  try {
    for (const width of [1440, 390]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      page.on('pageerror', (error) => errors.push(error.message));
      for (const path of pages) {
        await page.goto(new URL(path, base).href);
        await page.waitForLoadState('networkidle');
        await page.evaluate(async () => {
          await Promise.all([...document.images].map(async (image) => {
            image.loading = 'eager';
            try { await image.decode(); } catch (_) { /* Reported below as a broken image. */ }
          }));
        });
        const state = await page.evaluate(() => ({
          title: document.title,
          overflow: document.documentElement.scrollWidth > innerWidth + 1,
          broken: [...document.images].filter((image) => !image.complete || image.naturalWidth === 0).map((image) => image.getAttribute('src')),
        }));
        assert.ok(state.title, `${path} has a title`);
        assert.equal(state.overflow, false, `${path} has no horizontal overflow at ${width}px`);
        assert.deepEqual(state.broken, [], `${path} has no broken images at ${width}px`);
      }
      await page.close();
    }

    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(new URL('index.html', base).href);
    await page.getByRole('button', { name: 'Open menu' }).click();
    assert.equal(await page.getByRole('button', { name: 'Close menu' }).getAttribute('aria-expanded'), 'true');
    await page.getByRole('link', { name: 'Menu', exact: true }).first().click();
    await page.waitForURL(/menu\.html$/);
    await page.getByRole('tab', { name: 'Drinks' }).click();
    assert.equal(await page.getByRole('tabpanel', { name: 'Drinks' }).isVisible(), true);

    await page.goto(new URL('reserve.html', base).href);
    const date = new Date();
    date.setDate(date.getDate() + 1);
    if (date.getDay() === 1) date.setDate(date.getDate() + 1);
    const pad = (number) => String(number).padStart(2, '0');
    await page.locator('#booking-date').fill(`${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`);
    await page.locator('#booking-time').selectOption({ label: '7:00 PM' });
    await page.locator('#booking-guests').selectOption('2');
    await page.getByRole('button', { name: /The nook/ }).click();
    await page.locator('#booking-name').fill('Demo Guest');
    await page.locator('#booking-email').fill('demo@example.com');
    await page.getByRole('button', { name: /Save demo request/ }).click();
    assert.equal(await page.locator('#booking-success').isVisible(), true);
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('nocte-demo-booking')));
    assert.equal(saved.table, 'The nook');
    assert.equal(saved.guests, 2);
    assert.deepEqual(errors, [], 'No uncaught browser errors');
    console.log('Nocte QA passed: four pages at desktop/mobile, navigation, menu tabs, images, overflow, and demo booking.');
    await page.close();
  } finally {
    await browser.close();
  }
})().catch((error) => { console.error(error); process.exitCode = 1; });
