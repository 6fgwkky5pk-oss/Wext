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
  arrayUnion, increment, getDoc, getDocs, orderBy, limit, connectFirestoreEmulator,
} from 'firebase/firestore'
import firebaseConfig from './firebase-config'

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

const round = p => p && [Math.round(p[0] * 1000) / 1000, Math.round(p[1] * 1000) / 1000]

// ---------- profile ----------
let pushT
export function pushProfile() {
  if (!uid) return
  clearTimeout(pushT)
  pushT = setTimeout(() => {
    const s = ctx.get(), u = s.user; if (!u) return
    setDoc(doc(db, 'users', uid), {
      name: u.name, role: u.role, hue: u.hue ?? 38, pro: u.pro, aliases: u.aliases || [], ...(s.locReal ? { pos: round(s.loc), posReal: true, posAcc: s.locAcc || null, posAt: Date.now() } : {}), region: s.region || 'ge',
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
export const normPhone = ph => String(ph || '').replace(/\D/g, '').slice(-9)
let myIds = []
export const isMe = id => !!id && (id === uid || myIds.includes(id))

// One phone number = one person. Any earlier account with the same number (other phone, reinstalled app)
// is folded into this one: profile, worker data, request/job history, chats.
async function restoreByPhone(phone, p9) {
  try {
    const ids = new Set()
    for (const q of [query(collection(db, 'private'), where('p9', '==', p9)), query(collection(db, 'private'), where('phone', '==', phone))]) {
      const snap = await getDocs(q); snap.forEach(d => d.id !== uid && ids.add(d.id))
    }
    if (!ids.size) return
    let best = null; const all = new Set()
    for (const id of ids) {
      const x = (await getDoc(doc(db, 'users', id))).data(); if (!x) continue
      all.add(id); (x.aliases || []).forEach(a => a !== uid && all.add(a))
      const score = (x.pro?.registered ? 1e15 : 0) + (x.updatedAt || 0)
      if (!best || score > best.score) best = { id, x, score }
    }
    if (!best) return
    const cur = ctx.get().user
    const known = new Set(cur.aliases || [])
    const fresh = [...all].filter(a => !known.has(a))
    if (!fresh.length) return
    const x = best.x
    ctx.set(s => ({ user: { ...s.user, aliases: [...known, ...fresh], restoredFrom: best.id,
      name: x.name || s.user.name, hue: x.hue ?? s.user.hue,
      pro: x.pro?.registered ? { ...s.user.pro, ...x.pro, online: true } : s.user.pro } }))
    fresh.forEach(id => updateDoc(doc(db, 'users', id), { movedTo: uid, 'pro.online': false, 'pro.registered': false }).catch(() => {}))
  } catch (e) { console.warn('restore', e) }
}

// ---------- listeners ----------
function listenGlobal() {
  sub('config', onSnapshot(doc(db, 'config', 'main'), d => {
    const c = d.data(); if (!c) return
    const { blockedIds = [], ...cfg } = c
    ctx.set(s => ({ config: { ...s.config, ...cfg }, blockedIds }))
  }))
  sub('stats', onSnapshot(doc(db, 'stats', 'cats'), d => { ctx.set({ catStats: d.data() || {} }) }, () => {}))
}
export const bumpStat = (keys, n = 1) => setDoc(doc(db, 'stats', 'cats'), Object.fromEntries(keys.map(k => [k, increment(n)])), { merge: true }).catch(() => {})

function listenUser() {
  const region = ctx.get().region || 'ge'
  // registered pros in my region = the live network
  sub('pros', onSnapshot(query(collection(db, 'users'), where('region', '==', region)), snap => {
    const now = Date.now()
    const pros = []
    snap.forEach(d => {
      const u = d.data(); if (isMe(d.id) || u.movedTo || !u.pro?.registered || !u.pos) return
      pros.push({
        id: d.id, name: u.name, type: u.pro.type, cat: u.pro.cats?.[0], cats: u.pro.cats || [], members: u.pro.members || 1,
        verified: !!u.pro.verified, rating: u.pro.rating || 5, jobs: u.pro.jobs || 0, pos: u.pos, posUnknown: !u.posReal && Math.abs(u.pos[0] - 41.92) < 0.0006 && Math.abs(u.pos[1] - 45.47) < 0.0006, hue: u.hue ?? 30,
        online: !!u.pro.online && now - (u.updatedAt || 0) < 6 * 3600e3,
      })
    })
    ctx.set({ pros })
  }))
  // my requests as a client
  sub('myReqs', onSnapshot(query(collection(db, 'requests'), where('clientId', 'in', myIds.length ? myIds : [uid])), snap => {
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
    ctx.set({ incoming: { id: best.id, cat: best.cat, dist: +dist.toFixed(1), note: best.note, photo: best.photo || null, voice: best.voice || null, client: best.clientName, pos: best.pos, viaSms, opened: !viaSms, expires: Date.now() + (viaSms ? 300000 : 75000) } })
    ctx.ping(viaSms ? 'soft' : 'job')
  }))
  // jobs I accepted as a pro
  sub('myJobs', onSnapshot(query(collection(db, 'requests'), where('proId', 'in', myIds.length ? myIds : [uid])), snap => {
    const s = ctx.get(), loc = s.loc
    const jobs = []
    snap.forEach(d => {
      const r = d.data()
      jobs.push({ id: d.id, cat: r.cat, note: r.note, photo: r.photo || null, voice: r.voice || null, client: r.clientName, clientId: r.clientId, pos: r.pos, dist: +(loc ? ctx.dist(loc, r.pos) : 0).toFixed(1), status: r.status === 'cancelled' ? 'cancelled' : r.status, acceptedAt: r.acceptedAt, threadId: r.threadId })
      if (r.threadId) listenThread(r.threadId, d.id, 'pro')
    })
    jobs.sort((a, b) => b.acceptedAt - a.acceptedAt)
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
    snap.forEach(d => { const c = d.data(); if (c.state === 'ringing' && Date.now() - c.ts < 40000) ring = { id: d.id, ...c } })
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
  const ref = await addDoc(collection(db, 'requests'), { ...r, clientId: uid, createdAt: Date.now() })
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
export const setConfig = patch => setDoc(doc(db, 'config', 'main'), patch, { merge: true })

// ---------- WebRTC internet calls (Firestore signaling) ----------
const ICE = { iceServers: [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }] }
export async function startCall({ to, threadId, reqId, fromName, onState, onRemote }) {
  const pc = new RTCPeerConnection(ICE)
  const local = await navigator.mediaDevices.getUserMedia({ audio: true })
  local.getTracks().forEach(t => pc.addTrack(t, local))
  pc.ontrack = e => onRemote(e.streams[0])
  const callRef = doc(collection(db, 'calls'))
  pc.onicecandidate = e => e.candidate && addDoc(collection(callRef, 'cc'), e.candidate.toJSON())
  pc.onconnectionstatechange = () => onState(pc.connectionState)
  const offer = await pc.createOffer(); await pc.setLocalDescription(offer)
  await setDoc(callRef, { from: uid, fromName, to, threadId, reqId: reqId || null, offer: { type: offer.type, sdp: offer.sdp }, state: 'ringing', ts: Date.now() })
  const u1 = onSnapshot(callRef, d => {
    const c = d.data(); if (!c) return
    if (c.answer && !pc.currentRemoteDescription) pc.setRemoteDescription(new RTCSessionDescription(c.answer))
    if (c.state === 'declined' || c.state === 'ended') onState(c.state)
  })
  const u2 = onSnapshot(collection(callRef, 'ac'), s => s.docChanges().forEach(ch => ch.type === 'added' && pc.addIceCandidate(new RTCIceCandidate(ch.doc.data())).catch(() => {})))
  return { id: callRef.id, pc, local, end: (state = 'ended') => { u1(); u2(); updateDoc(callRef, { state }).catch(() => {}); pc.close(); local.getTracks().forEach(t => t.stop()) } }
}
export async function answerCall({ callId, onState, onRemote }) {
  const callRef = doc(db, 'calls', callId)
  const c = (await getDoc(callRef)).data()
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
  const u2 = onSnapshot(callRef, d => { const x = d.data(); if (x?.state === 'ended') onState('ended') })
  return { id: callId, call: c, pc, local, end: (state = 'ended') => { u1(); u2(); updateDoc(callRef, { state }).catch(() => {}); pc.close(); local.getTracks().forEach(t => t.stop()) } }
}
export const setCallState = (id, state) => updateDoc(doc(db, 'calls', id), { state }).catch(() => {})
