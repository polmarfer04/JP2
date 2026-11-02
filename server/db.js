import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
export const dataDir = process.env.DATA_DIR || path.resolve('data');
mkdirSync(dataDir,{recursive:true});
export const db = new DatabaseSync(path.join(dataDir,'japan.sqlite'));
db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,name TEXT NOT NULL,color TEXT NOT NULL,password TEXT);
CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,user_id TEXT REFERENCES users(id),expires INTEGER);
CREATE TABLE IF NOT EXISTS items(id TEXT PRIMARY KEY,type TEXT NOT NULL,data TEXT NOT NULL,author TEXT REFERENCES users(id),created TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS comments(id TEXT PRIMARY KEY,item_id TEXT REFERENCES items(id) ON DELETE CASCADE,author TEXT REFERENCES users(id),body TEXT NOT NULL,created TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS votes(item_id TEXT REFERENCES items(id) ON DELETE CASCADE,user_id TEXT REFERENCES users(id),value TEXT,PRIMARY KEY(item_id,user_id));
CREATE TABLE IF NOT EXISTS favorites(item_id TEXT REFERENCES items(id) ON DELETE CASCADE,user_id TEXT REFERENCES users(id),PRIMARY KEY(item_id,user_id));`);
for(const [id,name,color] of [['pol','Pol','#b64136'],['monica','Mónica','#c78b48'],['leyre','Leyre','#808c68'],['joaquin','Joaquín','#647e96']]) db.prepare('INSERT OR IGNORE INTO users(id,name,color,password) VALUES(?,?,?,NULL)').run(id,name,color);
db.exec("CREATE TABLE IF NOT EXISTS meta(key TEXT PRIMARY KEY)");
// One-time local migration: clear the previous itinerary, then preserve new plans.
if (!db.prepare("SELECT key FROM meta WHERE key='activities-cleared-v1'").get()) {
 db.exec("BEGIN IMMEDIATE; DELETE FROM items WHERE type='activity'; INSERT OR IGNORE INTO meta VALUES('seeded'); INSERT INTO meta VALUES('activities-cleared-v1'); COMMIT;");
}

if (!db.prepare('PRAGMA table_info(users)').all().some(c=>c.name==='family')) db.exec("ALTER TABLE users ADD COLUMN family TEXT NOT NULL DEFAULT 'MF' CHECK (family IN ('MF','HG'))");
