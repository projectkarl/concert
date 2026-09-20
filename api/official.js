import { seedEvents } from "../data/events.js";
import { monitorOfficialSource } from "../lib/official-monitor.js";

export default async function handler(req, res) {
  // Public source verification is intentionally cached for six hours to keep Hobby usage low
  // and avoid repeatedly requesting promoter/artist pages.
  res.setHeader("Cache-Control", "s-maxage=21600, stale-while-revalidate=86400");
  const now = Date.now();
  const future = seedEvents
    .filter(event => (event.sourceUrl || event.secondarySourceUrl) && (!event.end || new Date(event.end).getTime() >= now - 86400000) && new Date(event.start || 0).getTime() >= now - 86400000);
  // Seat-map linked and multi-source events are monitored first because their official map/price
  // can change after the concert has already been discovered. Fill remaining slots by date.
  const priority = future.filter(event => event.seatLayoutSourceUrl || event.secondarySourceUrl);
  const candidates = [...new Map([...priority, ...future].map(event => [event.id, event])).values()].slice(0, 60);
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
