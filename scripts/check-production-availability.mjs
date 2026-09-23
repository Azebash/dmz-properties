import { pathToFileURL } from "node:url";

export async function checkAvailability(baseUrl, fetcher = fetch) {
  const site = new URL(baseUrl);
  if (site.protocol !== "https:" && !(site.protocol === "http:" && site.hostname === "localhost")) {
    throw new Error("Monitoring requires an HTTPS site URL");
  }

  async function check(path) {
    const response = await fetcher(new URL(path, site.origin), {
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) throw new Error(`${path} returned HTTP ${response.status}`);
    return response.json();
  }

  const health = await check("/api/health");
  if (health.status !== "ok" || health.service !== "dmz-properties") {
    throw new Error("/api/health returned an unexpected service state");
  }

  const readiness = await check("/api/ready");
  if (readiness.scope !== "operational" || readiness.status !== "ready" ||
      readiness.checks?.supabaseReachable !== true ||
      readiness.checks?.enquiryPersistence !== true) {
    throw new Error("/api/ready has not verified live Supabase and enquiry persistence");
  }

  return { revision: health.revision || "unknown", operational: true };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const baseUrl = process.env.DMZ_MONITOR_URL || "https://dmz-properties.vercel.app";
  try {
    const result = await checkAvailability(baseUrl);
    console.log(`DMZ operational: ${result.revision}`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Production availability check failed");
    process.exitCode = 1;
  }
}
