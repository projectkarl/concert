import fs from 'node:fs';
import { auditCoverage } from '../lib/coverage-auditor.js';
import { parseTmcCalendar, parseZeppCalendar, parseKpmcCalendar } from '../lib/venue-calendar-discovery.js';

let ok = true;
const fail = (msg, data) => { console.error(msg, data ?? ''); ok = false; };

const api = fs.readFileSync(new URL('../api/events.js', import.meta.url), 'utf8');
const coverageApi = fs.readFileSync(new URL('../api/coverage.js', import.meta.url), 'utf8');
const ticket = fs.readFileSync(new URL('../lib/taiwan-ticket-platform-discovery.js', import.meta.url), 'utf8');
const resolver = fs.readFileSync(new URL('../api/seat-map-image.js', import.meta.url), 'utf8');
const app = fs.readFileSync(new URL('../app.js', import.meta.url), 'utf8');

for (const [name, hit] of Object.entries({
  venueCalendars: /discoverVenueCalendars/.test(api),
  coverageAudit: /auditCoverage/.test(api) && /coverageSnapshot/.test(api),
  coverageEndpoint: /coverageAudit/.test(coverageApi),
  sixHourCache: /s-maxage=21600/.test(api),
  rotatingKktix: /rotatingKktixIndexes/.test(ticket) && /offtimemusic\.kktix\.cc/.test(ticket),
  recursiveSeatMap: /extractOfficialSeatLayoutCandidates/.test(resolver) && /extractOfficialTicketLinks/.test(resolver),
  autoRefresh: /startAutomaticEventVerification/.test(app) && /SERVER_REFRESH_MS/.test(app)
})) if (!hit) fail(`coverage capability missing: ${name}`);

const parsed = [
  ...parseTmcCalendar('演唱會 TEST STAR 2027.01.15 (五) 表演廳'),
  ...parseZeppCalendar('2027 1.20 WED TEST BAND [OPEN] 18:00 [START] 19:00'),
  ...parseKpmcCalendar('2027 01.22 (五) 19:30 海音館 TEST LIVE CONCERT')
];
if (parsed.length !== 3) fail('venue calendar parser regression', parsed);

const venueOnly = {
  id:'venue-only', artist:'TEST STAR', title:'TEST STAR CONCERT',
  start:'2027-01-15T00:00:00+08:00', end:'2027-01-15T23:59:00+08:00',
  venue:'臺北流行音樂中心 Taipei Music Center', region:'TW',
  sourceName:'臺北流行音樂中心官方活動', sourceUrl:'https://www.tmc.taipei/test',
  sourceRefs:[{name:'臺北流行音樂中心官方活動',url:'https://www.tmc.taipei/test'}]
};
const audit = auditCoverage({events:[venueOnly], rawDiscovered:[venueOnly], sourceHealth:[{name:'Test Ticket',discovered:0,errors:1}]});
if (audit.detectedCoverageGaps !== 1) fail('venue-only coverage gap not detected', audit);
if (audit.venueOnlyNeedsTicketBackfill !== 1) fail('ticket backfill queue not generated', audit);
if (audit.sourceHealthWarnings !== 1) fail('source health warning not propagated', audit);

if (!ok) process.exit(1);
console.log('NEUL v0.40.2 Coverage Auditor checks passed · venue-gap detection · auto backfill queue · rotating KKTIX · recursive official-map resolver · six-hour refresh');
