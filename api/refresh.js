export default async function handler(req, res) {
  res.setHeader("Cache-Control", "public, s-maxage=21600, stale-while-revalidate=86400");
  if (process.env.CRON_SECRET && req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ ok: false });
  }
  try {
    const host = req.headers.host;
    const proto = host?.includes("localhost") ? "http" : "https";
    const headers = { Accept: "application/json" };
    const [eventsResponse, officialResponse] = await Promise.all([
      fetch(`${proto}://${host}/api/events`, { headers, signal: AbortSignal.timeout(9000) }),
      fetch(`${proto}://${host}/api/official`, { headers, signal: AbortSignal.timeout(12000) })
    ]);
    if (!eventsResponse.ok) throw new Error(`events warm ${eventsResponse.status}`);
    const eventsBody = await eventsResponse.json();
    const officialBody = officialResponse.ok ? await officialResponse.json() : null;
    return res.status(200).json({
      ok: true,
      warmedEvents: eventsBody.count,
      warmedArtists: eventsBody.artistCount,
      upstream: eventsBody.upstream,
      autoUpdateEnabled: eventsBody.autoUpdateEnabled,
      discoveredEvents: eventsBody.discovery?.discoveredCount || 0,
      coverage: eventsBody.coverage ? {
        futureEvents: eventsBody.coverage.auditor?.futureEvents || 0,
        crossVerified: eventsBody.coverage.auditor?.crossVerified || 0,
        detectedCoverageGaps: eventsBody.coverage.auditor?.detectedCoverageGaps || 0,
        sourceWarnings: eventsBody.coverage.sourceWarnings || 0
      } : null,
      officialMonitor: officialBody ? { monitored: officialBody.monitored, live: officialBody.live, review: officialBody.review, unreachable: officialBody.unreachable } : { available: false },
      at: new Date().toISOString()
    });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
}
