import React, { useEffect, useRef, useState } from 'react'
import { api, useStore, getState, ping, CLOUD, callAudio } from '../store'
import * as cloud from '../cloud'
import { catName } from '../data'
import { useT, Icon, Top, Avatar, fmtTime, catIcon } from '../ui'
import { useNav } from '../nav'

function useThreadMeta(threadId) {
  const s = getState()
  const r = s.requests.find(x => x.threadId === threadId)
  if (r) {
    const p = (s.pros || []).find(x => x.id === r.proId)
    const name = p?.name || r.proName || '—'
    return { name, av: p || { name, hue: 30, type: 'individual' }, cat: r.cat, reqId: r.id, other: r.proId }
  }
  const bm = threadId.match(/^([pd])_(.+)_([^_]+)$/)
  if (bm) {
    const [, kind, id, joiner] = bm
    const me = api.me() === 'me' ? s.user?.id : api.me()
    if (kind === 'p') {
      const p = s.projects.find(x => x.id === id), j = p?.joins.find(x => x.userId === joiner)
      const own = api.isMe(p?.ownerId), name = own ? j?.name : p?.ownerName
      return { name: name || '—', av: { name: name || '?', hue: 120, type: 'individual' }, cat: p?.cat, other: own ? joiner : p?.ownerId, title: p?.title }
    }
    const r = s.rides.find(x => x.id === id), b = r?.bookings.find(x => x.userId === joiner)
    const own = api.isMe(r?.driverId), name = own ? b?.name : r?.driver
    return { name: name || '—', av: { name: name || '?', hue: 210, type: 'individual' }, cat: null, other: own ? joiner : r?.driverId, title: r ? `${r.from} → ${r.to}` : '' }
  }
  const j = s.proJobs.find(x => x.threadId === threadId)
  return { name: j?.client || '—', av: { name: j?.client || '?', hue: 200, type: 'individual' }, cat: j?.cat, other: j?.clientId }
}

export function ChatList() {
  const { t, lang } = useT()
  const nav = useNav()
  const chats = useStore(s => s.chats)
  const list = Object.values(chats).filter(c => c.msgs.length).sort((a, b) => b.msgs.slice(-1)[0].ts - a.msgs.slice(-1)[0].ts)
  return <div className="scroll">
    <Top title={t('chats')} />
    <div className="pad list">
      {!list.length && <div className="empty"><div className="e">💬</div>{t('noChats')}</div>}
      {list.map(c => <ChatRow key={c.id} c={c} onClick={() => nav.go('chat', { threadId: c.id })} lang={lang} />)}
    </div>
  </div>
}
function ChatRow({ c, onClick, lang }) {
  const m = useThreadMeta(c.id), last = c.msgs.slice(-1)[0]
  return <button className="prorow" style={{ width: '100%', textAlign: 'left' }} onClick={onClick}>
    <Avatar p={m.av} />
    <div className="grow"><div className="row between"><b className="ell">{m.name}</b><span className="tiny mute">{fmtTime(last.ts)}</span></div>
      <div className="meta ell" style={{ display: 'block' }}>{catIcon(m.cat)} {last.kind === 'missed' ? '📞' : last.text}</div></div>
    {c.unread > 0 && <span className="badge ink">{c.unread}</span>}
  </button>
}

export function Chat({ threadId }) {
  const { t, lang } = useT()
  const nav = useNav()
  const th = useStore(s => s.chats[threadId])
  const meta = useThreadMeta(threadId)
  const [txt, setTxt] = useState('')
  const end = useRef()
  useEffect(() => { if (CLOUD) cloud.listenThread(threadId, null, 'board') }, [threadId])
  useEffect(() => { end.current?.scrollIntoView({ behavior: 'smooth' }); api.readThread(threadId) }, [th?.msgs.length])
  const send = () => { if (!txt.trim()) return; api.sendMsg(threadId, txt.trim()); setTxt('') }
  return <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
    <div className="top" style={{ borderBottom: '1px solid var(--line)' }}>
      <button className="iconbtn" onClick={nav.back}><Icon n="back" /></button>
      <Avatar p={meta.av} />
      <div className="grow"><b className="ell" style={{ display: 'block' }}>{meta.name}</b><span className="tiny mute b ell" style={{ display: 'block' }}>{meta.title ? (meta.cat ? catIcon(meta.cat) + ' ' : '🚗 ') + meta.title : catIcon(meta.cat) + ' ' + catName(meta.cat, lang)}</span></div>
      <button className="iconbtn" style={{ background: 'var(--y)' }} onClick={() => nav.go('voice', { threadId, reqId: meta.reqId })}><Icon n="phone" /></button>
    </div>
    <div className="msgs">
      {(th?.msgs || []).map(m => m.kind === 'missed'
        ? <div key={m.id} className="sys">📞 <b>{t('missedCall')}</b><br />{api.isMe(m.from) ? t('missedSent') : t('missedAuto', { name: m.name || meta.name, cat: catName(m.cat || meta.cat, lang) })}
            <div style={{ marginTop: 8 }}><button className="btn sm primary" onClick={() => nav.go('voice', { threadId, reqId: meta.reqId })}><Icon n="phone" s={16} />{t('callBack')}</button></div></div>
        : <div key={m.id} className={'bub' + (api.isMe(m.from) ? ' me' : '')}>{m.text}<div className="t">{fmtTime(m.ts)}</div></div>)}
      <div ref={end} />
    </div>
    <div className="composer">
      <input placeholder={t('typeMsg')} value={txt} onChange={e => setTxt(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} />
      <button className="send" onClick={send} aria-label={t('send')}><Icon n="send" /></button>
    </div>
  </div>
}

// In-app internet call (WebRTC, signaling through the realtime backend). No phone numbers are exchanged.
// Unanswered within 30s → automatic "X called about Y, call back" message in the chat.
export function Voice({ threadId, reqId, answerId }) {
  const { t } = useT()
  const nav = useNav()
  const meta = useThreadMeta(threadId)
  const [state, setState] = useState(answerId ? 'connecting' : 'calling')
  const [secs, setSecs] = useState(0)
  const [mute, setMute] = useState(false), [spk, setSpk] = useState(true)
  const call = useRef(), audio = useRef(), done = useRef(false)
  const finish = (st) => { if (done.current) return; done.current = true; call.current?.end(st); try { callAudio().srcObject = null } catch {} setTimeout(() => nav.back(), 900) }
  useEffect(() => {
    let ring, tm, tick
    const onState = st => {
      if (st === 'answered') { clearInterval(ring); clearTimeout(tm); setState('connecting'); tm = setTimeout(() => { setState('failed'); finish() }, 25000) }
      if (st === 'connected') { setState('connected'); clearInterval(ring); clearTimeout(tm); const t0 = Date.now(); tick = setInterval(() => { const s = Math.floor((Date.now() - t0) / 1000); setSecs(s); if (s === 20 && reqId) api.registerContact(reqId, 'call') }, 1000) }
      if (['declined', 'ended', 'failed'].includes(st)) { setState('ended'); finish() }
    }
    const onRemote = stream => { const a = callAudio(); audio.current = a; a.srcObject = stream; a.volume = 1; a.play().catch(() => {}) }
    if (!CLOUD) {
      ring = setInterval(() => ping('ring'), 2200); ping('ring')
      navigator.mediaDevices?.getUserMedia?.({ audio: true }).then(s => { call.current = { end: () => s.getTracks().forEach(x => x.stop()), local: s } }).catch(() => {})
      tm = setTimeout(() => { clearInterval(ring); setState('noanswer'); api.missedCall(threadId, reqId, t); finish() }, 12000)
    } else if (answerId) {
      tm = setTimeout(() => { setState('failed'); finish() }, 25000)
      cloud.answerCall({ callId: answerId, onState, onRemote }).then(c => { call.current = c }).catch(() => { setState('ended'); finish() })
    } else if (cloud.callFrom(getState().ringing, meta.other)) {
      // the other person is already calling me: answer that call instead of starting a second one
      const r = getState().ringing; api.clearRinging(); done.current = true
      setTimeout(() => nav.replace('voice', { threadId, reqId, answerId: r.id }), 0)
    } else {
      api.setOutgoing(meta.other)
      ring = setInterval(() => ping('ring'), 2200); ping('ring')
      cloud.startCall({ to: meta.other, threadId, reqId, fromName: getState().user.name, onState, onRemote }).then(c => { call.current = c }).catch(() => { setState('ended'); finish() })
      tm = setTimeout(() => { clearInterval(ring); setState('noanswer'); api.missedCall(threadId, reqId, t); finish('missed') }, 30000)
    }
    const bye = () => { if (!done.current) { done.current = true; call.current?.end() } }
    window.addEventListener('pagehide', bye)
    return () => { window.removeEventListener('pagehide', bye); clearInterval(ring); clearTimeout(tm); clearInterval(tick); api.setOutgoing(null); if (!done.current) { done.current = true; call.current?.end() } }
  }, [])
  // both pressed "call" at the same moment: one side gives way and answers the other's call
  const ringing = useStore(s => s.ringing)
  useEffect(() => {
    if (!CLOUD || answerId || state !== 'calling' || !cloud.callFrom(ringing, meta.other)) return
    if ((cloud.myId() || '') > ringing.from) {
      const r = ringing; api.clearRinging(); done.current = true; call.current?.end('ended'); api.setOutgoing(null)
      nav.replace('voice', { threadId, reqId, answerId: r.id })
    }
  }, [ringing?.id, state])
  useEffect(() => { call.current?.local?.getAudioTracks().forEach(x => x.enabled = !mute) }, [mute])
  const label = state === 'calling' ? t('calling') : state === 'connecting' ? '…' : state === 'connected' ? `${t('connected')} · ${String(Math.floor(secs / 60)).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}` : state === 'noanswer' ? t('noAnswer') : state === 'failed' ? t('callFailed') : t('endCall')
  return <div className="callscr">
    <div className="col" style={{ alignItems: 'center', gap: 16 }}>
      <div className={state === 'calling' ? 'ring' : ''}><Avatar p={{ ...meta.av, online: false }} lg /></div>
      <h1 style={{ color: '#fff', fontSize: 26 }}>{meta.name}</h1>
      <span className="b" style={{ color: 'var(--y)' }}>{label}</span>
      <span className="tiny" style={{ opacity: .5 }}>WEXT · {catIcon(meta.cat)} · 🔒</span>
    </div>
    <div className="callbtns">
      <button className={'cb' + (mute ? ' on' : '')} onClick={() => setMute(!mute)}><Icon n="mic" s={26} /></button>
      <button className="cb end" onClick={() => { setState('ended'); finish() }}><Icon n="phone" s={28} /></button>
      <button className={'cb' + (spk ? ' on' : '')} onClick={() => { setSpk(!spk); if (audio.current) audio.current.volume = spk ? 0.4 : 1 }}><Icon n="vol" s={26} /></button>
    </div>
  </div>
}

// Incoming internet call (callee side)
export function IncomingCall() {
  const { t, lang } = useT()
  const nav = useNav()
  const ring0 = useStore(s => s.ringing), outgoing = useStore(s => s.outgoing)
  const ring = ring0 && !(CLOUD && cloud.callFrom(ring0, outgoing)) ? ring0 : null
  useEffect(() => { if (!ring) return; const i = setInterval(() => ping('ring'), 2000); ping('ring'); return () => clearInterval(i) }, [ring?.id])
  if (!ring) return null
  return <div className="callscr" style={{ zIndex: 90 }}>
    <div className="col" style={{ alignItems: 'center', gap: 16 }}>
      <div className="ring"><Avatar p={{ name: ring.fromName || '?', hue: 200, type: 'individual' }} lg /></div>
      <h1 style={{ color: '#fff', fontSize: 26 }}>{ring.fromName}</h1>
      <span className="b" style={{ color: 'var(--y)' }}>📞 WEXT…</span>
    </div>
    <div className="callbtns" style={{ gap: 70 }}>
      <button className="cb end" onClick={() => { cloud.setCallState(ring.id, 'declined') }}><Icon n="close" s={28} /></button>
      <button className="cb" style={{ background: 'var(--green)' }} onClick={() => { const r = ring; api.clearRinging(); nav.go('voice', { threadId: r.threadId, reqId: r.reqId, answerId: r.id }) }}><Icon n="phone" s={28} /></button>
    </div>
  </div>
}
