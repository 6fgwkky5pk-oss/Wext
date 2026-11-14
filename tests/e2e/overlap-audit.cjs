// Overlap / clipped-text audit over the main screens (emulator build on :4322)
const { chromium, devices } = require('playwright');
const U = 'http://localhost:4322/'; const S = (process.env.OUT || __dirname + '/out') + '/'; require('fs').mkdirSync(S, { recursive: true });
const notes = [];
const DEV = { se: { viewport: { width: 375, height: 667 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true, userAgent: devices['iPhone SE'].userAgent }, i13: devices['iPhone 13'] };
async function scan(p, tag) {
  return p.evaluate(tag => {
    const W = innerWidth, H = innerHeight, res = [];
    const modal = document.querySelector('.overlay .modal'), full = document.querySelector('.incoming, .callscr');
    const root = modal || full || document.querySelector('.app');
    const sc = modal || root.querySelector('.scroll') || root;
    const atBottom = sc.scrollHeight - sc.clientHeight - sc.scrollTop < 2, scrolls = sc.scrollHeight > sc.clientHeight + 2;
    const name = e => (e.className && typeof e.className == 'string' ? '.' + e.className.split(' ')[0] : e.tagName.toLowerCase()) + '«' + (e.textContent || e.value || e.placeholder || '').trim().slice(0, 24) + '»';
    const bars = '.tabbar,.dock,.joindock,.top,.fab-bug,.demobar';
    const els = [...root.querySelectorAll('*')].filter(e => (e.matches('button,input,textarea,select,a') || ([...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()))) && !e.closest('svg'));
    for (const e of els) {
      const b = e.getBoundingClientRect(); if (b.width < 3 || b.height < 3) continue;
      const cs = getComputedStyle(e); if (cs.visibility === 'hidden' || +cs.opacity === 0) continue;
      if (b.right > W + 1 || b.left < -1) { res.push('OUT ' + name(e)); continue }
      if (cs.textOverflow !== 'ellipsis' && e.scrollWidth > e.clientWidth + 2 && cs.overflowX !== 'visible' && cs.overflowX !== 'auto' && cs.overflowX !== 'scroll') res.push('CLIP ' + name(e));
      if (e.scrollWidth > e.clientWidth + 2 && cs.textOverflow === 'ellipsis' && e.matches('button, .btn *, h2, h3, .b')) res.push('ELL ' + name(e));
      for (const [fx, fy] of [[.5, .5], [.15, .5], [.85, .5]]) {
        const x = b.left + b.width * fx, y = b.top + b.height * fy; if (y < 0 || y > H || x < 0 || x > W) continue;
        const t = document.elementFromPoint(x, y); if (!t || e.contains(t) || t.contains(e)) continue;
        const bar = t.closest(bars); const mine = e.closest(bars);
        if (bar && !mine && scrolls && !atBottom) continue; // content passes under a bar while scrolling: normal
        if (bar && mine === bar) continue;
        if (t.closest('.toast')) continue;
        res.push('COVER ' + name(e) + ' by ' + name(t)); break
      }
    }
    const txt = document.body.innerText.match(/undefined|NaN|\{[a-zA-Z]+\}|\[object/g);
    if (txt) res.push('TXT ' + txt.join(','));
    return [...new Set(res)].slice(0, 12)
  }, tag)
}
async function check(p, name) {
  await p.waitForTimeout(600);
  const r1 = await scan(p, name);
  await p.screenshot({ path: S + p.dev + '-' + name + '.png' });
  await p.evaluate(() => { const s = document.querySelector('.overlay .modal') || document.querySelector('.app .scroll'); if (s) s.scrollTop = 1e6 });
  await p.waitForTimeout(300);
  const r2 = await scan(p, name);
  await p.screenshot({ path: S + p.dev + '-' + name + '-end.png' });
  await p.evaluate(() => { const s = document.querySelector('.overlay .modal') || document.querySelector('.app .scroll'); if (s) s.scrollTop = 0 });
  const all = [...new Set([...r1, ...r2])];
  if (all.length) notes.push(p.dev + ' ' + name + ':\n   ' + all.join('\n   '));
}
async function login(b, dev, phone, name, lang) {
  const c = await b.newContext({ ...DEV[dev], locale: lang || 'ka-GE', geolocation: { latitude: -20.001, longitude: -20.002 }, permissions: ['geolocation'] });
  const p = await c.newPage(); p.dev = dev + (lang ? '-' + lang.slice(0, 2) : ''); p.errs = []; p.on('pageerror', e => p.errs.push(e.message));
  await p.goto(U); await p.waitForTimeout(2000);
  await check(p, '00-onboard');
  await p.locator('.splash .btn.primary').click();
  await p.fill('input[type=tel]', phone); await check(p, '01-phone'); await p.locator('.splash .btn.primary').click();
  await p.waitForTimeout(3800); await check(p, '02-name');
  await p.fill('.field input', name); await p.locator('.splash .btn.primary').last().click();
  await p.waitForTimeout(3000); await check(p, '03-first');
  const ok = p.locator('.modal .btn.primary'); if (await ok.count()) { await ok.first().click(); await p.waitForTimeout(400) }
  return p
}
const tab = async (p, i) => { await sheetClose(p); await p.locator('.tabbar button').nth(i).click() };
var sheetClose = async p => { if (await p.locator('.overlay').count()) { await p.mouse.click(10, 10); await p.waitForTimeout(400) } };
(async () => {
  const b = await chromium.launch();
  const runs = [['se', '555000301'], ['i13', '555000302'], ['se', '555000303', 'ru-RU']];
  for (const [dev, phone, lang] of runs) {
    const p = await login(b, dev, phone, 'ალექსანდრე ტესტიშვილი', lang);
    await check(p, '10-home');
    const g = p.locator('.h7t'); if (await g.count()) { await g.first().click(); await check(p, '11-group'); await p.goBack().catch(() => { }); await p.waitForTimeout(400) }
    if (!(await p.locator('.tabbar').count())) { await p.locator('.top .iconbtn').first().click().catch(() => { }); await p.waitForTimeout(400) }
    await p.locator('.h7hero').click().catch(() => { }); await check(p, '12-handy');
    const svc = p.locator('.prorow, .pickrow, .catrow, .svc').first(); if (await svc.count()) { await svc.click(); await p.waitForTimeout(1500); await check(p, '13-service') }
    for (let k = 0; k < 3 && !(await p.locator('.tabbar').count()); k++) { await p.locator('.top .iconbtn').first().click().catch(() => { }); await p.waitForTimeout(400) }
    await tab(p, 1); await check(p, '20-mypros');
    await tab(p, 2); await check(p, '21-chats');
    await tab(p, 3); await check(p, '22-profile');
    await p.locator('.listrow').nth(2).click(); await check(p, '23-lang-sheet'); await sheetClose(p);
    await p.locator('.listrow', { hasText: /➕/ }).click().catch(() => { }); await check(p, '24-extra-sheet'); await sheetClose(p);
    // work mode
    await p.locator('.roleswitch button').nth(1).click().catch(async () => { await p.locator('.listrow').nth(3).click() }); await p.waitForTimeout(800);
    await check(p, '30-work-join');
    await p.fill('.h7search input', 'დალაგ').catch(() => p.fill('.h7search input', 'убор')).catch(() => { }); await p.waitForTimeout(400);
    await p.locator('.pickrow').first().click().catch(() => { }); await check(p, '31-picked');
    await p.locator('.joindock .btn').click().catch(() => { }); await p.waitForTimeout(800); await check(p, '32-join-step');
    for (let k = 0; k < 4; k++) { const nb = p.locator('.btn.primary, .btn.green').last(); if (!(await p.locator('.tabbar').count()) && await nb.count()) { await nb.click().catch(() => { }); await p.waitForTimeout(900); await check(p, '33-join-' + k) } }
    await p.waitForTimeout(1500); await check(p, '40-work-home');
    if (await p.locator('.tabbar').count()) {
      await tab(p, 1); await check(p, '41-stats');
      await tab(p, 3); await check(p, '42-profile-pro');
      const st = p.locator('.listrow', { hasText: '⏹' }); if (await st.count()) { await st.click(); await check(p, '43-stop-sheet'); await sheetClose(p) }
      const ms = p.locator('.listrow', { hasText: '🧰' }); if (await ms.count()) { await ms.click(); await p.waitForTimeout(600); await check(p, '44-settings') }
    }
    console.log(p.dev, 'errs', p.errs.slice(0, 3));
  }
  console.log(notes.join('\n'));
  await b.close();
})();
