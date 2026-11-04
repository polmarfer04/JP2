// Utilidades de ubicación compartidas por la interfaz, el servidor y las pruebas.
const round = n => String(Math.round(n * 1e6) / 1e6);

export function validCoords(lat, lng) {
  if ((lat ?? '') === '' && (lng ?? '') === '') return true;
  if (typeof lat !== 'string' || typeof lng !== 'string') return false;
  if (!/^-?\d{1,2}(\.\d+)?$/.test(lat) || !/^-?\d{1,3}(\.\d+)?$/.test(lng)) return false;
  return Math.abs(Number(lat)) <= 90 && Math.abs(Number(lng)) <= 180;
}

export const hasLocation = item => validCoords(item?.lat, item?.lng) && !!item?.lat && !!item?.lng;

// Acepta "34.69, 135.50" o enlaces largos de Google Maps (@lat,lng · !3dLAT!4dLNG · ?q=lat,lng).
export function parseCoords(text) {
  if (!text) return null;
  const s = decodeURIComponent(String(text).trim());
  const patterns = [/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/, /@(-?\d+\.\d+),(-?\d+\.\d+)/, /[?&](?:q|query|ll|destination)=(-?\d+\.\d+),\s*(-?\d+\.\d+)/, /^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/];
  for (const p of patterns) {
    const m = s.match(p);
    if (m) {
      const lat = round(Number(m[1])), lng = round(Number(m[2]));
      if (validCoords(lat, lng)) return { lat, lng };
    }
  }
  return null;
}

export const toCoords = (lat, lng) => ({ lat: round(Number(lat)), lng: round(Number(lng)) });

// Búsqueda de lugares con OpenStreetMap Nominatim (gratuito, sin clave; uso puntual al pulsar Buscar).
export async function searchPlaces(query) {
  const url = 'https://nominatim.openstreetmap.org/search?format=jsonv2&limit=6&accept-language=es&q=' + encodeURIComponent(query);
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw Error('No se pudo buscar el lugar. Inténtalo de nuevo en unos segundos.');
  return (await res.json()).map(r => ({ name: r.display_name, ...toCoords(r.lat, r.lon) }));
}
