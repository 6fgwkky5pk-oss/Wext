import React, { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

export default function Map({ center, pros = [], focus, onPick, zoom = 14 }) {
  const el = useRef(), map = useRef(), layer = useRef()
  useEffect(() => {
    map.current = L.map(el.current, { zoomControl: false, attributionControl: false }).setView(center, zoom)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', { maxZoom: 19, subdomains: 'abcd' }).addTo(map.current)
    layer.current = L.layerGroup().addTo(map.current)
    return () => map.current.remove()
  }, [])
  useEffect(() => {
    const g = layer.current; if (!g) return
    g.clearLayers()
    L.marker(center, { icon: L.divIcon({ className: '', html: '<div class="mepin"></div>', iconSize: [22, 22], iconAnchor: [11, 11] }) }).addTo(g)
    const pts = [center]
    pros.forEach(p => {
      const sel = focus === p.id
      const bg = !p.online ? '#bdb7aa' : sel ? '#111' : '#FFC21A'
      const m = L.marker(p.pos, { icon: L.divIcon({ className: '', html: `<div class="pin" style="background:${bg}"><span>${p.icon || '🔧'}</span></div>`, iconSize: [36, 36], iconAnchor: [18, 36] }), zIndexOffset: sel ? 1000 : 0 }).addTo(g)
      if (onPick) m.on('click', () => onPick(p))
      if (p.online) pts.push(p.pos)
    })
    if (focus) { const f = pros.find(p => p.id === focus); if (f) map.current.fitBounds(L.latLngBounds([center, f.pos]).pad(0.5), { maxZoom: 15 }) }
    else if (pts.length > 1) map.current.fitBounds(L.latLngBounds(pts.slice(0, 6)).pad(0.25), { maxZoom: 15 })
    else map.current.setView(center, zoom)
  }, [center, pros, focus])
  return <div ref={el} className="map" />
}
