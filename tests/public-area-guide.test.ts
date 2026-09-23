import { afterEach, describe, expect, it, vi } from "vitest";
import { getPublicAreaGuide } from "../src/lib/public-area-guide";
import { repositoryAreaGuideCopy } from "../src/lib/area-guide-copy";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("published area guide source", () => {
  it("uses the repository copy before the database rollout", async () => {
    vi.stubEnv("SUPABASE_CONTENT_SOURCE", "repository");
    expect(await getPublicAreaGuide()).toEqual(repositoryAreaGuideCopy);
  });

  it("reads only approved copy through the anonymous publication RPC", async () => {
    vi.stubEnv("SUPABASE_CONTENT_SOURCE", "database");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://project.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "public-key");
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify(repositoryAreaGuideCopy)));
    vi.stubGlobal("fetch", fetcher);
    expect(await getPublicAreaGuide()).toEqual(repositoryAreaGuideCopy);
    expect(String(fetcher.mock.calls[0][0])).toContain("/rpc/get_published_area_guide");
    expect(fetcher.mock.calls[0][1].body).toContain("kyc-homes-phase-ii");
    expect(fetcher.mock.calls[0][1].headers.apikey).toBe("public-key");
  });

  it("fails closed when the approved guide is unavailable", async () => {
    vi.stubEnv("SUPABASE_CONTENT_SOURCE", "database");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://project.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "public-key");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("null")));
    await expect(getPublicAreaGuide()).rejects.toThrow("Area guide copy is unavailable");
  });
});
