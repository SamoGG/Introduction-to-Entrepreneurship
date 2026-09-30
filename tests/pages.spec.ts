import { test, expect } from '@playwright/test';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';

test('built site works at a GitHub Pages repository path with no external requests', async ({ page }) => {
  const prefix = '/student-questionnaire/';
  const root = resolve('dist');
  const mime: Record<string, string> = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml' };
  const server = createServer(async (request, response) => {
    const url = new URL(request.url!, 'http://localhost');
    const file = resolve(root, url.pathname.slice(prefix.length) || 'index.html');
    if (!url.pathname.startsWith(prefix) || !file.startsWith(root + '/')) { response.writeHead(404).end(); return; }
    try { response.writeHead(200, { 'Content-Type': mime[extname(file)] ?? 'application/octet-stream' }).end(await readFile(file)); }
    catch { response.writeHead(404).end(); }
  });
  await new Promise<void>(done => server.listen(0, '127.0.0.1', done));
  const address = server.address() as { port: number };
  const origin = `http://127.0.0.1:${address.port}`;
  const requests: { url: string; method: string }[] = [];
  const errors: string[] = [];
  page.on('request', request => requests.push({ url: request.url(), method: request.method() }));
  page.on('pageerror', error => errors.push(error.message));
  try {
    await page.goto(origin + prefix);
    await expect(page.getByRole('button', { name: 'Start Test', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Start Test', exact: true }).click();
    await page.evaluate(() => navigator.locks.request('get2-test-data', () => {}));
    await page.keyboard.press('1');
    await page.evaluate(() => navigator.locks.request('get2-test-data', () => {}));
    await page.keyboard.press('Enter');
    await page.evaluate(() => navigator.locks.request('get2-test-data', () => {}));
    const before = await page.evaluate(() => localStorage.getItem('get2-active-session'));
    await page.reload();
    await page.getByRole('button', { name: 'Continue Test' }).click();
    expect(await page.evaluate(() => localStorage.getItem('get2-active-session'))).toBe(before);
    const favicon = await page.request.get(origin + prefix + 'favicon.svg');
    expect(favicon.ok()).toBe(true);
    expect(requests.every(request => request.url.startsWith(origin + prefix) && request.method === 'GET')).toBe(true);
    expect(requests.some(request => request.url.endsWith('.css'))).toBe(true);
    expect(requests.some(request => request.url.endsWith('.js'))).toBe(true);
    expect(errors).toEqual([]);
  } finally { await new Promise<void>((done, reject) => server.close(error => error ? reject(error) : done())); }
});
