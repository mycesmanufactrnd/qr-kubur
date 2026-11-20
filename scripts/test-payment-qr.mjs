// Run after npm run build. Real pages with read-only API fixtures; no live payments.
import { chromium, expect } from '@playwright/test';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
const root = path.resolve('dist');
const server = createServer(async (req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname;
  let file = path.join(root, pathname === '/' ? 'index.html' : pathname);
  if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
  try { await readFile(file); } catch { file = path.join(root, 'index.html'); }
  const mime = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.png': 'image/png', '.svg': 'image/svg+xml' };
  res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
  res.end(await readFile(file));
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await context.addInitScript(() => {
    localStorage.setItem('language', 'en');
    localStorage.setItem('onboardingPermissionsDone', '1');
    sessionStorage.setItem('user_location', JSON.stringify({ location: { lat: 3.1, lng: 101.6 }, state: 'Selangor' }));
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  let writes = 0;
  let qrFailure = false;
  const orgs = [1, 2, 3].map(id => ({ id, name: `Masjid Test ${id}`, state: 'Selangor', organisationpaymentconfigs: [] }));
  await page.route('**/trpc/**', async route => {
    if (route.request().method() !== 'GET') writes++;
    const url = new URL(route.request().url());
    const names = decodeURIComponent(url.pathname.split('/trpc/')[1]).split(',');
    const inputs = JSON.parse(url.searchParams.get('input') || '{}');
    const data = names.map((name, i) => {
      const input = names.length > 1 || url.searchParams.has('batch') ? inputs[i] : inputs;
      if (name === 'organisation.getOrganisationByCoordinates') return orgs;
      if (name === 'mosque.getMosqueById') {
        const id = input?.id || 1;
        return { id, name: `Masjid Test ${id}`, organisation: orgs[id - 1], organisationcharts: [] };
      }
      return [];
    });
    await route.fulfill({ json: url.searchParams.has('batch') ? data.map(data => ({ result: { data } })) : { result: { data: data[0] } } });
  });
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aD1sAAAAASUVORK5CYII=', 'base64');
  await page.route('**/api/payment-display/**', async route => {
    const pathname = new URL(route.request().url()).pathname;
    const id = Number(pathname.split('/')[4]);
    if (pathname.includes('/qr/')) {
      await route.fulfill(qrFailure ? { status: 404 } : { contentType: 'image/png', body: png }); return;
    }
    const qr = { code: 'QR', name: 'QR', kind: 'qr', fields: [], qrUrl: `/api/payment-display/organisation/${id}/qr/${id}` };
    const bank = { code: 'FPX', name: 'Bank Transfer', kind: 'bank', qrUrl: null, fields: [{ key: 'bank_name', label: 'Bank Name', fieldtype: 'text', value: 'Maybank' }, { key: 'account_no', label: 'Account No.', fieldtype: 'text', value: `1234567${id}` }] };
    await route.fulfill({ json: id === 3 ? [bank] : id === 2 ? [qr] : [bank, qr] });
  });
  await page.goto(`${origin}/DonationPage?id=1&type=organisation`);
  await expect(page.locator('input[value="FPX"]')).toBeChecked({ timeout: 20000 });
  await expect(page.getByText('12345671', { exact: false })).toBeVisible();
  await page.getByPlaceholder('Name', { exact: true }).fill('Test Donor');
  await page.getByPlaceholder('Email', { exact: true }).fill('donor@example.com');
  await page.getByPlaceholder('Notes', { exact: true }).fill('Donation form remains editable');
  await page.getByPlaceholder('Other amount (RM)', { exact: true }).fill('100');
  await expect(page.getByText('RM 101.50', { exact: true })).toBeVisible();
  await page.getByText('QR Payment', { exact: true }).click();
  await expect(page.getByPlaceholder('Name', { exact: true })).toHaveCount(0);
  await expect(page.locator('button[type="submit"]')).toHaveCount(0);
  await expect(page.getByText('12345671', { exact: false })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Download QR', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'Enlarge QR' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('dialog').getByRole('button', { name: 'Details', exact: true }).click();
  await expect(page.getByRole('dialog').getByRole('button', { name: 'Details', exact: true })).toHaveAttribute('aria-expanded', 'true');
  await page.getByRole('dialog').getByRole('button', { name: 'Details', exact: true }).click();
  const downloadEvent = page.waitForEvent('download');
  await page.getByRole('dialog').getByRole('button', { name: 'Download QR', exact: true }).click();
  const download = await downloadEvent;
  assert.equal(download.suggestedFilename(), 'QR-Masjid_Test_1.png');
  assert.deepEqual(await readFile(await download.path()), png);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'canShare', { configurable: true, value: () => true });
    Object.defineProperty(navigator, 'share', { configurable: true, value: async data => { window.sharedFile = data.files[0].name; } });
  });
  await page.getByRole('button', { name: 'Share QR', exact: true }).click();
  assert.equal(await page.evaluate(() => window.sharedFile), 'QR-Masjid_Test_1.png');
  await page.evaluate(() => Object.defineProperty(navigator, 'canShare', { configurable: true, value: () => false }));
  const fallbackDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Share QR', exact: true }).click();
  await fallbackDownload;
  await page.getByText('Bank Transfer', { exact: true }).click();
  await expect(page.locator('input[value="FPX"]')).toBeChecked();
  await expect(page.getByText('12345671', { exact: false })).toBeVisible();
  await expect(page.getByPlaceholder('Name', { exact: true })).toHaveValue('Test Donor');
  await expect(page.getByPlaceholder('Notes', { exact: true })).toHaveValue('Donation form remains editable');
  await expect(page.getByText('RM 101.50', { exact: true })).toBeVisible();
  await expect(page.locator('button[type="submit"]')).toBeEnabled();
  console.log('PASS bank default, method switching, enlargement, correct download bytes, native Web Share and download fallback');
  await page.goto(`${origin}/DonationPage?id=2&type=organisation`);
  await expect(page.locator('input[value="QR"]')).toBeChecked({ timeout: 20000 });
  await expect(page.getByRole('button', { name: 'Download QR', exact: true })).toBeEnabled();
  await expect(page.getByRole('img', { name: 'Donation QR - Masjid Test 2' })).toBeVisible();
  console.log('PASS recipient isolation and QR-only fallback');
  await page.goto(`${origin}/DonationPage`);
  await expect(page.locator('input[value="FPX"]')).toBeChecked();
  await page.getByRole('button', { name: 'Change', exact: true }).click();
  await page.getByRole('button', { name: 'Masjid Test 2', exact: true }).click();
  await expect(page.locator('input[value="QR"]')).toBeChecked();
  await expect(page.getByRole('img', { name: 'Donation QR - Masjid Test 2' })).toBeVisible();
  await page.getByRole('button', { name: 'Change', exact: true }).click();
  await page.getByRole('button', { name: 'Masjid Test 1', exact: true }).click();
  await expect(page.locator('input[value="FPX"]')).toBeChecked();
  console.log('PASS recipient switching without reload restores bank default');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${origin}/MosqueDetailsPage?id=1`);
  await page.getByRole('button', { name: 'Show Donation QR' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('dialog').getByRole('button', { name: 'Download QR', exact: true })).toBeEnabled();
  assert.equal(await page.getByRole('dialog').locator('input').count(), 0);
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.waitForTimeout(300); // Let the modal's opening animation finish before visual QA.
  await page.screenshot({ path: 'test-results/qr-modal-mobile.png' });
  await page.getByRole('dialog').getByRole('button', { name: 'Close', exact: true }).first().click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  qrFailure = true;
  await page.getByRole('button', { name: 'Show Donation QR' }).click();
  await expect(page.getByRole('alert')).toContainText('QR image unavailable');
  qrFailure = false;
  await page.getByRole('button', { name: 'Retry', exact: true }).click();
  await expect(page.getByRole('dialog').getByRole('button', { name: 'Download QR', exact: true })).toBeEnabled();
  await page.goto(`${origin}/MosqueDetailsPage?id=3`);
  await expect(page.getByRole('heading', { name: 'Masjid Test 3' })).toBeVisible();
  await page.getByRole('button', { name: 'Show Donation QR' }).click();
  await expect(page.getByRole('dialog').getByText('No payment QR available', { exact: true })).toBeVisible();
  await expect(page.getByRole('dialog').getByRole('button', { name: 'Download QR', exact: true })).toBeDisabled();
  await page.keyboard.press('Escape');
  await page.goto(`${origin}/DonationPage?id=3&type=organisation`);
  await expect(page.locator('input[value="FPX"]')).toBeChecked();
  await expect(page.getByText('No payment QR available', { exact: true })).toHaveCount(0);
  await page.getByText('QR Payment', { exact: true }).click();
  await expect(page.locator('input[value="__qr_unavailable"]')).toBeChecked();
  await expect(page.getByText('No payment QR available', { exact: true })).toBeVisible();
  await expect(page.getByText('12345673', { exact: false })).toHaveCount(0);
  await expect(page.locator('button[type="submit"]')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Download QR', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Share QR', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Enlarge QR' })).toHaveCount(0);
  await page.getByText('Bank Transfer', { exact: true }).click();
  await expect(page.getByText('No payment QR available', { exact: true })).toHaveCount(0);
  await expect(page.getByText('12345673', { exact: false })).toBeVisible();
  await expect(page.locator('button[type="submit"]')).toBeEnabled();
  console.log('PASS visible QR empty state with unavailable image actions disabled');
  assert.equal(writes, 0, 'Display actions must not issue mutations');
  assert.deepEqual(errors, []);
  console.log('PASS mobile mosque modal, close, unavailable image/retry, missing QR empty state, zero payment mutations');
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
