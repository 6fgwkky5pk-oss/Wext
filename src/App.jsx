import React, { useEffect, useMemo, useState } from 'react'
import { api, useStore, getState, CLOUD, DEMO, setDemo } from './store'
import { regionFor, REGIONS } from './data'
import { TEST_MODE } from './payments'
import { detectLang } from './i18n'
import { I18nProvider, useT, Icon, Toaster, Sheet, toast } from './ui'
import { catName } from './data'
import { Nav } from './nav'
import Onboarding from './screens/Onboarding'
import { Home, CallNow, RequestTrack, Activity } from './screens/Client'
import { ChatList, Chat, Voice, IncomingCall } from './screens/Chat'
import { Projects, Rides, seedBoards } from './screens/Projects'
import { ProHome, Incoming, ProSettings } from './screens/Pro'
import { Profile, BugReport, Admin } from './screens/Profile'
import { MyPros, ProStats } from './screens/Tabs'

const THEME = new URLSearchParams(location.search).get('theme') || 'a'
const SCREENS = { activity: Activity, call: CallNow, request: RequestTrack, chat: Chat, voice: Voice, projects: Projects, rides: Rides, proSettings: ProSettings, bug: BugReport, admin: Admin }

function useLocation() {
  useEffect(() => {
    const s = getState()
    if (!s.loc) api.setLoc(REGIONS[0].center, false)
    if (!s.lang) api.setLang(detectLang())
    // live GPS: high accuracy, follows the phone (updates when moved ~50 m)
    const id = navigator.geolocation?.watchPosition(
      p => api.setLoc([p.coords.latitude, p.coords.longitude], true, p.coords.accuracy),
      () => api.setLocDenied(), { enableHighAccuracy: true, timeout: 20000, maximumAge: 30000 })
    return () => id != null && navigator.geolocation.clearWatch(id)
  }, [])
}

let BIP = null
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); BIP = e; window.dispatchEvent(new Event('wext-bip')) })
window.addEventListener('appinstalled', () => { BIP = null; window.dispatchEvent(new Event('wext-bip')) })
function useInstall() {
  const [, force] = useState(0)
  useEffect(() => { const h = () => force(x => x + 1); window.addEventListener('wext-bip', h); return () => window.removeEventListener('wext-bip', h) }, [])
  const standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone
  if (standalone) return null
  const ua = navigator.userAgent
  if (BIP) return { kind: 'android', go: () => { const e = BIP; e.prompt(); e.userChoice && e.userChoice.then(() => { BIP = null; force(x => x + 1) }) } }
  const inApp = /FBAN|FBAV|FB_IAB|Instagram|WhatsApp|Messenger|Line\/|Viber|Telegram|GSA\//i.test(ua)
  if (/iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) return { kind: inApp ? 'iosInApp' : 'ios' }
  if (/Android/.test(ua)) return { kind: inApp ? 'androidInApp' : 'androidManual' }
  return null
}

const ShareIc = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0A84FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12M7.5 7.5 12 3l4.5 4.5" /><path d="M8 10H6a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-9a1 1 0 0 0-1-1h-2" /></svg>
function InstallGuide({ kind, onClose }) {
  const { t } = useT()
  const [copied, setCopied] = useState(false)
  const url = location.href.split('#')[0].split('?')[0]
  const copy = () => { try { navigator.clipboard.writeText(url).then(() => setCopied(true)) } catch { } }
  const Step = ({ n, children }) => <div className="row" style={{ gap: 12, alignItems: 'center', padding: '10px 12px', background: 'var(--card2, #f4f1ea)', borderRadius: 14 }}><b style={{ width: 28, height: 28, borderRadius: 99, background: '#111', color: '#FFC21A', display: 'grid', placeItems: 'center', flex: 'none' }}>{n}</b><div className="b" style={{ fontSize: 16, lineHeight: 1.35 }}>{children}</div></div>
  let steps
  if (kind === 'ios') steps = [<>{t('iosS1')} <span style={{ verticalAlign: 'middle', display: 'inline-block' }}><ShareIc /></span></>, <>{t('iosS2')} <span style={{ whiteSpace: 'nowrap' }}>“Add to Home Screen” <span style={{ border: '2px solid #111', borderRadius: 5, padding: '0 4px' }}>+</span></span></>, <>{t('iosS3')} “Add”</>]
  else if (kind === 'androidManual') steps = [t('andS1'), <>{t('andS2')} “Install app” / “Add to Home screen”</>, t('andS3')]
  else steps = [<>{t('inAppS1')} <b>⋯</b> / <b>⋮</b></>, kind === 'iosInApp' ? t('inAppS2ios') : t('inAppS2and'), t('inAppS3')]
  return <Sheet onClose={onClose}>
    <div className="center" style={{ fontSize: 44 }}>📲</div>
    <h2 className="center" style={{ marginBottom: 12 }}>{t('install')}</h2>
    <div className="col" style={{ gap: 8 }}>{steps.map((s, i) => <Step key={i} n={i + 1}>{s}</Step>)}</div>
    {kind !== 'ios' && kind !== 'androidManual' && <button className="btn outline" style={{ marginTop: 12 }} onClick={copy}>{copied ? '✓' : '🔗'} {t('copyLink')}</button>}
    <button className="btn primary" style={{ marginTop: 12 }} onClick={onClose}>{t('done')}</button>
    {kind === 'ios' && <div className="iosarrow">⬇</div>}
  </Sheet>
}

function Shell() {
  const { t } = useT()
  const user = useStore(s => s.user)
  const big = useStore(s => s.big)
  const unread = useStore(s => Object.values(s.chats).reduce((a, c) => a + (c.unread || 0), 0))
  const [tab, setTab] = useState(() => new URLSearchParams(location.search).has('admin') ? 'profile' : 'home')
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

  const installFn = inst ? (inst.kind === 'android' ? inst.go : () => setIosHelp(inst.kind)) : null
  const installSheet = iosHelp && <InstallGuide kind={iosHelp} onClose={() => setIosHelp(false)} />

  // what the other side did (or "someone is free now"): a note that stays 7 s
  const note = useStore(s => s.note)
  const lang = useStore(s => s.lang) || 'ka'
  useEffect(() => { if (note) toast((note.icon || '🔔') + ' ' + t(note.k, { name: note.name || '', cat: note.cat ? catName(note.cat, lang) : '' }), 7000) }, [note?.ts])
  if (!user) return <div className="app"><Onboarding install={installFn} />{installSheet}<Toaster /></div>

  const top = stack.slice(-1)[0]
  const Screen = top && SCREENS[top.name]
  const isPro = user.role === 'pro'
  const tabs = [['home', 'home', t('home')], isPro ? ['stats', 'star', t('stats')] : ['mypros', 'users', t('myProsTab')], ['chats', 'chat', t('inbox')], ['profile', 'user', t('profile')]]

  return <Nav.Provider value={nav}>
    <div className={'app' + (big ? ' big' : '')} data-theme={THEME}>
      {DEMO && <button className="demobar" onClick={() => setDemo(false)}>🧪 {t('demoBar')} · <u>{t('demoExit')}</u></button>}
      {Screen ? <Screen key={top.k} {...top.params} /> : <>
        {tab === 'home' && (isPro ? <ProHome /> : <Home install={installFn} />)}
        {tab === 'mypros' && <MyPros />}
        {tab === 'stats' && <ProStats />}
        {tab === 'chats' && <ChatList />}
        {tab === 'profile' && <Profile install={installFn} />}
        <div className="tabbar">{tabs.map(([k, ic, l]) => <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}><Icon n={ic} s={24} />{l}{k === 'chats' && unread > 0 && <span className="dotn">{unread}</span>}</button>)}</div>
      </>}
      {TEST_MODE && !user.testerOk && <Sheet onClose={() => api.updateUser({ testerOk: true })}>
        <h2>🧪 {t('testerTitle')}</h2>
        <div className="col" style={{ gap: 8, marginTop: 10, lineHeight: 1.45 }}>
          <p style={{ margin: 0 }}>✅ {t('testerWorks')}</p>
          <p style={{ margin: 0 }}>🧪 {t('testerSim')}</p>
          <p style={{ margin: 0 }}>🐞 {t('testerReport')}</p>
        </div>
        <div className="grid2" style={{ marginTop: 14 }}>
          <button className="btn light" onClick={() => { api.updateUser({ testerOk: true }); nav.go('bug') }}>{t('reportProblem')}</button>
          <button className="btn primary" onClick={() => api.updateUser({ testerOk: true })}>{t('understood')}</button>
        </div>
      </Sheet>}
      {user.pro?.registered && <Incoming />}
      <IncomingCall />
      {installSheet}
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
