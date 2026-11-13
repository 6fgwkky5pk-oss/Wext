import React, { useState } from 'react'
import { api, useStore, money, promoActive, getState, groupOrder } from '../store'
import { LANGS } from '../i18n'
import { catName, CATEGORIES, GROUPS, groupName } from '../data'
import { useT, Icon, Top, Sheet, toast, Avatar, fmtDate } from '../ui'
import { useNav } from '../nav'

const ADMIN_PIN = '2468'

export function Profile({ install }) {
  const { t, lang } = useT()
  const nav = useNav()
  const user = useStore(s => s.user)
  const [langSheet, setLangSheet] = useState(false)
  const [taps, setTaps] = useState(0)
  const user0 = useStore(s => s.user)
  const [pin, setPin] = useState(() => new URLSearchParams(location.search).has('admin') && !user0?.admin ? '' : null)
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
        <Row ic={<Icon n="globe" s={20} />} label={t('language')} right={<span className="mute small b">{LANGS.find(l => l.code === lang).label}</span>} onClick={() => setLangSheet(true)} />
        <Row ic={<Icon n="swap" s={20} />} label={isPro ? '🙋 ' + t('roleClient') : '💼 ' + t('rolePro')} onClick={() => { api.updateUser({ role: isPro ? 'client' : 'pro' }); nav.home() }} />
        {isPro && <Row ic="🧰" label={t('myCats') + ' · ' + t('profileType')} onClick={() => nav.go('proSettings')} />}
        {user.card && <Row ic={<Icon n="card" s={20} />} label={`${t('savedCard')} · ${user.card.label}`} onClick={() => { api.updateUser({ card: null }); toast('✓') }} />}
        {install && <Row ic={<Icon n="dl" s={20} />} label={t('install')} onClick={install} />}
        <Row ic={<Icon n="bug" s={20} />} label={t('reportBug')} onClick={() => nav.go('bug')} />
        {user.admin && <Row ic={<Icon n="shield" s={20} />} label={t('admin')} onClick={() => nav.go('admin')} />}
        <Row ic={<Icon n="logout" s={20} />} label={t('logout')} danger onClick={() => api.logout()} />
      </div>
      <p className="tiny mute center" style={{ marginTop: 18 }} onClick={() => { const n = taps + 1; setTaps(n); if (n >= 5) { setTaps(0); user.admin ? nav.go('admin') : setPin('') } }}>WEXT 0.1 · {t('tagline')}</p>
    </div>
    {langSheet && <LangSheet lang={lang} t={t} onClose={() => setLangSheet(false)} />}
    {pin != null && <Sheet onClose={() => setPin(null)}><h2>{t('admin')}</h2>
      <input className="inp" style={{ marginTop: 12, textAlign: 'center', fontSize: 24, letterSpacing: 10 }} type="password" inputMode="numeric" autoFocus value={pin} onChange={e => { setPin(e.target.value); if (e.target.value === ADMIN_PIN) { api.setAdmin(true); setPin(null); nav.go('admin') } }} /></Sheet>}
  </div>
}

const EN_NAMES = { ka: 'Georgian', en: 'English', ru: 'Russian', de: 'German', tr: 'Turkish', uk: 'Ukrainian', hy: 'Armenian', az: 'Azerbaijani', es: 'Spanish', fr: 'French', ar: 'Arabic', zh: 'Chinese' }
function LangSheet({ lang, t, onClose }) {
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
  const adminUsers = useStore(s => s.adminUsers) || []
  const adminReqsCloud = useStore(s => s.adminReqs), myReqs = useStore(s => s.requests)
  const adminReqs = adminReqsCloud || myReqs
  const proUsers = adminUsers.length ? adminUsers.filter(u => u.pro?.registered) : pros
  const clientUsers = adminUsers.filter(u => !u.pro?.registered)
  const contacted = adminReqs.filter(r => r.contacted || ['arrived', 'done'].includes(r.status))
  const Stat = ({ n, l, e }) => <div className="card center" style={{ padding: 14 }}><div style={{ fontSize: 22 }}>{e}</div><div style={{ fontSize: 28, fontWeight: 900 }}>{n}</div><div className="tiny mute b">{l}</div></div>
  const [f, setF] = useState(cfg)
  const byUser = complaints.reduce((a, c) => (a[c.byId] = (a[c.byId] || 0) + 1, a), {})
  const N = (k, step = 0.5) => <input className="inp" type="number" step={step} inputMode="decimal" value={f[k]} onChange={e => setF({ ...f, [k]: +e.target.value })} />
  return <div className="scroll nopad">
    <Top title={t('admin')} onBack={nav.back} />
    <div className="pad col">
      <div className="seg" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr' }}>{[['stats', t('stats')], ['users', t('users')], ['complaints', t('complaints')], ['prices', t('prices')], ['bugs', t('bugs')]].map(([k, l]) => <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)} style={{ fontSize: 12 }}>{l}</button>)}</div>

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
        <button className="btn primary" onClick={() => { api.setConfig(f); toast('✅ ' + t('saved')) }}>{t('save')}</button>
      </div>}

      {tab === 'complaints' && <div className="list">
        {!complaints.length && <div className="empty">{t('none')}</div>}
        {complaints.map(c => { const p = pros.find(x => x.id === c.proId)
          return <div key={c.id} className="card">
            <div className="row between"><b>{c.reason}</b><span className="tiny mute">{fmtDate(c.ts, lang)}</span></div>
            <div className="small" style={{ marginTop: 6 }}>{t('client')}: <b>{c.byName}</b> {byUser[c.byId] >= 3 && <span className="badge r">⚑ {t('flagged')} ({byUser[c.byId]})</span>}</div>
            {p && <div className="row between" style={{ marginTop: 8 }}><span className="small">{p.name} · {catName(p.cat, lang)}</span>
              <button className={'btn sm ' + (blocked.includes(p.id) ? 'outline' : 'red')} onClick={() => api.toggleBlock(p.id)}>{blocked.includes(p.id) ? t('unblock') : t('block')}</button></div>}
          </div> })}
      </div>}

      {tab === 'users' && <div className="list">
        <h3>{t('pros')} · {proUsers.length}</h3>
        {proUsers.map(p => <div key={p.id} className="prorow"><Avatar p={p} /><div className="grow"><b className="ell" style={{ display: 'block' }}>{p.name}</b><span className="tiny mute b">{catName(p.cat || (p.cats || [])[0], lang)} · ★{p.rating || '—'} · {p.online ? '🟢' : '⚪'}{p.noShows ? ' · ⚠️' + p.noShows : ''}{complaints.filter(c => c.proId === p.id).length ? ' · ⚑' + complaints.filter(c => c.proId === p.id).length : ''}</span></div>
          <button className={'btn sm ' + (blocked.includes(p.id) ? 'outline' : 'light')} onClick={() => api.toggleBlock(p.id)}>{blocked.includes(p.id) ? t('unblock') : t('block')}</button></div>)}
        {clientUsers.length > 0 && <h3 style={{ marginTop: 14 }}>{t('clients')} · {clientUsers.length}</h3>}
        {clientUsers.map(u => <div key={u.id} className="prorow"><Avatar p={{ name: u.name || '?', hue: 38, type: 'individual' }} /><div className="grow"><b className="ell" style={{ display: 'block' }}>{u.name || '—'}</b></div>
          <button className={'btn sm ' + (blocked.includes(u.id) ? 'outline' : 'light')} onClick={() => api.toggleBlock(u.id)}>{blocked.includes(u.id) ? t('unblock') : t('block')}</button></div>)}
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
        <div className="row"><b className="grow">{i + 1}. {G.icon} {groupName(g, lang)}</b><b>{st['g_' + g] || 0}</b></div>
        {cats.filter(c => st[c.id]).map(c => <div key={c.id} className="row tiny mute"><span className="grow">{catName(c.id, lang)}</span><span>{st[c.id]}</span></div>)}
      </div> })}
    <span className="tiny mute">შეკვეთა = 3 ქულა, გახსნა = 1</span>
  </div>
}
