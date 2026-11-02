import { spawnSync } from 'node:child_process';
import { loadEnv } from 'vite';
const buildEnv = {...loadEnv('production', process.cwd(), 'VITE_'), ...process.env};
const {VITE_SUPABASE_URL:url,VITE_SUPABASE_PUBLISHABLE_KEY:key}=buildEnv;
function fail(message){console.error(message);process.exit(1);}
if(!url||!key) fail('Define VITE_SUPABASE_URL y VITE_SUPABASE_PUBLISHABLE_KEY en Netlify antes de desplegar.');
try{const parsed=new URL(url);if(parsed.protocol!=='https:'||!parsed.hostname.endsWith('.supabase.co')||parsed.username||parsed.password)fail('Usa la URL HTTPS de tu proyecto *.supabase.co.');}catch{fail('URL de Supabase no válida.');}
if(!key.startsWith('sb_publishable_')){try{const payload=JSON.parse(Buffer.from(key.split('.')[1],'base64url'));if(payload.role!=='anon')fail('Solo se admite la clave pública publishable o anon. Nunca uses service_role.');}catch{fail('Clave pública no válida.');}}
const result=spawnSync(process.platform==='win32'?'npm.cmd':'npm',['run','build'],{stdio:'inherit',env:{...buildEnv,VITE_BACKEND:'supabase'}});
process.exit(result.status??1);
