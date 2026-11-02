import {test} from 'node:test';import assert from 'node:assert/strict';
import {isSharedDate,activityFamily,visibleActivity,visibleDate,destinationForDate,cityDates} from '../src/families.js';
test('Family calendars include shared plans and keep the opposite routes separate',()=>{
 const mf={family:'MF',date:'2026-12-07'},hg={family:'HG',date:'2026-12-07'},shared={family:'Todos',date:'2026-12-03'};
 assert.equal(visibleActivity(mf,'MF'),true);assert.equal(visibleActivity(mf,'HG'),false);assert.equal(visibleActivity(hg,'HG'),true);assert.equal(visibleActivity(hg,'MF'),false);
 for(const family of ['MF','HG','Todos'])assert.equal(visibleActivity(shared,family),true);
 for(const family of ['MF','HG','Todos'])assert.equal(visibleActivity({family:'Todos',date:'2026-12-07'},family),true);
 assert.equal(visibleDate('2026-12-07','Todos'),true);assert.equal(visibleDate('2026-12-08','Todos'),false);
 assert.equal(destinationForDate('2026-12-07','Todos'),'Takayama · Día compartido');assert.equal(cityDates('Takayama','Todos'),'7 DIC');
 assert.equal(visibleActivity(mf,'Todos'),false);assert.equal(visibleActivity(hg,'Todos'),false);
 assert.equal(visibleActivity({family:'Todos',date:'2026-12-08'},'Todos'),false);
 for(const date of ['2026-12-01','2026-12-06','2026-12-07','2026-12-09','2026-12-14'])assert.equal(isSharedDate(date),true);
 for(const date of ['2026-11-30','2026-12-08','2026-12-15'])assert.equal(isSharedDate(date),false);
 assert.equal(visibleDate('2026-11-29','HG'),false);assert.equal(visibleDate('2026-12-01','HG'),true);assert.equal(visibleDate('2026-12-15','MF'),true);
 assert.equal(destinationForDate('2026-12-06','HG'),'Kioto → Kanazawa');assert.equal(destinationForDate('2026-12-07','HG'),'Kanazawa → Takayama');assert.equal(destinationForDate('2026-12-09','HG'),'Takayama → Tokio');
 assert.equal(destinationForDate('2026-12-06','MF'),'Kioto → Takayama');assert.equal(destinationForDate('2026-12-08','MF'),'Takayama → Kanazawa');
 assert.equal(cityDates('Kanazawa','HG'),'6 — 7 DIC');assert.equal(cityDates('Takayama','HG'),'7 — 9 DIC');assert.equal(cityDates('Takayama','MF'),'6 — 8 DIC');
 assert.equal(activityFamily({date:'2026-12-03',author:'pol'}),'Todos');assert.equal(activityFamily({date:'2026-12-08',author:'alvaro'},[{id:'alvaro',family:'HG'}]),'HG');
});
