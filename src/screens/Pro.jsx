import React, { useEffect, useState } from 'react'
import { api, useStore } from '../store'
import { CATEGORIES, catName, TYPICAL, searchCats, PRICE_Q } from '../data'
import { useT, Icon, Ring, useNow, catIcon, catTint, fmtKm, Stepper, RoleSwitch } from '../ui'
import { useNav } from '../nav'

export function ProHome() {
  const { t, lang } = useT()
  const nav = useNav()
  const user = useStore(s => s.user)
  const jobs = useStore(s => s.proJobs)
  const pro = user.pro
  const active = jobs.filter(j => ['accepted', 'arrived', 'agreed'].includes(j.status) && !j.proDoneAt)
  const todayN = jobs.filter(j => new Date(j.acceptedAt).toDateString() === new Date().toDateString()).length

  if (!pro.registered) return <ProJoin />
  if (pro.blocked) return <div className="scroll"><div className="empty" style={{ paddingTop: 120 }}><div className="e">⛔</div><h2>{t('blockedMsg')}</h2><p>{t('noShows')}: {pro.noShows}/3</p></div></div>

  return <div className="scroll">
    <div className="top"><div className="grow"><RoleSwitch /><h1 style={{ fontSize: 24, marginTop: 10 }} className="ell">{user.name}</h1></div>
      <button className="iconbtn" style={{ alignSelf: 'flex-start' }} onClick={() => nav.go('bug')}><Icon n="bug" s={20} /></button></div>
    <div className="pad">
      {!pro.cats.length && <button className="card row" style={{ width: '100%', background: '#FFF1C2', textAlign: 'left' }} onClick={() => nav.go('proSettings')}>
        <span style={{ fontSize: 26 }}>👉</span><b className="grow">{t('myCats')}</b><Icon n="right" /></button>}
      {pro.cats.length > 0 && <button className="mycats" onClick={() => nav.go('proSettings')}>
        <span className="row" style={{ flexWrap: 'wrap', gap: 6, flex: 1 }}>{pro.cats.map(c => <span key={c} className="mc" style={{ background: catTint(c) }}>{catIcon(c)} {catName(c, lang)}</span>)}</span>
        <b className="small" style={{ whiteSpace: 'nowrap' }}>＋ {t('editCats')}</b>
      </button>}
      {active.map(j => <div key={j.id} className="card" style={{ marginBottom: 12, border: '2px solid var(--ink)' }}>
        <div className="row"><span style={{ fontSize: 28 }}>{catIcon(j.cat)}</span><div className="grow"><b>{catName(j.cat, lang)} · {j.client}</b><div className="meta">{fmtKm(j.dist, t)}{j.note ? ' · ' + j.note : ''}</div></div></div>
        {j.photo && <img src={j.photo} alt="" style={{ width: '100%', maxHeight: 160, objectFit: 'cover', borderRadius: 14, marginTop: 8 }} />}
        {j.voice && <audio src={j.voice} controls style={{ width: '100%', marginTop: 8 }} />}
        <div className="jsteps">{[t('stepOnWay'), t('stepArrived'), t('stepDone')].map((l, i) => { const at = j.status === 'agreed' ? 2 : j.status === 'arrived' ? 2 : j.onWayAt ? 1 : 0; return <span key={i} className={i < at ? 'ok' : i === at ? 'now' : ''}>{i < at ? '✓ ' : ''}{l}</span> })}</div>
        <div className="grid3" style={{ marginTop: 10 }}>
          <button className="btn green sm" onClick={() => nav.go('voice', { threadId: j.threadId, reqId: j.id })}><Icon n="phone" s={18} />{t('call')}</button>
          <a className="btn light sm" style={{ textDecoration: 'none' }} href={`https://www.google.com/maps/dir/?api=1&destination=${j.pos[0]},${j.pos[1]}`} target="_blank" rel="noreferrer"><Icon n="nav" s={18} />{t('navigate')}</a>
          <button className="btn yellow sm" onClick={() => nav.go('chat', { threadId: j.threadId })}><Icon n="chat" s={18} />{t('chat')}</button>
        </div>
        {j.status === 'accepted' && !j.onWayAt && <button className="btn primary" style={{ marginTop: 10 }} onClick={() => api.proOnWay(j.id)}>🚗 {t('stepOnWay')}</button>}
        {j.status === 'accepted' && j.onWayAt && <button className="btn primary" style={{ marginTop: 10 }} onClick={() => api.proArrived(j.id)}><Icon n="pin" s={18} />{t('stepArrived')}</button>}
        {j.status === 'agreed' && <button className="btn primary" style={{ marginTop: 10 }} onClick={() => api.proDone(j.id)}><Icon n="check" />{t('stepDone')}</button>}
        {j.status !== 'agreed' && j.clientDeal === 'yes' && <div className="badge g" style={{ marginTop: 10, display: 'block', textAlign: 'center', padding: 8 }}>🤝 {t('clientAgreed')}</div>}
        {j.status !== 'agreed' && j.proDeal === 'yes' && <p className="center small b mute" style={{ margin: '10px 0 0' }}>{t('waitClientDeal')}</p>}
        {j.status !== 'agreed' && j.proDeal !== 'yes' && <div className="grid2 dealrow" style={{ marginTop: 10 }}>
          <button className="btn outline" style={{ color: 'var(--red)' }} onClick={() => api.proNoDeal(j.id)}>✕ {t('noDeal')}</button>
          <button className="btn green" onClick={() => api.proAgree(j.id)}>🤝 {t('agreed')}</button>
        </div>}
      </div>)}
      <button className={'toggle ' + (pro.online ? 'on' : 'off')} onClick={() => api.setOnline(!pro.online)}>
        <div><div style={{ fontSize: 46 }}>{pro.online ? '●' : '○'}</div>{pro.online ? t('online') : t('offline')}</div>
      </button>
      <p className="center b mute small" style={{ margin: '6px 0 18px' }}>{pro.online ? t('goOffline') : t('goOnline')}</p>
      {pro.online && !active.length && <p className="center b" style={{ marginTop: -6 }}>⏳ {t('waiting')}</p>}
      {!pro.online && <p className="center small b mute" style={{ marginTop: -6 }}>💬 {t('offlineSms')}</p>}


      <p className="tiny mute center" style={{ marginTop: 14, lineHeight: 1.5 }}>{t('noShowRule')}</p>
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
  if (!inc.opened) return <button className="smsbar" onClick={() => api.openSms()}>
    <span className="smsic">💬</span>
    <span className="grow" style={{ textAlign: 'left' }}><b>SMS · WEXT</b><br />{t('smsJob', { cat: catName(inc.cat, lang), d: inc.dist ?? '?' })}</span>
    <span className="btn sm yellow">{t('open')}</span>
  </button>
  return <div className="incoming">
    <div className="center b" style={{ fontSize: 15, letterSpacing: .5 }}>⚡ {t('incoming')}</div>
    {inc.viaSms && <div className="center small b" style={{ marginTop: 6 }}>🔴 → 🟢 {t('acceptGoesOnline')}</div>}
    <div className="center" style={{ fontSize: 72, marginTop: 18 }}>{catIcon(inc.cat)}</div>
    <h1 className="center" style={{ fontSize: 30 }}>{catName(inc.cat, lang)}</h1>
    <p className="center b" style={{ fontSize: 18, margin: '8px 0 0' }}>📍 {fmtKm(inc.dist, t)} · {inc.client}</p>
    {inc.note && <div className="card center b" style={{ marginTop: 16 }}>“{inc.note}”</div>}
    {(inc.photo || inc.voice) && <div className="col" style={{ marginTop: 12, gap: 8 }}>
      {inc.photo && <img src={inc.photo} alt="" style={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 16 }} />}
      {inc.voice && <audio src={inc.voice} controls style={{ width: '100%' }} />}
    </div>}
    <div style={{ marginTop: 24 }}><Ring left={left} total={75} /></div>
    <div className="bigbtns">
      <button className="btn red" onClick={() => api.respondIncoming(false)}>✕ {t('decline')}</button>
      <button className="btn primary" style={{ background: 'var(--green)' }} onClick={() => api.respondIncoming(true)}>✓ {t('acceptIt')}</button>
    </div>
  </div>
}

export function ProSettings() {
  const { t, lang } = useT()
  const nav = useNav()
  const pro = useStore(s => s.user.pro)
  const [sq, setSq] = useState('')
  const toggle = id => api.updatePro({ cats: pro.cats.includes(id) ? pro.cats.filter(c => c !== id) : [...pro.cats, id] })
  return <div className="scroll nopad">
    <div className="top"><button className="iconbtn" onClick={nav.back}><Icon n="back" /></button><h2>{t('myServices')}</h2></div>
    <div className="pad col">
      <h3>{t('profileType')}</h3>
      <div className="seg">{['individual', 'brigade', 'company'].map(k => <button key={k} className={pro.type === k ? 'on' : ''} onClick={() => api.updatePro({ type: k, members: k === 'individual' ? 1 : Math.max(pro.members, 3) })}>{t(k)}</button>)}</div>
      {pro.type !== 'individual' && <div className="row between card"><b>{t('teamMembers')}</b><Stepper v={pro.members} set={v => api.updatePro({ members: v })} min={2} max={200} /></div>}
      {pro.type === 'company' && <span className="badge g" style={{ alignSelf: 'flex-start' }}>✓ {t('verified')}</span>}
      {pro.cats.length > 0 && <>
        <h3 style={{ marginTop: 8 }}>🏷️ {t('myPrice')}</h3>
        <p className="tiny mute b" style={{ margin: 0 }}>{t('myPriceNote')}</p>
        <PriceQs cats={pro.cats} prices={pro.prices || {}} onChange={prices => api.updatePro({ prices })} />
      </>}
      <h3 style={{ marginTop: 8 }}>{t('myCats')}</h3>
      <div className="row" style={{ flexWrap: 'wrap', gap: 8 }}>
        <div className="search" style={{ width: '100%' }}><Icon n="search" s={20} /><input placeholder={t('findService')} value={sq} onChange={e => setSq(e.target.value)} /></div>
        {(sq ? searchCats(sq, lang) : CATEGORIES).map(c => <button key={c.id} className={'chip' + (pro.cats.includes(c.id) ? ' on' : '')} onClick={() => toggle(c.id)}>{catIcon(c.id)} {c.n[lang] || c.n.en}</button>)}
      </div>
      <button className="btn primary" style={{ marginTop: 12 }} onClick={nav.back}>{t('save')}</button>
    </div>
  </div>
}

// Optional price questions per service (one number each, skippable)
function PriceQs({ cats, prices, onChange }) {
  const { lang } = useT()
  return <div className="col" style={{ gap: 10 }}>{cats.map(c => { const qs = PRICE_Q[c] || [], v = prices[c] || [], d = TYPICAL[c]
    const put = (i, x) => { const cur = [...v]; cur[i] = x === '' ? '' : +x; onChange({ ...prices, [c]: cur }) }
    return <div key={c} className="card" style={{ padding: 12 }}>
      <b>{catIcon(c)} {catName(c, lang)}</b>
      {qs.map((q, i) => <div key={i} className="row" style={{ gap: 8, marginTop: 8 }}>
        <span className="grow small b">{q[lang] || q.en}</span>
        <input className="inp" style={{ width: 84, height: 42 }} type="number" inputMode="numeric" placeholder={i === 0 && d ? d[0] + '–' + d[1] : ''} value={v[i] ?? ''} onChange={e => put(i, e.target.value)} />
        <span className="small b">₾</span></div>)}
    </div> })}</div>
}

// First time in "I work" mode: what do you do → solo/crew/company → how it works
export function ProJoin() {
  const { t, lang } = useT()
  const pro = useStore(s => s.user.pro)
  const [step, setStep] = useState(0), [jq, setJq] = useState('')
  const [prices, setPrices] = useState(pro.prices || {})
  const [cats, setCats] = useState(pro.cats)
  const [type, setType] = useState(pro.type)
  const [n, setN] = useState(Math.max(pro.members, 3))
  const tog = id => setCats(cats.includes(id) ? cats.filter(c => c !== id) : [...cats, id])
  const finish = () => { api.updatePro({ cats, type, members: type === 'individual' ? 1 : n, prices, registered: true, stopped: false }); setTimeout(() => api.setOnline(true), 300) }
  return <div className="scroll">
    <div className="fhead"><span className="wlogo"><img src="icons/icon-192.png" alt="" />WEXT</span><RoleSwitch /></div>
    <div className="pad col" style={{ gap: 12 }}>
      <div className="steps">{[0, 1, 2, 3].map(i => <i key={i} className={i <= step ? 'on' : ''} />)}</div>
      {step === 0 && pro.stopped && pro.cats?.length > 0 && <div className="card" style={{ background: '#E9F8EF' }}>
        <b>{t('restartTitle')}</b>
        <div className="row" style={{ flexWrap: 'wrap', gap: 6, marginTop: 8 }}>{pro.cats.map(c => <span key={c} className="mc" style={{ background: catTint(c) }}>{catIcon(c)} {catName(c, lang)}</span>)}</div>
        <button className="btn green" style={{ marginTop: 10 }} onClick={() => api.restartWork()}>▶ {t('restartBtn')}</button>
      </div>}
      {step === 0 && <>
        <h1 style={{ marginTop: 8 }}>{t('joinTitle')}</h1>
        <p className="mute b small" style={{ margin: 0 }}>{t('joinSub')}</p>
        <div className="search"><Icon n="search" s={20} /><input placeholder={t('findService')} value={jq} onChange={e => setJq(e.target.value)} /></div>
        <div className="jgrid">{(jq ? searchCats(jq, lang) : CATEGORIES).map(c => <button key={c.id} className={'jt' + (cats.includes(c.id) ? ' on' : '')} onClick={() => tog(c.id)}><i style={{ background: catTint(c.id) }}>{catIcon(c.id)}</i>{c.n[lang] || c.n.en}</button>)}</div>
        <button className="btn primary" style={{ marginTop: 8 }} disabled={!cats.length} onClick={() => setStep(1)}>{t('next')} <Icon n="right" /></button>
      </>}
      {step === 1 && <>
        <h1 style={{ marginTop: 8 }}>🏷️ {t('priceStepTitle')}</h1>
        <p className="mute b small" style={{ margin: 0 }}>{t('priceStepSub')}</p>
        <PriceQs cats={cats} prices={prices} onChange={setPrices} />
        <div className="grid2" style={{ gridTemplateColumns: '1fr 2fr' }}><button className="btn outline" onClick={() => setStep(0)}>{t('back')}</button><button className="btn primary" onClick={() => setStep(2)}>{Object.values(prices).some(x => x.some(Boolean)) ? t('next') : t('skip')} <Icon n="right" /></button></div>
      </>}
      {step === 2 && <>
        <h1 style={{ marginTop: 8 }}>{t('howWork')}</h1>
        {[['individual', '🙋', t('alone'), t('aloneSub')], ['brigade', '👷', t('brigade'), t('crewSub')], ['company', '🏢', t('company'), t('companySub')]].map(([k, e, l, sub]) =>
          <button key={k} className={'rolecard' + (type === k ? ' on' : '')} onClick={() => setType(k)}><span className="e">{e}</span><div><b style={{ fontSize: 18 }}>{l}</b><div className="small mute b">{sub}</div></div></button>)}
        {type !== 'individual' && <div className="card row between"><b>{t('howMany')}</b><Stepper v={n} set={setN} min={2} max={200} /></div>}
        <div className="grid2" style={{ gridTemplateColumns: '1fr 2fr' }}><button className="btn outline" onClick={() => setStep(1)}>{t('back')}</button><button className="btn primary" onClick={() => setStep(3)}>{t('next')}</button></div>
      </>}
      {step === 3 && <>
        <h1 style={{ marginTop: 8 }}>{t('readyTitle')}</h1>
        <div className="row" style={{ flexWrap: 'wrap', gap: 6 }}>{cats.map(c => <span key={c} className="badge y" style={{ fontSize: 13, padding: '6px 10px' }}>{catIcon(c)} {catName(c, lang)}</span>)}</div>
        <div className="card col" style={{ gap: 16 }}>
          <div className="okline"><b>🟢</b>{t('ready1')}</div>
          <div className="okline"><b>🔔</b>{t('ready2')}</div>
          <div className="okline"><b>🔒</b>{t('ready3')}</div>
        </div>
        <p className="tiny mute" style={{ margin: 0, lineHeight: 1.5 }}>⚠️ {t('noShowRule')}</p>
        <button className="btn green" style={{ height: 64, fontSize: 19 }} onClick={finish}>{t('startWork')} <Icon n="right" /></button>
      </>}
    </div>
  </div>
}
