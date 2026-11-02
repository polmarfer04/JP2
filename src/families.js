export const families = {MF:'Marhuenda Fernández',HG:'Hoffmann Gaspar'};
export function isSharedDate(date) {
  return (date >= '2026-12-01' && date <= '2026-12-07') ||
    (date >= '2026-12-09' && date <= '2026-12-14');
}
export function activityFamily(item, users=[]) {
  return item.family || (isSharedDate(item.date) ? 'Todos' : users.find(u=>u.id===item.author)?.family || 'MF');
}
export function visibleActivity(item, family, users=[]) {
  const owner = activityFamily(item,users);
  if (owner === 'Todos') return isSharedDate(item.date);
  return family !== 'Todos' && owner === family;
}
export function visibleDate(date, family) {
  if (family==='Todos') return isSharedDate(date);
  if (family==='HG') return date>='2026-11-30' && date<='2026-12-15';
  return date>='2026-11-28' && date<='2026-12-15';
}
export function destinationForDate(date,family) {
  if (family==='Todos') {
    if(date==='2026-12-07')return 'Takayama · Día compartido';
    if(date>='2026-12-01'&&date<='2026-12-03') return date==='2026-12-03'?'Osaka → Kioto':'Osaka';
    if(date>='2026-12-04'&&date<='2026-12-06') return date==='2026-12-06'?'Kioto · Antes de separar las rutas':'Kioto';
    return date==='2026-12-09'?'Tokio · Reencuentro':'Tokio';
  }
  if(family==='HG'&&date==='2026-11-30')return 'Málaga → Estambul';
  if(family==='HG'&&date==='2026-12-01')return 'Estambul → Osaka · Llegada a las 19:10';
  if(family==='HG'&&date==='2026-12-15')return 'Estambul → Málaga · Llegada a las 11:10';
  if(date==='2026-11-28')return 'Salida de Barcelona';
  if(date==='2026-12-15')return 'Regreso a Barcelona';
  if(date<'2026-12-03')return 'Osaka';
  if(date==='2026-12-03')return 'Osaka → Kioto';
  if(date<'2026-12-06')return 'Kioto';
  if(family==='HG') {
    if(date==='2026-12-06')return 'Kioto → Kanazawa';
    if(date==='2026-12-07')return 'Kanazawa → Takayama';
    if(date==='2026-12-08')return 'Takayama';
    if(date==='2026-12-09')return 'Takayama → Tokio';
  } else {
    if(date==='2026-12-06')return 'Kioto → Takayama';
    if(date==='2026-12-07')return 'Takayama';
    if(date==='2026-12-08')return 'Takayama → Kanazawa';
    if(date==='2026-12-09')return 'Kanazawa → Tokio';
  }
  return date==='2026-12-14'?'Tokio · Salida de Japón':'Tokio';
}
export function cityDates(city,family) {
  const dates={Osaka:family==='HG'?'1 — 3 DIC':'29 NOV — 3 DIC',Kioto:'3 — 6 DIC',Takayama:family==='HG'?'7 — 9 DIC':'6 — 8 DIC',Kanazawa:family==='HG'?'6 — 7 DIC':'8 — 9 DIC',Tokio:'9 — 14 DIC',Kobe:'2 DIC'};
  if(family==='Todos')return {Osaka:'1 — 3 DIC',Kioto:'3 — 6 DIC',Takayama:'7 DIC',Tokio:'9 — 14 DIC',Kobe:'2 DIC'}[city]||'';
  return dates[city]||'';
}

export function activityTimeZone(item) {
  if(['Barcelona','Málaga'].includes(item.city))return 'Europe/Madrid';
  if(item.city==='Estambul')return 'Europe/Istanbul';
  return 'Asia/Tokyo';
}
