import React, { useState } from 'react'
import { api, useStore } from '../store'
import { LANGS } from '../i18n'
import { useT, Icon, toast } from '../ui'
import { regionFor } from '../data'

const CC = { ge: '+995', tr: '+90', de: '+49' }

export default function Onboarding({ install }) {
  const { t, lang } = useT()
  const loc = useStore(s => s.loc)
  const [step, setStep] = useState(0)
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [sent, setSent] = useState(null)
  const [name, setName] = useState('')
  const [role, setRole] = useState('client')
  const cc = CC[regionFor(loc || [41.92, 45.47]).id]
  const digits = phone.replace(/\D/g, '')

  const sendCode = () => {
    // SMS provider is plugged in on the backend; in test mode the code is shown on screen
    // test mode: no SMS gateway yet -> go straight to name step (no code needed)
    setStep(3)
  }

  return <div className="splash">
    {install && <button onClick={install} className="row" style={{ gap: 10, background: '#111', color: '#fff', borderRadius: 16, padding: '10px 12px', marginBottom: 14, width: '100%', textAlign: 'left' }}>
      <img src="icons/icon-192.png" alt="" style={{ width: 38, height: 38, borderRadius: 10 }} />
      <b className="grow small">📲 {t('install')}</b>
      <span className="btn sm yellow" style={{ pointerEvents: 'none' }}>{t('installBtn')}</span>
    </button>}
    <div className="logo"><img src="icons/icon-192.png" alt="" />WEXT</div>
    <div style={{ marginTop: 28 }}>
      <h1 style={{ fontSize: 34 }}>{t('tagline')}</h1>
    </div>

    {step === 0 && <div className="obgrid">{['🚰', '⚡', '🔧', '🍇', '🎨', '🔑', '🧽', '🚗', '📦'].map((e, i) => <span key={i} style={{ animationDelay: i * 0.08 + 's' }}>{e}</span>)}</div>}
    <div style={{ marginTop: 'auto', paddingTop: 24 }} className="col">
      {step === 0 && <>
        <div className="row" style={{ flexWrap: 'wrap', gap: 8 }}>
          {LANGS.map(l => <button key={l.code} className={'chip' + (lang === l.code ? ' on' : '')} onClick={() => api.setLang(l.code)}>{l.label}</button>)}
        </div>
        <button className="btn primary" style={{ marginTop: 10 }} onClick={() => setStep(1)}>{t('continue')} <Icon n="right" /></button>
      </>}

      {step === 1 && <>
        <h2>{t('welcome')}</h2>
        <div className="field"><label>{t('phone')}</label>
          <div className="phone"><div className="inp cc">{cc}</div>
            <input className="inp" type="tel" inputMode="tel" autoFocus placeholder="5XX XX XX XX" value={phone} onChange={e => setPhone(e.target.value)} /></div>
        </div>
        <button className="btn primary" disabled={digits.length < 7} onClick={sendCode}>{t('continue')} <Icon n="right" /></button>
        <p className="tiny center" style={{ opacity: .6, margin: 0 }}>{t('terms')}</p>
      </>}

      {step === 2 && <>
        <h2>{t('code')}</h2>
        <p className="small" style={{ margin: 0, opacity: .7 }}>{cc} {phone}</p>
        <input className="inp" inputMode="numeric" autoFocus maxLength={4} placeholder="• • • •" style={{ fontSize: 28, letterSpacing: 14, textAlign: 'center', fontWeight: 900 }} value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ''))} />
        {sent && <p className="small center b" style={{ margin: 0 }}>{t('codeSent', { code: sent })}</p>}
        <button className="btn primary" disabled={code !== sent} onClick={() => setStep(3)}>{t('verify')}</button>
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
