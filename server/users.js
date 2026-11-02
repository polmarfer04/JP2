import { scryptSync,randomBytes } from 'node:crypto';
import { db } from './db.js';
for(const id of ['pol','monica','leyre','joaquin']) {
 const password=process.env['PASSWORD_'+id.toUpperCase()];
 if(!password || password.length<12) throw Error('Define PASSWORD_'+id.toUpperCase()+' con al menos 12 caracteres.');
}
for(const id of ['pol','monica','leyre','joaquin']) {
 const salt=randomBytes(16).toString('hex');
 const hash=scryptSync(process.env['PASSWORD_'+id.toUpperCase()],salt,64).toString('hex');
 db.prepare('UPDATE users SET password=? WHERE id=?').run(salt+':'+hash,id);
}
db.prepare('DELETE FROM sessions').run(); console.log('Cuatro accesos configurados. Sesiones anteriores revocadas.');
