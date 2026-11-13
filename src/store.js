// WEXT data layer. All app screens talk to `api` only, so the local adapter below can be
// swapped for a realtime backend (Firebase/Supabase) without touching UI code.
import { useSyncExternalStore } from 'react'
import { seedPros, distKm, catName, regionFor, catById, CATEGORIES, GROUPS, TYPICAL, setExtraSyn } from './data'
import { payments } from './payments'
import * as cloud from './cloud'
export const CLOUD = cloud.CLOUD

const KEY = 'wext:v1'
const uid = () => Math.random().toString(36).slice(2, 10)
const now = () => Date.now()
const DAY = 864e5

const defaultConfig = {
  baseFee: 5, promoFee: 1, promoEnd: '2027-02-13', surgeCap: 2, surgeManual: false,
  rideFee: 1, brigadeFee: 3, projFee: 1, surgeThreshold: 2, surgeMode: 'off',
}

function load() {
  try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && s.v === 1) return s } catch {}
  return null
}

let state = load() || {
  v: 1, config: defaultConfig, user: null, lang: null, loc: null, pros: null,
  requests: [], chats: {}, projects: [], rides: [], complaints: [], bugs: [], payments: [], incoming: null, proJobs: [], blockedIds: [],
}
state.config = { ...defaultConfig, ...state.config }
setExtraSyn(state.config.syn)
const subs = new Set()
let saveT
function set(patch) {
  state = { ...state, ...(typeof patch === 'function' ? patch(state) : patch) }
  subs.forEach(f => f())
  clearTimeout(saveT); saveT = setTimeout(() => { try { localStorage.setItem(KEY, JSON.stringify(state)) } catch {} }, 150)
}
export const getState = () => state
export function useStore(sel = s => s) {
  return useSyncExternalStore(f => (subs.add(f), () => subs.delete(f)), () => sel(state))
}

// ---------- effects (sound / vibration) ----------
// iPhone rules: sound only after the first tap; Web Audio is muted by the silent switch, an <audio> element is not.
let actx, unlocked = false
const tones = {}
function wav(notes, dur = 0.16, gap = 0.04, vol = 0.5) {
  const sr = 22050, per = Math.floor(sr * (dur + gap)), n = per * notes.length, buf = new DataView(new ArrayBuffer(44 + n * 2))
  const w = (o, str) => [...str].forEach((c, i) => buf.setUint8(o + i, c.charCodeAt(0)))
  w(0, 'RIFF'); buf.setUint32(4, 36 + n * 2, true); w(8, 'WAVEfmt '); buf.setUint32(16, 16, true); buf.setUint16(20, 1, true); buf.setUint16(22, 1, true)
  buf.setUint32(24, sr, true); buf.setUint32(28, sr * 2, true); buf.setUint16(32, 2, true); buf.setUint16(34, 16, true); w(36, 'data'); buf.setUint32(40, n * 2, true)
  notes.forEach((f, k) => { for (let i = 0; i < per; i++) { const t = i / sr, on = t < dur, env = on ? Math.min(1, t * 60, (dur - t) * 40) : 0; buf.setInt16(44 + (k * per + i) * 2, on ? Math.sin(2 * Math.PI * f * t) * env * vol * 32767 : 0, true) } })
  let bin = ''; const u8 = new Uint8Array(buf.buffer); for (let i = 0; i < u8.length; i++) bin += String.fromCharCode(u8[i])
  return 'data:audio/wav;base64,' + btoa(bin)
}
const NOTES = { job: [880, 1175, 880, 1175, 1568], ring: [660, 880, 660, 880], soft: [784, 1046] }
function el(kind) { if (!tones[kind]) { const a = new Audio(wav(NOTES[kind] || NOTES.soft)); a.preload = 'auto'; a.setAttribute('playsinline', ''); tones[kind] = a } return tones[kind] }
let sharedAudio
export function callAudio() { if (!sharedAudio) { sharedAudio = document.createElement('audio'); sharedAudio.autoplay = true; sharedAudio.setAttribute('playsinline', ''); document.body.appendChild(sharedAudio) } return sharedAudio }
export function unlockAudio() {
  if (unlocked) return
  unlocked = true
  try { if (navigator.audioSession) navigator.audioSession.type = 'playback' } catch {}
  try { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); actx.resume() } catch {}
  for (const k of ['job', 'ring', 'soft']) { const a = el(k); a.muted = true; a.play().then(() => { a.pause(); a.currentTime = 0; a.muted = false }).catch(() => { a.muted = false }) }
  const c = callAudio(); c.muted = true; c.play().catch(() => {}).finally(() => { c.muted = false })
}
if (typeof window !== 'undefined') ['touchend', 'click', 'keydown'].forEach(ev => window.addEventListener(ev, unlockAudio, { once: false, passive: true }))
export function ping(kind = 'soft') {
  try { const a = el(kind); a.currentTime = 0; a.play().catch(() => {}) } catch {}
  try { if (navigator.vibrate) navigator.vibrate(kind === 'job' ? [300, 120, 300, 120, 500] : kind === 'ring' ? [400, 200, 400] : 60) } catch {}
}

// ---------- pricing ----------
export function promoActive(cfg = state.config) { return new Date(cfg.promoEnd + 'T23:59:59') > new Date() }
export function surgeFor(cat) {
  const cfg = state.config
  if (cfg.surgeMode === 'on' || (cfg.surgeManual && !cfg.surgeMode)) return cfg.surgeCap
  if (cfg.surgeMode !== 'auto') return 1
  const loc = state.loc || [41.92, 45.47]
  const near = (state.pros || []).filter(p => (p.cats || [p.cat]).includes(cat) && p.online && distKm(loc, p.pos) < 4 && !state.blockedIds.includes(p.id)).length
  if (near >= cfg.surgeThreshold) return 1
  return Math.min(cfg.surgeCap, near === 0 ? 1.5 : 1.3)
}
export function priceFor(cat, kind = 'instant', brigade = false) {
  const cfg = state.config, promo = promoActive(cfg)
  const base = kind === 'ride' ? cfg.rideFee : kind === 'project' ? cfg.projFee : brigade ? (cfg.brigadeFee || 3) : promo ? cfg.promoFee : cfg.baseFee
  const surge = kind === 'instant' ? surgeFor(cat) : 1
  const amount = Math.round(base * surge * 100) / 100
  return { amount, old: kind === 'instant' && promo && !brigade ? cfg.baseFee : null, surge, promo }
}
// approximate price range per service (not binding): admin override in config.typical, else the default in data.js
export const typicalFor = cat => { const o = state.config?.typical?.[cat]; const d = TYPICAL[cat]; if (o && o[0] && o[1]) return [o[0], o[1], d?.[2]]; return d || null }
export const currency = () => regionFor(state.loc || [41.92, 45.47])
export const money = n => `${Number.isInteger(n) ? n : n.toFixed(2)}${currency().symbol}`

// ---------- simulation of the pro network (local adapter only) ----------
const timers = {}
function later(key, ms, fn) { clearTimeout(timers[key]); timers[key] = setTimeout(fn, ms) }

function pushMsg(threadId, msg) {
  set(s => {
    const th = s.chats[threadId] || { id: threadId, msgs: [] }
    return { chats: { ...s.chats, [threadId]: { ...th, msgs: [...th.msgs, { id: uid(), ts: now(), ...msg }], unread: msg.from !== 'me' ? (th.unread || 0) + 1 : th.unread } } }
  })
}

// trims user text and caps its length (names, notes, chat, complaints)
const clean = (x, n) => String(x ?? '').replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, '').trim().slice(0, n)
const REPLIES = {
  ka: ['გამარჯობა! მივიღე, უკვე გზაში ვარ 👍', 'კარგი, მისამართი ზუსტად მომწერეთ, თუ შეიძლება', 'დაახლოებით 15 წუთში ვიქნები'],
  en: ['Hi! Got it, on my way 👍', 'Great, please send me the exact address', "I'll be there in about 15 minutes"],
  ru: ['Здравствуйте! Принял, уже еду 👍', 'Хорошо, напишите точный адрес, пожалуйста', 'Буду примерно через 15 минут'],
  de: ['Hallo! Erhalten, bin unterwegs 👍', 'Gut, schicken Sie mir bitte die genaue Adresse', 'Ich bin in etwa 15 Minuten da'],
  tr: ['Merhaba! Aldım, yoldayım 👍', 'Tamam, lütfen tam adresi yazın', 'Yaklaşık 15 dakikada oradayım'],
}

// ---------- API ----------
// demand ranking: request = 3 points, opening a group/service = 1 point
const PRIOR = { handy: 70, road: 60, ride: 50, clean: 40, move: 30, land: 20, machine: 10 }
export function groupOrder(st = state.catStats || {}) {
  const score = g => PRIOR[g] + (st['g_' + g] || 0)
  const o = GROUPS.map(g => g.id).sort((a, b) => score(b) - score(a))
  if (o[0] === 'ride') { o.shift(); o.splice(1, 0, 'ride') }
  const i = o.indexOf('ride'); if (i > 2) { o.splice(i, 1); o.splice(2, 0, 'ride') }
  return o
}
export function catRank(cats, st = state.catStats || {}) {
  const idx = id => CATEGORIES.findIndex(c => c.id === id)
  return [...cats].sort((a, b) => ((st[b.id] || 0) - (st[a.id] || 0)) || (idx(a.id) - idx(b.id)))
}
export const api = {
  missSearch(q) {
    const term = String(q || '').trim().toLowerCase().replace(/[.\/#$\[\]~*`]/g, '').slice(0, 30)
    if (term.length < 3 || !CLOUD) return
    cloud.missSearch(term)
  },
  bump(cat, group, n = 1) {
    const g = group || (catById(cat) || {}).g
    const keys = [cat, g && 'g_' + g].filter(Boolean)
    if (CLOUD) cloud.bumpStat(keys, n)
    set(s => { const st = { ...(s.catStats || {}) }; keys.forEach(k => st[k] = (st[k] || 0) + n); return { catStats: st } })
  },
  setLang(lang) { set({ lang }); document.documentElement.lang = lang },
  setLocDenied() { if (!state.locReal) set({ locDenied: true }) },
  me() { return CLOUD ? cloud.myId() : 'me' },
  isMe(id) { return CLOUD ? cloud.isMe(id) : id === 'me' },
  setLoc(loc, real, acc) {
    if (real && state.locReal && state.loc && distKm(state.loc, loc) < 0.05 && !(acc && state.locAcc && acc < state.locAcc / 2)) return
    const patch = { loc, locReal: !!real, locAcc: real ? Math.round(acc || 0) : null, locDenied: false, region: regionFor(loc).id }
    if (CLOUD) { set(patch); if (real) cloud.pushProfile(); return }
    if (!state.pros || !state.prosCenter || distKm(state.prosCenter, loc) > 30) { patch.pros = seedPros(loc); patch.prosCenter = loc }
    set(patch)
  },
  login(phone, name, role) {
    name = clean(name, 40)
    const user = { id: CLOUD ? cloud.myId() : 'u_' + uid(), phone, name, role, hue: Math.floor(Math.random() * 360), createdAt: now(), pro: { type: 'individual', cats: [], members: 1, online: false, noShows: 0, blocked: false, rating: 5, jobs: 0 } }
    set({ user })
    if (CLOUD) cloud.onLogin()
  },
  logout() {
    if (CLOUD && state.user?.pro?.online) { api.updatePro({ online: false }) }
    if (CLOUD) cloud.logoutCloud()
    set({ user: null, requests: [], proJobs: [], chats: {}, incoming: null })
  },
  updateUser(patch) { if (typeof patch.name === 'string') patch = { ...patch, name: clean(patch.name, 40) }; set(s => ({ user: { ...s.user, ...patch } })); if (CLOUD) cloud.pushProfile() },
  updatePro(patch) { set(s => ({ user: { ...s.user, pro: { ...s.user.pro, ...patch } } })); if (CLOUD) cloud.pushProfile() },

  nearbyPros(cat, radius = 50) {
    const loc = state.loc || [41.92, 45.47]
    return (state.pros || []).filter(p => (!cat || (p.cats || [p.cat]).includes(cat)) && !state.blockedIds.includes(p.id))
      .map(p => ({ ...p, dist: distKm(loc, p.pos) })).filter(p => p.dist <= radius).sort((a, b) => (b.online - a.online) || a.dist - b.dist)
  },

  // Bundle rule: one payment = up to 3 contacts in the same category within 24h
  activeBundle(cat) {
    return state.payments.find(p => p.cat === cat && p.status !== 'released' && now() - p.createdAt < DAY && p.contacts < 3)
  },

  async createRequest({ cat, note, brigade, photo, voice }) {
    note = clean(note, 500)
    // anti-abuse: at most 5 new requests in 10 minutes from one phone
    const recent = state.requests.filter(r => now() - (r.createdAt || 0) < 10 * 60e3).length
    if (recent >= 5) { set({ note: { k: 'tooMany', icon: '⏳', ts: now() } }); return null }
    brigade = !!brigade
    api.bump(cat, null, 3)
    let bundle = api.activeBundle(cat)
    if (bundle && !!bundle.brigade !== brigade) bundle = null
    const price = priceFor(cat, 'instant', brigade)
    if (!bundle) {
      const pay = await payments.preauthorize({ amount: price.amount, currency: currency().currency, card: state.user?.card })
      bundle = { id: pay.id, cat, brigade, amount: price.amount, status: 'held', contacts: 0, createdAt: now() }
      set(s => ({ payments: [bundle, ...s.payments] }))
    }
    if (CLOUD) {
      const id = await cloud.createRequest({ cat, note: note || '', photo: photo || null, voice: voice || null, status: 'searching', brigade, payId: bundle.id, radius: 3, notified: [], log: [], proId: null, clientName: state.user.name, pos: state.loc, posReal: !!state.locReal, region: state.region || 'ge' })
      set(s => s.requests.some(r => r.id === id) ? {} : { requests: [{ id, cat, note, photo, voice, brigade, status: 'searching', createdAt: now(), payId: bundle.id, radius: 3, notified: [], log: [] }, ...s.requests] })
      api._dispatch(id)
      return id
    }
    const req = { id: 'r_' + uid(), cat, note, photo, voice, brigade, status: 'searching', createdAt: now(), payId: bundle.id, radius: 3, notified: [], proId: null, log: [] }
    set(s => ({ requests: [req, ...s.requests] }))
    api._dispatch(req.id)
    return req.id
  },

  _req(id) { return state.requests.find(r => r.id === id) },
  _updReq(id, patch) {
    if (CLOUD) { const r = api._req(id); const p = typeof patch === 'function' ? patch(r || {}) : patch; const { contacted, ...rest } = p; if (Object.keys(rest).length) cloud.updateRequest(id, rest); set(s => ({ requests: s.requests.map(x => x.id === id ? { ...x, ...p } : x) })); return }
    set(s => ({ requests: s.requests.map(r => r.id === id ? { ...r, ...(typeof patch === 'function' ? patch(r) : patch) } : r) })) },

  // dispatch: nearest 3 online pros, 75s window, then expand radius 3 -> 6 -> 12 km
  _dispatch(id) {
    const r = api._req(id); if (!r || r.status !== 'searching') return
    const pool = api.nearbyPros(r.cat, r.radius).filter(p => !r.brigade || p.type !== 'individual')
    const cand = pool.filter(p => p.online && !r.notified.includes(p.id)).slice(0, 3)
    const sms = pool.filter(p => !p.online && !r.notified.includes(p.id)).slice(0, 5)
    if (!cand.length && !(CLOUD && sms.length)) {
      if (r.radius >= 12) { if (CLOUD && r.notified.length && now() - r.createdAt < 5 * 60e3) { later(id, 30000, () => api._dispatch(id)); return } api._updReq(id, { status: 'nopros' }); api._releaseIfUnused(r.payId); return }
      const radius = r.radius === 3 ? 6 : 12
      api._updReq(id, x => ({ radius, log: [...x.log, { k: 'radius', r: radius }] }))
      later(id, 1800, () => api._dispatch(id))
      return
    }
    api._updReq(id, x => ({ notified: [...x.notified, ...cand.map(c => c.id), ...sms.map(c => c.id)], current: cand.map(c => c.id), windowEnds: now() + 75000, log: [...x.log, ...(cand.length ? [{ k: 'notify', n: cand.length }] : []), ...(sms.length ? [{ k: 'sms', n: sms.length }] : [])] }))
    if (CLOUD) { later(id, 75000, () => { const rr = api._req(id); if (rr?.status === 'searching') { const radius = rr.radius >= 12 ? 12 : rr.radius === 3 ? 6 : 12; api._updReq(id, { radius }); api._dispatch(id) } }); return }
    // local simulation: one of them accepts in 4–10s
    later(id, 4000 + Math.random() * 6000, () => {
      const rr = api._req(id); if (!rr || rr.status !== 'searching') return
      const p = cand[Math.floor(Math.random() * cand.length)]
      const eta = Math.max(4, Math.round(p.dist * 3 + 3))
      api._updReq(id, { status: 'accepted', proId: p.id, acceptedAt: now(), eta, threadId: 't_' + id })
      ping('soft')
      const lang = state.lang || 'ka', rep = REPLIES[lang] || REPLIES.ka
      later(id + 'm1', 3500, () => { pushMsg('t_' + id, { from: p.id, text: rep[0] }); api.registerContact(id, 'chat') })
      later(id + 'm2', 9000, () => pushMsg('t_' + id, { from: p.id, text: rep[1] }))
    })
  },

  cancelRequest(id) {
    const r = api._req(id); clearTimeout(timers[id])
    api._updReq(id, { status: 'cancelled' })
    if (r) api._releaseIfUnused(r.payId)
  },

  // real contact = chat reply from pro, call > 20s, or GPS arrived → capture the hold
  async registerContact(reqId, how) {
    const r = api._req(reqId); if (!r || r.contacted) return
    if (CLOUD) set(s => ({ requests: s.requests.map(x => x.id === reqId ? { ...x, contacted: how } : x) })); else api._updReq(reqId, { contacted: how })
    const p = state.payments.find(x => x.id === r.payId); if (!p) return
    if (p.status === 'held') await payments.capture(p.id)
    set(s => ({ payments: s.payments.map(x => x.id === p.id ? { ...x, status: 'captured', contacts: x.contacts + 1 } : x) }))
  },
  async _releaseIfUnused(payId) {
    const p = state.payments.find(x => x.id === payId)
    if (!p || p.status !== 'held') return
    const stillUsed = state.requests.some(r => r.payId === payId && ['searching', 'accepted'].includes(r.status))
    if (stillUsed) return
    await payments.release(p.id)
    set(s => ({ payments: s.payments.map(x => x.id === payId ? { ...x, status: 'released' } : x) }))
  },
  // outcome buttons. The fee is decided by system facts (call >20s, chat reply, GPS arrival), never by these buttons.
  // each side presses "agreed" for itself; the deal counts ('agreed') only when both have pressed
  agree(reqId) { const r = api._req(reqId) || {}; const both = r.proDeal === 'yes'
    api._updReq(reqId, { clientDeal: 'yes', clientDealAt: now(), ...(both ? { status: 'agreed', agreedAt: now() } : {}) }); api.registerContact(reqId, 'agreed') },
  noDeal(reqId) { api._updReq(reqId, { clientDeal: 'no', status: 'nodeal', closedAt: now(), outcomeBy: 'client' }) },
  proAgree(jobId) { const j = (state.proJobs || []).find(x => x.id === jobId) || {}; const p = { proDeal: 'yes', proDealAt: now(), ...(j.clientDeal === 'yes' ? { status: 'agreed', agreedAt: now() } : {}) }; if (CLOUD) { cloud.updateRequest(jobId, p); return } set(s => ({ proJobs: s.proJobs.map(j => j.id === jobId ? { ...j, ...p } : j) })) },
  proNoDeal(jobId) { const p = { proDeal: 'no', status: 'nodeal', closedAt: now(), outcomeBy: 'pro' }; if (CLOUD) { cloud.updateRequest(jobId, p); return } set(s => ({ proJobs: s.proJobs.map(j => j.id === jobId ? { ...j, ...p } : j) })); if (state.user.pro.online) api._scheduleIncoming() },
  markArrived(reqId) { api._updReq(reqId, { status: 'arrived', arrivedAt: now() }); api.registerContact(reqId, 'arrived') },
  finish(reqId, rating) { api._updReq(reqId, { status: 'done', rating }) },
  // client says the work is finished (rating is asked after this, never before)
  clientDone(reqId) { api._updReq(reqId, { status: 'done', doneAt: now() }) },

  sendMsg(threadId, text) {
    text = clean(text, 1000); if (!text) return
    if (CLOUD) { cloud.sendMsg(threadId, { text }); return }
    pushMsg(threadId, { from: 'me', text })
  },
  readThread(threadId) { if (CLOUD) set(s => ({ lastRead: { ...(s.lastRead || {}), [threadId]: now() } })); set(s => s.chats[threadId] ? { chats: { ...s.chats, [threadId]: { ...s.chats[threadId], unread: 0 } } } : {}) },
  missedCall(threadId, reqId, t) {
    const r = api._req(reqId)
    // the other side receives: t('missedAuto') with a call-back button (delivered through the backend)
    if (CLOUD) { cloud.sendMsg(threadId, { kind: 'missed', name: state.user?.name, cat: r?.cat || null, text: '' }); return }
    pushMsg(threadId, { from: 'me', kind: 'missed', text: '' })
  },

  // projects / field work (N-slot mechanic)
  createProject(p) { if (CLOUD) { cloud.addItem('projects', { ...p, ownerId: state.user.id, ownerName: state.user.name, joins: [], createdAt: now(), region: state.region || 'ge' }); return } const proj = { id: 'pj_' + uid(), ownerId: state.user.id, ownerName: state.user.name, joins: [], createdAt: now(), ...p }; set(s => ({ projects: [proj, ...s.projects] })); return proj.id },
  joinProject(id, count) {
    if (CLOUD) { const me = state.user; cloud.slotTx('projects', id, p => { const joins = p.joins.filter(j => j.userId !== me.id); const taken = joins.reduce((a, j) => a + j.count, 0); const c = Math.min(count, p.people - taken); if (c <= 0) return null; return { joins: [...joins, { userId: me.id, name: me.name, count: c, type: me.pro.type }] } }); return }
    set(s => ({ projects: s.projects.map(p => {
      if (p.id !== id) return p
      const taken = p.joins.reduce((a, j) => a + j.count, 0)
      const c = Math.min(count, p.people - taken); if (c <= 0) return p
      return { ...p, joins: [...p.joins.filter(j => j.userId !== state.user.id), { userId: state.user.id, name: state.user.name, count: c, type: state.user.pro.type }] }
    }) }))
  },
  leaveProject(id) { if (CLOUD) { cloud.slotTx('projects', id, p => ({ joins: p.joins.filter(j => j.userId !== state.user.id) })); return } set(s => ({ projects: s.projects.map(p => p.id === id ? { ...p, joins: p.joins.filter(j => j.userId !== state.user.id) } : p) })) },

  // rides (same N-slot mechanic)
  createRide(r) { if (CLOUD) { cloud.addItem('rides', { ...r, driverId: state.user.id, driver: state.user.name, bookings: [], createdAt: now(), region: state.region || 'ge' }); return } const ride = { id: 'rd_' + uid(), driverId: state.user.id, driver: state.user.name, bookings: [], createdAt: now(), ...r }; set(s => ({ rides: [ride, ...s.rides] })) },
  bookSeat(id, n = 1) {
    if (CLOUD) { const me = state.user; cloud.slotTx('rides', id, r => { const b = r.bookings.filter(x => x.userId !== me.id); if (b.reduce((a, x) => a + x.n, 0) + n > r.seats) return null; return { bookings: [...b, { userId: me.id, name: me.name, n }] } }); return }
    set(s => ({ rides: s.rides.map(r => {
      if (r.id !== id) return r
      const taken = r.bookings.reduce((a, b) => a + b.n, 0); if (taken + n > r.seats) return r
      return { ...r, bookings: [...r.bookings.filter(b => b.userId !== state.user.id), { userId: state.user.id, name: state.user.name, n }] }
    }) }))
  },
  cancelSeat(id) { if (CLOUD) { cloud.slotTx('rides', id, r => ({ bookings: r.bookings.filter(b => b.userId !== state.user.id) })); return } set(s => ({ rides: s.rides.map(r => r.id === id ? { ...r, bookings: r.bookings.filter(b => b.userId !== state.user.id) } : r) })) },

  // pro side
  // stop working: worker role off, account + history kept; client stays. Offers stop at once (others' pro lists skip !registered).
  stopWork() {
    clearTimeout(timers.incoming)
    set(s => ({ incoming: null, user: { ...s.user, role: 'client', pro: { ...s.user.pro, registered: false, online: false, stopped: true } } }))
    if (CLOUD) cloud.pushProfile()
  },
  restartWork() {
    set(s => ({ user: { ...s.user, role: 'pro', pro: { ...s.user.pro, registered: true, stopped: false } } }))
    if (CLOUD) cloud.pushProfile()
    setTimeout(() => api.setOnline(true), 300)
  },
  setOnline(on) {
    api.updatePro({ online: on })
    clearTimeout(timers.incoming)
    if (CLOUD) { if (state.incoming) set(s => ({ incoming: { ...s.incoming, viaSms: !on, opened: true } })); return }
    set({ incoming: null })
    api._scheduleIncoming()
  },
  // Online (green) pros get the job in-app. Offline (red) pros get an SMS; opening it and accepting turns them green.
  _scheduleIncoming() {
    if (CLOUD) return
    const off = !state.user?.pro.online
    later('incoming', off ? 25000 + Math.random() * 20000 : 8000 + Math.random() * 10000, () => {
      const u = state.user; if (!u || !u.pro.registered || u.pro.blocked || state.incoming) return
      const viaSms = !u.pro.online
      const cats = u.pro.cats.length ? u.pro.cats : ['handyman']
      const cat = cats[Math.floor(Math.random() * cats.length)]
      const loc = state.loc || [41.92, 45.47]
      const d = 0.4 + Math.random() * 3.5
      const notes = { ka: ['წყალი ჩამოდის ჭერიდან', 'როზეტკა არ მუშაობს', 'კარი არ იკეტება', 'სასწრაფოდ მჭირდება', ''], en: ['Water leaking from ceiling', 'Socket not working', "Door won't lock", 'Urgent', ''] }
      const ns = notes[state.lang] || notes.ka
      set({ incoming: { id: 'in_' + uid(), cat, dist: +d.toFixed(1), note: ns[Math.floor(Math.random() * ns.length)], client: ['ნათია', 'ლაშა', 'Anna', 'მზია', 'გიგა'][Math.floor(Math.random() * 5)], expires: now() + (viaSms ? 300000 : 75000), viaSms, opened: !viaSms, pos: [loc[0] + d / 140, loc[1] + d / 160] } })
      ping(viaSms ? 'soft' : 'job')
    })
  },
  respondIncoming(accept) {
    const inc = state.incoming; if (!inc) return
    set({ incoming: null })
    if (accept && !state.user.pro.online) api.updatePro({ online: true })
    if (CLOUD) {
      if (accept) cloud.acceptRequest(inc.id, { name: state.user.name, eta: Math.max(4, Math.round(inc.dist * 3 + 3)) }).then(ok => { if (ok) api.updatePro({ jobs: state.user.pro.jobs + 1 }); else set({ note: { k: 'takenByOther', icon: '⏱', cat: inc.cat, ts: now() } }) })
      else { set(s => ({ declined: [...(s.declined || []), inc.id] })); cloud.declineRequest(inc.id) }
      return
    }
    if (accept) {
      const job = { ...inc, status: 'accepted', acceptedAt: now(), threadId: 't_' + inc.id }
      set(s => ({ proJobs: [job, ...s.proJobs], user: { ...s.user, pro: { ...s.user.pro, jobs: s.user.pro.jobs + 1 } } }))
      pushMsg(job.threadId, { from: 'client', text: inc.note || '👋' })
    } else api._scheduleIncoming()
  },
  openSms() { set(s => s.incoming ? { incoming: { ...s.incoming, opened: true, expires: now() + 75000 } } : {}); ping('job') },
  proOnWay(jobId) { if (CLOUD) { cloud.updateRequest(jobId, { onWayAt: now() }); return } set(s => ({ proJobs: s.proJobs.map(j => j.id === jobId ? { ...j, onWayAt: now() } : j) })) },
  proArrived(jobId) { if (CLOUD) { cloud.updateRequest(jobId, { status: 'arrived', arrivedAt: now() }); return } set(s => ({ proJobs: s.proJobs.map(j => j.id === jobId ? { ...j, status: 'arrived', arrivedAt: now() } : j) })) },
  // pro says finished → client is asked "was the work done?"; no answer in 24h = done
  proDone(jobId) { if (CLOUD) { cloud.updateRequest(jobId, { proDoneAt: now() }); return } set(s => ({ proJobs: s.proJobs.map(j => j.id === jobId ? { ...j, proDoneAt: now() } : j) })); if (state.user.pro.online) api._scheduleIncoming() },
  // No-show: accepted but no GPS "arrived" within 1h. 3 → automatic block.
  checkNoShows() {
    const late = state.proJobs.filter(j => j.status === 'accepted' && now() - j.acceptedAt > 3600e3)
    if (!late.length) return
    set(s => {
      const noShows = s.user.pro.noShows + late.length
      return { proJobs: s.proJobs.map(j => late.includes(j) ? { ...j, status: 'noshow' } : j), user: { ...s.user, pro: { ...s.user.pro, noShows, blocked: noShows >= 3, online: noShows >= 3 ? false : s.user.pro.online } } }
    })
  },

  // trust & safety
  complain(reqId, proId, reason) {
    reason = clean(reason, 1000)
    const byId = state.user?.id
    if (CLOUD) { cloud.addItem('complaints', { reqId, proId, reason, byId, byName: state.user?.name }); return }
    set(s => ({ complaints: [{ id: uid(), reqId, proId, reason, byId, byName: s.user?.name, ts: now() }, ...s.complaints] }))
  },
  reportBug(text, screen) { text = clean(text, 2000); if (CLOUD) { cloud.addItem('bugs', { text, screen: screen || '', by: state.user?.name || '', ua: navigator.userAgent }); return } set(s => ({ bugs: [{ id: uid(), text, screen, ts: now(), by: s.user?.name, ua: navigator.userAgent }, ...s.bugs] })) },

  _seed(b) { set(s => ({ seeded: true, projects: [...s.projects, ...b.projects], rides: [...s.rides, ...b.rides] })) },

  // admin
  notifyAvail(cat, name) {
    const msg = '🟢 ' + name + ' · ' + catName(cat, state.lang || 'ka')
    try { if (typeof Notification !== 'undefined' && Notification.permission === 'granted') new Notification('WEXT', { body: msg, icon: 'icons/icon-192.png' }) } catch {}
    set({ note: { k: 'availNow', icon: '🟢', cat, name, ts: now() } })
  },
  watchCat(cat) { set({ watchCat: cat }); if (cat && typeof Notification !== 'undefined' && Notification.permission === 'default') Notification.requestPermission().catch(() => {}) },
  setBig(on) { set({ big: !!on }) },
  setConfig(patch) { if (patch.syn) setExtraSyn(patch.syn); if (CLOUD) cloud.setConfig(patch); set(s => ({ config: { ...s.config, ...patch } })) },
  // admin decided the booking fee of one order (refund or charge); the client's app applies it to its own payment record
  applyAdminPay(r) {
    const p = state.payments.find(x => x.id === r.payId); if (!p) return
    const st = r.adminPay === 'refund' ? 'released' : 'captured'
    if (p.status === st) return
    set(s => ({ payments: s.payments.map(x => x.id === p.id ? { ...x, status: st } : x), note: { k: r.adminPay === 'refund' ? 'adminRefunded' : 'adminCharged', icon: r.adminPay === 'refund' ? '↩️' : '💳', cat: r.cat, ts: now() } }))
  },
  adminPay(reqId, how, why) {
    why = clean(why, 200); if (!CLOUD || !why) return false
    const r = (state.adminReqs || []).find(x => x.id === reqId); if (r?.adminPay) return false // once per order
    cloud.updateRequest(reqId, { adminPay: how, adminPayAt: now(), adminPayWhy: why }); return true
  },
  clearUser(id) { if (CLOUD) cloud.clearUser(id) },
  async setTester(phone, on) { const p9 = cloud.normPhone(phone); if (p9.length < 9) return false; await cloud.setTester(p9, on); return true },
  toggleBlock(id) { if (CLOUD) { const u = (state.adminUsers || []).find(x => x.id === id); cloud.setBlocked([id, ...(u?.aliases || [])].slice(0, 10), !u?.pro?.blocked); return } set(s => ({ blockedIds: s.blockedIds.includes(id) ? s.blockedIds.filter(x => x !== id) : [...s.blockedIds, id] })) },
  clearRinging() { set({ ringing: null }) },
  setOutgoing(to) { set({ outgoing: to }) },
  setAdmin(on) { set(s => ({ user: { ...s.user, admin: on } })); if (CLOUD && on) cloud.listenAdmin() },
}

// expire hold automatically if a request never got a real contact within 2h
setInterval(() => {
  state.requests.filter(r => r.status === 'accepted' && !r.contacted && now() - r.acceptedAt > 2 * 3600e3).forEach(r => { api._updReq(r.id, { status: 'expired' }); api._releaseIfUnused(r.payId) })
  if (state.user?.pro?.registered) api.checkNoShows()
}, 30000)

// resume pro network after reload
if (state.user?.pro?.registered) setTimeout(() => api._scheduleIncoming(), 3000)
// resume in-flight searches after reload
state.requests.filter(r => r.status === 'searching').forEach(r => setTimeout(() => api._dispatch(r.id), 1000))

// realtime backend
if (CLOUD) {
  set({ pros: [], requests: state.requests.filter(r => r.id && !r.id.startsWith('r_')), incoming: null })
  cloud.initCloud({ set, get: () => state, api, ping, dist: distKm })
  // pros: own blocked flag = admin block (users/{me}.pro.blocked) or 3 no-shows
  subs.add(() => { const u = state.user; if (!u?.pro) return; const bl = !!state.adminBlocked || (u.pro.noShows || 0) >= 3; if (bl !== !!u.pro.blocked) set(s => ({ user: { ...s.user, pro: { ...s.user.pro, blocked: bl, online: false } } })) })
  // keep "online" fresh so stale pros drop off
  setInterval(() => { if (state.user?.pro?.online) cloud.pushProfile() }, 5 * 60e3)
}
