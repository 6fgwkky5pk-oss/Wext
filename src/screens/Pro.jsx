import React, { useEffect, useState } from 'react'
import { api, useStore } from '../store'
import { CATEGORIES, catName } from '../data'
import { useT, Icon, Ring, useNow, catIcon, Stepper, RoleSwitch } from '../ui'
import { useNav } from '../nav'

export function ProHome() {
  const { t, lang } = useT()
  const nav = useNav()
  const user = useStore(s => s.user)
  const jobs = useStore(s => s.proJobs)
  const pro = user.pro
  const active = jobs.filter(j => ['accepted', 'arrived'].includes(j.status))
  const todayN = jobs.filter(j => new Date(j.acceptedAt).toDateString() === new Date().toDateString()).length

  if (pro.blocked) return <div className="scroll"><div className="empty" style={{ paddingTop: 120 }}><div className="e">⛔</div><h2>{t('blockedMsg')}</h2><p>{t('noShows')}: {pro.noShows}/3</p></div></div>

  return <div className="scroll">
    <div className="top"><div className="grow"><RoleSwitch /><h1 style={{ fontSize: 24, marginTop: 10 }} className="ell">{user.name}</h1></div>
      <button className="iconbtn" style={{ alignSelf: 'flex-start' }} onClick={() => nav.go('bug')}><Icon n="bug" s={20} /></button></div>
    <div className="pad">
      {!pro.cats.length && <button className="card row" style={{ width: '100%', background: '#FFF1C2', textAlign: 'left' }} onClick={() => nav.go('proSettings')}>
        <span style={{ fontSize: 26 }}>👉</span><b className="grow">{t('myCats')}</b><Icon n="right" /></button>}
      <button className={'toggle ' + (pro.online ? 'on' : 'off')} onClick={() => api.setOnline(!pro.online)}>
        <div><div style={{ fontSize: 46 }}>{pro.online ? '●' : '○'}</div>{pro.online ? t('online') : t('offline')}</div>
      </button>
      <p className="center b mute small" style={{ margin: '6px 0 18px' }}>{pro.online ? t('goOffline') : t('goOnline')}</p>
      {pro.online && !active.length && <p className="center b" style={{ marginTop: -6 }}>⏳ {t('waiting')}</p>}

      {active.map(j => <div key={j.id} className="card" style={{ marginBottom: 12, border: '2px solid var(--ink)' }}>
        <div className="row"><span style={{ fontSize: 28 }}>{catIcon(j.cat)}</span><div className="grow"><b>{catName(j.cat, lang)} · {j.client}</b><div className="meta">{t('away', { d: j.dist })}{j.note ? ' · ' + j.note : ''}</div></div></div>
        <div className="grid2" style={{ marginTop: 12 }}>
          <a className="btn light sm" style={{ width: '100%', textDecoration: 'none' }} href={`https://www.google.com/maps/dir/?api=1&destination=${j.pos[0]},${j.pos[1]}`} target="_blank" rel="noreferrer"><Icon n="nav" s={18} />{t('navigate')}</a>
          <button className="btn yellow sm" style={{ width: '100%' }} onClick={() => nav.go('chat', { threadId: j.threadId })}><Icon n="chat" s={18} />{t('chat')}</button>
        </div>
        {j.status === 'accepted'
          ? <button className="btn green" style={{ marginTop: 10 }} onClick={() => api.proArrived(j.id)}><Icon n="pin" />{t('iArrived')}</button>
          : <button className="btn primary" style={{ marginTop: 10 }} onClick={() => api.proDone(j.id)}><Icon n="check" />{t('jobDone')}</button>}
      </div>)}

      <div className="row" style={{ gap: 10 }}>
        <div className="stat"><b>{todayN}</b><span className="tiny mute b">{t('today')}</span></div>
        <div className="stat"><b>★ {pro.rating}</b><span className="tiny mute b">{t('rating')}</span></div>
        <div className="stat"><b style={{ color: pro.noShows ? 'var(--red)' : undefined }}>{pro.noShows}/3</b><span className="tiny mute b">{t('noShows')}</span></div>
      </div>
      <p className="tiny mute center" style={{ marginTop: 14, lineHeight: 1.5 }}>{t('noShowRule')}</p>
      <div className="grid2" style={{ marginTop: 6 }}>
        <button className="tile" style={{ minHeight: 100 }} onClick={() => nav.go('projects')}><span className="emoji">🍇</span><h3>{t('openProjects')}</h3></button>
        <button className="tile" style={{ minHeight: 100 }} onClick={() => nav.go('rides')}><span className="emoji">🚗</span><h3>{t('ride')}</h3></button>
      </div>
    </div>
  </div>
}

export function Incoming() {
  const { t, lang } = useT()
  const inc = useStore(s => s.incoming)
  const now = useNow(250)
  const left = inc ? (inc.expires - now) / 1000 : 0
  useEffect(() => { if (inc && left <= 0) api.respondIncoming(false) }, [left <= 0])
  if (!inc) return null
  return <div className="incoming">
    <div className="center b" style={{ fontSize: 15, letterSpacing: .5 }}>⚡ {t('incoming')}</div>
    <div className="center" style={{ fontSize: 72, marginTop: 18 }}>{catIcon(inc.cat)}</div>
    <h1 className="center" style={{ fontSize: 30 }}>{catName(inc.cat, lang)}</h1>
    <p className="center b" style={{ fontSize: 18, margin: '8px 0 0' }}>📍 {t('away', { d: inc.dist })} · {inc.client}</p>
    {inc.note && <div className="card center b" style={{ marginTop: 16 }}>“{inc.note}”</div>}
    <div style={{ marginTop: 24 }}><Ring left={left} total={75} /></div>
    <div className="bigbtns">
      <button className="btn red" onClick={() => api.respondIncoming(false)}>{t('decline')}</button>
      <button className="btn primary" style={{ background: 'var(--green)' }} onClick={() => api.respondIncoming(true)}>{t('accept')}</button>
    </div>
  </div>
}

export function ProSettings() {
  const { t, lang } = useT()
  const nav = useNav()
  const pro = useStore(s => s.user.pro)
  const toggle = id => api.updatePro({ cats: pro.cats.includes(id) ? pro.cats.filter(c => c !== id) : [...pro.cats, id] })
  return <div className="scroll nopad">
    <div className="top"><button className="iconbtn" onClick={nav.back}><Icon n="back" /></button><h2>{t('proMode')}</h2></div>
    <div className="pad col">
      <h3>{t('profileType')}</h3>
      <div className="seg">{['individual', 'brigade', 'company'].map(k => <button key={k} className={pro.type === k ? 'on' : ''} onClick={() => api.updatePro({ type: k, members: k === 'individual' ? 1 : Math.max(pro.members, 3) })}>{t(k)}</button>)}</div>
      {pro.type !== 'individual' && <div className="row between card"><b>{t('teamMembers')}</b><Stepper v={pro.members} set={v => api.updatePro({ members: v })} min={2} max={200} /></div>}
      {pro.type === 'company' && <span className="badge g" style={{ alignSelf: 'flex-start' }}>✓ {t('verified')}</span>}
      <h3 style={{ marginTop: 8 }}>{t('myCats')}</h3>
      <div className="row" style={{ flexWrap: 'wrap', gap: 8 }}>
        {CATEGORIES.map(c => <button key={c.id} className={'chip' + (pro.cats.includes(c.id) ? ' on' : '')} onClick={() => toggle(c.id)}>{c.icon} {c.n[lang] || c.n.en}</button>)}
      </div>
      <button className="btn primary" style={{ marginTop: 12 }} onClick={nav.back}>{t('save')}</button>
    </div>
  </div>
}
