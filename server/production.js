import { db } from './db.js';
// Provision once; restarting must not reset passwords or revoke sessions.
if (db.prepare('SELECT COUNT(*) AS count FROM users WHERE password IS NULL').get().count > 0) {
  await import('./users.js');
}
await import('./index.js');
