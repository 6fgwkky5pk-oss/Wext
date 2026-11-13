import React, { useState } from 'react'
import { api, useStore, priceFor, money } from '../store'
import { CATEGORIES, catName } from '../data'
import { useT, Icon, Top, Sheet, Stepper, catIcon, fmtDate, toast } from '../ui'
import { useNav } from '../nav'

const taken = p => p.joins.reduce((a, j) => a + j.count, 0)
const inDays = d => new Date(Date.now() + d * 864e5).toISOString().slice(0, 10)

export function Projects({ cat, create }) {
  const { t, lang } = useT()
  const nav = useNav()
  const user = useStore(s => s.user)
  const all = useStore(s => s.projects)
  const [tab, setTab] = useState('open')
  const [form, setForm] = useState(create ? { cat: cat || 'harvest' } : null)
  const [join, setJoin] = useState(null)
  const list = (tab === 'open' ? all : all.filter(p => p.ownerId === user.id || p.joins.some(j => j.userId === user.id)))
    .filter(p => !cat || create || p.cat === cat).sort((a, b) => a.date.localeCompare(b.date))
  return <>
    <div className="scroll">
      <Top title={t('peopleNeed')} onBack={nav.back} right={<button className="iconbtn" style={{ background: 'var(--y)' }} onClick={() => setForm({ cat: cat || 'harvest' })}><Icon n="plus" /></button>} />
      <div className="pad col">
        <div className="seg"><button className={tab === 'open' ? 'on' : ''} onClick={() => setTab('open')}>{t('openProjects')}</button><button className={tab === 'mine' ? 'on' : ''} onClick={() => setTab('mine')}>{t('myProjects')}</button></div>
        {!list.length && <div className="empty"><div className="e">🍇</div>{t('none')}</div>}
        {list.map(p => {
          const n = taken(p), left = p.people - n, me = p.joins.find(j => j.userId === user.id), own = p.ownerId === user.id
          return <div key={p.id} className="card">
            <div className="row" style={{ alignItems: 'flex-start' }}>
              <span className="av" style={{ background: '#FFF1C2', fontSize: 26 }}>{catIcon(p.cat)}</span>
              <div className="grow"><h3>{p.title}</h3>
                <div className="meta"><Icon n="cal" s={14} />{fmtDate(p.date, lang)}<span>·</span><Icon n="pin" s={14} />{p.place}</div></div>
              {p.pay ? <div className="center"><b style={{ fontSize: 18 }}>{p.pay}₾</b><div className="tiny mute b">{t('perDay')}</div></div> : null}
            </div>
            <div style={{ marginTop: 12 }} className="row between small b"><span>{n}/{p.people} {t('workers')}</span><span className={left ? '' : 'mute'}>{left ? t('spotsLeft', { n: left }) : t('full')}</span></div>
            <div className="progress" style={{ marginTop: 6 }}><i style={{ width: `${(n / p.people) * 100}%` }} /></div>
            {p.joins.length > 0 && <div className="row" style={{ gap: 6, flexWrap: 'wrap', marginTop: 10 }}>{p.joins.map(j => <span key={j.userId} className="badge">{j.name}{j.count > 1 ? ` +${j.count - 1}` : ''}</span>)}</div>}
            <div style={{ marginTop: 12 }}>
              {own ? <span className="badge y">★ {t('myProjects')}</span>
                : me ? <div className="row"><span className="badge g" style={{ padding: '8px 12px' }}>✓ {t('applied')} · {me.count}</span><button className="btn sm outline" onClick={() => api.leaveProject(p.id)}>{t('cancel')}</button></div>
                : left > 0 && <button className="btn yellow sm" style={{ width: '100%' }} onClick={() => setJoin(p)}>{t('joinMe')} / {t('joinTeam')}</button>}
            </div>
          </div>
        })}
      </div>
    </div>
    {form && <ProjectForm init={form} onClose={() => setForm(null)} />}
    {join && <JoinSheet p={join} onClose={() => setJoin(null)} />}
  </>
}

function ProjectForm({ init, onClose }) {
  const { t, lang } = useT()
  const [f, setF] = useState({ cat: init.cat, title: '', date: inDays(3), people: 5, place: '', pay: 60 })
  const fee = priceFor(f.cat, 'project')
  return <Sheet onClose={onClose}>
    <h2>{t('newProject')}</h2>
    <div className="col" style={{ marginTop: 14 }}>
      <div className="row" style={{ gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
        {CATEGORIES.filter(c => c.kind === 'field' || ['painter', 'tiler', 'handyman', 'movers', 'cleaning'].includes(c.id)).map(c =>
          <button key={c.id} className={'chip' + (f.cat === c.id ? ' on' : '')} onClick={() => setF({ ...f, cat: c.id })}>{c.icon} {c.n[lang] || c.n.en}</button>)}
      </div>
      <div className="field"><label>{t('projTitle')}</label><input className="inp" placeholder={t('projTitlePh')} value={f.title} onChange={e => setF({ ...f, title: e.target.value })} /></div>
      <div className="grid2">
        <div className="field"><label>{t('date')}</label><input className="inp" type="date" value={f.date} onChange={e => setF({ ...f, date: e.target.value })} /></div>
        <div className="field"><label>{t('payPerDay')}</label><input className="inp" type="number" inputMode="numeric" value={f.pay} onChange={e => setF({ ...f, pay: +e.target.value })} /></div>
      </div>
      <div className="field"><label>{t('place')}</label><input className="inp" placeholder={t('placePh')} value={f.place} onChange={e => setF({ ...f, place: e.target.value })} /></div>
      <div className="row between"><b>{t('people')}</b><Stepper v={f.people} set={v => setF({ ...f, people: v })} max={200} /></div>
      <div className="hold"><span>💳</span><span>{t('fee')}: <b>{money(fee.amount)}</b> {t('perPerson')} · {money(fee.amount * f.people)}</span></div>
      <button className="btn primary" disabled={!f.title.trim() || !f.place.trim()} onClick={() => { api.createProject({ ...f, title: f.title.trim(), place: f.place.trim() }); onClose(); toast('✅ ' + t('publish')) }}>{t('publish')}</button>
    </div>
  </Sheet>
}

function JoinSheet({ p, onClose }) {
  const { t } = useT()
  const user = useStore(s => s.user)
  const left = p.people - taken(p)
  const [mode, setMode] = useState(user.pro.type === 'individual' ? 'me' : 'team')
  const [n, setN] = useState(Math.min(left, Math.max(2, user.pro.members || 2)))
  return <Sheet onClose={onClose}>
    <h2>{p.title}</h2>
    <p className="small mute b">{t('spotsLeft', { n: left })}</p>
    <div className="col">
      <button className={'rolecard' + (mode === 'me' ? ' on' : '')} onClick={() => setMode('me')}><span className="e">🙋</span><b>{t('joinMe')}</b></button>
      {left > 1 && <button className={'rolecard' + (mode === 'team' ? ' on' : '')} onClick={() => setMode('team')}><span className="e">👷‍♂️</span><b>{t('joinTeam')}</b></button>}
      {mode === 'team' && left > 1 && <div className="row between"><b>{t('teamSize')}</b><Stepper v={n} set={setN} min={2} max={left} /></div>}
      <button className="btn primary" onClick={() => { api.joinProject(p.id, mode === 'me' ? 1 : n); onClose(); toast('✅ ' + t('applied')) }}>{t('continue')}</button>
    </div>
  </Sheet>
}

export function Rides() {
  const { t, lang } = useT()
  const nav = useNav()
  const user = useStore(s => s.user)
  const rides = useStore(s => s.rides)
  const [form, setForm] = useState(false)
  const fee = priceFor(null, 'ride')
  const list = [...rides].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
  return <>
    <div className="scroll">
      <Top title={t('ride')} onBack={nav.back} right={<button className="iconbtn" style={{ background: 'var(--y)' }} onClick={() => setForm(true)}><Icon n="plus" /></button>} />
      <div className="pad col">
        <button className="btn yellow" onClick={() => setForm(true)}><Icon n="car" />{t('postRide')}</button>
        {!list.length && <div className="empty"><div className="e">🚗</div>{t('none')}</div>}
        {list.map(r => {
          const tk = r.bookings.reduce((a, b) => a + b.n, 0), left = r.seats - tk, me = r.bookings.find(b => b.userId === user.id), own = r.driverId === user.id
          return <div key={r.id} className="card">
            <div className="row between" style={{ alignItems: 'flex-start' }}>
              <div className="grow">
                <div className="row" style={{ gap: 8 }}><span style={{ width: 10, height: 10, borderRadius: 5, border: '3px solid #111' }} /><b>{r.from}</b></div>
                <div style={{ width: 2, height: 14, background: '#ddd', margin: '2px 0 2px 4px' }} />
                <div className="row" style={{ gap: 8 }}><span style={{ width: 10, height: 10, borderRadius: 5, background: 'var(--o)' }} /><b>{r.to}</b></div>
              </div>
              <div style={{ textAlign: 'right' }}><b style={{ fontSize: 20 }}>{r.price}₾</b><div className="tiny mute b">{t('perSeat')}</div></div>
            </div>
            <div className="sep" />
            <div className="row between">
              <div className="small b"><Icon n="cal" s={14} /> {fmtDate(r.date, lang)} · {r.time}<div className="tiny mute" style={{ marginTop: 3 }}>{t('driver')}: {r.driver}{r.car ? ' · ' + r.car : ''}</div></div>
              <div className="seats">{Array.from({ length: r.seats }).map((_, i) => <i key={i} className={i < tk ? 't' : ''} />)}</div>
            </div>
            <div style={{ marginTop: 12 }}>
              {own ? <span className="badge y">★ {t('driver')} · {tk}/{r.seats}</span>
                : me ? <div className="row"><span className="badge g" style={{ padding: '8px 12px' }}>✓ {t('booked')}</span><button className="btn sm outline" onClick={() => api.cancelSeat(r.id)}>{t('cancel')}</button></div>
                : left > 0 ? <button className="btn primary sm" style={{ width: '100%' }} onClick={() => { api.bookSeat(r.id, 1); toast('✅ ' + t('booked') + ' · ' + t('fee') + ' ' + money(fee.amount)) }}>{t('bookSeat')} · {t('fee')} {money(fee.amount)}</button>
                : <span className="badge">{t('full')}</span>}
            </div>
          </div>
        })}
      </div>
    </div>
    {form && <RideForm onClose={() => setForm(false)} />}
  </>
}

function RideForm({ onClose }) {
  const { t } = useT()
  const [f, setF] = useState({ from: '', to: '', date: inDays(1), time: '09:00', seats: 3, price: 10, car: '' })
  return <Sheet onClose={onClose}>
    <h2>{t('postRide')}</h2>
    <div className="col" style={{ marginTop: 14 }}>
      <div className="field"><label>{t('from')}</label><input className="inp" value={f.from} onChange={e => setF({ ...f, from: e.target.value })} /></div>
      <div className="field"><label>{t('to')}</label><input className="inp" value={f.to} onChange={e => setF({ ...f, to: e.target.value })} /></div>
      <div className="grid2">
        <div className="field"><label>{t('date')}</label><input className="inp" type="date" value={f.date} onChange={e => setF({ ...f, date: e.target.value })} /></div>
        <div className="field"><label>{t('when')}</label><input className="inp" type="time" value={f.time} onChange={e => setF({ ...f, time: e.target.value })} /></div>
      </div>
      <div className="grid2">
        <div className="field"><label>{t('price')}</label><input className="inp" type="number" inputMode="numeric" value={f.price} onChange={e => setF({ ...f, price: +e.target.value })} /></div>
        <div className="field"><label>{t('car')}</label><input className="inp" placeholder="Prius, თეთრი" value={f.car} onChange={e => setF({ ...f, car: e.target.value })} /></div>
      </div>
      <div className="row between"><b>{t('seats')}</b><Stepper v={f.seats} set={v => setF({ ...f, seats: v })} max={8} /></div>
      <button className="btn primary" disabled={!f.from.trim() || !f.to.trim()} onClick={() => { api.createRide(f); onClose() }}>{t('publish')}</button>
    </div>
  </Sheet>
}

// Starter content so a fresh install is not empty (only for the Georgian region)
export function seedBoards(region) {
  if (region !== 'ge') return { projects: [], rides: [] }
  const P = (title, cat, d, people, place, pay, joins) => ({ id: 'pj_s' + title.length + d, title, cat, date: inDays(d), people, place, pay, ownerId: 'seed', ownerName: '—', joins, createdAt: Date.now() - d * 1000 })
  const R = (from, to, d, time, seats, price, driver, car, b) => ({ id: 'rd_s' + from.length + to.length + d, from, to, date: inDays(d), time, seats, price, driver, car, driverId: 'seed', bookings: b, createdAt: Date.now() - d * 1000 })
  return {
    projects: [
      P('რთველი — საფერავი, 3 ჰა', 'harvest', 2, 12, 'კისისხევი', 70, [{ userId: 's1', name: 'გოჩას ბრიგადა', count: 5 }, { userId: 's2', name: 'ნინო', count: 1 }]),
      P('ბოსტნის თოხნა', 'land', 1, 3, 'ქვემო ალვანი', 50, [{ userId: 's3', name: 'ლევანი', count: 1 }]),
      P('სახლის შეღებვა — 2 სართული', 'painter', 5, 4, 'ნაფარეული', 90, []),
      P('შეშის დაჩეხვა, 6 მ³', 'firewood', 3, 2, 'ქურდღელაური', 60, []),
    ],
    rides: [
      R('თელავი', 'თბილისი', 1, '08:30', 3, 15, 'დავითი', 'Prius', [{ userId: 's4', name: 'მარიამი', n: 1 }]),
      R('თელავი', 'სიღნაღი', 1, '11:00', 4, 8, 'ზურაბი', 'Fit', []),
      R('ყვარელი', 'თელავი', 2, '09:15', 2, 5, 'ბექა', 'Opel', [{ userId: 's5', name: 'თამარი', n: 2 }]),
    ],
  }
}
