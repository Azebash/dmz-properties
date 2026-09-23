import { describe, expect, it, vi } from "vitest";
import { checkAvailability } from "../scripts/check-production-availability.mjs";

const healthy = {
  health: { status: "ok", service: "dmz-properties", revision: "abc1234" },
  readiness: {
    scope: "operational",
    status: "ready",
    checks: { supabaseReachable: true, enquiryPersistence: true, emailDelivery: false },
  },
};

function fetcher(health = healthy.health, readiness = healthy.readiness) {
  return vi.fn(async (...args: Parameters<typeof fetch>) => {
    const [input] = args;
    const url = new URL(input instanceof Request ? input.url : input.toString());
    return new Response(JSON.stringify(url.pathname === "/api/health" ? health : readiness));
  });
}

describe("external operational monitor", () => {
  it("requires a healthy app and verified database, without demanding optional email", async () => {
    const request = fetcher();
    expect(await checkAvailability("https://dmz.example", request)).toEqual({
      revision: "abc1234",
      operational: true,
    });
    expect(request.mock.calls.map(([url]) => new URL(url.toString()).pathname)).toEqual(["/api/health", "/api/ready"]);
    expect(request.mock.calls[0][1]?.cache).toBe("no-store");
  });

  it("fails when readiness is configuration-only or the database is unreachable", async () => {
    await expect(checkAvailability("https://dmz.example", fetcher(healthy.health, {
      ...healthy.readiness, scope: "configuration",
    }))).rejects.toThrow("has not verified live Supabase");
    await expect(checkAvailability("https://dmz.example", fetcher(healthy.health, {
      ...healthy.readiness,
      checks: { ...healthy.readiness.checks, supabaseReachable: false },
    }))).rejects.toThrow("has not verified live Supabase");
  });

  it("fails on HTTP errors, wrong service, and insecure public origins", async () => {
    await expect(checkAvailability("https://dmz.example", vi.fn(async () => new Response(null, {
      status: 503,
    })))).rejects.toThrow("/api/health returned HTTP 503");
    await expect(checkAvailability("https://dmz.example", fetcher({
      ...healthy.health,
      service: "unrecognized",
    }))).rejects.toThrow("unexpected service state");
    await expect(checkAvailability("http://dmz.example", fetcher())).rejects.toThrow("HTTPS");
  });
});
