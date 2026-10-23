const { chromium } = require('C:/Users/sashakamen/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const { pathToFileURL } = require('node:url');
const path = require('node:path');
const fs = require('node:fs');

const screenshots = path.join(__dirname, 'screenshots');
fs.mkdirSync(screenshots, { recursive: true });
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const future = offset => {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
};

async function revealAll(page) {
  await page.evaluate(async () => {
    for (let y = 0; y < document.documentElement.scrollHeight; y += 560) {
      window.scrollTo({ top: y, behavior: 'instant' });
      await new Promise(resolve => setTimeout(resolve, 95));
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
  });
  await page.waitForTimeout(800);
}

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  const pages = ['index.html', 'suites.html', 'experience.html'];
  const viewports = {
    desktop: { width: 1440, height: 900 },
    tablet: { width: 768, height: 900 },
    mobile: { width: 390, height: 844 }
  };
  const errors = [];
  for (const file of pages) {
    for (const [size, viewport] of Object.entries(viewports)) {
      const page = await browser.newPage({ viewport, reducedMotion: 'reduce' });
      const label = file.replace('.html', '') + '-' + size;
      page.on('pageerror', error => errors.push(label + ': ' + error.message));
      await page.goto(pathToFileURL(path.join(__dirname, file)).href, { waitUntil: 'load' });
      await page.evaluate(() => document.fonts.ready);
      await revealAll(page);
      await page.evaluate(async () => {
        const images = [...document.images];
        images.forEach(image => { image.loading = 'eager'; });
        await Promise.all(images.map(image => image.decode().catch(() => {})));
      });
      const state = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth > window.innerWidth,
        broken: [...document.images].filter(image => !image.complete || !image.naturalWidth).map(image => image.src),
        hiddenContent: [...document.querySelectorAll('main h1, main h2')].filter(el => getComputedStyle(el).opacity === '0').map(el => el.textContent.trim()),
        overflowElements: [...document.querySelectorAll('body *')].filter(el => el.getBoundingClientRect().right > window.innerWidth + 2).slice(0, 6).map(el => el.tagName + '.' + el.className + ':' + Math.round(el.getBoundingClientRect().left) + '-' + Math.round(el.getBoundingClientRect().right))
      }));
      assert(!state.overflow, label + ': horizontal overflow ' + state.overflowElements.join(', '));
      assert(!state.broken.length, label + ': broken images ' + state.broken.join(', '));
      assert(!state.hiddenContent.length, label + ': hidden heading ' + state.hiddenContent.join(', '));
      await page.screenshot({ path: path.join(screenshots, label + '-hero.png') });
      if (size !== 'tablet') await page.screenshot({ path: path.join(screenshots, label + '-full.png'), fullPage: true });

      if (size === 'mobile') {
        await page.getByRole('button', { name: 'Open menu' }).click();
        assert(await page.getByRole('navigation', { name: 'Mobile navigation' }).isVisible(), label + ': mobile menu');
        await page.getByRole('button', { name: 'Close menu' }).click();
      }
      if (size === 'desktop') {
        let submitted = null;
        await page.route('https://formsubmit.co/ajax/**', async route => {
          submitted = route.request().postDataJSON();
          await route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ success: 'true' }) });
        });
        await page.locator('[data-open-booking]').first().click();
        assert(await page.getByRole('dialog').isVisible(), label + ': inquiry dialog');
        await page.locator('#stay-form [type=submit]').click();
        assert(await page.locator('#form-error').isVisible(), label + ': required field validation');
        await page.locator('#arrival').fill(future(20));
        await page.locator('#departure').fill(future(24));
        await page.locator('#guest-name').fill('Test Guest');
        await page.locator('#guest-email').fill('test@example.com');
        await page.locator('#stay-form [type=submit]').click();
        await page.locator('#booking-summary').waitFor({ state: 'visible', timeout: 5000 });
        assert(submitted?.email === 'test@example.com' && submitted?.arrival && submitted?.departure, label + ': submission payload');
        await page.getByRole('button', { name: /Close stay/ }).click();
      }
      console.log(label + ': passed');
      await page.close();
    }
  }
  assert(!errors.length, 'Browser errors: ' + errors.join('; '));
  await browser.close();
  console.log('All three pages passed responsive and inquiry checks.');
})().catch(error => { console.error(error); process.exit(1); });
