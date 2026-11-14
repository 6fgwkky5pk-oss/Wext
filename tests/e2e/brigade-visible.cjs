const { chromium, devices } = require('playwright');
const U='http://localhost:4322/';
async function login(b, phone, name, geo, url=U){
const c = await b.newContext({ ...devices['iPhone 13'], locale: 'ka-GE', geolocation: geo, permissions: ['geolocation','clipboard-read','clipboard-write'] });
const p = await c.newPage(); p.errs=[]; p.on('pageerror', e=>p.errs.push(e.message));
await p.goto(url); await p.waitForTimeout(2500);
await p.locator('.splash .btn.primary').click();
await p.fill('input[type=tel]', phone); await p.locator('.splash .btn.primary').click();
await p.waitForTimeout(3800);
await p.fill('.field input', name); await p.locator('.splash .btn.primary').last().click();
await p.waitForTimeout(3500); const ok=p.locator('.modal .btn.primary', { hasText: 'გასაგებია' }); if (await ok.count()) { await ok.click(); await p.waitForTimeout(400) }
return p }
const A0={latitude:41.80,longitude:45.30}, M0={latitude:41.92,longitude:45.475}, C0={latitude:41.925,longitude:45.48};
(async()=>{const b=await chromium.launch();
// brigadier far (≈20 km), member near client
const a = await login(b,'555000481','ბრიგადირი',A0);
await a.locator('.roleswitch button').nth(1).click(); await a.waitForTimeout(800);
await a.fill('.h7search input','ტრაქტ'); await a.waitForTimeout(400);
await a.locator('.pickrow').filter({hasText:'ტრაქტორი'}).first().click(); await a.locator('.joindock .btn').click(); await a.waitForTimeout(800);
await a.locator('.btn.primary').last().click(); await a.waitForTimeout(300); // prices skip
await a.locator('.rolecard').nth(1).click(); await a.locator('.btn.primary').last().click(); await a.waitForTimeout(300);
await a.locator('.btn.green').last().click(); await a.waitForTimeout(2500);
const bid = await a.evaluate(()=>JSON.parse(localStorage.getItem('wext:v1')).user.id);
await a.screenshot({path:(process.env.OUT||'/tmp')+'/cr-1-lead.png'});
// member joins by link
const m = await login(b,'555000482','გიორგი',M0, U+'?crew='+bid);
await m.waitForTimeout(1500); await m.screenshot({path:(process.env.OUT||'/tmp')+'/cr-2-join.png'});
await m.locator('.btn.green').click(); await m.waitForTimeout(3500);
await m.screenshot({path:(process.env.OUT||'/tmp')+'/cr-3-member.png'});
await a.waitForTimeout(2000); await a.screenshot({path:(process.env.OUT||'/tmp')+'/cr-4-lead-list.png'});
// client near the member
const c = await login(b,'555000483','კლიენტი',C0);
await c.fill('.h7search input','ტრაქტ'); await c.waitForTimeout(500);
await c.locator('.prorow').filter({hasText:'ტრაქტორი'}).first().click(); await c.waitForTimeout(2500);
console.log('client head:', await c.locator('.sheet h3').first().textContent(), await c.locator('.sheet .prorow').allTextContents());
await c.screenshot({path:(process.env.OUT||'/tmp')+'/cr-5-client.png'});
await c.locator('.brigseg button').nth(1).click(); await c.waitForTimeout(300);
await c.locator('.dock .btn.primary').click(); await c.waitForTimeout(1500);
const pay=c.locator('.sheet .btn.primary, .modal .btn.primary').last(); if (await pay.count()) { await pay.click(); await c.waitForTimeout(2500) }
await c.waitForTimeout(4000);
await a.waitForTimeout(2000); await a.screenshot({path:(process.env.OUT||'/tmp')+'/cr-6-offer.png'});
console.log('offer buttons:', await a.locator('.crewrow').allTextContents());
await a.locator('.incoming .btn.primary').click(); await a.waitForTimeout(4000);
await m.waitForTimeout(2000); await m.screenshot({path:(process.env.OUT||'/tmp')+'/cr-7-sent.png'});
await c.waitForTimeout(2000); await c.screenshot({path:(process.env.OUT||'/tmp')+'/cr-8-client-track.png'});
console.log('client sees:', await c.locator('.hold').allTextContents());
console.log(a.errs, m.errs, c.errs); await b.close()})()
