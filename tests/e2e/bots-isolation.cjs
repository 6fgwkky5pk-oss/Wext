// Bots isolation test (emulator only): bots are shown, but never get an order, call or message; real pros do.
const { chromium, devices } = require('playwright');
const U = 'http://localhost:4322/', DB = 'http://127.0.0.1:8080/v1/projects/wext-af650/databases/(default)/documents';
const R0 = { latitude: 41.5495, longitude: 44.993 }, R1 = { latitude: 41.552, longitude: 44.996 };
let fail = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fail++ };
async function login(b, phone, name, geo) {
  const c = await b.newContext({ ...devices['iPhone 13'], locale: 'ka-GE', geolocation: geo, permissions: ['geolocation'] });
  const p = await c.newPage(); p.errs = []; p.on('pageerror', e => p.errs.push(e.message));
  await p.goto(U); await p.waitForTimeout(2000);
  await p.locator('.splash .btn.primary').click(); await p.fill('input[type=tel]', phone); await p.locator('.splash .btn.primary').click();
  await p.waitForTimeout(3800); await p.fill('.field input', name); await p.locator('.splash .btn.primary').last().click();
  await p.locator('.modal .btn.primary', { hasText: 'გასაგებია' }).click({ timeout: 12000 }).catch(() => {}); await p.waitForTimeout(500);
  await p.evaluate(() => document.querySelector('.top .iconbtn')?.click()); await p.waitForTimeout(1500); // 📍 real location
  return p
}
async function docs(col) { const r = await (await fetch(DB + '/' + col + '?pageSize=300', { headers: { Authorization: 'Bearer owner' } })).json(); return r.documents || [] }
async function book(c) {
  await c.fill('.h7search input', 'დალაგ'); await c.waitForTimeout(500);
  await c.locator('.prorow').filter({ hasText: 'სახლის დალაგება' }).first().click(); await c.waitForTimeout(2500);
  const list = await c.locator('.sheet .prorow, .prorow').allTextContents();
  await c.locator('.dock .btn.primary').first().click(); await c.waitForTimeout(1200);
  const pay = c.locator('.modal .btn.primary').last(); if (await pay.count()) { await pay.click(); await c.waitForTimeout(2000) }
  return list
}
(async () => {
  const b = await chromium.launch();
  // 1) only bots near: client sees them, books, nobody real is asked, no bot gets anything
  const c = await login(b, '555000331', 'კლიენტი ერთი', R0);
  const bots = await c.evaluate(() => new Promise(r => setTimeout(() => r(document.body.innerText.match(/🤖/g)?.length || 0), 4000)));
  ok(bots > 0, 'bots are visible on the client home (' + bots + ' 🤖)');
  const list = await book(c);
  ok(list.some(x => x.includes('🤖')), 'cleaning list shows 🤖 bots');
  await c.waitForTimeout(8000);
  let reqs = (await docs('requests')).map(d => d.fields);
  const ids = reqs.flatMap(f => [...(f.notified?.arrayValue?.values || []).map(v => v.stringValue), f.proId?.stringValue].filter(Boolean));
  ok(reqs.length >= 1, 'request saved (' + reqs.length + ')');
  ok(!ids.some(id => id.startsWith('bot_')), 'no bot id in notified/proId: ' + JSON.stringify(ids));
  const users = await docs('users');
  ok(!users.some(d => d.name.split('/').pop().startsWith('bot_') || JSON.stringify(d.fields).includes('🤖')), 'no bot written to the database (' + users.length + ' users)');
  for (const col of ['chats', 'calls', 'threads', 'sms']) { const n = (await docs(col)).filter(d => JSON.stringify(d).includes('bot_')).length; ok(n === 0, col + ': nothing addressed to a bot') }
  await c.locator('.btn', { hasText: /გაუქმება/ }).first().click().catch(() => {}); await c.waitForTimeout(1500);
  // 2) a real pro nearby: the order goes to the real pro, not to bots
  const p = await login(b, '555000332', 'ნამდვილი ხელოსანი', R1);
  await p.locator('.roleswitch button').nth(1).click(); await p.waitForTimeout(800);
  await p.fill('.h7search input', 'დალაგ'); await p.waitForTimeout(400);
  await p.locator('.pickrow').filter({ hasText: 'სახლის დალაგება' }).first().click(); await p.locator('.joindock .btn').click(); await p.waitForTimeout(1000);
  for (let k = 0; k < 6; k++) { const nb = p.locator('button', { hasText: /გამოტოვება|გაგრძელება|მუშაობის დაწყება|შემდეგი/ }).last(); if (!(await nb.count())) break; await nb.click(); await p.waitForTimeout(1200) }
  await p.waitForTimeout(3000);
  await c.goto(U); await c.waitForTimeout(3000);
  await book(c); await c.waitForTimeout(6000);
  const got = await p.locator('.incoming').count() + await p.locator('.smsbar').count();
  ok(got > 0, 'real pro got the offer');
  reqs = (await docs('requests')).map(d => d.fields);
  const last = reqs.sort((a, b) => +b.createdAt?.integerValue - +a.createdAt?.integerValue)[0];
  const n2 = (last.notified?.arrayValue?.values || []).map(v => v.stringValue);
  ok(n2.length >= 1 && !n2.some(id => id.startsWith('bot_')), 'second order notified only real pros: ' + n2.length);
  ok(!c.errs.length && !p.errs.length, 'no page errors ' + JSON.stringify([c.errs, p.errs]));
  console.log(fail ? 'RESULT: ' + fail + ' FAILED' : 'RESULT: ALL PASS');
  await b.close();
})();
