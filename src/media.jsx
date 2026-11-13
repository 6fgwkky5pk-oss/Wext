// Voice note, photo and voice search helpers (no typing needed)
import React, { useRef, useState, useEffect } from 'react'
import { useT, Icon, toast } from './ui'

export function shrinkPhoto(file, max = 900) {
  return new Promise(res => {
    const img = new Image()
    img.onload = () => {
      const sc = Math.min(1, max / Math.max(img.width, img.height))
      const c = document.createElement('canvas'); c.width = Math.round(img.width * sc); c.height = Math.round(img.height * sc)
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height)
      URL.revokeObjectURL(img.src); res(c.toDataURL('image/jpeg', 0.68))
    }
    img.onerror = () => res(null)
    img.src = URL.createObjectURL(file)
  })
}
const toData = b => new Promise(r => { const f = new FileReader(); f.onload = () => r(f.result); f.readAsDataURL(b) })

export function PhotoBtn({ value, onChange }) {
  const { t } = useT()
  if (value) return <div className="mediabox"><img src={value} alt="" /><button className="x" onClick={() => onChange(null)}><Icon n="close" s={16} /></button></div>
  return <label className="mediabtn"><span className="e">📷</span><b>{t('addPhoto')}</b>
    <input type="file" accept="image/*" hidden onChange={async e => { const f = e.target.files[0]; if (f) onChange(await shrinkPhoto(f)) }} /></label>
}

export function VoiceBtn({ value, onChange, max = 30 }) {
  const { t } = useT()
  const [rec, setRec] = useState(null), [sec, setSec] = useState(0)
  const timer = useRef()
  const stop = () => { clearInterval(timer.current); rec && rec.state !== 'inactive' && rec.stop() }
  useEffect(() => () => clearInterval(timer.current), [])
  const start = async () => {
    if (!window.MediaRecorder || !navigator.mediaDevices) { toast(t('noMic')); return }
    let stream
    try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }) } catch { toast(t('noMic')); return }
    const type = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm'].find(x => MediaRecorder.isTypeSupported?.(x))
    const r = new MediaRecorder(stream, { ...(type ? { mimeType: type } : {}), audioBitsPerSecond: 24000 })
    const parts = []
    r.ondataavailable = e => e.data.size && parts.push(e.data)
    r.onstop = async () => { stream.getTracks().forEach(x => x.stop()); setRec(null); onChange(await toData(new Blob(parts, { type: r.mimeType || type }))) }
    r.start(); setRec(r); setSec(0)
    timer.current = setInterval(() => setSec(s => { if (s + 1 >= max) { clearInterval(timer.current); r.state !== 'inactive' && r.stop() } return s + 1 }), 1000)
  }
  if (value) return <div className="mediabox voice"><audio src={value} controls /><button className="x" onClick={() => onChange(null)}><Icon n="close" s={16} /></button></div>
  return <button className={'mediabtn' + (rec ? ' rec' : '')} onClick={rec ? stop : start}>
    <span className="e">{rec ? '⏹' : '🎤'}</span><b>{rec ? t('recStop', { s: max - sec }) : t('sayIt')}</b></button>
}

const SR = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)
const LOC = { ka: 'ka-GE', en: 'en-US', ru: 'ru-RU', de: 'de-DE', tr: 'tr-TR', uk: 'uk-UA', hy: 'hy-AM', az: 'az-AZ', es: 'es-ES', fr: 'fr-FR', ar: 'ar-SA', zh: 'zh-CN' }
export function MicSearch({ onText }) {
  const { lang } = useT()
  const [on, setOn] = useState(false)
  if (!SR) return null
  const go = () => {
    const r = new SR(); r.lang = LOC[lang] || lang; r.interimResults = false; r.maxAlternatives = 1
    r.onresult = e => onText(e.results[0][0].transcript.toLowerCase().replace(/[.,!?]/g, ''))
    r.onend = () => setOn(false); r.onerror = () => setOn(false)
    setOn(true); try { r.start() } catch { setOn(false) }
  }
  return <button className={'micbtn' + (on ? ' on' : '')} onClick={go} aria-label="voice"><span>🎤</span></button>
}
