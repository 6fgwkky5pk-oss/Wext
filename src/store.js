// WEXT data layer. All app screens talk to `api` only, so the local adapter below can be
// swapped for a realtime backend (Firebase/Supabase) without touching UI code.
import { useSyncExternalStore } from 'react'
import { seedPros, distKm, catName, regionFor } from './data'
import { payments } from './payments'

const KEY = 'wext:v1'
const uid = () => Math.random().toString(36).slice(2, 10)
const now = () => Date.now()
const DAY = 864e5

const defaultConfig = {
  baseFee: 5, promoFee: 1, promoEnd: '2027-02-13', surgeCap: 2, surgeManual: false,
  rideFee: 1, projFee: 1, surgeThreshold: 2,
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
let actx
export function ping(kind = 'soft') {
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)()
    const notes = kind === 'job' ? [880, 1175, 880, 1175, 1568] : kind === 'ring' ? [660, 880] : [784, 1046]
    notes.forEach((f, i) => {
      const o = actx.createOscillator(), g = actx.createGain()
      o.type = 'sine'; o.frequency.value = f
      const t = actx.currentTime + i * 0.16
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.25, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.15)
      o.connect(g).connect(actx.destination); o.start(t); o.stop(t + 0.16)
    })
    if (navigator.vibrate) navigator.vibrate(kind === 'job' ? [300, 120, 300, 120, 500] : 60)
  } catch {}
}

// ---------- pricing ----------
export function promoActive(cfg = state.config) { return new Date(cfg.promoEnd + 'T23:59:59') > new Date() }
export function surgeFor(cat) {
  const cfg = state.config
  if (cfg.surgeManual) return cfg.surgeCap
  const loc = state.loc || [41.92, 45.47]
  const near = (state.pros || []).filter(p => p.cat === cat && p.online && distKm(loc, p.pos) < 4 && !state.blockedIds.includes(p.id)).length
  if (near >= cfg.surgeThreshold) return 1
  return Math.min(cfg.surgeCap, near === 0 ? 1.5 : 1.3)
}
export function priceFor(cat, kind = 'instant') {
  const cfg = state.config, promo = promoActive(cfg)
  const base = kind === 'ride' ? cfg.rideFee : kind === 'project' ? cfg.projFee : promo ? cfg.promoFee : cfg.baseFee
  const surge = kind === 'instant' ? surgeFor(cat) : 1
  const amount = Math.round(base * surge * 100) / 100
  return { amount, old: kind === 'instant' && promo ? cfg.baseFee : null, surge, promo }
}
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

const REPLIES = {
  ka: ['გამარჯობა! მივიღე, უკვე გზაში ვარ 👍', 'კარგი, მისამართი ზუსტად მომწერეთ, თუ შეიძლება', 'დაახლოებით 15 წუთში ვიქნები'],
  en: ['Hi! Got it, on my way 👍', 'Great, please send me the exact address', "I'll be there in about 15 minutes"],
  ru: ['Здравствуйте! Принял, уже еду 👍', 'Хорошо, напишите точный адрес, пожалуйста', 'Буду примерно через 15 минут'],
  de: ['Hallo! Erhalten, bin unterwegs 👍', 'Gut, schicken Sie mir bitte die genaue Adresse', 'Ich bin in etwa 15 Minuten da'],
  tr: ['Merhaba! Aldım, yoldayım 👍', 'Tamam, lütfen tam adresi yazın', 'Yaklaşık 15 dakikada oradayım'],
}

// ---------- API ----------
export const api = {
  setLang(lang) { set({ lang }); document.documentElement.lang = lang },
  setLoc(loc, real) {
    const patch = { loc, locReal: !!real }
    if (!state.pros || !state.prosCenter || distKm(state.prosCenter, loc) > 30) { patch.pros = seedPros(loc); patch.prosCenter = loc }
    set(patch)
  },
  login(phone, name, role) {
    const user = { id: 'u_' + uid(), phone, name, role, createdAt: now(), pro: { type: 'individual', cats: [], members: 1, online: false, noShows: 0, blocked: false, rating: 5, jobs: 0 } }
    set({ user })
  },
  logout() { set({ user: null }) },
  updateUser(patch) { set(s => ({ user: { ...s.user, ...patch } })) },
  updatePro(patch) { set(s => ({ user: { ...s.user, pro: { ...s.user.pro, ...patch } } })) },

  nearbyPros(cat, radius = 50) {
    const loc = state.loc || [41.92, 45.47]
    return (state.pros || []).filter(p => (!cat || p.cat === cat) && !state.blockedIds.includes(p.id))
      .map(p => ({ ...p, dist: distKm(loc, p.pos) })).filter(p => p.dist <= radius).sort((a, b) => (b.online - a.online) || a.dist - b.dist)
  },

  // Bundle rule: one payment = up to 3 contacts in the same category within 24h
  activeBundle(cat) {
    return state.payments.find(p => p.cat === cat && p.status !== 'released' && now() - p.createdAt < DAY && p.contacts < 3)
  },

  async createRequest({ cat, note }) {
    let bundle = api.activeBundle(cat)
    const price = priceFor(cat)
    if (!bundle) {
      const pay = await payments.preauthorize({ amount: price.amount, currency: currency().currency, card: state.user?.card })
      bundle = { id: pay.id, cat, amount: price.amount, status: 'held', contacts: 0, createdAt: now() }
      set(s => ({ payments: [bundle, ...s.payments] }))
    }
    const req = { id: 'r_' + uid(), cat, note, status: 'searching', createdAt: now(), payId: bundle.id, radius: 3, notified: [], proId: null, log: [] }
    set(s => ({ requests: [req, ...s.requests] }))
    api._dispatch(req.id)
    return req.id
  },

  _req(id) { return state.requests.find(r => r.id === id) },
  _updReq(id, patch) { set(s => ({ requests: s.requests.map(r => r.id === id ? { ...r, ...(typeof patch === 'function' ? patch(r) : patch) } : r) })) },

  // dispatch: nearest 3 online pros, 75s window, then expand radius 3 -> 6 -> 12 km
  _dispatch(id) {
    const r = api._req(id); if (!r || r.status !== 'searching') return
    const cand = api.nearbyPros(r.cat, r.radius).filter(p => p.online && !r.notified.includes(p.id)).slice(0, 3)
    if (!cand.length) {
      if (r.radius >= 12) { api._updReq(id, { status: 'nopros' }); api._releaseIfUnused(r.payId); return }
      const radius = r.radius === 3 ? 6 : 12
      api._updReq(id, x => ({ radius, log: [...x.log, { k: 'radius', r: radius }] }))
      later(id, 1800, () => api._dispatch(id))
      return
    }
    api._updReq(id, x => ({ notified: [...x.notified, ...cand.map(c => c.id)], current: cand.map(c => c.id), windowEnds: now() + 75000, log: [...x.log, { k: 'notify', n: cand.length }] }))
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
    api._updReq(reqId, { contacted: how })
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
  markArrived(reqId) { api._updReq(reqId, { status: 'arrived', arrivedAt: now() }); api.registerContact(reqId, 'arrived') },
  finish(reqId, rating) { api._updReq(reqId, { status: 'done', rating }) },

  sendMsg(threadId, text) {
    pushMsg(threadId, { from: 'me', text })
  },
  readThread(threadId) { set(s => s.chats[threadId] ? { chats: { ...s.chats, [threadId]: { ...s.chats[threadId], unread: 0 } } } : {}) },
  missedCall(threadId, reqId, t) {
    const r = api._req(reqId)
    // the other side receives: t('missedAuto') with a call-back button (delivered through the backend)
    pushMsg(threadId, { from: 'system', kind: 'missed', text: t('missedSent') })
  },

  // projects / field work (N-slot mechanic)
  createProject(p) { const proj = { id: 'pj_' + uid(), ownerId: state.user.id, ownerName: state.user.name, joins: [], createdAt: now(), ...p }; set(s => ({ projects: [proj, ...s.projects] })); return proj.id },
  joinProject(id, count) {
    set(s => ({ projects: s.projects.map(p => {
      if (p.id !== id) return p
      const taken = p.joins.reduce((a, j) => a + j.count, 0)
      const c = Math.min(count, p.people - taken); if (c <= 0) return p
      return { ...p, joins: [...p.joins.filter(j => j.userId !== state.user.id), { userId: state.user.id, name: state.user.name, count: c, type: state.user.pro.type }] }
    }) }))
  },
  leaveProject(id) { set(s => ({ projects: s.projects.map(p => p.id === id ? { ...p, joins: p.joins.filter(j => j.userId !== state.user.id) } : p) })) },

  // rides (same N-slot mechanic)
  createRide(r) { const ride = { id: 'rd_' + uid(), driverId: state.user.id, driver: state.user.name, bookings: [], createdAt: now(), ...r }; set(s => ({ rides: [ride, ...s.rides] })) },
  bookSeat(id, n = 1) {
    set(s => ({ rides: s.rides.map(r => {
      if (r.id !== id) return r
      const taken = r.bookings.reduce((a, b) => a + b.n, 0); if (taken + n > r.seats) return r
      return { ...r, bookings: [...r.bookings.filter(b => b.userId !== state.user.id), { userId: state.user.id, name: state.user.name, n }] }
    }) }))
  },
  cancelSeat(id) { set(s => ({ rides: s.rides.map(r => r.id === id ? { ...r, bookings: r.bookings.filter(b => b.userId !== state.user.id) } : r) })) },

  // pro side
  setOnline(on) {
    api.updatePro({ online: on })
    if (on) api._scheduleIncoming(); else { clearTimeout(timers.incoming); set({ incoming: null }) }
  },
  _scheduleIncoming() {
    later('incoming', 8000 + Math.random() * 10000, () => {
      const u = state.user; if (!u?.pro.online || u.pro.blocked || state.incoming) return
      const cats = u.pro.cats.length ? u.pro.cats : ['handyman']
      const cat = cats[Math.floor(Math.random() * cats.length)]
      const loc = state.loc || [41.92, 45.47]
      const d = 0.4 + Math.random() * 3.5
      const notes = { ka: ['წყალი ჩამოდის ჭერიდან', 'როზეტკა არ მუშაობს', 'კარი არ იკეტება', 'სასწრაფოდ მჭირდება', ''], en: ['Water leaking from ceiling', 'Socket not working', "Door won't lock", 'Urgent', ''] }
      const ns = notes[state.lang] || notes.ka
      set({ incoming: { id: 'in_' + uid(), cat, dist: +d.toFixed(1), note: ns[Math.floor(Math.random() * ns.length)], client: ['ნათია', 'ლაშა', 'Anna', 'მზია', 'გიგა'][Math.floor(Math.random() * 5)], expires: now() + 75000, pos: [loc[0] + d / 140, loc[1] + d / 160] } })
      ping('job')
    })
  },
  respondIncoming(accept) {
    const inc = state.incoming; if (!inc) return
    set({ incoming: null })
    if (accept) {
      const job = { ...inc, status: 'accepted', acceptedAt: now(), threadId: 't_' + inc.id }
      set(s => ({ proJobs: [job, ...s.proJobs], user: { ...s.user, pro: { ...s.user.pro, jobs: s.user.pro.jobs + 1 } } }))
      pushMsg(job.threadId, { from: 'client', text: inc.note || '👋' })
    } else api._scheduleIncoming()
  },
  proArrived(jobId) { set(s => ({ proJobs: s.proJobs.map(j => j.id === jobId ? { ...j, status: 'arrived', arrivedAt: now() } : j) })) },
  proDone(jobId) { set(s => ({ proJobs: s.proJobs.map(j => j.id === jobId ? { ...j, status: 'done' } : j) })); if (state.user.pro.online) api._scheduleIncoming() },
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
    const byId = state.user?.id
    set(s => ({ complaints: [{ id: uid(), reqId, proId, reason, byId, byName: s.user?.name, ts: now() }, ...s.complaints] }))
  },
  reportBug(text, screen) { set(s => ({ bugs: [{ id: uid(), text, screen, ts: now(), by: s.user?.name, ua: navigator.userAgent }, ...s.bugs] })) },

  _seed(b) { set(s => ({ seeded: true, projects: [...s.projects, ...b.projects], rides: [...s.rides, ...b.rides] })) },

  // admin
  setConfig(patch) { set(s => ({ config: { ...s.config, ...patch } })) },
  toggleBlock(id) { set(s => ({ blockedIds: s.blockedIds.includes(id) ? s.blockedIds.filter(x => x !== id) : [...s.blockedIds, id] })) },
  setAdmin(on) { set(s => ({ user: { ...s.user, admin: on } })) },
}

// expire hold automatically if a request never got a real contact within 2h
setInterval(() => {
  state.requests.filter(r => r.status === 'accepted' && !r.contacted && now() - r.acceptedAt > 2 * 3600e3).forEach(r => { api._updReq(r.id, { status: 'expired' }); api._releaseIfUnused(r.payId) })
  if (state.user?.role === 'pro') api.checkNoShows()
}, 30000)

// resume pro network after reload
if (state.user?.pro?.online) setTimeout(() => api._scheduleIncoming(), 3000)
// resume in-flight searches after reload
state.requests.filter(r => r.status === 'searching').forEach(r => setTimeout(() => api._dispatch(r.id), 1000))
