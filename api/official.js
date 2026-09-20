import { seedEvents } from "../data/events.js";
import { monitorOfficialSource } from "../lib/official-monitor.js";

export default async function handler(req, res) {
  // Official sale/event verification is cached for one hour; CDN coalescing keeps upstream traffic bounded.
  res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=21600");
  const now = Date.now();
  const future = seedEvents
    .filter(event => (event.sourceUrl || event.secondarySourceUrl) && (!event.end || new Date(event.end).getTime() >= now - 86400000) && new Date(event.start || 0).getTime() >= now - 86400000);
  // Missing-seat-map events are the most important false-negative risk. Monitor them first, but
  // rotate the window every hour so a growing catalog never starves events beyond a fixed cap.
  const ticketHost=/tixcraft|kktix|ticketplus|kham|ibon|famiticket|udnfunlife|ticket\.mna|ticket\.com\.tw|opentix|tixfun|fansi|indievox|tickets\.books/i;
  const hasTicketSource=event=>[event.sourceUrl,event.secondarySourceUrl,event.ticketUrl,event.ticketSourceUrl,event.autoSourceUrl,...(event.sourceRefs||[]).map(x=>x?.url)].filter(Boolean).some(url=>ticketHost.test(String(url)));
  const rotate=(list,offset)=>list.length?[...list.slice(offset%list.length),...list.slice(0,offset%list.length)]:[];
  const bucket=Math.floor(Date.now()/3600000);
  const missing=future.filter(event=>!event.seatLayoutSourceUrl&&hasTicketSource(event));
  const established=future.filter(event=>event.seatLayoutSourceUrl||event.secondarySourceUrl||hasTicketSource(event));
  const missingWindow=rotate(missing,bucket*48).slice(0,48);
  const establishedWindow=rotate(established,bucket*12).slice(0,12);
  const candidates=[...new Map([...missingWindow,...establishedWindow].map(event=>[event.id,event])).values()].slice(0,60);
  const results = await Promise.all(candidates.map(event => monitorOfficialSource(event)));
  const live = results.filter(x => x.check?.status === "live").length;
  const review = results.filter(x => x.check?.status === "review").length;
  const unreachable = results.filter(x => x.check?.status === "unreachable").length;
  return res.status(200).json({
    updatedAt: new Date().toISOString(),
    monitored: results.length,
    live,
    review,
    unreachable,
    results
  });
}
