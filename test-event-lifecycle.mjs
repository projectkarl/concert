
import {eventLifecycle} from './lib/source-engine.mjs';
const ts=s=>+new Date(s);

let e={dateStart:'2026-09-19T19:00:00+08:00',status:'ended'};
if(eventLifecycle(e,ts('2026-09-17T23:06:00+08:00')).phase!=='upcoming')
  throw new Error('future event wrongly archived');

if(eventLifecycle(e,ts('2026-09-19T19:30:00+08:00')).phase!=='live')
  throw new Error('missing dateEnd archived at start time');

if(eventLifecycle(e,ts('2026-09-20T06:30:00+08:00')).phase!=='archive')
  throw new Error('fallback end never archives');

e={dateStart:'2026-11-19T19:00:00+08:00',dates:[
  '2026-11-19T19:00:00+08:00','2026-11-21T19:00:00+08:00','2026-11-22T19:00:00+08:00'
]};
if(eventLifecycle(e,ts('2026-11-20T12:00:00+08:00')).phase==='archive')
  throw new Error('multi-date event archived before final show');

console.log('event lifecycle PASS');
