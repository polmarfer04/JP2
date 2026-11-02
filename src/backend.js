import { createClient } from '@supabase/supabase-js';
const env = import.meta.env || {};
export const cloud = env.VITE_BACKEND === 'supabase';
const configured = env.VITE_SUPABASE_URL && env.VITE_SUPABASE_PUBLISHABLE_KEY;
const linkType=typeof window!=='undefined'?new URLSearchParams(window.location.hash.slice(1)).get('type'):null;
export const passwordLink=cloud&&['invite','recovery'].includes(linkType);
const client = cloud && configured ? createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY) : null;
function check(result) { if (result.error) throw new Error(result.error.message); return result.data; }
async function profile() {
  const { user } = check(await client.auth.getUser());
  if (!user) return null;
  const row = check(await client.from('profiles').select('*').eq('auth_id',user.id).maybeSingle());
  if (!row) { await client.auth.signOut(); throw Error('Tu cuenta no tiene acceso a este viaje. Consulta al administrador.'); }
  return {id:row.id,name:row.name,color:row.color,family:row.family||'MF'};
}
export async function api(path, method='GET', body) {
  if (!cloud) {
    const response = await fetch('/api'+path, {method,headers:{'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});
    const data = await response.json(); if (!response.ok) throw Error(data.error || 'No se pudo completar la acción'); return data;
  }
  if (!client) throw Error('Falta conectar Supabase. Configura las variables públicas de la web y vuelve a desplegar.');
  if (path === '/password-session') {
    const {session}=check(await client.auth.getSession());
    if(!session)throw Error('El enlace no es válido o ha caducado. Pide una nueva invitación.');
    return {ok:true};
  }
  if (path === '/password') {
    if(typeof body.password!=='string'||body.password.length<12)throw Error('Usa al menos 12 caracteres.');
    check(await client.auth.updateUser({password:body.password}));
    return {ok:true};
  }
  if (path === '/login') {
    check(await client.auth.signInWithPassword({email:body.email,password:body.password}));
    return {user:await profile()};
  }
  if (path === '/session') {
    const {session} = check(await client.auth.getSession());
    return {user:session?await profile():null};
  }
  if (path === '/logout') {check(await client.auth.signOut());return {ok:true};}
  const user = await profile(); if (!user) throw Error('Inicia sesión para continuar');
  if (path === '/state') {
    const [users,items,comments,votes,favorites] = await Promise.all([
      client.from('profiles').select('*'),client.from('items').select('*').order('created',{ascending:false}),
      client.from('comments').select('*').order('created'),client.from('votes').select('*'),client.from('favorites').select('*')
    ]);
    return {users:check(users).map(u=>({id:u.id,name:u.name,color:u.color,family:u.family||'MF'})),items:check(items).map(({data,...item})=>({...data,...item})),comments:check(comments),votes:check(votes),favorites:check(favorites)};
  }
  if (path === '/items' && method === 'POST') {
    const {type,...data} = body;
    return check(await client.from('items').insert({type,data,author:user.id}).select('id').single());
  }
  const match = path.match(/^\/items\/([^/]+)(?:\/(comments|vote|favorite|schedule))?$/);
  if (!match) throw Error('Acción no disponible');
  const [,id,action] = match;
  if (action === 'comments') check(await client.from('comments').insert({item_id:id,author:user.id,body:body.body}));
  else if (action === 'vote') check(await client.from('votes').upsert({item_id:id,user_id:user.id,value:body.value},{onConflict:'item_id,user_id'}));
  else if (action === 'favorite') {
    if(body.active) check(await client.from('favorites').upsert({item_id:id,user_id:user.id},{onConflict:'item_id,user_id'}));
    else check(await client.from('favorites').delete().eq('item_id',id).eq('user_id',user.id));
  } else if (action === 'schedule') {
    const {type,...data}=body;
    return {id:check(await client.rpc('schedule_idea',{idea_id:id,activity_data:data}))};
  } else if (method === 'DELETE') check(await client.from('items').delete().eq('id',id));
  else if (method === 'PATCH') check(await client.rpc('edit_item',{item_id:id,patch:body}));
  else throw Error('Acción no disponible');
  return {ok:true};
}
export function subscribe(onChange) {
  if (!cloud) { const events=new EventSource('/api/events');events.onmessage=onChange;return ()=>events.close(); }
  if (!client) return ()=>{};
  let channel=client.channel('trip-'+crypto.randomUUID());
  for (const table of ['items','comments','votes','favorites','profiles']) channel=channel.on('postgres_changes',{event:'*',schema:'public',table},onChange);
  channel.subscribe();
  const {data:{subscription}}=client.auth.onAuthStateChange(()=>setTimeout(onChange,0));
  return ()=>{client.removeChannel(channel);subscription.unsubscribe();};
}
