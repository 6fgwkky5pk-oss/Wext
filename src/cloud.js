// Firebase realtime adapter. Active only when src/firebase-config.js exports a config.
// Firestore layout:
//   users/{uid}            public profile (name, role, pro{...}, pos, region)
//   private/{uid}          phone number (never shown to others)
//   requests/{id}          instant jobs: clientId, cat, status, notified[], proId ...
//   threads/{tid}/msgs/*   chat messages (tid = 't_' + requestId)
//   calls/{id}             WebRTC signaling (+ subcollections cc / ac for ICE candidates)
//   projects/*, rides/*    N-slot boards per region
//   complaints/*, bugs/*   trust & safety, tester feedback
//   config/main            prices, promo, surge, blockedIds (admin)
import { initializeApp } from 'firebase/app'
import { getAuth, signInAnonymously, onAuthStateChanged, connectAuthEmulator } from 'firebase/auth'
import {
  getFirestore, collection, doc, setDoc, addDoc, updateDoc, onSnapshot, query, where, runTransaction,
  arrayUnion, increment, deleteField, getDoc, getDocs, orderBy, limit, connectFirestoreEmulator,
} from 'firebase/firestore'
import firebaseConfig from './firebase-config'
import { setExtraSyn } from './data'

export const CLOUD = !!(firebaseConfig && firebaseConfig.apiKey)
let app, auth, db
let ctx // { set, get, api }
let uid = null
const unsubs = {}
const threadSubs = {}
const sub = (k, fn) => { unsubs[k]?.(); unsubs[k] = fn }

export function myId() { return uid }

export async function initCloud(c) {
  if (!CLOUD) return
  ctx = c
  app = initializeApp(firebaseConfig)
  auth = getAuth(app)
  db = getFirestore(app)
  if (firebaseConfig.emulator) { connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true }); connectFirestoreEmulator(db, '127.0.0.1', 8080) }
  await new Promise(res => onAuthStateChanged(auth, u => { if (u) { uid = u.uid; res() } else signInAnonymously(auth).catch(e => { console.error(e); res() }) }))
  ctx.set({ cloudReady: true, myUid: uid })
  listenGlobal()
  if (ctx.get().user) onLogin()
}

// positions are published on a ~50 m grid only
const round = p => p && [Math.round(p[0] * 2000) / 2000, Math.round(p[1] * 2000) / 2000]
export const roundPos = round

// ---------- profile ----------
let pushT
export function pushProfile() {
  if (!uid) return
  clearTimeout(pushT)
  pushT = setTimeout(() => {
    const s = ctx.get(), u = s.user; if (!u) return
    setDoc(doc(db, 'users', uid), {
      name: u.name, role: u.role, hue: u.hue ?? 38, pro: (({ rating, jobs, noShows, blocked, verified, ...rest }) => rest)(u.pro || {}), aliases: u.aliases || [], ...(!u.pro?.registered ? { pos: deleteField(), posReal: deleteField(), posAcc: deleteField(), posAt: deleteField() } : s.locReal ? { pos: round(s.loc), posReal: true, posAcc: s.locAcc || null, posAt: Date.now() } : {}), region: s.region || 'ge',
      updatedAt: Date.now(),
    }, { merge: true }).catch(console.error)
  }, 400)
}
export async function onLogin() {
  const u = ctx.get().user
  if (!uid || !u) return
  if (u.id !== uid) ctx.set(s => ({ user: { ...s.user, id: uid } }))
  const p9 = normPhone(u.phone)
  setDoc(doc(db, 'private', uid), { phone: u.phone, p9 }, { merge: true }).catch(() => {})
  if (p9.length >= 9) await restoreByPhone(u.phone, p9)
  myIds = [uid, ...(ctx.get().user?.aliases || [])].slice(0, 10)
  pushProfile()
  listenUser()
}
// both pressed 'agreed' at the same moment: neither saw the other's yes, so the listener closes the deal
const bothYes = r => r.clientDeal === 'yes' && r.proDeal === 'yes' && ['accepted', 'arrived'].includes(r.status)
export const normPhone = ph => String(ph || '').replace(/\D/g, '').slice(-9)
let myIds = []
export const callFrom = (c, id) => !!c && !!id && (c.from === id || (c.fromIds || []).includes(id))
export const isMe = id => !!id && (id === uid || myIds.includes(id))

// One phone number = one person. Any earlier account with the same number (other phone, reinstalled app)
// is folded into this one: profile, worker data, request/job history, chats.
// Lookup key for a phone: SHA-256 of a fixed prefix + last 9 digits. The number itself is never stored there.
async function phoneKey(p9) {
  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('wext-phone:' + p9))
  return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('')
}
// phones/{key} = { uids: [every account id that logged in with this number], uid: latest, at }.
// Readable only by exact key (rules: get, no list), so nobody can download the list of numbers.
// We never write to other people's /users docs: old accounts are hidden by the "aliases" of the newest one (see listenUser).
async function restoreByPhone(phone, p9) {
  try {
    const ref = doc(db, 'phones', await phoneKey(p9))
    const ph = (await getDoc(ref)).data() || {}
    const ids = new Set((ph.uids || []).filter(id => id && id !== uid))
    const known = new Set(ctx.get().user.aliases || [])
    setDoc(ref, { uids: [...new Set([...(ph.uids || []), uid])].slice(-10), uid, at: Date.now() }).catch(e => console.warn('phones', e.code || e))
    if (!ids.size) return
    let best = null; const all = new Set()
    for (const id of ids) {
      const x = (await getDoc(doc(db, 'users', id))).data(); if (!x) continue
      all.add(id); (x.aliases || []).forEach(a => a !== uid && all.add(a))
      const score = (x.pro?.registered ? 1e15 : 0) + (x.updatedAt || 0)
      if (!best || score > best.score) best = { id, x, score }
    }
    if (!best) return
    const fresh = [...all].filter(a => !known.has(a))
    if (!fresh.length) return
    const x = best.x
    ctx.set(s => ({ user: { ...s.user, aliases: [...known, ...fresh].slice(-20), restoredFrom: best.id,
      name: x.name || s.user.name, hue: x.hue ?? s.user.hue,
      pro: x.pro?.registered ? { ...s.user.pro, ...x.pro, online: true } : s.user.pro } }))
  } catch (e) { console.warn('restore', e.code || e) }
}

// ---------- listeners ----------
function listenGlobal() {
  sub('config', onSnapshot(doc(db, 'config', 'main'), d => {
    const c = d.data(); if (!c) return
    const { blockedIds = [], ...cfg } = c
    setExtraSyn(cfg.syn)
    ctx.set(s => ({ config: { ...s.config, ...cfg }, blockedIds }))
  }))
  sub('stats', onSnapshot(doc(db, 'stats', 'cats'), d => { ctx.set({ catStats: d.data() || {} }) }, () => {}))
}
// searches that found nothing: admin links them to a service (stats/misses: { term: count })
export const missSearch = term => setDoc(doc(db, 'stats', 'misses'), { [term]: increment(1) }, { merge: true }).catch(() => {})
export const clearMiss = term => setDoc(doc(db, 'stats', 'misses'), { [term]: deleteField() }, { merge: true }).catch(() => {})
export function listenMisses(cb) { return onSnapshot(doc(db, 'stats', 'misses'), d => cb(d.data() || {}), () => cb({})) }
export const bumpStat = (keys, n = 1) => setDoc(doc(db, 'stats', 'cats'), Object.fromEntries(keys.map(k => [k, increment(n)])), { merge: true }).catch(() => {})

function listenUser() {
  const region = ctx.get().region || 'ge'
  // registered pros in my region = the live network
  sub('pros', onSnapshot(query(collection(db, 'users'), where('region', '==', region)), snap => {
    const now = Date.now()
    const pros = []
    // (aliases of other accounts are NOT trusted here: anyone could list a real pro's id and hide him)
    snap.forEach(d => {
      const u = d.data(); if (isMe(d.id) || u.movedTo || !u.pro?.registered || !u.pos) return
      pros.push({
        id: d.id, name: u.name, type: u.pro.type, cat: u.pro.cats?.[0], cats: u.pro.cats || [], prices: u.pro.prices || {}, members: u.pro.members || 1,
        verified: !!u.pro.verified, rating: u.pro.rating || 5, jobs: u.pro.jobs || 0, pos: u.pos, posUnknown: !u.posReal && Math.abs(u.pos[0] - 41.92) < 0.0006 && Math.abs(u.pos[1] - 45.47) < 0.0006, hue: u.hue ?? 30,
        online: !!u.pro.online && now - (u.updatedAt || 0) < 6 * 3600e3,
      })
    })
    const w = ctx.get().watchCat
    if (w) { const hit = pros.find(p => p.online && (p.cats || []).includes(w) && !p.posUnknown && ctx.dist(ctx.get().loc || p.pos, p.pos) < 15)
      if (hit) { ctx.set({ watchCat: null }); ctx.ping('job'); ctx.api.notifyAvail?.(w, hit.name) } }
    ctx.set({ pros })
  }))
  // my requests as a client
  sub('myReqs', onSnapshot(query(collection(db, 'requests'), where('clientId', '==', uid)), snap => {
    const prev = ctx.get().requests
    const reqs = []
    snap.forEach(d => reqs.push({ id: d.id, ...d.data() }))
    reqs.sort((a, b) => b.createdAt - a.createdAt)
    ctx.set({ requests: reqs })
    reqs.forEach(r => {
      if (r.threadId) listenThread(r.threadId, r.id, 'client')
      const old = prev.find(x => x.id === r.id)
      if (r.status === 'accepted' && old?.status === 'searching') ctx.ping('soft')
      if (['arrived', 'agreed'].includes(r.status) && !r.contacted) ctx.api.registerContact(r.id, r.status)
      if (bothYes(r)) updateDoc(doc(db, 'requests', r.id), { status: 'agreed', agreedAt: Date.now() }).catch(() => {})
    })
  }))
  // jobs offered to me (online → full screen, offline → SMS-style banner)
  sub('offers', onSnapshot(query(collection(db, 'requests'), where('notified', 'array-contains', uid)), snap => {
    const s = ctx.get()
    if (!s.user?.pro?.registered || s.user.pro.blocked) return
    const declined = s.declined || []
    let best = null
    snap.forEach(d => {
      const r = d.data()
      if (r.status !== 'searching' || declined.includes(d.id) || Date.now() - r.createdAt > 15 * 60e3) return
      if (!best || r.createdAt > best.createdAt) best = { id: d.id, ...r }
    })
    const cur = s.incoming
    if (!best) { if (cur) ctx.set({ incoming: null }); return }
    if (cur?.id === best.id) return
    const loc = s.loc || best.pos
    const dist = ctx.dist(loc, best.pos)
    const viaSms = !s.user.pro.online
    ctx.set({ incoming: { id: best.id, cat: best.cat, dist: best.posReal === false ? null : +dist.toFixed(1), note: best.note, photo: best.photo || null, voice: best.voice || null, client: best.clientName, pos: best.pos, viaSms, opened: !viaSms, expires: Date.now() + (viaSms ? 300000 : 75000) } })
    ctx.ping(viaSms ? 'soft' : 'job')
  }))
  // jobs I accepted as a pro
  sub('myJobs', onSnapshot(query(collection(db, 'requests'), where('proId', '==', uid)), snap => {
    const s = ctx.get(), loc = s.loc
    const jobs = []
    snap.forEach(d => {
      const r = d.data()
      jobs.push({ id: d.id, cat: r.cat, note: r.note, photo: r.photo || null, voice: r.voice || null, client: r.clientName, clientId: r.clientId, pos: r.pos, dist: r.posReal === false || !loc ? null : +ctx.dist(loc, r.pos).toFixed(1), status: r.status, rating: r.rating || null, outcomeBy: r.outcomeBy || null, doneAt: r.doneAt || null, clientDeal: r.clientDeal || null, proDeal: r.proDeal || null === 'cancelled' ? 'cancelled' : r.status, acceptedAt: r.acceptedAt, onWayAt: r.onWayAt || null, proDoneAt: r.proDoneAt || null, threadId: r.threadId })
      if (r.threadId) listenThread(r.threadId, d.id, 'pro')
      if (bothYes(r)) updateDoc(doc(db, 'requests', d.id), { status: 'agreed', agreedAt: Date.now() }).catch(() => {})
    })
    jobs.sort((a, b) => b.acceptedAt - a.acceptedAt)
    // tell the pro what the client did (the card would otherwise just disappear)
    const before = ctx.get().proJobs || []
    jobs.forEach(j => { const o = before.find(x => x.id === j.id); if (!o || !['accepted', 'arrived', 'agreed'].includes(o.status) || o.status === j.status) return
      const k = j.status === 'nodeal' && j.outcomeBy === 'client' ? 'clientNoDeal' : j.status === 'cancelled' ? 'clientCancelled' : j.status === 'done' && !o.proDoneAt ? 'clientMarkedDone' : j.status === 'agreed' ? 'dealBoth' : null
      if (k) { ctx.set({ note: { k, icon: k === 'dealBoth' ? '🤝' : k === 'clientMarkedDone' ? '✅' : '✕', name: j.client, cat: j.cat, ts: Date.now() } }); ctx.ping('soft') } })
    // one live card per client+service: a newer request from the same client replaces the older one
    const seen = new Set()
    jobs.forEach(j => { if (!['accepted', 'arrived', 'agreed'].includes(j.status)) return; const k = j.clientId + j.cat; if (seen.has(k)) { j.status = 'replaced'; updateDoc(doc(db, 'requests', j.id), { status: 'replaced' }).catch(() => {}) } else seen.add(k) })
    ctx.set({ proJobs: jobs })
  }))
  // boards
  sub('projects', onSnapshot(query(collection(db, 'projects'), where('region', '==', region)), snap => {
    const a = []; snap.forEach(d => a.push({ id: d.id, ...d.data() })); ctx.set({ projects: a })
    a.forEach(p => (p.joins || []).forEach(j => { if (isMe(p.ownerId) || isMe(j.userId)) listenThread(`p_${p.id}_${j.userId}`, null, 'board') }))
  }))
  sub('rides', onSnapshot(query(collection(db, 'rides'), where('region', '==', region)), snap => {
    const a = []; snap.forEach(d => a.push({ id: d.id, ...d.data() })); ctx.set({ rides: a })
    a.forEach(r => (r.bookings || []).forEach(b => { if (isMe(r.driverId) || isMe(b.userId)) listenThread(`d_${r.id}_${b.userId}`, null, 'board') }))
  }))
  // incoming internet calls
  sub('calls', onSnapshot(query(collection(db, 'calls'), where('to', '==', uid)), snap => {
    let ring = null
    snap.forEach(d => { const c = d.data(); if (c.state === 'ringing' && Date.now() - c.ts < 35000) ring = { id: d.id, ...c } })
    const cur = ctx.get().ringing
    if (ring && cur?.id !== ring.id) ctx.set({ ringing: ring })
    if (!ring && cur) ctx.set({ ringing: null })
  }))
  if (ctx.get().user?.admin) listenAdmin()
}

export function listenAdmin() {
  sub('complaints', onSnapshot(query(collection(db, 'complaints'), orderBy('ts', 'desc'), limit(200)), snap => {
    const a = []; snap.forEach(d => a.push({ id: d.id, ...d.data() })); ctx.set({ complaints: a })
  }))
  sub('bugs', onSnapshot(query(collection(db, 'bugs'), orderBy('ts', 'desc'), limit(200)), snap => {
    const a = []; snap.forEach(d => a.push({ id: d.id, ...d.data() })); ctx.set({ bugs: a })
  }))
  sub('adminUsers', onSnapshot(query(collection(db, 'users'), limit(1000)), snap => {
    const a = []; snap.forEach(d => a.push({ id: d.id, ...d.data() })); ctx.set({ adminUsers: a })
  }))
  sub('adminReqs', onSnapshot(query(collection(db, 'requests'), limit(1000)), snap => {
    const a = []; snap.forEach(d => a.push({ id: d.id, ...d.data() })); ctx.set({ adminReqs: a })
  }))
}

export function listenThread(tid, reqId, side) {
  if (threadSubs[tid]) return
  threadSubs[tid] = onSnapshot(query(collection(db, 'threads', tid, 'msgs'), orderBy('ts')), snap => {
    const msgs = []; snap.forEach(d => msgs.push({ id: d.id, ...d.data() }))
    const s = ctx.get(), last = (s.lastRead || {})[tid] || 0
    const unread = msgs.filter(m => !isMe(m.from) && m.ts > last).length
    const prev = s.chats[tid]?.msgs.length || 0
    ctx.set(st => ({ chats: { ...st.chats, [tid]: { id: tid, msgs, unread } } }))
    if (msgs.length > prev && prev > 0 && !isMe(msgs[msgs.length - 1].from)) ctx.ping('soft')
    // a reply from the pro is a real contact → capture the client's hold
    if (side === 'client' && msgs.some(m => !isMe(m.from) && m.kind !== 'missed')) ctx.api.registerContact(reqId, 'chat')
  })
}

export function logoutCloud() {
  Object.keys(unsubs).forEach(k => { if (k !== 'config') { unsubs[k](); delete unsubs[k] } })
  Object.keys(threadSubs).forEach(k => { threadSubs[k](); delete threadSubs[k] })
}

// ---------- writes ----------
export async function createRequest(r) {
  const ref = await addDoc(collection(db, 'requests'), { ...r, pos: round(r.pos), clientId: uid, createdAt: Date.now() })
  return ref.id
}
export const updateRequest = (id, patch) => updateDoc(doc(db, 'requests', id), patch).catch(console.error)
export async function acceptRequest(id, pro) {
  return runTransaction(db, async tx => {
    const ref = doc(db, 'requests', id)
    const d = await tx.get(ref)
    if (!d.exists() || d.data().status !== 'searching') return false
    tx.update(ref, { status: 'accepted', proId: uid, proName: pro.name, eta: pro.eta, acceptedAt: Date.now(), threadId: 't_' + id })
    return true
  })
}
export const declineRequest = id => updateDoc(doc(db, 'requests', id), { declined: arrayUnion(uid) }).catch(() => {})
export const sendMsg = (tid, m) => addDoc(collection(db, 'threads', tid, 'msgs'), { ...m, from: uid, ts: Date.now() })
export const addItem = (col, data) => addDoc(collection(db, col), { ...data, ts: Date.now() })
export const setItem = (col, id, data) => setDoc(doc(db, col, id), data, { merge: true })
export async function slotTx(col, id, fn) {
  return runTransaction(db, async tx => {
    const ref = doc(db, col, id); const d = await tx.get(ref); if (!d.exists()) return
    const patch = fn(d.data()); if (patch) tx.update(ref, patch)
  })
}
// admin = a document /admins/{uid} created by hand in the Firebase console (the rules enforce it on the server)
export async function isAdmin() { try { return !!uid && (await getDoc(doc(db, 'admins', uid))).exists() } catch { return false } }
export const setConfig = patch => setDoc(doc(db, 'config', 'main'), patch, { merge: true })

// ---------- WebRTC internet calls (Firestore signaling) ----------
// STUN finds a direct path; TURN relays audio when mobile networks block direct paths (free public relay, replace with own later)
const ICE = { iceCandidatePoolSize: 4, iceServers: [
  { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] },
  { urls: ['turn:openrelay.metered.ca:80', 'turn:openrelay.metered.ca:443', 'turn:openrelay.metered.ca:443?transport=tcp'], username: 'openrelayproject', credential: 'openrelayproject' },
] }
// anti-abuse: max 8 outgoing calls in 10 minutes
let callTimes = []
export async function startCall({ to, threadId, reqId, fromName, onState, onRemote }) {
  callTimes = callTimes.filter(x => Date.now() - x < 10 * 60e3)
  if (callTimes.length >= 8) { ctx.set({ note: { k: 'tooManyCalls', icon: '⏳', ts: Date.now() } }); throw new Error('rate') }
  callTimes.push(Date.now())
  const pc = new RTCPeerConnection(ICE)
  const local = await navigator.mediaDevices.getUserMedia({ audio: true })
  local.getTracks().forEach(t => pc.addTrack(t, local))
  pc.ontrack = e => onRemote(e.streams[0])
  const callRef = doc(collection(db, 'calls'))
  // candidates are written only after the call document exists (the rules check its participants)
  let docReady = false; const early = []
  const putCand = c => addDoc(collection(callRef, 'cc'), c).catch(() => {})
  pc.onicecandidate = e => { if (!e.candidate) return; const c = e.candidate.toJSON(); docReady ? putCand(c) : early.push(c) }
  pc.onconnectionstatechange = () => onState(pc.connectionState)
  const offer = await pc.createOffer(); await pc.setLocalDescription(offer)
  await setDoc(callRef, { from: uid, fromIds: [uid, ...myIds.filter(x => x !== uid)], fromName, to, threadId, reqId: reqId || null, offer: { type: offer.type, sdp: offer.sdp }, state: 'ringing', ts: Date.now() })
  docReady = true; early.splice(0).forEach(putCand)
  // the callee's ICE candidates can arrive before the answer; addIceCandidate would fail and they were lost: hold them until the answer is applied
  const pending = []
  const addCand = x => pc.addIceCandidate(new RTCIceCandidate(x)).catch(() => {})
  const u1 = onSnapshot(callRef, async d => {
    const c = d.data(); if (!c) return
    if (c.answer && !pc.currentRemoteDescription) { await pc.setRemoteDescription(new RTCSessionDescription(c.answer)).catch(() => {}); pending.splice(0).forEach(addCand) }
    if (c.state === 'answered') onState('answered')
    if (c.state === 'declined' || c.state === 'ended' || c.state === 'busy') onState(c.state === 'busy' ? 'declined' : c.state)
  })
  const u2 = onSnapshot(collection(callRef, 'ac'), s => s.docChanges().forEach(ch => { if (ch.type !== 'added') return; const x = ch.doc.data(); pc.remoteDescription ? addCand(x) : pending.push(x) }))
  return { id: callRef.id, pc, local, end: (state = 'ended') => { u1(); u2(); updateDoc(callRef, { state }).catch(() => {}); pc.close(); local.getTracks().forEach(t => t.stop()) } }
}
export async function answerCall({ callId, onState, onRemote }) {
  const callRef = doc(db, 'calls', callId)
  const c = (await getDoc(callRef)).data()
  if (!c || c.state !== 'ringing') throw new Error('call gone')
  const pc = new RTCPeerConnection(ICE)
  const local = await navigator.mediaDevices.getUserMedia({ audio: true })
  local.getTracks().forEach(t => pc.addTrack(t, local))
  pc.ontrack = e => onRemote(e.streams[0])
  pc.onicecandidate = e => e.candidate && addDoc(collection(callRef, 'ac'), e.candidate.toJSON())
  pc.onconnectionstatechange = () => onState(pc.connectionState)
  await pc.setRemoteDescription(new RTCSessionDescription(c.offer))
  const ans = await pc.createAnswer(); await pc.setLocalDescription(ans)
  await updateDoc(callRef, { answer: { type: ans.type, sdp: ans.sdp }, state: 'answered' })
  const u1 = onSnapshot(collection(callRef, 'cc'), s => s.docChanges().forEach(ch => ch.type === 'added' && pc.addIceCandidate(new RTCIceCandidate(ch.doc.data())).catch(() => {})))
  const u2 = onSnapshot(callRef, d => { const x = d.data(); if (x?.state === 'ended' || x?.state === 'declined') onState('ended') })
  return { id: callId, call: c, pc, local, end: (state = 'ended') => { u1(); u2(); updateDoc(callRef, { state }).catch(() => {}); pc.close(); local.getTracks().forEach(t => t.stop()) } }
}
export const setCallState = (id, state) => updateDoc(doc(db, 'calls', id), { state }).catch(() => {})
