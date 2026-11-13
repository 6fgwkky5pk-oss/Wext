import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'
createRoot(document.getElementById('root')).render(<App />)
if ('serviceWorker' in navigator && location.protocol === 'https:') window.addEventListener('load', () => navigator.serviceWorker.register('sw.js'))

// auto-update: when the app comes back to the screen, check for a newer release and reload quietly
let lastCheck = 0
async function checkUpdate() {
  if (location.protocol !== 'https:' || Date.now() - lastCheck < 60000) return
  lastCheck = Date.now()
  try {
    const r = await fetch('version.json?t=' + Date.now(), { cache: 'no-store' })
    const { v } = await r.json()
    if (v && v !== __BUILD__) { try { if (sessionStorage.getItem('wext:rl') === v) return; sessionStorage.setItem('wext:rl', v) } catch {} navigator.serviceWorker?.getRegistration().then(g => g && g.update()).catch(() => {}); location.reload() }
  } catch {}
}
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') checkUpdate() })
window.addEventListener('focus', checkUpdate)
setInterval(checkUpdate, 10 * 60000)
