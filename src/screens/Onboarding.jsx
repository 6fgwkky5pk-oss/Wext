import React, { useState } from 'react'
import { api, useStore, CLOUD } from '../store'
import * as cloud from '../cloud'
import { useT, Icon, toast } from '../ui'
import { LangSheet } from './Profile'
import { regionFor } from '../data'

const CC = { ge: '+995', tr: '+90', de: '+49' }

export default function Onboarding({ install }) {
  const { t, lang } = useT()
  const loc = useStore(s => s.loc)
  const [step, setStep] = useState(0)
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [sent, setSent] = useState(null)
  const [sms, setSms] = useState(null)
  const [langSheet, setLangSheet] = useState(false)
  const [name, setName] = useState('')
  const [role, setRole] = useState('client')
  const cc = CC[regionFor(loc || [41.92, 45.47]).id]
  const digits = phone.replace(/\D/g, '')

  const cfgTesters = useStore(s => s.config?.testersOnly)
  const [notListed, setNotListed] = useState(false)
  const sendCode = async () => {
    if (CLOUD && cfgTesters) { const ok = await cloud.testerAllowed(cloud.normPhone(cc + digits)); if (ok === false) { setNotListed(true); return } }
    setNotListed(false)
    // SMS provider is plugged in on the backend; in test mode the code is shown on screen
    // test mode (no SMS gateway yet): simulate an incoming SMS and auto-fill the code
    const c = String(Math.floor(1000 + Math.random() * 9000))
    setSent(c); setCode(''); setStep(2); setSms(null)
    setTimeout(() => setSms(c), 1200)
    c.split('').forEach((_, i) => setTimeout(() => setCode(c.slice(0, i + 1)), 2200 + i * 180))
    setTimeout(() => setStep(st => st === 2 ? 3 : st), 3300)
  }

  return <div className="splash">
    {langSheet && <LangSheet lang={lang} t={t} onClose={() => setLangSheet(false)} />}
    {step === 2 && sms && <div onClick={() => { setCode(sms); setStep(3) }} style={{ position: 'fixed', zIndex: 50, left: 10, right: 10, top: 'calc(10px + env(safe-area-inset-top, 0px))', background: 'rgba(250,250,250,.97)', color: '#111', borderRadius: 18, padding: '10px 14px', boxShadow: '0 10px 30px rgba(0,0,0,.25)', display: 'flex', gap: 10, alignItems: 'center', animation: 'smsIn .35s ease-out' }}>
      <div style={{ width: 36, height: 36, borderRadius: 9, background: '#34C759', display: 'grid', placeItems: 'center', fontSize: 20, flex: 'none' }}>💬</div>
      <div style={{ minWidth: 0 }}><div className="tiny b" style={{ opacity: .55 }}>WEXT · SMS</div><div className="small b">{t('codeSent', { code: sms })}</div><div className="tiny" style={{ opacity: .6 }}>{t('smsTest')}</div></div>
    </div>}
    {install && <button onClick={install} className="row" style={{ gap: 10, background: '#111', color: '#fff', borderRadius: 16, padding: '10px 12px', marginBottom: 14, width: '100%', textAlign: 'left' }}>
      <img src="icons/icon-192.png" alt="" style={{ width: 38, height: 38, borderRadius: 10 }} />
      <b className="grow small">📲 {t('install')}</b>
      <span className="btn sm yellow" style={{ pointerEvents: 'none' }}>{t('installBtn')}</span>
    </button>}
    <div className="row between" style={{ alignItems: 'center' }}>
      <div className="logo"><img src="icons/icon-192.png" alt="" />WEXT</div>
      <button className="langchip" onClick={() => setLangSheet(true)} aria-label="Language">🌐 {lang.toUpperCase()}</button>
    </div>
    <div style={{ marginTop: 28 }}>
      <h1 style={{ fontSize: 34 }}>{t('tagline')}</h1>
    </div>

    {step === 0 && <div className="obgrid">{['🚰', '⚡', '🔧', '🍇', '🎨', '🔑', '🧽', '🚗', '📦'].map((e, i) => <span key={i} style={{ animationDelay: i * 0.08 + 's' }}>{e}</span>)}</div>}
    <div style={{ marginTop: 'auto', paddingTop: 24 }} className="col">
      {step === 0 && <>
        <button className="btn primary" style={{ marginTop: 10 }} onClick={() => setStep(1)}>{t('continue')} <Icon n="right" /></button>
      </>}

      {step === 1 && <>
        <h2>{t('welcome')}</h2>
        <div className="field"><label>{t('phone')}</label>
          <div className="phone"><div className="inp cc">{cc}</div>
            <input className="inp" type="tel" inputMode="tel" autoFocus placeholder="5XX XX XX XX" value={phone} onChange={e => setPhone(e.target.value)} /></div>
        </div>
        {notListed && <div className="card small b" style={{ background: '#FFE3E3' }}>🧪 {t('notTester')}</div>}
        <button className="btn primary" disabled={digits.length < 7} onClick={sendCode}>{t('sendCode')}</button>
        <p className="tiny center" style={{ opacity: .6, margin: 0 }}>{t('terms')}</p>
      </>}

      {step === 2 && <>
        <h2>{t('code')}</h2>
        <p className="small" style={{ margin: 0, opacity: .7 }}>{cc} {phone}</p>
        <input className="inp" inputMode="numeric" autoFocus maxLength={4} placeholder="• • • •" style={{ fontSize: 28, letterSpacing: 14, textAlign: 'center', fontWeight: 900 }} value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ''))} />
        <button className="btn primary" disabled={code !== sent} onClick={() => setStep(3)}>{t('verify')}</button>
        <button className="tiny b" style={{ opacity: .6, padding: 6 }} onClick={sendCode}>↻ {t('sendCode')}</button>
      </>}

      {step === 3 && <>
        <div className="field"><label>{t('yourName')}</label><input className="inp" autoFocus value={name} onChange={e => setName(e.target.value)} /></div>
        <h3 style={{ marginTop: 6 }}>{t('whoAreYou')}</h3>
        {[['client', '🙋', t('iNeedHelp')], ['pro', '🧰', t('iAmPro')]].map(([k, e, l]) =>
          <button key={k} className={'rolecard' + (role === k ? ' on' : '')} onClick={() => setRole(k)}><span className="e">{e}</span><b style={{ fontSize: 17 }}>{l}</b></button>)}
        <button className="btn primary" disabled={name.trim().length < 2} onClick={() => api.login(cc + digits, name.trim(), role)}>{t('continue')}</button>
      </>}
    </div>
  </div>
}
