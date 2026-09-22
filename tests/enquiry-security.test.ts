import { describe, expect, it, vi } from "vitest";
import {
  isEnquiryRateLimited,
  verifyTurnstile,
} from "../src/lib/enquiry-security";

describe("distributed enquiry rate limiting", () => {
  it("uses the distributed count without exposing the raw identifier", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ result: 6 }), { status: 200 }),
    ) as unknown as typeof fetch;

    const limited = await isEnquiryRateLimited("203.0.113.42", fetcher, {
      UPSTASH_REDIS_REST_URL: "https://redis.example",
      UPSTASH_REDIS_REST_TOKEN: "secret",
    });

    expect(limited).toBe(true);
    const body = String(vi.mocked(fetcher).mock.calls[0][1]?.body);
    expect(body).not.toContain("203.0.113.42");
    expect(body).toContain("dmz:enquiry-rate:");
  });

  it("falls back to local limiting if the distributed store fails", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const fetcher = vi.fn().mockRejectedValue(new Error("offline")) as unknown as typeof fetch;
    const identifier = `fallback-${Date.now()}`;
    const environment = {
      UPSTASH_REDIS_REST_URL: "https://redis.example",
      UPSTASH_REDIS_REST_TOKEN: "secret",
    };

    expect(await isEnquiryRateLimited(identifier, fetcher, environment)).toBe(false);
    vi.restoreAllMocks();
  });
});

describe("Turnstile verification", () => {
  it("is optional when no secret is configured", async () => {
    expect(await verifyTurnstile("", "visitor", fetch, {})).toBe(true);
  });

  it("requires a token when protection is configured", async () => {
    expect(
      await verifyTurnstile("", "visitor", fetch, {
        TURNSTILE_SECRET_KEY: "secret",
      }),
    ).toBe(false);
  });

  it("accepts only a successful provider response", async () => {
    const successFetcher = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: true }), { status: 200 }),
    ) as unknown as typeof fetch;
    const failureFetcher = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: false }), { status: 200 }),
    ) as unknown as typeof fetch;

    expect(
      await verifyTurnstile("valid-token", "visitor", successFetcher, {
        TURNSTILE_SECRET_KEY: "secret",
      }),
    ).toBe(true);
    expect(
      await verifyTurnstile("invalid-token", "visitor", failureFetcher, {
        TURNSTILE_SECRET_KEY: "secret",
      }),
    ).toBe(false);
  });
});
