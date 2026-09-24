import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "../src/app/api/ready/route";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

function configureCore() {
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://dmz.example");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://project.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "public-key");
  vi.stubEnv("SUPABASE_SECRET_KEY", "secret-key");
  vi.stubEnv("SUPABASE_PERSIST_ENQUIRIES", "true");
  vi.stubEnv("SUPABASE_CONTENT_SOURCE", "database");
}

describe("operational readiness route", () => {
  it("requires a live uncached database response, not just configured credentials", async () => {
    configureCore();
    const fetcher = vi.fn().mockRejectedValue(new Error("Database unavailable"));
    vi.stubGlobal("fetch", fetcher);

    const response = await GET();
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({
      scope: "operational",
      status: "not_ready",
      checks: { supabaseReachable: false },
    });
    expect(fetcher.mock.calls[0][1].cache).toBe("no-store");
  });

  it("stays operational with durable core services when optional email is absent", async () => {
    configureCore();
    vi.stubEnv("RESEND_API_KEY", "");
    vi.stubEnv("ENQUIRY_TO_EMAIL", "");
    vi.stubEnv("ENQUIRY_FROM_EMAIL", "");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("[]", { status: 200 })));

    const response = await GET();
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      scope: "operational",
      status: "ready",
      checks: { emailDelivery: false, supabaseReachable: true },
    });
    expect(response.headers.get("cache-control")).toContain("no-store");
  });

  it("rejects a non-JSON success response from the dependency", async () => {
    configureCore();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("<html>Unavailable</html>")));
    const response = await GET();
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ checks: { supabaseReachable: false } });
  });
});
