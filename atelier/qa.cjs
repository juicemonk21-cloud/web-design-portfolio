const { chromium } = require('C:/Users/sashakamen/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const { pathToFileURL } = require('node:url');
const path = require('node:path');
const fs = require('node:fs');

const url = pathToFileURL(path.join(__dirname, 'index.html')).href;
const screenshots = path.join(__dirname, 'screenshots');
fs.mkdirSync(screenshots, { recursive: true });
const assert = (condition, message) => { if (!condition) throw new Error(message); };

async function revealAll(page) {
  await page.evaluate(async () => {
    for (let y = 0; y < document.documentElement.scrollHeight; y += 600) {
      window.scrollTo({ top: y, behavior: 'instant' });
      await new Promise(resolve => setTimeout(resolve, 120));
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
  });
  await page.waitForTimeout(900);
}

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  const errors = [];
  for (const [name, viewport] of Object.entries({ desktop: { width: 1440, height: 900 }, mobile: { width: 390, height: 844 } })) {
    const page = await browser.newPage({ viewport, deviceScaleFactor: 1 });
    page.on('pageerror', error => errors.push(`${name}: ${error.message}`));
    await page.goto(url, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    await revealAll(page);
    await page.evaluate(async () => {
      const images = [...document.images];
      images.forEach(image => { image.loading = 'eager'; });
      await Promise.all(images.map(image => image.decode().catch(() => {})));
    });
    const state = await page.evaluate(() => ({ overflow: document.documentElement.scrollWidth > window.innerWidth, brokenImages: [...document.images].filter(image => !image.complete || image.naturalWidth === 0).map(image => image.src) }));
    assert(!state.overflow, `${name}: horizontal overflow`);
    assert(!state.brokenImages.length, `${name}: broken images: ${state.brokenImages.join(', ')}`);
    await page.screenshot({ path: path.join(screenshots, `${name}-full.png`), fullPage: true });
    await page.screenshot({ path: path.join(screenshots, `${name}-hero.png`) });
    if (name === 'mobile') {
      await page.getByRole('button', { name: 'Open menu' }).click();
      assert(await page.getByRole('navigation', { name: 'Mobile navigation' }).isVisible(), 'mobile navigation failed to open');
      await page.getByRole('navigation', { name: 'Mobile navigation' }).getByRole('link', { name: 'Stay' }).click();
      assert(!(await page.getByRole('navigation', { name: 'Mobile navigation' }).isVisible()), 'mobile navigation failed to close');
    } else {
      await page.getByRole('tab', { name: 'Courtyard Suite' }).click();
      assert(await page.locator('#room-title').textContent() === 'A slower morning awaits.', 'room selection failed');
      await page.getByRole('button', { name: 'Plan a stay' }).first().click();
      assert(await page.getByRole('dialog').isVisible(), 'stay planner failed to open');
      const future = offset => { const date = new Date(); date.setDate(date.getDate() + offset); return date.toISOString().split('T')[0]; };
      await page.locator('#arrival').fill(future(20));
      await page.locator('#departure').fill(future(24));
      await page.getByRole('button', { name: 'Preview request' }).click();
      assert(await page.locator('#booking-summary').isVisible(), 'request preview failed');
      await page.getByRole('button', { name: 'Close stay planner' }).click();
    }
    console.log(`${name}: images loaded, no horizontal overflow, interactions passed`);
    await page.close();
  }
  assert(errors.length === 0, `Browser errors: ${errors.join('; ')}`);
  await browser.close();
  console.log('All QA checks passed.');
})().catch(error => { console.error(error); process.exit(1); });
