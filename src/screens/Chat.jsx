import React, { useEffect, useRef, useState } from 'react'
import { api, useStore, getState, ping } from '../store'
import { catName } from '../data'
import { useT, Icon, Top, Avatar, fmtTime, catIcon } from '../ui'
import { useNav } from '../nav'

function useThreadMeta(threadId) {
  const s = getState()
  if (threadId.startsWith('t_r_')) {
    const r = s.requests.find(x => x.threadId === threadId)
    const p = r && s.pros.find(x => x.id === r.proId)
    return { name: p?.name || '—', av: p || { name: '?', hue: 30 }, cat: r?.cat, reqId: r?.id }
  }
  const j = s.proJobs.find(x => x.threadId === threadId)
  return { name: j?.client || '—', av: { name: j?.client || '?', hue: 200, type: 'individual' }, cat: j?.cat }
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
      <div className="meta ell" style={{ display: 'block' }}>{catIcon(m.cat)} {last.text}</div></div>
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
  useEffect(() => { end.current?.scrollIntoView({ behavior: 'smooth' }); api.readThread(threadId) }, [th?.msgs.length])
  const send = () => { if (!txt.trim()) return; api.sendMsg(threadId, txt.trim()); setTxt('') }
  return <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
    <div className="top" style={{ borderBottom: '1px solid var(--line)' }}>
      <button className="iconbtn" onClick={nav.back}><Icon n="back" /></button>
      <Avatar p={meta.av} />
      <div className="grow"><b className="ell" style={{ display: 'block' }}>{meta.name}</b><span className="tiny mute b">{catIcon(meta.cat)} {catName(meta.cat, lang)}</span></div>
      <button className="iconbtn" style={{ background: 'var(--y)' }} onClick={() => nav.go('voice', { threadId, reqId: meta.reqId })}><Icon n="phone" /></button>
    </div>
    <div className="msgs">
      {(th?.msgs || []).map(m => m.kind === 'missed'
        ? <div key={m.id} className="sys">📞 <b>{t('missedCall')}</b><br />{m.text}
            <div style={{ marginTop: 8 }}><button className="btn sm primary" onClick={() => nav.go('voice', { threadId, reqId: meta.reqId })}><Icon n="phone" s={16} />{t('callBack')}</button></div></div>
        : <div key={m.id} className={'bub' + (m.from === 'me' ? ' me' : '')}>{m.text}<div className="t">{fmtTime(m.ts)}</div></div>)}
      <div ref={end} />
    </div>
    <div className="composer">
      <input placeholder={t('typeMsg')} value={txt} onChange={e => setTxt(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} />
      <button className="send" onClick={send} aria-label={t('send')}><Icon n="send" /></button>
    </div>
  </div>
}

// In-app internet call. Media is captured locally now; the WebRTC peer link is opened through the
// realtime backend's signaling channel once connected. Unanswered → automatic "call back" message.
export function Voice({ threadId, reqId }) {
  const { t } = useT()
  const nav = useNav()
  const meta = useThreadMeta(threadId)
  const [state, setState] = useState('calling')
  const [mute, setMute] = useState(false), [spk, setSpk] = useState(false)
  const stream = useRef()
  useEffect(() => {
    navigator.mediaDevices?.getUserMedia?.({ audio: true }).then(s => { stream.current = s }).catch(() => {})
    const ring = setInterval(() => ping('ring'), 2200); ping('ring')
    const tm = setTimeout(() => {
      clearInterval(ring); setState('noanswer')
      api.missedCall(threadId, reqId, t)
      setTimeout(() => nav.back(), 1600)
    }, 12000)
    return () => { clearInterval(ring); clearTimeout(tm); stream.current?.getTracks().forEach(x => x.stop()) }
  }, [])
  useEffect(() => { stream.current?.getAudioTracks().forEach(x => x.enabled = !mute) }, [mute])
  return <div className="callscr">
    <div className="col" style={{ alignItems: 'center', gap: 16 }}>
      <div className={state === 'calling' ? 'ring' : ''}><Avatar p={{ ...meta.av, online: false }} lg /></div>
      <h1 style={{ color: '#fff', fontSize: 26 }}>{meta.name}</h1>
      <span className="b" style={{ color: 'var(--y)' }}>{state === 'calling' ? t('calling') : t('noAnswer')}</span>
      <span className="tiny" style={{ opacity: .5 }}>WEXT · {catIcon(meta.cat)}</span>
    </div>
    <div className="callbtns">
      <button className={'cb' + (mute ? ' on' : '')} onClick={() => setMute(!mute)}><Icon n="mic" s={26} /></button>
      <button className="cb end" onClick={nav.back}><Icon n="phone" s={28} /></button>
      <button className={'cb' + (spk ? ' on' : '')} onClick={() => setSpk(!spk)}><Icon n="vol" s={26} /></button>
    </div>
  </div>
}
