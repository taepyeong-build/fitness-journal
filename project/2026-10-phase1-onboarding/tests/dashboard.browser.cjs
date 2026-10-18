// node dashboard.browser.cjs [path/to/playwright] — uses installed Chrome, no app server/dependencies.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.argv[2] || 'playwright');

const root = path.resolve(__dirname, '../../..');
const projectPath = 'project/2026-10-phase1-onboarding';
const htmlPath = path.join(root, projectPath, 'dashboard.html');
const canonicalPath = path.join(root, projectPath, 'log.md');
const artifacts = process.env.DASHBOARD_ARTIFACTS || os.tmpdir();
const errors = [];
let checks = 0;
const check = message => { checks++; process.stdout.write(`✓ ${message}\n`); };

async function main() {
  const canonical = await fs.readFile(canonicalPath, 'utf8');
  const server = http.createServer(async (request, response) => {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const filePath = path.resolve(root, '.' + pathname);
    if (!filePath.startsWith(root + path.sep)) { response.writeHead(403).end(); return; }
    try {
      const body = await fs.readFile(filePath);
      response.setHeader('Content-Type', filePath.endsWith('.html') ? 'text/html; charset=utf-8' : 'text/plain; charset=utf-8');
      response.end(body);
    } catch (_) { response.writeHead(404).end(); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  let browser;
  try {
    browser = await chromium.launch({
      executablePath: process.env.CHROME_BIN || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      headless: true
    });
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    page.on('dialog', dialog => dialog.accept());
    const url = `http://127.0.0.1:${server.address().port}/${projectPath}/dashboard.html`;
    await page.goto(url);
    await page.locator('#inp-memo').waitFor();
    assert.equal(await page.locator('.supp-grid input:checked').count(), 0);
    assert.equal(await page.locator('.gate-card input:checked').count(), 0);
    assert.equal(await page.evaluate(() => serializeFullLogMarkdown(state.baseMarkdown)), canonical);
    await page.screenshot({ path: path.join(artifacts, 'fitness-dashboard-desktop.png'), fullPage: true });
    check('standalone desktop UI, initial unchecked evidence, exact embedded log');

    await page.selectOption('#day-select', '10-19');
    await page.locator('#inp-weight').fill('');
    await page.locator('#inp-weight').pressSequentially('97.7', { delay: 20 });
    await page.locator('#inp-weight').press('Tab');
    assert.equal(await page.locator('#inp-sleep').evaluate(el => el === document.activeElement), true, 'Tab moves to the next field');
    assert.equal(await page.evaluate(() => getActiveDay().weight), 97.7);
    await page.locator('#inp-memo').fill('');
    await page.locator('#inp-memo').pressSequentially('입력 | A & "B"', { delay: 10 });
    assert.equal(await page.locator('#inp-memo').inputValue(), '입력 | A & "B"');
    assert.ok((await page.locator('#live-row-preview').textContent()).includes('입력 \\| A & "B"'));
    await page.locator('#aux-1-waist').fill('');
    await page.locator('#aux-1-waist').pressSequentially('101.4', { delay: 20 });
    await page.locator('#aux-1-waist').press('Tab');
    assert.equal(await page.evaluate(() => state.weeklyAux[1].waist), '101.4');
    check('decimal entry, multi-character memo, escaped pipe, auxiliary input focus');

    await page.getByRole('button', { name: 'W3', exact: true }).click();
    assert.equal(await page.locator('#day-select').inputValue(), '11-01');
    assert.equal(await page.evaluate(() => computeWeekAggregation(3).bedCount), 0);
    await page.locator('#inp-weight').fill('98.0');
    await page.locator('#inp-weight').press('Tab');
    await page.reload();
    assert.equal(await page.evaluate(() => computeWeekAggregation(3).bedCount), 0);
    assert.equal(await page.evaluate(() => computeWeekAggregation(3).mealCount), 0);
    check('a weight-only backup keeps future meal and bedtime plans unrecorded');
    await page.locator('#inp-nrs').fill('4');
    await page.locator('#inp-nrs').press('Tab');
    assert.equal(await page.evaluate(() => evaluateReadiness(getActiveDay()).grade), 'red');
    assert.ok((await page.locator('.hardstop').first().textContent()).includes('정규 운동 중단'));
    await page.locator('.supp-grid input').nth(1).check();
    await page.locator('#gate-runDrift').check();
    await page.reload();
    assert.equal(await page.locator('#day-select').inputValue(), '11-01');
    assert.equal(await page.locator('.supp-grid input').nth(1).isChecked(), true);
    assert.equal(await page.locator('#gate-runDrift').isChecked(), true);
    assert.equal(await page.locator('#inp-nrs').inputValue(), '4');
    check('week/day navigation, Red downshift, browser backup and reload');

    // Native FileSystemFileHandle in origin-private storage exercises actual writable streams.
    // The repository log.md is never opened for writing by this test.
    await page.evaluate(async text => {
      const directory = await navigator.storage.getDirectory();
      window.testHandle = await directory.getFileHandle('log.md', { create: true });
      const writable = await testHandle.createWritable();
      await writable.write(text);
      await writable.close();
      window.showOpenFilePicker = async () => [testHandle];
    }, canonical);
    await page.getByRole('button', { name: '📂 log.md 파일 연결', exact: true }).click();
    await page.waitForFunction(() => fileHandle !== null);
    assert.equal(await page.evaluate(() => fileHandle instanceof FileSystemFileHandle), true);
    await page.locator('#inp-memo').fill('실제 파일 저장 | 검증');
    await page.evaluate(() => fileWriteQueue);
    assert.ok((await page.evaluate(async () => (await testHandle.getFile()).text())).includes('실제 파일 저장 \\| 검증'));
    await page.locator('#inp-memo').pressSequentially(' ABC', { delay: 1 });
    await page.evaluate(() => fileWriteQueue);
    assert.ok((await page.evaluate(async () => (await testHandle.getFile()).text())).includes('검증 ABC'));
    check('native FileSystemFileHandle read/write and rapid automatic saves');

    const external = await page.evaluate(async () => {
      const text = (await (await testHandle.getFile()).text()) + '\n외부 편집 메모\n';
      const writable = await testHandle.createWritable();
      await writable.write(text); await writable.close();
      return text;
    });
    await page.locator('#inp-memo').fill('브라우저 쪽 최신 기록');
    await page.evaluate(() => fileWriteQueue);
    assert.equal(await page.evaluate(async () => (await testHandle.getFile()).text()), external);
    assert.match(await page.locator('#file-sync-text').textContent(), /외부 파일 변경/);
    check('external Markdown edits are preserved and reported as a conflict');

    await page.evaluate(async () => {
      const directory = await navigator.storage.getDirectory();
      const invalid = await directory.getFileHandle('invalid.md', { create: true });
      const writable = await invalid.createWritable();
      await writable.write('not a 28-day log'); await writable.close();
      window.showOpenFilePicker = async () => [invalid];
    });
    await page.getByRole('button', { name: '📂 log.md 파일 연결', exact: true }).click();
    await page.waitForFunction(() => document.getElementById('toast').textContent.includes('불러오지 않았습니다'));
    assert.equal(await page.evaluate(() => fileHandle === testHandle), true);
    assert.equal(await page.locator('#inp-memo').inputValue(), '브라우저 쪽 최신 기록');
    check('invalid native file selection cannot replace records or the current handle');

    await page.evaluate(() => {
      const current = serializeFullLogMarkdown(state.baseMarkdown);
      window.showOpenFilePicker = async () => [{
        getFile: async () => new File([current], 'log.md', { type: 'text/markdown' }),
        createWritable: async () => { throw new DOMException('permission denied', 'NotAllowedError'); }
      }];
    });
    await page.getByRole('button', { name: '📂 log.md 파일 연결', exact: true }).click();
    await page.waitForFunction(() => fileHandle !== testHandle);
    await page.locator('.supp-grid input').first().check();
    await page.evaluate(() => fileWriteQueue);
    assert.match(await page.locator('#file-sync-text').textContent(), /파일 저장 실패/);
    assert.equal(await page.evaluate(async () => (await testHandle.getFile()).text()), external);
    check('permission-denied writes show an error and retain the browser backup');

    const exported = await page.evaluate(() => serializeFullLogMarkdown(state.baseMarkdown));
    await page.evaluate(() => { window.showOpenFilePicker = undefined; });
    await page.locator('#fallback-file-input').setInputFiles({ name: 'log.md', mimeType: 'text/markdown', buffer: Buffer.from(exported) });
    await page.waitForFunction(() => fileHandle === null);
    assert.equal(await page.locator('#inp-memo').inputValue(), '브라우저 쪽 최신 기록');
    check('fallback file import restores Markdown and detaches the prior writable handle');

    await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', {
      configurable: true, value: { writeText: async () => { throw new Error('permission denied'); } }
    }));
    await page.getByRole('button', { name: '📋 전체 log.md 복사', exact: true }).click();
    await page.locator('#copy-fallback').waitFor();
    assert.equal(await page.locator('#copy-fallback').inputValue(), exported);
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#catalog-drawer').isVisible(), false);
    await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', {
      configurable: true, value: { writeText: async text => { window.copiedMarkdown = text; } }
    }));
    await page.getByRole('button', { name: /measurements.md 행 복사/ }).click();
    assert.equal((await page.evaluate(() => copiedMarkdown)).split('|').length, 13);
    check('clipboard failure opens selectable text; measurement-row copy keeps 11 columns');

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: '⬇️ log.md 다운로드', exact: true }).click();
    const download = await downloadPromise;
    const chunks = [];
    for await (const chunk of await download.createReadStream()) chunks.push(chunk);
    assert.equal(Buffer.concat(chunks).toString('utf8'), exported);
    assert.equal(download.suggestedFilename(), 'log.md');
    check('downloaded log.md exactly matches the exported records');

    await page.getByRole('button', { name: '🔄 초기화', exact: true }).click();
    assert.equal(await page.evaluate(() => serializeFullLogMarkdown(state.baseMarkdown)), canonical);
    assert.equal(await page.evaluate(async () => (await testHandle.getFile()).text()), external);
    check('confirmed reset clears browser records without rewriting the connected file');

    const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const mobile = await mobileContext.newPage();
    mobile.on('pageerror', error => errors.push(error.message));
    await mobile.goto(url);
    assert.equal(await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await mobile.screenshot({ path: path.join(artifacts, 'fitness-dashboard-mobile.png'), fullPage: true });
    await mobile.getByRole('button', { name: '⚡ If-Then 긴급 대응', exact: true }).click();
    assert.equal(await mobile.locator('#catalog-drawer').isVisible(), true);
    await mobile.keyboard.press('Escape');
    await mobile.getByRole('button', { name: '🕐 24h 일주기 앵커', exact: true }).click();
    await mobile.mouse.click(2, 400);
    assert.equal(await mobile.locator('#catalog-drawer').isVisible(), false);
    check('390px mobile layout, native drawer, Escape and outside-click dismissal');

    const direct = await context.newPage();
    direct.on('pageerror', error => errors.push(error.message));
    await direct.goto(pathToFileURL(htmlPath).href);
    await direct.locator('#inp-nrs').fill('4');
    await direct.locator('#inp-nrs').press('Tab');
    assert.equal(await direct.evaluate(() => evaluateReadiness(getActiveDay()).grade), 'red');
    check('double-click file:// usage runs the complete UI without a server');
    assert.deepEqual(errors, []);
    assert.equal(await fs.readFile(canonicalPath, 'utf8'), canonical);
    check('no browser exceptions and the repository log.md remains byte-for-byte unchanged');
    process.stdout.write(`Browser checks passed: ${checks}\nScreenshots: ${artifacts}\n`);
  } finally {
    await browser?.close();
    await new Promise(resolve => server.close(resolve));
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
