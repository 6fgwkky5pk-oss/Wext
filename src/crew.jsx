// Brigade members (D-008): invite link, member consent, brigadier's member list, choosing who goes, member's "you are sent".
import React, { useEffect, useMemo, useState } from 'react'
import { api, useStore, CLOUD } from './store'
import * as cloud from './cloud'
import { catName, distKm } from './data'
import { useT, Icon, catIcon, catTint, toast } from './ui'

const FRESH = 30 * 60e3 // a member point older than this is not trusted as "near"
const ago = (t, tr) => { const m = Math.max(0, Math.round((Date.now() - t) / 60e3)); return tr('updAgo', { m }) }
export const inviteLink = id => location.origin + location.pathname + '?crew=' + id

// brigadier: members + invite link (only for brigade/company accounts)
export function CrewCard() {
  const { t } = useT()
  const pro = useStore(s => s.user.pro)
  const crew = useStore(s => s.crew) || []
  const loc = useStore(s => s.loc)
  const on = useStore(s => s.config?.crews)
  if (!CLOUD || !on || pro.type === 'individual' || pro.crewOf) return null
  const link = inviteLink(api.me())
  const share = async () => {
    try { if (navigator.share) { await navigator.share({ title: 'WEXT', text: t('crewInviteText'), url: link }); return } } catch { return }
    try { await navigator.clipboard.writeText(link); toast('✓ ' + t('copied')) } catch { toast(link) }
  }
  return <div className="card col" style={{ gap: 10, marginBottom: 12 }}>
    <b>👷 {t('myCrew')} · {crew.length + 1}/{pro.members}</b>
    <button className="crewlink" onClick={share}>🔗 <span className="grow">{t('crewInvite')}<small>{t('crewInviteSub')}</small></span><Icon n="right" s={16} /></button>
    {crew.map(m => <div key={m.id} className="row" style={{ gap: 10 }}>
      <span className="av sm" style={{ background: m.online ? '#12B76A' : '#bbb' }}>{Array.from(m.name || '?')[0]}</span>
      <span className="grow col" style={{ gap: 0, minWidth: 0 }}><b className="ell">{m.name}</b>
        <small className="mute b">{m.busy ? '⏳ ' + t('crewBusy') : m.online ? '🟢 ' + t('crewWorking') : '⚪ ' + t('crewOff')}{m.online && m.pos && loc ? ' · ' + distKm(loc, m.pos).toFixed(1) + ' ' + t('km') : ''}{m.at ? ' · ' + ago(m.at, t) : ''}</small></span>
    </div>)}
    {pro.members > crew.length + 1 && <small className="mute b">❔ {t('crewNoApp', { n: pro.members - crew.length - 1 })}</small>}
  </div>
}

// members a brigadier can send to a job at `pos`, nearest first (free, green, fresh point, does this service)
export function crewFor(crew, cat, pos) {
  return (crew || []).filter(m => m.online && !m.busy && m.pos && m.at && Date.now() - m.at < FRESH && (m.cats || []).includes(cat))
    .map(m => ({ id: m.id, name: m.name, dist: +distKm(pos, m.pos).toFixed(1) })).sort((a, b) => a.dist - b.dist)
}

// brigadier's offer screen: who goes
export function CrewPick({ inc, value, onChange }) {
  const { t } = useT()
  const crew = useStore(s => s.crew)
  const list = useMemo(() => crewFor(crew, inc.cat, inc.pos), [crew, inc.id])
  useEffect(() => { onChange(list[0] || null) }, [inc.id, list.length])
  if (!list.length) return null
  return <div className="col" style={{ gap: 8, marginTop: 14 }}>
    <b className="small">👷 {t('whoGoes')}</b>
    {list.slice(0, 5).map((m, i) => <button key={m.id} className={'crewrow' + (value?.id === m.id ? ' on' : '')} onClick={() => onChange(m)}>
      <b className="grow ell" style={{ textAlign: 'left' }}>{m.name}{i === 0 && <span className="tagg">{t('nearest')}</span>}</b><span className="small b">{m.dist} {t('km')}</span></button>)}
    <button className={'crewrow' + (!value ? ' on' : '')} onClick={() => onChange(null)}><b className="grow" style={{ textAlign: 'left' }}>🙋 {t('goMyself')}</b></button>
  </div>
}

// brigadier's job card: who was sent / re-send after a member said no
export function CrewOnJob({ j }) {
  const { t } = useT()
  const crew = useStore(s => s.crew)
  if (!(crew || []).length) return null
  if (j.crewMemberName) return <div className="badge g" style={{ display: 'block', marginTop: 8, padding: 8 }}>👷 {t('sentMember', { name: j.crewMemberName, d: j.crewMemberDist })}</div>
  const list = crewFor(crew, j.cat, j.pos).filter(m => !(j.crewDeclined || []).includes(m.id))
  if (!(j.crewDeclined || []).length && !list.length) return null
  return <div className="col" style={{ gap: 6, marginTop: 8 }}>
    {(j.crewDeclined || []).length > 0 && <small className="b" style={{ color: 'var(--red)' }}>✕ {t('memberSaidNo')}</small>}
    {list.slice(0, 3).map(m => <button key={m.id} className="crewrow" onClick={() => api.assignMember(j.id, m)}><b className="grow" style={{ textAlign: 'left' }}>➜ {m.name}</b><span className="small b">{m.dist} {t('km')}</span></button>)}
  </div>
}

// member: my brigade + jobs I was sent to
export function MemberCard() {
  const { t, lang } = useT()
  const pro = useStore(s => s.user.pro)
  const jobs = useStore(s => s.crewJobs) || []
  const loc = useStore(s => s.loc)
  const [ask, setAsk] = useState(false)
  if (!pro.crewOf) return null
  return <>
    {jobs.map(j => <div key={j.id} className="card" style={{ marginBottom: 12, border: '3px solid var(--green)' }}>
      <b>📣 {t('youAreSent')}</b>
      <div className="row" style={{ marginTop: 8 }}><span style={{ fontSize: 28 }}>{catIcon(j.cat)}</span><div className="grow"><b>{catName(j.cat, lang)} · {j.clientName}</b>
        <div className="meta">{loc && j.pos ? distKm(loc, j.pos).toFixed(1) + ' ' + t('km') : ''}{j.note ? ' · ' + j.note : ''}</div></div></div>
      <div className="grid2" style={{ marginTop: 10 }}>
        <a className="btn green sm" style={{ textDecoration: 'none' }} href={`https://www.google.com/maps/dir/?api=1&destination=${j.pos[0]},${j.pos[1]}`} target="_blank" rel="noreferrer"><Icon n="nav" s={18} />{t('navigate')}</a>
        <button className="btn outline sm" style={{ color: 'var(--red)' }} onClick={() => api.memberDecline(j)}>✕ {t('decline')}</button>
      </div>
    </div>)}
    <div className="card row" style={{ marginBottom: 12, gap: 10 }}>
      <span style={{ fontSize: 26 }}>👷</span>
      <span className="grow col" style={{ gap: 0 }}><b>{t('memberOf', { name: pro.crewName })}</b><small className="mute b">{t('memberPrivacy')}</small></span>
      {ask ? <button className="btn red sm" style={{ width: 'auto' }} onClick={() => api.leaveCrew()}>{t('leaveYes')}</button>
        : <button className="btn outline sm" style={{ width: 'auto' }} onClick={() => setAsk(true)}>{t('leaveCrew')}</button>}
    </div>
  </>
}

// member opens the invite link
export function JoinCrew({ bid, onDone }) {
  const { t, lang } = useT()
  const [info, setInfo] = useState(undefined), [cats, setCats] = useState([])
  useEffect(() => { cloud.getUser(bid).then(u => { setInfo(u); setCats(u?.pro?.cats || []) }) }, [bid])
  if (info === undefined) return <div className="scroll"><div className="empty" style={{ paddingTop: 120 }}><div className="e">⏳</div></div></div>
  const bad = !info || !info.pro?.registered || info.pro.type === 'individual' || bid === api.me()
  return <div className="scroll home7"><div className="pad col" style={{ gap: 12, paddingTop: 'calc(30px + var(--safe-t))' }}>
    {bad ? <><div className="empty"><div className="e">🤷</div><b>{t('crewBadLink')}</b></div><button className="btn primary" onClick={onDone}>{t('close')}</button></> : <>
      <h1>👷 {t('joinCrewQ')}</h1>
      <div className="card"><b>{t('crewLead')}: {info.name}</b><div className="mute b small" style={{ marginTop: 4 }}>{t('brigadeN')} · {info.pro.members}</div></div>
      <div className="card col" style={{ gap: 8 }}><b>{t('crewWhatDo')}</b>
        <div className="row" style={{ flexWrap: 'wrap', gap: 6 }}>{(info.pro.cats || []).map(c => <button key={c} className={'chip' + (cats.includes(c) ? ' on' : '')} onClick={() => setCats(cats.includes(c) ? cats.filter(x => x !== c) : [...cats, c])}>{catIcon(c)} {catName(c, lang)}</button>)}</div></div>
      <div className="card"><b>📍 {t('crewLocTitle')}</b><div className="mute b small" style={{ marginTop: 6, lineHeight: 1.45 }}>{t('crewLocText')}</div></div>
      <button className="btn green" style={{ height: 58 }} disabled={!cats.length} onClick={() => { api.joinCrew(bid, info, cats); onDone() }}>✓ {t('crewAgree')}</button>
      <button className="btn outline" onClick={onDone}>{t('noThanks')}</button>
    </>}
  </div></div>
}
