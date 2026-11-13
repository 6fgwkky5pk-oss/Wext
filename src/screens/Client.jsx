import React, { useMemo, useState, useEffect } from 'react'
import { api, useStore, priceFor, money, promoActive, getState, CLOUD } from '../store'
import { CATEGORIES, catName, searchCats, catById } from '../data'
import { useT, Icon, Bolt, ProRow, Top, Sheet, Avatar, TypeBadge, catIcon, fmtDate, promoText, RoleSwitch, useNow, toast, Ring } from '../ui'
import { useNav } from '../nav'
import { TEST_MODE } from '../payments'
import Map from '../Map'

const TINT = { plumber: '#E0F0FF', electric: '#FFF3BF', appliance: '#E6FCF5', handyman: '#FFE3E3', painter: '#F3F0FF', tiler: '#FFF0E0', carpenter: '#F4EBDD', locksmith: '#FFF9DB', cleaning: '#E3FAFC', windows: '#E7F5FF', harvest: '#F3E8FF', land: '#EBFBEE', garden: '#E6FCF5', firewood: '#FFF0E0', movers: '#F1F3F5' }
const go = (nav, c) => nav.go(c.kind === 'field' ? 'projects' : 'call', { cat: c.id, create: c.kind === 'field' })

export function Home({ install }) {
  const { t, lang } = useT()
  const nav = useNav()
  const user = useStore(s => s.user)
  const locReal = useStore(s => s.locReal)
  const cfg = useStore(s => s.config)
  const pros = useStore(s => s.pros)
  const blocked = useStore(s => s.blockedIds)
  const [q, setQ] = useState('')
  const res = useMemo(() => searchCats(q, lang), [q, lang])
  const p = priceFor('handyman')
  const active = useStore(s => s.requests.find(r => ['searching', 'accepted', 'arrived'].includes(r.status)))
  const near = useMemo(() => api.nearbyPros(null, 8).filter(x => x.online), [pros, blocked])
  const eta = near.length ? Math.max(5, Math.round(near[0].dist * 3 + 5)) : null
  const featured = useMemo(() => { const seen = new Set(); return near.filter(x => !seen.has(x.cat) && seen.add(x.cat)).slice(0, 8) }, [near])

  const openJobs = useStore(s => s.projects.filter(p => p.date >= new Date().toISOString().slice(0, 10)).length)

  const B = ({ e, label, onClick, big, badge }) => <button className={'gb' + (big ? ' big' : '')} onClick={onClick}>
    <span className="bc"><span className="be">{e}</span>{badge}</span>
    <span className="bl">{label}</span>
  </button>
  const POP = ['plumber', 'electric', 'locksmith', 'appliance', 'cleaning', 'handyman', 'painter', 'movers'].map(catById).filter(Boolean)

  return <div className="scroll" style={{ paddingTop: 0, paddingBottom: 0 }}>
    <div className="ghead">
      <div className="gtop">
        <button className="locpill" onClick={() => api.setLoc && navigator.geolocation && navigator.geolocation.getCurrentPosition(pos => api.setLoc([pos.coords.latitude, pos.coords.longitude], true))}>
          <Icon n="pin" s={18} /><span className="ell">{locReal ? t('myLoc') : t('findLoc')}</span><Icon n="down" s={16} />
        </button>
        <RoleSwitch />
      </div>
      {active && <button className="activebar" onClick={() => nav.go('request', { id: active.id })}>
        <span style={{ fontSize: 22 }}>{catIcon(active.cat)}</span>
        <b className="grow ell">{catName(active.cat, lang)} · {active.status === 'searching' ? t('searching') : t('accepted')}</b><Icon n="right" s={18} />
      </button>}
      <div className="bubs r2">
        <B big e="⚡" label={t('proNow')} onClick={() => nav.go('call')} badge={near.length ? <span className="bbadge"><span className="livedot" />{near.length}</span> : null} />
        <B big e="👷" label={t('peopleNeed')} onClick={() => nav.go('projects')} badge={openJobs ? <span className="bbadge dark">{openJobs}</span> : null} />
      </div>
      <div className="bubs r3">
        <B e="🚗" label={t('ride')} onClick={() => nav.go('rides')} />
        <B e="🍇" label={catName('harvest', lang)} onClick={() => go(nav, catById('harvest'))} />
        <B e="📦" label={catName('movers', lang)} onClick={() => go(nav, catById('movers'))} />
      </div>
      <svg className="gwave" viewBox="0 0 400 40" preserveAspectRatio="none"><path d="M0 22 C 90 2, 170 2, 240 16 S 360 34, 400 10 L400 40 L0 40Z" /></svg>
    </div>

    <div className="gbody">
      <div className="search"><Icon n="search" s={20} /><input placeholder={t('search')} value={q} onChange={e => setQ(e.target.value)} />{q && <button onClick={() => setQ('')}><Icon n="close" s={18} /></button>}</div>
      {q ? <div className="list" style={{ marginTop: 12 }}>
        {res.map(c => <button key={c.id} className="prorow" style={{ width: '100%' }} onClick={() => go(nav, c)}>
          <span className="av" style={{ background: TINT[c.id], fontSize: 24 }}>{c.icon}</span>
          <b className="grow" style={{ textAlign: 'left' }}>{c.n[lang] || c.n.en}</b><Icon n="right" s={18} /></button>)}
        {!res.length && <div className="empty"><div className="e">🔎</div>{t('none')}</div>}
      </div> : <>
        <h2 className="gh2">{t('forYou', { name: (user.name || '').split(' ')[0] })}</h2>
        <div className="poprow">{POP.map(c => <button key={c.id} className="popc" onClick={() => go(nav, c)}>
          <span className="pi" style={{ background: TINT[c.id] }}>{c.icon}</span><span className="pl">{c.n[lang] || c.n.en}</span></button>)}</div>
        <button className="promo" onClick={() => nav.go('call')}>
          <div className="grow"><b>{t('proNow')}</b><div className="pp">{money(p.amount)} {p.old && <s>{money(p.old)}</s>}</div>
            {p.promo && <span className="tiny b mute">🔥 {promoText(t, cfg.promoEnd, lang)}</span>}</div>
          <span className="pe">🧰</span>
        </button>
        <div className="trust">🔒 <span>{t('trustLine')}</span></div>
        {install && <InstallCard onClick={install} />}
      </>}
    </div>
  </div>
}

function InstallCard({ onClick }) {
  const { t } = useT()
  const [hide, setHide] = useState(() => { try { return localStorage.getItem('wext:ib') } catch { return false } })
  if (hide) return null
  return <div className="card row" style={{ background: '#111', color: '#fff' }}>
    <img src="icons/icon-192.png" alt="" style={{ width: 42, height: 42, borderRadius: 12 }} />
    <b className="grow small">{t('install')}</b>
    <button className="btn sm yellow" onClick={onClick}>{t('installBtn')}</button>
    <button onClick={() => { setHide(true); try { localStorage.setItem('wext:ib', 1) } catch {} }} style={{ color: '#888' }}><Icon n="close" s={18} /></button>
  </div>
}

export function CallNow({ cat: initCat }) {
  const { t, lang } = useT()
  const nav = useNav()
  const [cat, setCat] = useState(initCat || null)
  const [q, setQ] = useState('')
  const [note, setNote] = useState('')
  const [pay, setPay] = useState(false)
  const [focus, setFocus] = useState(null)
  const loc = useStore(s => s.loc) || [41.92, 45.47]
  const blocked = useStore(s => s.blockedIds)
  const pros = useMemo(() => cat ? api.nearbyPros(cat, 15).map(p => ({ ...p, icon: catIcon(p.cat) })) : [], [cat, loc, blocked])
  const online = pros.filter(p => p.online)
  const p = cat ? priceFor(cat) : null
  const bundle = cat ? api.activeBundle(cat) : null
  const user = useStore(s => s.user)

  if (!cat) {
    const res = searchCats(q, lang).filter(c => c.kind === 'instant')
    return <div className="scroll nopad">
      <Top title={t('callNow')} onBack={nav.back} />
      <div className="pad col">
        <div className="search"><Icon n="search" s={20} /><input autoFocus placeholder={t('search')} value={q} onChange={e => setQ(e.target.value)} /></div>
        <div className="list" style={{ marginTop: 6 }}>
          {res.map(c => <button key={c.id} className="prorow" style={{ width: '100%' }} onClick={() => setCat(c.id)}>
            <span className="av" style={{ background: '#FFF1C2', fontSize: 24 }}>{c.icon}</span>
            <b className="grow" style={{ textAlign: 'left' }}>{c.n[lang] || c.n.en}</b>
            <span className="mute small b">{api.nearbyPros(c.id, 6).filter(x => x.online).length} ●</span><Icon n="right" s={18} /></button>)}
        </div>
      </div>
    </div>
  }

  const send = async () => {
    if (!bundle && !user.card) { setPay(true); return }
    const id = await api.createRequest({ cat, note })
    nav.replace('request', { id })
  }

  return <>
    <div className="scroll" style={{ paddingBottom: 190 }}>
      <div className="mapwrap">
        <Map center={loc} pros={pros} focus={focus} onPick={x => setFocus(x.id)} />
        <div style={{ position: 'absolute', top: 'calc(14px + var(--safe-t))', left: 16, right: 16, zIndex: 500 }} className="row">
          <button className="iconbtn" onClick={() => initCat ? nav.back() : setCat(null)}><Icon n="back" /></button>
          <div className="card row grow" style={{ padding: '10px 14px', borderRadius: 14 }}><span style={{ fontSize: 20 }}>{catIcon(cat)}</span><b className="ell">{catName(cat, lang)}</b></div>
        </div>
      </div>
      <div className="sheet">
        <div className="grab" />
        <div className="row between"><h3>{t('nearby')} · {online.length}</h3>{p.surge > 1 && <span className="badge r">⚡ {t('highDemand')} ×{p.surge}</span>}</div>
        <div className="list" style={{ marginTop: 12 }}>
          {online.length === 0 && <div className="empty" style={{ padding: 20 }}><div className="e">🕐</div>{t('noPros')}</div>}
          {pros.slice(0, 8).map(x => <ProRow key={x.id} p={x} onClick={() => setFocus(x.id)} />)}
        </div>
        <div className="field" style={{ marginTop: 16 }}><label>{t('note')}</label>
          <textarea className="inp" placeholder={t('notePh')} value={note} onChange={e => setNote(e.target.value)} /></div>
        <div className="hold" style={{ marginTop: 12 }}><span>🔒</span><span>{t('holdNote')}<br /><b>{t('oneFee3')}</b></span></div>
      </div>
    </div>
    <div className="dock">
      <button className="btn primary" style={{ height: 62 }} disabled={!(CLOUD ? pros.length : online.length)} onClick={send}>
        <Icon n="bolt" />{bundle ? <>{t('newRequest')} · {t('contactsLeft', { n: 3 - bundle.contacts })}</> : <>{t('requestFor', { fee: money(p.amount) })}{p.old && <span className="old">{money(p.old)}</span>}</>}
      </button>
    </div>
    {pay && <PaySheet amount={p.amount} onClose={() => setPay(false)} onDone={async () => { setPay(false); const id = await api.createRequest({ cat, note }); nav.replace('request', { id }) }} />}
  </>
}

export function PaySheet({ amount, onClose, onDone }) {
  const { t } = useT()
  const user = useStore(s => s.user)
  const ua = navigator.userAgent
  const isApple = /iPhone|iPad|Mac/.test(ua)
  const [m, setM] = useState(user.card ? 'saved' : isApple ? 'apple' : 'google')
  const [no, setNo] = useState(''), [exp, setExp] = useState(''), [busy, setBusy] = useState(false)
  const ok = m !== 'card' || (no.replace(/\D/g, '').length >= 16 && exp.length >= 4)
  const go = async () => {
    setBusy(true)
    const card = m === 'card' ? { last4: no.replace(/\D/g, '').slice(-4), brand: no.startsWith('4') ? 'VISA' : 'MC', label: '•••• ' + no.replace(/\D/g, '').slice(-4) } : m === 'saved' ? user.card : { brand: m === 'apple' ? '' : 'G', label: m === 'apple' ? 'Apple Pay' : 'Google Pay' }
    api.updateUser({ card })
    await onDone()
  }
  return <Sheet onClose={onClose}>
    <h2>{t('payTitle')}</h2>
    {TEST_MODE && <div className="badge y" style={{ marginTop: 8 }}>🧪 {t('testMode')}</div>}
    <div className="col" style={{ marginTop: 14 }}>
      {user.card && <button className={'paym' + (m === 'saved' ? ' on' : '')} onClick={() => setM('saved')}><span className="lg">{user.card.brand}</span>{t('savedCard')} · {user.card.label}</button>}
      {isApple ? <button className={'paym' + (m === 'apple' ? ' on' : '')} onClick={() => setM('apple')}><span className="lg"></span>Apple Pay</button>
        : <button className={'paym' + (m === 'google' ? ' on' : '')} onClick={() => setM('google')}><span className="lg" style={{ background: '#fff', color: '#111', border: '1.5px solid #ddd' }}>G</span>Google Pay</button>}
      <button className={'paym' + (m === 'card' ? ' on' : '')} onClick={() => setM('card')}><span className="lg" style={{ background: '#FFC21A', color: '#111' }}><Icon n="card" s={18} /></span>{t('addCard')}</button>
      {m === 'card' && <div className="col">
        <input className="inp" inputMode="numeric" placeholder={t('cardNo')} value={no} onChange={e => setNo(e.target.value.replace(/[^\d ]/g, '').slice(0, 19))} />
        <input className="inp" inputMode="numeric" placeholder={t('exp') + ' MM/YY'} value={exp} onChange={e => setExp(e.target.value.slice(0, 5))} />
      </div>}
      <div className="hold"><span>🔒</span><span>{t('holdNote')}</span></div>
      <button className="btn primary" disabled={!ok || busy} onClick={go}>{busy ? '…' : t('payHold', { fee: money(amount) })}</button>
    </div>
  </Sheet>
}

export function RequestTrack({ id }) {
  const { t, lang } = useT()
  const nav = useNav()
  const r = useStore(s => s.requests.find(x => x.id === id))
  const pros = useStore(s => s.pros)
  const pay = useStore(s => s.payments.find(p => p.id === r?.payId))
  const loc = useStore(s => s.loc) || [41.92, 45.47]
  const now = useNow()
  const [rate, setRate] = useState(false), [comp, setComp] = useState(false)
  const pro = r?.proId ? { name: r.proName || '—', rating: 5, jobs: 0, type: 'individual', hue: 30, pos: loc, ...(pros || []).find(p => p.id === r.proId), icon: catIcon(r.cat) } : null
  const mapPros = useMemo(() => pro ? [pro] : [], [r?.proId])

  // simulated GPS arrival of the pro (real build: pro app GPS geofence)
  useEffect(() => {
    if (CLOUD || r?.status !== 'accepted') return
    const tm = setTimeout(() => { api.markArrived(id); }, 45000)
    return () => clearTimeout(tm)
  }, [r?.status])

  if (!r) return null
  const left = r.windowEnds ? (r.windowEnds - now) / 1000 : 75

  if (r.status === 'searching') return <div className="scroll nopad" style={{ background: 'var(--bg)' }}>
    <Top title={catName(r.cat, lang)} onBack={nav.back} />
    <div className="pad">
      <div className="radar"><i /><i /><i /><div className="core"><span style={{ fontSize: 40 }}>{catIcon(r.cat)}</span></div></div>
      <h1 className="center" style={{ fontSize: 24 }}>{t('searching')}</h1>
      <div className="col" style={{ marginTop: 18, gap: 12 }}>
        {r.log.map((l, i) => <div key={i} className="logline"><span className="ok"><Icon n="check" s={14} w={3} /></span>{l.k === 'notify' ? t('notifying', { n: l.n }) : l.k === 'sms' ? t('smsSent', { n: l.n }) : t('radiusUp', { r: l.r })}</div>)}
      </div>
      <div style={{ marginTop: 20 }}><Ring left={left} total={75} size={86} /></div>
      <div className="col" style={{ marginTop: 20 }}>
        {pay && <div className="hold"><span>🔒</span><span>{t('held')}: <b>{money(pay.amount)}</b> · {t('holdNote')}</span></div>}
        <button className="btn outline" onClick={() => { api.cancelRequest(id); nav.back() }}>{t('cancel')}</button>
      </div>
    </div>
  </div>

  if (r.status === 'nopros' || r.status === 'cancelled' || r.status === 'expired') return <div className="scroll nopad">
    <Top title={catName(r.cat, lang)} onBack={nav.back} />
    <div className="empty"><div className="e">{r.status === 'nopros' ? '😔' : '✖️'}</div>{r.status === 'nopros' ? t('noPros') : t('cancel')}
      {pay && <p><span className="badge">{t(pay.status)} · {money(pay.amount)}</span></p>}</div>
    <div className="pad"><button className="btn primary" onClick={() => nav.replace('call', { cat: r.cat })}>{t('tryAgain')}</button></div>
  </div>

  return <>
    <div className="scroll" style={{ paddingBottom: 30 }}>
      <div className="mapwrap" style={{ height: '34vh' }}>
        <Map center={loc} pros={mapPros} focus={pro?.id} />
        <div style={{ position: 'absolute', top: 'calc(14px + var(--safe-t))', left: 16, zIndex: 500 }}><button className="iconbtn" onClick={nav.back}><Icon n="back" /></button></div>
      </div>
      <div className="sheet">
        <div className="grab" />
        <div className="row"><span className="badge g" style={{ fontSize: 13, padding: '6px 10px' }}>✓ {r.status === 'arrived' ? t('arrivedOk') : r.status === 'done' ? t('jobDone') : t('accepted')}</span>
          {r.status === 'accepted' && <span className="small b mute">{t('onTheWay', { m: r.eta })}</span>}</div>
        <div className="row" style={{ marginTop: 16, gap: 14 }}>
          <Avatar p={pro} lg />
          <div className="grow"><h2>{pro.name}</h2>
            <div className="meta"><span className="stars">★ {pro.rating}</span><span>· {pro.jobs} {t('jobs')}</span></div>
            <div className="row" style={{ gap: 5, marginTop: 6, flexWrap: 'wrap' }}><TypeBadge p={pro} /></div></div>
        </div>
        <div className="grid2" style={{ marginTop: 16 }}>
          <button className="btn yellow" onClick={() => nav.go('chat', { threadId: r.threadId, reqId: r.id })}><Icon n="chat" />{t('chat')}</button>
          <button className="btn primary" onClick={() => nav.go('voice', { threadId: r.threadId, reqId: r.id })}><Icon n="phone" />{t('call')}</button>
        </div>
        {pay && <div className="card row between" style={{ marginTop: 14 }}>
          <span className="small b">{t('fee')}</span>
          <span className="row" style={{ gap: 8 }}><b>{money(pay.amount)}</b><span className={'badge ' + (pay.status === 'captured' ? 'g' : pay.status === 'held' ? 'y' : '')}>{t(pay.status)}</span></span>
        </div>}
        <div className="col" style={{ marginTop: 14 }}>
          {(r.status === 'arrived') && <button className="btn primary" onClick={() => setRate(true)}><Icon n="star" />{t('rate')}</button>}
          <button className="btn outline" onClick={() => setComp(true)} style={{ color: 'var(--red)' }}><Icon n="flag" s={18} />{t('complain')}</button>
        </div>
      </div>
    </div>
    {rate && <RateSheet onClose={() => setRate(false)} onDone={n => { api.finish(id, n); setRate(false); toast('⭐ ' + t('rateThanks')) }} />}
    {comp && <ComplainSheet onClose={() => setComp(false)} onDone={reason => { api.complain(id, r.proId, reason); setComp(false); toast('✅ ' + t('complaintSent')) }} />}
  </>
}

function RateSheet({ onClose, onDone }) {
  const { t } = useT(); const [n, setN] = useState(5)
  return <Sheet onClose={onClose}><h2 className="center">{t('rate')}</h2>
    <div className="stars-in" style={{ margin: '18px 0' }}>{[1, 2, 3, 4, 5].map(i => <button key={i} className={i <= n ? 'on' : ''} onClick={() => setN(i)}>⭐</button>)}</div>
    <button className="btn primary" onClick={() => onDone(n)}>{t('done')}</button></Sheet>
}

// one-tap complaint
function ComplainSheet({ onClose, onDone }) {
  const { t } = useT()
  return <Sheet onClose={onClose}><h2>{t('complainWhy')}</h2>
    <div className="col" style={{ marginTop: 14 }}>{t('complaintReasons').map(r => <button key={r} className="btn light" style={{ justifyContent: 'flex-start' }} onClick={() => onDone(r)}>{r}</button>)}</div></Sheet>
}

export function Activity() {
  const { t, lang } = useT()
  const nav = useNav()
  const reqs = useStore(s => s.requests)
  const pays = useStore(s => s.payments)
  const projects = useStore(s => s.projects)
  const rides = useStore(s => s.rides)
  const user = useStore(s => s.user)
  const mine = [
    ...reqs.map(r => ({ ts: r.createdAt, k: 'r', r })),
    ...projects.filter(p => p.ownerId === user.id || p.joins.some(j => j.userId === user.id)).map(p => ({ ts: p.createdAt, k: 'p', p })),
    ...rides.filter(r => r.driverId === user.id || r.bookings.some(b => b.userId === user.id)).map(r => ({ ts: r.createdAt, k: 'd', d: r })),
  ].sort((a, b) => b.ts - a.ts)
  const st = { searching: t('searching'), accepted: t('accepted'), arrived: t('arrivedOk'), done: t('jobDone'), cancelled: t('cancel'), nopros: t('noPros'), expired: '—' }
  return <div className="scroll">
    <Top title={t('activity')} />
    <div className="pad list">
      {!mine.length && <div className="empty"><div className="e">🗂️</div>{t('noActivity')}</div>}
      {mine.map(x => {
        if (x.k === 'r') { const pay = pays.find(p => p.id === x.r.payId)
          return <button key={x.r.id} className="prorow" style={{ width: '100%', textAlign: 'left' }} onClick={() => nav.go('request', { id: x.r.id })}>
            <span className="av" style={{ background: '#FFF1C2', fontSize: 24 }}>{catIcon(x.r.cat)}</span>
            <div className="grow"><b>{catName(x.r.cat, lang)}</b><div className="meta">{fmtDate(x.ts, lang)} · {st[x.r.status]}</div></div>
            {pay && <span className={'badge ' + (pay.status === 'captured' ? 'g' : pay.status === 'held' ? 'y' : '')}>{money(pay.amount)} · {t(pay.status)}</span>}
          </button> }
        if (x.k === 'p') return <button key={x.p.id} className="prorow" style={{ width: '100%', textAlign: 'left' }} onClick={() => nav.go('projects')}>
          <span className="av" style={{ background: '#E8F5E0', fontSize: 24 }}>{catIcon(x.p.cat)}</span>
          <div className="grow"><b className="ell">{x.p.title}</b><div className="meta">{fmtDate(x.p.date, lang)} · {x.p.joins.reduce((a, j) => a + j.count, 0)}/{x.p.people} {t('workers')}</div></div></button>
        return <button key={x.d.id} className="prorow" style={{ width: '100%', textAlign: 'left' }} onClick={() => nav.go('rides')}>
          <span className="av" style={{ background: '#E5F0FF', fontSize: 24 }}>🚗</span>
          <div className="grow"><b className="ell">{x.d.from} → {x.d.to}</b><div className="meta">{fmtDate(x.d.date, lang)} {x.d.time}</div></div></button>
      })}
    </div>
  </div>
}
