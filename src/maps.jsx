import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Search } from 'lucide-react';
import { hasLocation, parseCoords, searchPlaces, toCoords } from './geo.js';

const tiles = () => L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, referrerPolicy: 'strict-origin-when-cross-origin', attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>' });
const pin = (cls = '') => L.divIcon({ className: 'pin ' + cls, html: '<span></span>', iconSize: [26, 26], iconAnchor: [13, 26], tooltipAnchor: [0, -24] });
const JAPAN = [[32, 129.5], [39, 142]];

// Mapa general: un pin por actividad con ubicación.
export function TripMap({ items, familyOf, onSelect }) {
  const el = useRef(null), map = useRef(null), layer = useRef(null);
  useEffect(() => {
    map.current = L.map(el.current, { scrollWheelZoom: false }).fitBounds(JAPAN);
    tiles().addTo(map.current);
    layer.current = L.featureGroup().addTo(map.current);
    return () => map.current.remove();
  }, []);
  useEffect(() => {
    layer.current.clearLayers();
    const located = items.filter(hasLocation);
    for (const x of located) {
      L.marker([Number(x.lat), Number(x.lng)], { icon: pin('pin-' + familyOf(x).toLowerCase()), title: x.title, keyboard: true })
        .bindTooltip(`<b>${escape(x.title)}</b><br>${escape(x.location || x.city || '')}`)
        .on('click', () => onSelect(x.id))
        .addTo(layer.current);
    }
    if (located.length) map.current.fitBounds(layer.current.getBounds(), { padding: [40, 40], maxZoom: 15 });
    else map.current.fitBounds(JAPAN);
  }, [items]);
  return <div ref={el} className="map" role="region" aria-label="Mapa de actividades" />;
}

// Mini mapa dentro de la ficha de una actividad.
export function MiniMap({ lat, lng }) {
  const el = useRef(null);
  useEffect(() => {
    const m = L.map(el.current, { scrollWheelZoom: false, zoomControl: false, dragging: false, attributionControl: true }).setView([Number(lat), Number(lng)], 15);
    tiles().addTo(m); L.marker([Number(lat), Number(lng)], { icon: pin() }).addTo(m);
    return () => m.remove();
  }, [lat, lng]);
  return <div ref={el} className="mini-map" />;
}

// Selector de ubicación para el formulario de actividad.
export function LocationPicker({ item, defaultQuery }) {
  const [loc, setLoc] = useState(hasLocation(item) ? { name: item.location || '', lat: item.lat, lng: item.lng } : null);
  const [query, setQuery] = useState(item.location || defaultQuery || '');
  const [results, setResults] = useState([]), [busy, setBusy] = useState(false), [msg, setMsg] = useState('');
  const el = useRef(null), map = useRef(null), marker = useRef(null), queryRef = useRef(query);
  queryRef.current = query;
  useEffect(() => {
    map.current = L.map(el.current, { scrollWheelZoom: false }).fitBounds(JAPAN);
    tiles().addTo(map.current);
    map.current.on('click', e => setLoc(l => ({ name: l?.name || (parseCoords(queryRef.current) ? '' : queryRef.current.trim()), ...toCoords(e.latlng.lat, e.latlng.lng) })));
    return () => map.current.remove();
  }, []);
  useEffect(() => {
    if (!loc) { marker.current?.remove(); marker.current = null; return; }
    const ll = [Number(loc.lat), Number(loc.lng)];
    if (!marker.current) {
      marker.current = L.marker(ll, { icon: pin(), draggable: true }).addTo(map.current);
      marker.current.on('dragend', () => { const p = marker.current.getLatLng(); setLoc(l => ({ ...l, ...toCoords(p.lat, p.lng) })); });
    } else marker.current.setLatLng(ll);
    map.current.setView(ll, Math.max(map.current.getZoom(), 15));
  }, [loc?.lat, loc?.lng]);
  const search = async () => {
    const q = query.trim(); if (!q) return;
    const direct = parseCoords(q);
    if (direct) { setLoc({ name: loc?.name || '', ...direct }); setResults([]); setMsg('Coordenadas detectadas.'); return; }
    setBusy(true); setMsg('');
    try { const r = await searchPlaces(q); setResults(r); if (!r.length) setMsg('Sin resultados. Prueba con otro nombre, añade la ciudad o haz clic en el mapa.'); }
    catch (e) { setMsg(e.message); } finally { setBusy(false); }
  };
  return <fieldset className="location-picker">
    <legend>Ubicación <span className="required">*</span></legend>
    <div className="location-search">
      <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); search(); } }} placeholder="Nombre del lugar, dirección o coordenadas" aria-label="Buscar ubicación" />
      <button type="button" onClick={search} disabled={busy}><Search size={15} /> {busy ? 'Buscando…' : 'Buscar'}</button>
    </div>
    {results.length > 0 && <ul className="location-results">{results.map((r, i) => <li key={i}><button type="button" onClick={() => { setLoc(r); setResults([]); setMsg(''); }}><MapPin size={14} /> {r.name}</button></li>)}</ul>}
    {msg && <p className="muted">{msg}</p>}
    <div ref={el} className="picker-map" />
    <p className="muted">{loc ? <><MapPin size={13} /> {loc.name ? loc.name.split(',').slice(0, 3).join(',') : 'Punto marcado'} · {loc.lat}, {loc.lng} · Arrastra el pin o haz clic en el mapa para ajustar. <button type="button" className="link-button" onClick={() => setLoc(null)}>Quitar</button></> : 'Busca el lugar o haz clic en el mapa para colocar el pin.'}</p>
    <input type="hidden" name="location" value={loc?.name || ''} />
    <input type="hidden" name="lat" value={loc?.lat || ''} />
    <input type="hidden" name="lng" value={loc?.lng || ''} />
  </fieldset>;
}

const escape = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
