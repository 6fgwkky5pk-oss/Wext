import React, { useState, useEffect } from 'react'
import { api, CLOUD, useStore, money, promoActive, getState, groupOrder } from '../store'
import { LANGS } from '../i18n'
import { catName, CATEGORIES, GROUPS, groupName, TYPICAL, SLANG } from '../data'
import { useT, Icon, Top, Sheet, toast, Avatar, fmtDate } from '../ui'
import { useNav } from '../nav'
import * as cloud from '../cloud'

export function Profile({ install }) {
  const big = useStore(s => s.big)
  const { t, lang } = useT()
  const nav = useNav()
  const user = useStore(s => s.user)
  const [langSheet, setLangSheet] = useState(false)
  const [stopAsk, setStopAsk] = useState(false), [extra, setExtra] = useState(false)
  const activeJobs = useStore(s => (s.proJobs || []).filter(j => ['accepted', 'arrived', 'agreed'].includes(j.status)).length)
  const [taps, setTaps] = useState(0)
  // admin = server-side list /admins/{uid}, enforced by firestore.rules. No PIN in the client.
  // Offline demo (no Firebase config): admin opens only in a local dev build (npm run dev).
  const openAdmin = () => {
    if (user.admin) return nav.go('admin')
    if (!CLOUD) { if (import.meta.env.DEV) { api.setAdmin(true); nav.go('admin') } return }
    cloud.isAdmin().then(ok => { if (ok) { api.setAdmin(true); nav.go('admin') } })
  }
  const Row = ({ ic, label, right, onClick, danger }) => <button className="listrow" onClick={onClick} style={danger ? { color: 'var(--red)' } : null}><span className="ico">{ic}</span><span className="grow">{label}</span>{right}<Icon n="right" s={18} /></button>
  const isPro = user.role === 'pro'
  return <div className="scroll">
    <Top title={t('profile')} />
    <div className="pad">
      <div className="card row" style={{ gap: 14 }}>
        <Avatar p={{ name: user.name, hue: 38, type: 'individual' }} lg />
        <div className="grow"><h2 className="ell">{user.name}</h2><div className="small mute b">{user.phone}</div>
          <span className="badge y" style={{ marginTop: 6 }}>{isPro ? '🧰 ' + t('proMode') : '🙋 ' + t('clientMode')}</span></div>
      </div>
      <div className="card" style={{ marginTop: 12, padding: '4px 14px' }}>
        <Row ic={<Icon n="act" s={20} />} label={t('activity') + ' · ' + t('payHist')} onClick={() => nav.go('activity')} />
        <Row ic={<span style={{ fontSize: 18, fontWeight: 900 }}>Aa</span>} label={t('bigText')} right={<span className={'tgl' + (big ? ' on' : '')}><i /></span>} onClick={() => api.setBig(!big)} />
        <Row ic={<Icon n="globe" s={20} />} label={t('language')} right={<span className="mute small b">{LANGS.find(l => l.code === lang).label}</span>} onClick={() => setLangSheet(true)} />
        <Row ic={<Icon n="swap" s={20} />} label={isPro ? '🙋 ' + t('roleClient') : '💼 ' + t('rolePro')} onClick={() => { api.updateUser({ role: isPro ? 'client' : 'pro' }); nav.home() }} />
        {user.pro?.registered && <Row ic="⏹" label={t('stopWork')} onClick={() => setStopAsk(true)} />}
        {user.pro?.registered && <Row ic="🧰" label={t('myServices')} onClick={() => nav.go('proSettings')} />}
        <Row ic="➕" label={t('extra')} onClick={() => setExtra(true)} />
        {user.card && <Row ic={<Icon n="card" s={20} />} label={`${t('savedCard')} · ${user.card.label}`} onClick={() => { api.updateUser({ card: null }); toast('✓') }} />}
        {install && <Row ic={<Icon n="dl" s={20} />} label={t('install')} onClick={install} />}
        <Row ic={<Icon n="bug" s={20} />} label={t('reportBug')} onClick={() => nav.go('bug')} />
        {user.admin && <Row ic={<Icon n="shield" s={20} />} label={t('admin')} onClick={() => nav.go('admin')} />}
        <Row ic={<Icon n="logout" s={20} />} label={t('logout')} danger onClick={() => api.logout()} />
      </div>
      <p className="tiny mute center" style={{ marginTop: 18 }} onClick={() => { const n = taps + 1; setTaps(n); if (n >= 5) { setTaps(0); openAdmin() } }}>WEXT 0.1 · {t('tagline')}</p>
    </div>
    {extra && <Sheet onClose={() => setExtra(false)}><h2>{t('extra')}</h2>
      <div className="col" style={{ marginTop: 10 }}>
        {user.pro?.registered && <button className="listrow" onClick={() => { setExtra(false); nav.go('proSettings') }}><span className="ico">👷</span><span className="grow">{t('brigade')} / {t('company')}</span><Icon n="right" s={18} /></button>}
        <button className="listrow" onClick={() => { setExtra(false); nav.go('rides') }}><span className="ico">🚗</span><span className="grow">{t('ride')}</span><Icon n="right" s={18} /></button>
      </div></Sheet>}
    {stopAsk && <Sheet onClose={() => setStopAsk(false)}><h2>{t('stopWorkQ')}</h2>
      {activeJobs > 0 ? <p className="b" style={{ color: 'var(--red)' }}>{t('stopWorkBusy')}</p> : <p className="mute b">{t('stopWorkNote')}</p>}
      <div className="grid2" style={{ marginTop: 12 }}><button className="btn outline" onClick={() => setStopAsk(false)}>{t('cancel')}</button>
        <button className="btn primary" disabled={activeJobs > 0} onClick={() => { api.stopWork(); setStopAsk(false); nav.home(); toast('✓ ' + t('stopWorkDone')) }}>{t('stopWorkBtn')}</button></div></Sheet>}
    {langSheet && <LangSheet lang={lang} t={t} onClose={() => setLangSheet(false)} />}
  </div>
}

const EN_NAMES = { ka: 'Georgian', en: 'English', ru: 'Russian', de: 'German', tr: 'Turkish', uk: 'Ukrainian', hy: 'Armenian', az: 'Azerbaijani', es: 'Spanish', fr: 'French', ar: 'Arabic', zh: 'Chinese' }
export function LangSheet({ lang, t, onClose }) {
  const [q, setQ] = useState('')
  const list = LANGS.filter(l => !q || (l.label + ' ' + l.code + ' ' + (EN_NAMES[l.code] || '')).toLowerCase().includes(q.toLowerCase()))
  return <Sheet onClose={onClose}><h2>{t('language')}</h2>
    <div className="search" style={{ marginTop: 12 }}><Icon n="search" s={20} /><input placeholder="🔍" value={q} onChange={e => setQ(e.target.value)} /></div>
    <div className="col" style={{ marginTop: 12, maxHeight: '55vh', overflowY: 'auto' }}>
      {list.map(l => <button key={l.code} className={'paym' + (l.code === lang ? ' on' : '')} onClick={() => { api.setLang(l.code); onClose() }}>{l.label}{l.code === lang && ' ✓'}</button>)}</div></Sheet>
}

export function BugReport({ from }) {
  const { t } = useT()
  const nav = useNav()
  const [txt, setTxt] = useState('')
  return <div className="scroll nopad">
    <Top title={t('reportBug')} onBack={nav.back} />
    <div className="pad col">
      <div style={{ fontSize: 56, textAlign: 'center' }}>🐞</div>
      <textarea className="inp" style={{ height: 160 }} autoFocus placeholder={t('bugPh')} value={txt} onChange={e => setTxt(e.target.value)} />
      <button className="btn primary" disabled={txt.trim().length < 3} onClick={() => { api.reportBug(txt.trim(), from); toast('🙏 ' + t('thanks')); nav.back() }}>{t('sendReport')}</button>
    </div>
  </div>
}

export function Admin() {
  const { t, lang } = useT()
  const nav = useNav()
  const cfg = useStore(s => s.config)
  const complaints = useStore(s => s.complaints)
  const bugs = useStore(s => s.bugs)
  const pros = useStore(s => s.pros) || []
  const blocked = useStore(s => s.blockedIds)
  const [tab, setTab] = useState('stats')
  const [misses, setMisses] = useState({})
  useEffect(() => CLOUD && tab === 'words' ? cloud.listenMisses(setMisses) : undefined, [tab])
  const adminUsers = useStore(s => s.adminUsers) || []
  const isB = id => CLOUD && adminUsers.length ? !!adminUsers.find(u => u.id === id)?.pro?.blocked : blocked.includes(id)
  const adminReqsCloud = useStore(s => s.adminReqs), myReqs = useStore(s => s.requests)
  const adminReqs = adminReqsCloud || myReqs
  const live = adminUsers.filter(u => !u.movedTo)
  const proUsers = adminUsers.length ? live.filter(u => u.pro?.registered) : pros
  const clientUsers = live.filter(u => !u.pro?.registered)
  const nd = f => adminReqs.filter(r => r.status === 'nodeal' && f(r)).length
  const contacted = adminReqs.filter(r => r.contacted || ['arrived', 'done'].includes(r.status))
  const Stat = ({ n, l, e }) => <div className="card center" style={{ padding: 14 }}><div style={{ fontSize: 22 }}>{e}</div><div style={{ fontSize: 28, fontWeight: 900 }}>{n}</div><div className="tiny mute b">{l}</div></div>
  const [f, setF] = useState(cfg)
  const byUser = complaints.reduce((a, c) => (a[c.byId] = (a[c.byId] || 0) + 1, a), {})
  const N = (k, step = 0.5) => <input className="inp" type="number" step={step} inputMode="decimal" value={f[k]} onChange={e => setF({ ...f, [k]: +e.target.value })} />
  return <div className="scroll nopad">
    <Top title={t('admin')} onBack={nav.back} />
    <div className="pad col">
      <div className="seg" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr' }}>{[['stats', t('stats')], ['users', t('users')], ['complaints', t('complaints')], ['prices', t('prices')], ['words', t('words')], ['bugs', t('bugs')], ['orders', t('orders')], ['testers', t('testers')]].map(([k, l]) => <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)} style={{ fontSize: 12 }}>{l}</button>)}</div>

      {tab === 'stats' && <div className="grid2">
        <Stat e="👥" n={adminUsers.length || '—'} l={t('statUsers')} />
        <Stat e="🟢" n={proUsers.filter(p => p.online || p.pro?.online).length} l={t('statOnline')} />
        <Stat e="⚡" n={adminReqs.length} l={t('statReqs')} />
        <Stat e="💰" n={money(contacted.length * (promoActive(cfg) ? cfg.promoFee : cfg.baseFee))} l={t('statRevenue')} />
        <Stat e="🧰" n={proUsers.length} l={t('pros')} />
        <Stat e="⚑" n={complaints.length} l={t('complaints')} />
      </div>}
      {tab === 'stats' && <DemandList />}

      {tab === 'prices' && <div className="card col">
        <div className="grid2"><div className="field"><label>{t('baseFee')}</label>{N('baseFee')}</div><div className="field"><label>{t('promoFee')}</label>{N('promoFee')}</div></div>
        <div className="field"><label>{t('promoEnd')} {promoActive(f) ? '🟢' : '⚪'}</label><input className="inp" type="date" value={f.promoEnd} onChange={e => setF({ ...f, promoEnd: e.target.value })} /></div>
        <div className="grid2"><div className="field"><label>{t('surgeCap')}</label>{N('surgeCap', 0.1)}</div><div className="field"><label>{t('surgeNow')}</label>
          <button className={'btn sm ' + (f.surgeMode === 'on' ? 'red' : f.surgeMode === 'auto' ? 'yellow' : 'outline')} style={{ width: '100%', height: 54 }} onClick={() => setF({ ...f, surgeManual: false, surgeMode: f.surgeMode === 'off' || !f.surgeMode ? 'auto' : f.surgeMode === 'auto' ? 'on' : 'off' })}>{(f.surgeMode || 'off').toUpperCase()}</button></div></div>
        <div className="grid2"><div className="field"><label>👷 {t('brigadeN')}</label>{N('brigadeFee')}</div><div className="field"><label>{t('rideFee')}</label>{N('rideFee')}</div></div>
        <h3 style={{ marginTop: 8 }}>🏷️ {t('typical')}</h3>
        <p className="tiny mute b" style={{ margin: 0 }}>{t('typicalAdmin')}</p>
        {CATEGORIES.map(c => { const d = TYPICAL[c.id] || ['', ''], o = (f.typical || {})[c.id] || []
          const put = (i, v) => { const cur = [...((f.typical || {})[c.id] || ['', ''])]; cur[i] = v === '' ? '' : +v; setF({ ...f, typical: { ...(f.typical || {}), [c.id]: cur } }) }
          return <div key={c.id} className="row" style={{ gap: 6 }}><span className="grow small b ell">{catName(c.id, lang)}</span>
            <input className="inp" style={{ width: 70, height: 40 }} type="number" inputMode="numeric" placeholder={String(d[0])} value={o[0] ?? ''} onChange={e => put(0, e.target.value)} />
            <span>–</span>
            <input className="inp" style={{ width: 70, height: 40 }} type="number" inputMode="numeric" placeholder={String(d[1])} value={o[1] ?? ''} onChange={e => put(1, e.target.value)} /></div> })}
        <button className="btn primary" onClick={() => { api.setConfig(f); toast('✅ ' + t('saved')) }}>{t('save')}</button>
      </div>}

      {tab === 'complaints' && <div className="list">
        {!complaints.length && <div className="empty">{t('none')}</div>}
        {complaints.map(c => { const p = pros.find(x => x.id === c.proId)
          return <div key={c.id} className="card">
            <div className="row between"><b>{c.reason}</b><span className="tiny mute">{fmtDate(c.ts, lang)}</span></div>
            <div className="small" style={{ marginTop: 6 }}>{t('client')}: <b>{c.byName}</b> {byUser[c.byId] >= 3 && <span className="badge r">⚑ {t('flagged')} ({byUser[c.byId]})</span>}</div>
            {p && <div className="row between" style={{ marginTop: 8 }}><span className="small">{p.name} · {catName(p.cat, lang)}</span>
              <button className={'btn sm ' + (isB(p.id) ? 'outline' : 'red')} onClick={() => api.toggleBlock(p.id)}>{isB(p.id) ? t('unblock') : t('block')}</button></div>}
          </div> })}
      </div>}

      {tab === 'orders' && <div className="list">
        {!adminReqs.length && <div className="empty">{t('none')}</div>}
        {[...adminReqs].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)).slice(0, 60).map(r => <div key={r.id} className="card">
          <div className="row between"><b>{catName(r.cat, lang)} · {r.clientName || '—'}</b><span className="tiny mute">{fmtDate(r.createdAt, lang)}</span></div>
          <div className="small" style={{ marginTop: 4 }}>{r.status}{r.proName ? ' · ' + r.proName : ''}{r.adminPay ? ' · ' + (r.adminPay === 'refund' ? '↩️ ' + t('refundBtn') : '💳 ' + t('chargeBtn')) : ''}</div>
          {r.adminPay ? <div className="tiny mute b" style={{ marginTop: 4 }}>{t('payWhy')}: {r.adminPayWhy || '—'}</div> : <AdminPay id={r.id} />}
        </div>)}
      </div>}

      {tab === 'testers' && <TestersAdmin cfg={cfg} />}

      {tab === 'users' && <div className="list">
        <h3>{t('pros')} · {proUsers.length}</h3>
        {proUsers.map(p => <div key={p.id} className="prorow"><Avatar p={p} /><div className="grow"><b className="ell" style={{ display: 'block' }}>{p.name}</b><span className="tiny mute b">{(p.cats?.length ? p.cats : [p.cat || p.pro?.cats?.[0]]).filter(Boolean).map(c => catName(c, lang)).join(', ') || (p.pro?.cats || []).map(c => catName(c, lang)).join(', ')} · ★{p.rating || '—'} · {p.online ? '🟢' : '⚪'}{p.noShows ? ' · ⚠️' + p.noShows : ''}{complaints.filter(c => c.proId === p.id).length ? ' · ⚑' + complaints.filter(c => c.proId === p.id).length : ''}{nd(r => r.proId === p.id) ? ' · ✕' + nd(r => r.proId === p.id) : ''}</span></div>
          <button className="btn sm outline" onClick={() => api.clearUser(p.id)}>{t('clearUser')}</button>
          <button className={'btn sm ' + (isB(p.id) ? 'outline' : 'light')} onClick={() => api.toggleBlock(p.id)}>{isB(p.id) ? t('unblock') : t('block')}</button></div>)}
        {clientUsers.length > 0 && <h3 style={{ marginTop: 14 }}>{t('clients')} · {clientUsers.length}</h3>}
        {clientUsers.map(u => <div key={u.id} className="prorow"><Avatar p={{ name: u.name || '?', hue: 38, type: 'individual' }} /><div className="grow"><b className="ell" style={{ display: 'block' }}>{u.name || '—'}</b>{nd(r => r.clientId === u.id) > 0 && <span className={'tiny b ' + (nd(r => r.clientId === u.id) >= 3 ? 'badge r' : 'mute')}>✕ {t('noDeal')}: {nd(r => r.clientId === u.id)}</span>}</div>
          <button className="btn sm outline" onClick={() => api.clearUser(u.id)}>{t('clearUser')}</button>
          <button className={'btn sm ' + (isB(u.id) ? 'outline' : 'light')} onClick={() => api.toggleBlock(u.id)}>{isB(u.id) ? t('unblock') : t('block')}</button></div>)}
      </div>}

      {tab === 'words' && <div className="card col">
        <h3>🔍 {t('missTitle')}</h3>
        <p className="tiny mute b" style={{ margin: 0 }}>{t('missNote')}</p>
        {!Object.keys(misses).length && <div className="small mute">{t('none')}</div>}
        {Object.entries(misses).sort((a, b) => b[1] - a[1]).slice(0, 40).map(([term, n]) => <div key={term} className="row" style={{ gap: 6 }}>
          <b className="grow ell">„{term}“ <span className="mute small">×{n}</span></b>
          <select className="inp" style={{ width: 150, height: 40 }} value="" onChange={e => { const id = e.target.value; if (!id) return; const syn = { ...(f.syn || {}), [id]: (((f.syn || {})[id] || '') + ' ' + term).trim() }; setF({ ...f, syn }); api.setConfig({ syn }); cloud.clearMiss(term); toast('✓ ' + term + ' → ' + catName(id, lang)) }}>
            <option value="">{t('linkTo')}</option>{CATEGORIES.map(c => <option key={c.id} value={c.id}>{catName(c.id, lang)}</option>)}</select>
          <button className="btn sm outline" onClick={() => cloud.clearMiss(term)}>✕</button></div>)}
        <h3 style={{ marginTop: 10 }}>📚 {t('words')}</h3>
        <p className="tiny mute b" style={{ margin: 0 }}>{t('wordsAdmin')}</p>
        {CATEGORIES.map(c => <div key={c.id} className="field"><label>{catName(c.id, lang)}</label>
          <input className="inp" style={{ height: 42 }} placeholder={(SLANG[c.id] || '').split(' ').slice(0, 3).join(', ') + '…'} value={(f.syn || {})[c.id] || ''} onChange={e => setF({ ...f, syn: { ...(f.syn || {}), [c.id]: e.target.value } })} /></div>)}
        <button className="btn primary" onClick={() => { api.setConfig({ syn: f.syn || {} }); toast('✅ ' + t('saved')) }}>{t('save')}</button>
      </div>}
      {tab === 'bugs' && <div className="list">
        {!bugs.length && <div className="empty">{t('none')}</div>}
        {bugs.map(b => <div key={b.id} className="card"><div className="row between"><b>{b.by}</b><span className="tiny mute">{fmtDate(b.ts, lang)}</span></div><p style={{ margin: '6px 0 0' }}>{b.text}</p><div className="tiny mute">{b.screen}</div></div>)}
      </div>}
    </div>
  </div>
}

function DemandList() {
  const { lang } = useT()
  const st = useStore(s => s.catStats) || {}
  return <div className="card col" style={{ gap: 6, marginTop: 12 }}>
    <b>📊 მოთხოვნა</b>
    {groupOrder(st).map((g, i) => { const G = GROUPS.find(x => x.id === g); const cats = CATEGORIES.filter(c => c.g === g).sort((a, b) => (st[b.id] || 0) - (st[a.id] || 0))
      return <div key={g} className="col" style={{ gap: 2, padding: '6px 0', borderTop: i ? '1px solid #eee' : 0 }}>
        <div className="row"><b className="grow">{i + 1}. {groupName(g, lang)}</b><b>{st['g_' + g] || 0}</b></div>
        {cats.filter(c => st[c.id]).map(c => <div key={c.id} className="row tiny mute"><span className="grow">{catName(c.id, lang)}</span><span>{st[c.id]}</span></div>)}
      </div> })}
    <span className="tiny mute">შეკვეთა = 3 ქულა, გახსნა = 1</span>
  </div>
}

function AdminPay({ id }) {
  const { t } = useT()
  const [why, setWhy] = useState(''), [done, setDone] = useState(false)
  const go = how => { if (done) return; if (!why.trim()) { toast(t('payWhyNeed')); return } if (api.adminPay(id, how, why)) setDone(true) }
  if (done) return <div className="tiny mute b" style={{ marginTop: 4 }}>✓ {why}</div>
  return <>
    <input className="inp" style={{ height: 40, marginTop: 8 }} maxLength={200} placeholder={t('payWhy')} value={why} onChange={e => setWhy(e.target.value)} />
    <div className="grid2" style={{ marginTop: 8 }}>
      <button className="btn sm light" disabled={!why.trim()} onClick={() => go('refund')}>↩️ {t('refundBtn')}</button>
      <button className="btn sm outline" disabled={!why.trim()} onClick={() => go('capture')}>💳 {t('chargeBtn')}</button>
    </div></>
}

function TestersAdmin({ cfg }) {
  const { t } = useT()
  const [ph, setPh] = useState('')
  const on = !!cfg.testersOnly
  const [works, setWorks] = useState(undefined) // true = check works, false = rule not live (on => nobody can sign in)
  useEffect(() => { if (CLOUD) cloud.testerAllowed('000000000').then(x => setWorks(x !== null)) }, [])
  const act = async add => { const ok = await api.setTester(ph, add); toast(ok ? '✓ ' + (add ? t('testerAdded') : t('testerRemoved')) : t('testerBad')); if (ok) setPh('') }
  return <div className="card col">
    <h3>🧪 {t('testers')}</h3>
    <p className="tiny mute b" style={{ margin: 0 }}>{t('testersNote')}</p>
    <button className={'btn ' + (on ? 'green' : 'outline')} onClick={() => api.setConfig({ testersOnly: !on })}>{on ? t('testersOn') : t('testersOff')}</button>
    {works !== undefined && <div className={'card small b'} style={{ background: works ? '#DDF6E6' : '#FFE3E3' }}>{works ? '✓ ' + t('filterWorks') : '⚠️ ' + t(on ? 'filterBrokenOn' : 'filterBroken')}</div>}
    <input className="inp" type="tel" inputMode="tel" placeholder="5XX XX XX XX" value={ph} onChange={e => setPh(e.target.value)} />
    <div className="grid2"><button className="btn light" onClick={() => act(false)}>{t('testerRemove')}</button><button className="btn primary" onClick={() => act(true)}>{t('testerAdd')}</button></div>
  </div>
}
