import { seedEvents } from "../data/events.js";
import { monitorOfficialSource } from "../lib/official-monitor.js";

export default async function handler(req, res) {
  // Public source verification is intentionally cached for six hours to keep Hobby usage low
  // and avoid repeatedly requesting promoter/artist pages.
  res.setHeader("Cache-Control", "s-maxage=21600, stale-while-revalidate=86400");
  const now = Date.now();
  const candidates = seedEvents
    .filter(event => event.sourceUrl && (!event.end || new Date(event.end).getTime() >= now - 86400000) && new Date(event.start || 0).getTime() >= now - 86400000)
    .slice(0, 8);
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
