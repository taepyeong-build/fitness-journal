const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const projectDir = path.resolve(__dirname, '..');
const canonical = fs.readFileSync(path.join(projectDir, 'log.md'), 'utf8');
const html = fs.readFileSync(path.join(projectDir, 'dashboard.html'), 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];

function dashboard() {
  const elements = new Map();
  const storage = new Map();
  const document = {
    activeElement: null,
    getElementById(id) {
      if (!elements.has(id)) elements.set(id, {
        textContent: '', innerHTML: '', style: {}, value: '',
        classList: { add() {}, remove() {}, toggle() {} },
        addEventListener() {}, focus() {}, select() {}, showModal() {}, close() {}
      });
      return elements.get(id);
    }
  };
  const context = vm.createContext({
    document, window: { confirm: () => true }, navigator: {}, HTMLDialogElement: class {},
    localStorage: {
      getItem: key => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value),
      removeItem: key => storage.delete(key)
    },
    console, Blob, URL,
    setTimeout: () => 0, clearTimeout() {}
  });
  vm.runInContext(script.slice(0, script.indexOf('    // Initialize dashboard')), context);
  // Browser tests cover DOM updates; these tests use the renderer's output boundary.
  vm.runInContext('updateView = (mount, markup) => { mount.innerHTML = markup; }; loadStateFromLocalStorage(); renderAll();', context);
  return {
    run: source => vm.runInContext(source, context),
    import: markdown => vm.runInContext(`applyImportedMarkdown(${JSON.stringify(markdown)})`, context),
    export: () => vm.runInContext('serializeFullLogMarkdown(state.baseMarkdown)', context),
    context, storage, elements
  };
}

test('embedded log is the repository log, and a no-op export preserves every byte', () => {
  const app = dashboard();
  assert.equal(app.run('DEFAULT_LOG_MD'), canonical);
  assert.equal(app.export(), canonical);
});

test('import/export preserves CRLF, custom formatting, links, and an untouched week', () => {
  const source = canonical
    .replace('| **10-19 (월)** |', '|  **10-19 (월)**  |')
    .replace('첫 실행일: 주간 스톡 준비 및 기준선 측정', '첫 실행일: 메모 \\| 원문')
    .replace(/\n/g, '\r\n');
  const app = dashboard();
  app.import(source);
  assert.equal(app.export(), source);
  app.run("selectDay('10-19'); updateDayField('memo', '새 메모 | 링크 보존');");
  const output = app.export();
  assert.ok(output.includes('|  **10-19 (월)**  |'));
  assert.ok(output.includes('새 메모 \\| 링크 보존'));
  assert.equal(output.split('## 📊 Week 2')[1], source.split('## 📊 Week 2')[1]);
  assert.ok(!/(?<!\r)\n/.test(output));
});

test('an incomplete or duplicate-date log cannot replace the current records', () => {
  const app = dashboard();
  app.import('| **10-18 (일)** | `🟢` | `98.2kg` / `7.5h(88%)` / `NRS 0` | 보행 | `18:30` | (`22:30`) | |');
  assert.equal(app.export(), canonical);
  app.import(canonical.replace('**10-19 (월)**', '**10-18 (일)**'));
  assert.equal(app.export(), canonical);
});

test('a weight edit preserves source links, summary annotations, and later empty weeks', () => {
  const app = dashboard();
  app.import(canonical.replace('최저 SpO2 `__%`)\n', '최저 SpO2 `__%`) · 직접 적은 요약\n'));
  app.run("updateDayField('weight', '97.8');");
  const output = app.export();
  assert.ok(output.includes('7d MA 체중 `97.8 kg`'));
  assert.ok(output.includes('· 직접 적은 요약'));
  assert.ok(output.includes('[`Sunday 30-Min Prep`](../../research/'));
  assert.equal(output.split('## 📊 Week 2')[1], canonical.split('## 📊 Week 2')[1]);
});

test('planned times and unrelated edits never manufacture compliance or a Green light', () => {
  const app = dashboard();
  assert.equal(app.run('computeWeekAggregation(3).bedCount'), 0);
  app.run("selectDay('11-01'); updateSupp('s1', true); updateDayField('memo', '계획 확인');");
  assert.equal(app.run('computeWeekAggregation(3).bedCount'), 0);
  assert.equal(app.run('evaluateReadiness(getActiveDay()).grade'), 'none');
  app.run("updateDayField('weight', '98.0');");
  assert.equal(app.run('evaluateReadiness(getActiveDay()).grade'), 'none');
  assert.equal(app.run('computeWeekAggregation(3).mealCount'), 0);
  app.run("updateDayField('mealTime', '18:30'); updateDayField('bedTime', '22:30');");
  assert.equal(app.run('computeWeekAggregation(3).mealCount'), 1);
  assert.equal(app.run('computeWeekAggregation(3).bedCount'), 1);
  app.run("updateDayField('mealProtocolOk', false); updateDayField('bedTime', '05:30');");
  assert.equal(app.run('computeWeekAggregation(3).mealCount'), 0);
  assert.equal(app.run('computeWeekAggregation(3).bedCount'), 0);
  app.run("updateDayField('bedOverride', true);");
  assert.equal(app.run('computeWeekAggregation(3).bedCount'), 1);
});

test('readiness covers the protocol triggers and preserves a recorded light on memo edits', () => {
  const app = dashboard();
  app.run("updateDayField('memo', '회고'); updateSupp('s2', true);");
  assert.equal(app.run('evaluateReadiness(getActiveDay()).grade'), 'green');
  app.run("selectDay('10-19'); updateDayField('sleepH', '5.5');");
  assert.equal(app.run('evaluateReadiness(getActiveDay()).grade'), 'yellow');
  app.run("updateDayField('sleepH', '5.4');");
  assert.equal(app.run('evaluateReadiness(getActiveDay()).grade'), 'red');
  app.run("updateDayField('sleepH', '6.5'); updateDayField('se', '85'); updateDayField('nrs', '1'); updateDayField('rhrDelta', '2'); updateDayField('spo2', '93'); updateDayField('hrvDrop', '0');");
  assert.equal(app.run('evaluateReadiness(getActiveDay()).grade'), 'green');
  for (const [field, value] of [['hrvDrop', 20], ['rhrDelta', 5], ['spo2', 89], ['nrs', 4], ['alcohol', true]]) {
    const before = app.run(`getActiveDay().${field}`);
    app.run(`updateDayField('${field}', ${JSON.stringify(value)});`);
    assert.equal(app.run('evaluateReadiness(getActiveDay()).grade'), 'red', field);
    app.run(`updateDayField('${field}', ${JSON.stringify(before)});`);
  }
  app.run("updateDayField('hrvDrop', '10');");
  assert.equal(app.run('evaluateReadiness(getActiveDay()).grade'), 'yellow');
  app.run("updateDayField('trafficOverride', 'green');");
  assert.equal(app.run('evaluateReadiness(getActiveDay()).grade'), 'green');
});

test('supplements, overrides, exceptions, and gate confirmations survive file and browser round trips', () => {
  const app = dashboard();
  assert.equal(app.run('Object.values(getActiveDay().supps).some(Boolean)'), false);
  assert.equal(app.run('Object.values(state.gateChecks).some(Boolean)'), false);
  app.run("updateSupp('s2', true); updateDayField('rhrDelta', '3'); updateDayField('trafficOverride', 'yellow'); updateDayField('mealProtocolOk', false); updateDayField('bedOverride', false); toggleGateCheck('runDrift', true);");
  const exported = app.export();
  const imported = dashboard();
  imported.import(exported);
  assert.equal(imported.run('getActiveDay().supps.s2'), true);
  assert.equal(imported.run('getActiveDay().rhrDelta'), 3);
  assert.equal(imported.run('getActiveDay().trafficOverride'), 'yellow');
  assert.equal(imported.run('getActiveDay().mealProtocolOk'), false);
  assert.equal(imported.run('getActiveDay().bedOverride'), false);
  assert.equal(imported.run('state.gateChecks.runDrift'), true);
  assert.equal(imported.export(), exported);
  const restored = dashboard();
  restored.storage.set(app.run('STORAGE_KEY'), app.storage.get(app.run('STORAGE_KEY')));
  assert.equal(restored.run('loadStateFromLocalStorage()'), true);
  assert.equal(restored.export(), exported);
});

test('a completed downshift stays recorded when later morning inputs change', () => {
  const app = dashboard();
  app.run("selectDay('10-20'); updateDayField('nrs', '2'); updateDayField('sessionDone', true);");
  const completed = app.run('serializeMarkdownRow(getActiveDay())');
  assert.ok(completed.includes('→ `20분 미니멈(2세트)` ✅'));
  app.run("updateDayField('nrs', '4');");
  assert.ok(app.run('serializeMarkdownRow(getActiveDay())').includes('→ `20분 미니멈(2세트)` ✅'));
  app.run("updateDayField('sessionDone', false); updateDayField('sessionDone', true);");
  assert.ok(app.run('serializeMarkdownRow(getActiveDay())').includes('→ `20분 평지 산책+모빌리티` ✅'));
});

test('weekly aggregation uses recorded values and updates cleared auxiliary slots', () => {
  const app = dashboard();
  app.run("selectDay('10-19'); updateDayField('weight', '97.8'); updateDayField('sleepH', '7.5'); updateDayField('se', '88'); updateDayField('nrs', '3'); updateDayField('mealTime', '19:00'); updateDayField('bedTime', '00:30'); updateDayField('sessionDone', true); updateAux(1, 'waist', '100.5');");
  assert.equal(app.run('computeWeekAggregation(1).maWeight'), '98.0');
  assert.equal(app.run('computeWeekAggregation(1).avgSleepStr'), '7h 30m');
  assert.equal(app.run('computeWeekAggregation(1).mealCount'), 2);
  assert.equal(app.run('computeWeekAggregation(1).bedCount'), 1);
  assert.equal(app.run('computeWeekAggregation(1).maxNrs'), 3);
  assert.ok(app.export().includes('허리둘레 `100.5 cm`'));
  app.run("updateAux(1, 'waist', '');");
  assert.ok(app.export().includes('허리둘레 `___._ cm`'));
  assert.equal(app.run('computeWeekAggregation(1).measurementsRow.split("|").length'), 13);
});

test('missing prior-week data stays unknown and rounded sleep minutes never become 60', () => {
  const app = dashboard();
  app.run("updateDayField('weight', ''); selectDay('10-25'); updateDayField('weight', '97.5');");
  assert.equal(app.run('computeWeekAggregation(2).diffStr'), '___ kg');
  const imported = dashboard();
  imported.import(canonical.replace('`__h(__%)`', '`7.999h(88%)`'));
  assert.equal(imported.run('computeWeekAggregation(1).avgSleepStr'), '8h 00m');
});

test('Progression Gates require evidence, exclude future records, and do not count downshifts as target volume', () => {
  const app = dashboard();
  assert.equal(app.run('computeProgressionGates().every(g => !g.complete && g.passed === 0)'), true);
  app.run("for (const day of state.days) { selectDay(day.id); updateDayField('sessionDone', true); } for (const key of Object.keys(state.gateChecks)) toggleGateCheck(key, true);");
  assert.equal(app.run("computeProgressionGates('11-14', '2026-10-18')[0].complete"), false);
  app.run("selectDay('11-03'); updateDayField('sessionDone', false); updateDayField('nrs', 2); updateDayField('sessionDone', true); selectDay('11-05'); updateDayField('sessionDone', false); updateDayField('nrs', 2); updateDayField('sessionDone', true);");
  assert.equal(app.run("computeProgressionGates('11-14', '2026-11-14')[0].conditions[0].passed"), false);
});

test('rolling 14-day gates use the selected review day and require real weight, SE, and SpO2 evidence', () => {
  const app = dashboard();
  app.run(`for (const day of state.days) {
    selectDay(day.id);
    updateDayField('mealTime', day.mealCutoffTarget);
    updateDayField('bedTime', day.week === 4 ? '22:00' : '22:30');
    updateDayField('weight', day.week === 1 ? '98.2' : day.week === 2 ? '97.6' : day.week === 3 ? '97.0' : '96.4');
    updateDayField('se', '88'); updateDayField('spo2', '94');
  }
  for (const key of ['nutriProtocol', 'nutriHunger', 'sleepCutoffs', 'sleepWakeVar']) toggleGateCheck(key, true);`);
  assert.equal(app.run("computeProgressionGates('10-31', '2026-11-14')[2].complete"), true);
  assert.equal(app.run("computeProgressionGates('10-31', '2026-11-14')[3].complete"), true);
  assert.equal(app.run("computeProgressionGates('10-24', '2026-11-14')[2].complete"), false);
  app.run("selectDay('11-14'); updateDayField('spo2', '89');");
  assert.equal(app.run("computeProgressionGates('11-14', '2026-11-14')[3].complete"), false);
});

function connectMemoryFile(app, initial = canonical) {
  let content = initial, writes = 0, concurrent = 0, maxConcurrent = 0;
  app.context.memoryFile = {
    getFile: async () => ({ text: async () => content }),
    createWritable: async () => {
      concurrent++;
      maxConcurrent = Math.max(maxConcurrent, concurrent);
      let pending;
      return {
        write: async text => { await new Promise(resolve => setTimeout(resolve, 2)); pending = text; },
        close: async () => { content = pending; writes++; concurrent--; },
        abort: async () => { concurrent--; }
      };
    }
  };
  app.run(`fileHandle = memoryFile; lastFileText = ${JSON.stringify(initial)};`);
  return { content: () => content, writes: () => writes, maxConcurrent: () => maxConcurrent,
    externalEdit: value => { content = value; } };
}

test('rapid edits write in order and the final file contains the latest entry', async () => {
  const app = dashboard();
  const file = connectMemoryFile(app);
  app.run("updateDayField('memo', '첫 저장'); updateDayField('memo', '마지막 저장'); updateDayField('weight', '97.9');");
  await app.run('fileWriteQueue');
  assert.equal(file.maxConcurrent(), 1);
  assert.equal(file.writes(), 3);
  assert.ok(file.content().includes('마지막 저장'));
  assert.ok(file.content().includes('`97.9kg`'));
  assert.equal(app.run('pendingWrites'), 0);
});

test('external edits stop automatic writes and preserve both the file and browser records', async () => {
  const app = dashboard();
  const file = connectMemoryFile(app);
  const external = canonical + '\n外部에서 추가한 메모\n';
  file.externalEdit(external);
  app.run("updateDayField('memo', '브라우저의 새 기록');");
  await app.run('fileWriteQueue');
  assert.equal(file.content(), external);
  assert.equal(file.writes(), 0);
  assert.ok(app.export().includes('브라우저의 새 기록'));
  assert.match(app.run('fileError'), /외부 파일 변경/);
});

test('invalid file selection leaves the current writable handle intact; reset detaches it', async () => {
  const app = dashboard();
  const file = connectMemoryFile(app);
  app.import('invalid');
  assert.equal(app.run('fileHandle === memoryFile'), true);
  app.run("updateDayField('memo', '마지막 사용자 기록');");
  await app.run('fileWriteQueue');
  const previous = file.content();
  app.run('resetToCanonicalLog()');
  await app.run('fileWriteQueue');
  assert.equal(app.run('fileHandle'), null);
  assert.equal(file.content(), previous);
  assert.equal(app.export(), canonical);
  assert.equal(app.run('Object.values(state.gateChecks).some(Boolean)'), false);
});

test('clipboard rejection offers selectable Markdown instead of a false success message', async () => {
  const app = dashboard();
  app.context.navigator.clipboard = { writeText: async () => { throw new Error('denied'); } };
  assert.equal(await app.run('copyFullLogMarkdown()'), false);
  assert.match(app.elements.get('drawer-title').textContent, /직접 복사/);
  assert.match(app.elements.get('drawer-body').innerHTML, /textarea/);
});

test('unavailable browser storage is visible, and imported text cannot become executable HTML', () => {
  const app = dashboard();
  app.context.localStorage.getItem = () => { throw new Error('denied'); };
  assert.equal(app.run('loadStateFromLocalStorage()'), false);
  assert.match(app.elements.get('file-sync-text').textContent, /백업 불가/);
  app.import(canonical.replace('보행 35~40분 |', '<img src=x onerror=alert(1)> 보행 35~40분 |'));
  app.run("selectDay('10-19'); updateDayField('memo', '\"<svg onload=alert(1)>');");
  const markup = app.elements.get('app-mount').innerHTML;
  assert.ok(!markup.includes('<img src=x'));
  assert.ok(!markup.includes('<svg onload='));
  assert.ok(markup.includes('&lt;img'));
});

test('times manually entered in Markdown count without unrelated morning metrics', () => {
  const app = dashboard();
  const row = canonical.split('\n').find(line => line.startsWith('| **10-19'));
  const updated = row.replace('`__ : __` 마감', '`18:45` 마감').replace('`__ : __`)', '`22:30`)');
  app.import(canonical.replace(row, updated));
  assert.equal(app.run('computeWeekAggregation(1).mealCount'), 2);
  assert.equal(app.run('computeWeekAggregation(1).bedCount'), 2);
  assert.equal(app.export(), canonical.replace(row, updated));
});

test('a denied file write is visible while the browser copy keeps the new record', async () => {
  const app = dashboard();
  connectMemoryFile(app);
  app.context.memoryFile.createWritable = async () => { throw new Error('permission denied'); };
  app.run("updateDayField('memo', '저장 권한 실패 시에도 보관');");
  assert.equal(await app.run('fileWriteQueue'), false);
  assert.match(app.run('fileError'), /파일 저장 실패/);
  assert.ok(app.export().includes('저장 권한 실패 시에도 보관'));
  assert.ok(JSON.parse(app.storage.get(app.run('STORAGE_KEY'))).markdown.includes('저장 권한 실패 시에도 보관'));
});

test('invalid numeric/time imports are rejected and summary annotations remain untouched', () => {
  const app = dashboard();
  app.import(canonical.replace('`98.2kg`', '`NaNkg`'));
  app.import(canonical.replace('`18:30` 마감', '`99:99` 마감'));
  assert.equal(app.export(), canonical);
  app.import(canonical.replace('관절·첫발 최고 통증 `NRS __`', '관절·첫발 최고 통증 `NRS __` · 별도 지표 `3 / 7`'));
  app.run("updateDayField('weight', '98.1');");
  assert.ok(app.export().includes('별도 지표 `3 / 7`'));
});
