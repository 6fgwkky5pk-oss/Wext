import React, { createContext, useContext, useEffect, useState } from 'react'
import { initials, catById } from './data'
import { useStore, api } from './store'
import { makeT } from './i18n'

const P = {
  home: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  act: 'M4 6h16M4 12h10M4 18h7',
  chat: 'M4 5h16v11H8l-4 4z',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',
  back: 'M15 5l-7 7 7 7',
  right: 'M9 5l7 7-7 7',
  close: 'M6 6l12 12M18 6 6 18',
  phone: 'M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z',
  send: 'M4 12 20 4l-6 16-3-7z',
  pin: 'M12 21s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12zM12 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM21 21l-5-5',
  check: 'M5 12l5 5L20 7',
  mic: 'M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3zM5 11a7 7 0 0 0 14 0M12 18v3',
  vol: 'M4 9v6h4l5 4V5L8 9zM16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11',
  plus: 'M12 5v14M5 12h14',
  nav: 'M3 11 21 3l-8 18-2-8z',
  bug: 'M8 8a4 4 0 0 1 8 0v8a4 4 0 0 1-8 0zM4 12h4M16 12h4M5 7l3 2M19 7l-3 2M5 18l3-2M19 18l-3-2',
  shield: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z',
  globe: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3 12h18M12 3c2.5 3 2.5 15 0 18M12 3c-2.5 3-2.5 15 0 18',
  swap: 'M7 7h13l-4-4M17 17H4l4 4',
  logout: 'M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10',
  dl: 'M12 4v11M7 10l5 5 5-5M5 20h14',
  card: 'M3 6h18v12H3zM3 10h18',
  cal: 'M4 6h16v14H4zM4 10h16M9 3v4M15 3v4',
  users: 'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2 20a7 7 0 0 1 14 0M16 4a3.5 3.5 0 0 1 0 7M18 13.5A7 7 0 0 1 22 20',
  car: 'M5 16h14v-4l-2-5H7l-2 5zM5 16v2M19 16v2M7.5 13.5h.01M16.5 13.5h.01',
  flag: 'M5 21V4h12l-2 4 2 4H5',
  bolt: 'M13 2 4 14h7l-1 8 9-12h-7z',
  star: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z',
}
export function Icon({ n, s = 22, w = 2.2, fill }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill={fill || 'none'} stroke="currentColor" strokeWidth={w} strokeLinecap="round" strokeLinejoin="round"><path d={P[n]} /></svg>
}

export function Bolt(props) {
  return <svg viewBox="0 0 200 200" {...props}><circle cx="120" cy="80" r="80" fill="rgba(255,255,255,.22)" /><path d="M128 18 72 110h40l-18 72 64-102h-42l26-62z" fill="#111" /><path d="M128 18 72 110h40l-18 72 64-102h-42l26-62z" fill="none" stroke="#fff" strokeWidth="5" strokeLinejoin="round" transform="translate(-6 -6)" opacity=".9" /></svg>
}

const I18n = createContext(makeT('ka'))
export function I18nProvider({ children }) {
  const lang = useStore(s => s.lang) || 'ka'
  return <I18n.Provider value={{ t: makeT(lang), lang }}>{children}</I18n.Provider>
}
export const useT = () => useContext(I18n)

export function Avatar({ p, lg }) {
  const bg = p.type === 'company' ? '#111' : `hsl(${p.hue ?? 30} 70% 46%)`
  return <div className={'av' + (lg ? ' lg' : '')} style={{ background: bg }}>
    {p.type === 'company' ? <span style={{ color: '#FFC21A' }}>{p.name[0]}</span> : initials(p.name)}
    {p.online && <i className="on" />}
  </div>
}

export function TypeBadge({ p }) {
  const { t } = useT()
  return <>
    {p.type !== 'individual' && <span className="badge ink">{t(p.type)}{p.members > 1 ? ` · ${p.members}` : ''}</span>}
    {p.verified && <span className="badge g">✓ {t('verified')}</span>}
  </>
}

export function ProRow({ p, onClick, right }) {
  const { t, lang } = useT()
  return <button className={'prorow' + (p.online ? '' : ' off')} onClick={onClick} style={{ width: '100%', textAlign: 'left' }}>
    <Avatar p={p} />
    <div className="grow">
      <div className="row" style={{ gap: 6 }}><b className="ell">{p.name}</b></div>
      <div className="meta"><span className="stars">★ {p.rating}</span><span>· {p.jobs} {t('jobs')}</span>{p.dist != null && <span>· {p.dist.toFixed(1)} {t('km')}</span>}</div>
      <div className="row" style={{ gap: 5, marginTop: 6, flexWrap: 'wrap' }}><TypeBadge p={p} /></div>
    </div>
    {right}
  </button>
}

export function Top({ title, onBack, right, y }) {
  return <div className={'top' + (y ? ' y' : '')}>
    {onBack && <button className="iconbtn" onClick={onBack} aria-label="back"><Icon n="back" /></button>}
    <h2 className="ell">{title}</h2>
    {right}
  </div>
}

export function Sheet({ onClose, children }) {
  return <div className="overlay" onClick={onClose}><div className="modal" onClick={e => e.stopPropagation()}><div className="grab" />{children}</div></div>
}

export function Stepper({ v, set, min = 1, max = 99 }) {
  return <div className="stepper"><button onClick={() => set(Math.max(min, v - 1))}>−</button><b>{v}</b><button onClick={() => set(Math.min(max, v + 1))}>+</button></div>
}

export function Ring({ left, total, size = 120, color = '#111' }) {
  const r = size / 2 - 8, c = 2 * Math.PI * r
  return <div className="timer" style={{ width: size, height: size }}>
    <svg width={size} height={size}><circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(0,0,0,.12)" strokeWidth="8" fill="none" />
      <circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth="8" fill="none" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - left / total)} style={{ transition: 'stroke-dashoffset 1s linear' }} /></svg>
    <b>{Math.max(0, Math.ceil(left))}</b>
  </div>
}

export function useNow(ms = 1000) {
  const [n, setN] = useState(Date.now())
  useEffect(() => { const i = setInterval(() => setN(Date.now()), ms); return () => clearInterval(i) }, [ms])
  return n
}

let toastFn = () => {}
export const toast = (msg) => toastFn(msg)
export function Toaster() {
  const [m, setM] = useState(null)
  useEffect(() => { toastFn = (x) => { setM(x); clearTimeout(toastFn.t); toastFn.t = setTimeout(() => setM(null), 2600) } }, [])
  return m ? <div className="toast" onClick={() => setM(null)}>{m}</div> : null
}

export const catIcon = id => catById(id)?.icon || '🔧'
const KA_M = ['იანვარი', 'თებერვალი', 'მარტი', 'აპრილი', 'მაისი', 'ივნისი', 'ივლისი', 'აგვისტო', 'სექტემბერი', 'ოქტომბერი', 'ნოემბერი', 'დეკემბერი']
const RU_M = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря']
const KA_UNTIL = ['იანვრამდე', 'თებერვლამდე', 'მარტამდე', 'აპრილამდე', 'მაისამდე', 'ივნისამდე', 'ივლისამდე', 'აგვისტომდე', 'სექტემბრამდე', 'ოქტომბრამდე', 'ნოემბრამდე', 'დეკემბრამდე']
export function promoText(t, d, lang) {
  if (lang === 'ka') { const x = new Date(d + 'T12:00:00'); return `აქცია ${x.getDate()} ${KA_UNTIL[x.getMonth()]}` }
  return t('promoUntil', { d: fmtDate(d, lang) })
}
export function fmtDate(d, lang) {
  const x = typeof d === 'string' && d.length === 10 ? new Date(d + 'T12:00:00') : new Date(d)
  if (lang === 'ka') return `${x.getDate()} ${KA_M[x.getMonth()]}`
  if (lang === 'ru') return `${x.getDate()} ${RU_M[x.getMonth()]}`
  try { return x.toLocaleDateString(lang, { day: 'numeric', month: 'long' }) } catch { return x.toDateString() }
}
export function fmtTime(ts) { const d = new Date(ts); return d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0') }

export function RoleSwitch() {
  const { t } = useT()
  const role = useStore(s => s.user.role)
  const set = r => { if (r === role) return; if (r === 'client') api.setOnline(false); api.updateUser({ role: r }) }
  return <div className="roleswitch">
    <button className={role === 'client' ? 'on' : ''} onClick={() => set('client')}>🙋 {t('roleClient')}</button>
    <button className={role === 'pro' ? 'on' : ''} onClick={() => set('pro')}>🧰 {t('rolePro')}</button>
  </div>
}
