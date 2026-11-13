import React, { useMemo } from 'react'
import { api, useStore } from '../store'
import { catName } from '../data'
import { useT, Icon, Top, Avatar, catIcon, catTint, fmtDate } from '../ui'
import { useNav } from '../nav'

// Client tab: pros I already used — one tap to call or order again
export function MyPros() {
  const { t, lang } = useT()
  const nav = useNav()
  const reqs = useStore(s => s.requests)
  const list = useMemo(() => {
    const seen = new Map()
    reqs.filter(r => r.proName && ['accepted', 'arrived', 'agreed', 'done'].includes(r.status))
      .sort((a, b) => b.createdAt - a.createdAt)
      .forEach(r => { const k = r.proId || r.proName; if (!seen.has(k)) seen.set(k, { ...r, n: 0 }); seen.get(k).n++ })
    return [...seen.values()]
  }, [reqs])
  return <div className="scroll">
    <Top title={t('myPros')} />
    <div className="pad list">
      {!list.length && <div className="empty"><div className="e">🧰</div>{t('myProsEmpty')}</div>}
      {list.map(r => <div key={r.id} className="card" style={{ padding: 14 }}>
        <div className="row" style={{ gap: 12 }}>
          <span className="av" style={{ background: catTint(r.cat), fontSize: 26, width: 52, height: 52, borderRadius: 14, display: 'grid', placeItems: 'center' }}>{catIcon(r.cat)}</span>
          <div className="grow"><b className="ell">{r.proName}</b><div className="meta">{catName(r.cat, lang)} · {fmtDate(r.createdAt, lang)}{r.n > 1 ? ' · ×' + r.n : ''}</div></div>
        </div>
        <div className="grid2" style={{ marginTop: 10 }}>
          {r.threadId ? <button className="btn light" onClick={() => nav.go('voice', { threadId: r.threadId, reqId: r.id })}><Icon n="phone" s={18} />{t('callBig')}</button> : <span />}
          <button className="btn primary" onClick={() => nav.go('call', { cat: r.cat })}>🔁 {t('orderAgain')}</button>
        </div>
      </div>)}
    </div>
  </div>
}

// Work tab: honest numbers only — no money
export function ProStats() {
  const { t } = useT()
  const user = useStore(s => s.user)
  const jobs = useStore(s => s.proJobs)
  const pro = user.pro || {}
  const done = jobs.filter(j => ['done', 'agreed'].includes(j.status)).length
  const today = jobs.filter(j => j.acceptedAt && new Date(j.acceptedAt).toDateString() === new Date().toDateString()).length
  const week = jobs.filter(j => j.acceptedAt && Date.now() - j.acceptedAt < 7 * 864e5).length
  const Box = ({ v, l }) => <div className="card center" style={{ padding: '18px 8px' }}><div style={{ fontSize: 30, fontWeight: 900 }}>{v}</div><div className="small mute b">{l}</div></div>
  return <div className="scroll">
    <Top title={t('stats')} />
    <div className="pad col" style={{ gap: 12 }}>
      <div className="grid2"><Box v={'★ ' + (pro.rating || 5)} l={t('rating')} /><Box v={pro.jobs || 0} l={t('statTaken')} /></div>
      <div className="grid2"><Box v={done} l={t('statDone')} /><Box v={pro.noShows || 0} l={t('noShows') + ' (3 = ⛔)'} /></div>
      <div className="grid2"><Box v={today} l={t('today')} /><Box v={week} l={t('statWeek')} /></div>
    </div>
  </div>
}
