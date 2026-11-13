import React, { useEffect, useMemo, useState } from 'react'
import { api, useStore, getState, CLOUD } from './store'
import { regionFor, REGIONS } from './data'
import { detectLang } from './i18n'
import { I18nProvider, useT, Icon, Toaster, Sheet } from './ui'
import { Nav } from './nav'
import Onboarding from './screens/Onboarding'
import { Home, CallNow, RequestTrack, Activity } from './screens/Client'
import { ChatList, Chat, Voice, IncomingCall } from './screens/Chat'
import { Projects, Rides, seedBoards } from './screens/Projects'
import { ProHome, Incoming, ProSettings } from './screens/Pro'
import { Profile, BugReport, Admin } from './screens/Profile'

const THEME = new URLSearchParams(location.search).get('theme') || 'a'
const SCREENS = { call: CallNow, request: RequestTrack, chat: Chat, voice: Voice, projects: Projects, rides: Rides, proSettings: ProSettings, bug: BugReport, admin: Admin }

function useLocation() {
  useEffect(() => {
    const s = getState()
    if (!s.loc) api.setLoc(REGIONS[0].center, false)
    if (!s.lang) api.setLang(detectLang())
    navigator.geolocation?.getCurrentPosition(
      p => api.setLoc([p.coords.latitude, p.coords.longitude], true),
      () => {}, { enableHighAccuracy: true, timeout: 12000, maximumAge: 600000 })
  }, [])
}

function useInstall() {
  const [evt, setEvt] = useState(null)
  useEffect(() => { const h = e => { e.preventDefault(); setEvt(e) }; window.addEventListener('beforeinstallprompt', h); return () => window.removeEventListener('beforeinstallprompt', h) }, [])
  const standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone
  if (standalone) return null
  return evt ? { kind: 'android', go: () => evt.prompt() } : { kind: /iPhone|iPad/.test(navigator.userAgent) ? 'ios' : 'other' }
}

function Shell() {
  const { t } = useT()
  const user = useStore(s => s.user)
  const unread = useStore(s => Object.values(s.chats).reduce((a, c) => a + (c.unread || 0), 0))
  const [tab, setTab] = useState('home')
  const [stack, setStack] = useState([])
  const [iosHelp, setIosHelp] = useState(false)
  const inst = useInstall()
  useLocation()

  useEffect(() => {
    const s = getState()
    if (user && !s.seeded && !CLOUD) { const b = seedBoards(regionFor(s.loc || REGIONS[0].center).id); api._seed?.(b) }
  }, [user])

  // Android/browser back button support
  useEffect(() => {
    const h = () => setStack(s => s.slice(0, -1))
    window.addEventListener('popstate', h); return () => window.removeEventListener('popstate', h)
  }, [])

  const nav = useMemo(() => ({
    go: (name, params = {}) => { history.pushState({}, ''); setStack(s => [...s, { name, params, k: Math.random() }]) },
    replace: (name, params = {}) => setStack(s => [...s.slice(0, -1), { name, params, k: Math.random() }]),
    back: () => history.back(),
    home: () => { setStack([]); setTab('home') },
  }), [])

  if (!user) return <div className="app"><Onboarding /><Toaster /></div>

  const top = stack.slice(-1)[0]
  const Screen = top && SCREENS[top.name]
  const isPro = user.role === 'pro'
  const installFn = inst ? (inst.kind === 'android' ? inst.go : () => setIosHelp(true)) : null
  const tabs = [['home', 'home', t('home')], ['activity', 'act', t('activity')], ['chats', 'chat', t('chats')], ['profile', 'user', t('profile')]]

  return <Nav.Provider value={nav}>
    <div className="app" data-theme={THEME}>
      {Screen ? <Screen key={top.k} {...top.params} /> : <>
        {tab === 'home' && (isPro ? <ProHome /> : <Home install={installFn} />)}
        {tab === 'activity' && <Activity />}
        {tab === 'chats' && <ChatList />}
        {tab === 'profile' && <Profile install={installFn} />}
        <div className="tabbar">{tabs.map(([k, ic, l]) => <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}><Icon n={ic} s={24} />{l}{k === 'chats' && unread > 0 && <span className="dotn">{unread}</span>}</button>)}</div>
      </>}
      {isPro && <Incoming />}
      <IncomingCall />
      {iosHelp && <Sheet onClose={() => setIosHelp(false)}><div className="center" style={{ fontSize: 48 }}>📲</div><h2 className="center">{t('install')}</h2><p className="center b" style={{ fontSize: 17, lineHeight: 1.5 }}>{t('installIos')}</p><button className="btn primary" onClick={() => setIosHelp(false)}>{t('done')}</button></Sheet>}
      <Toaster />
    </div>
  </Nav.Provider>
}

function InstallBar({ onClick }) {
  const { t } = useT()
  const [hide, setHide] = useState(() => { try { return sessionStorage.getItem('wext:ib') } catch { return false } })
  if (hide) return null
  return <div style={{ position: 'absolute', left: 16, right: 16, bottom: 'calc(90px + var(--safe-b))', zIndex: 15 }} className="card row">
    <img src="icons/icon-192.png" alt="" style={{ width: 40, height: 40, borderRadius: 12 }} />
    <b className="grow small">{t('install')}</b>
    <button className="btn sm yellow" onClick={onClick}>{t('installBtn')}</button>
    <button onClick={() => { setHide(true); try { sessionStorage.setItem('wext:ib', 1) } catch {} }}><Icon n="close" s={18} /></button>
  </div>
}

export default function App() { return <I18nProvider><Shell /></I18nProvider> }
