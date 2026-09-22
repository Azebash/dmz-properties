import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getReadiness } from "../src/lib/readiness";

const keys = [
  "NEXT_PUBLIC_SITE_URL",
  "VERCEL_PROJECT_PRODUCTION_URL",
  "VERCEL_URL",
  "RESEND_API_KEY",
  "ENQUIRY_TO_EMAIL",
  "ENQUIRY_FROM_EMAIL",
  "NEXT_PUBLIC_TURNSTILE_SITE_KEY",
  "TURNSTILE_SECRET_KEY",
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_SECRET_KEY",
  "SUPABASE_PERSIST_ENQUIRIES",
] as const;

const original = Object.fromEntries(keys.map((key) => [key, process.env[key]]));

beforeEach(() => {
  for (const key of keys) delete process.env[key];
});

afterEach(() => {
  for (const key of keys) {
    const value = original[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

describe("deployment readiness", () => {
  it("reports every missing production dependency", () => {
    const result = getReadiness();
    expect(result.ready).toBe(false);
    expect(result.checks).toEqual({
      canonicalUrl: false,
      emailDelivery: false,
      botProtection: false,
      distributedRateLimit: false,
      supabase: false,
      enquiryPersistence: false,
    });
  });

  it("reports ready only when all required services exist", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://dmz.example";
    process.env.RESEND_API_KEY = "key";
    process.env.ENQUIRY_TO_EMAIL = "team@example.com";
    process.env.ENQUIRY_FROM_EMAIL = "DMZ <enquiries@example.com>";
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = "site";
    process.env.TURNSTILE_SECRET_KEY = "secret";
    process.env.UPSTASH_REDIS_REST_URL = "https://redis.example";
    process.env.UPSTASH_REDIS_REST_TOKEN = "token";
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://project.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "publishable";
    process.env.SUPABASE_SECRET_KEY = "secret";
    process.env.SUPABASE_PERSIST_ENQUIRIES = "true";

    expect(getReadiness().ready).toBe(true);
  });

  it("treats email and Turnstile as optional when durable core services exist", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://dmz.example";
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://project.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "publishable";
    process.env.SUPABASE_SECRET_KEY = "secret";
    process.env.SUPABASE_PERSIST_ENQUIRIES = "true";

    const readiness = getReadiness();
    expect(readiness.ready).toBe(true);
    expect(readiness.checks.emailDelivery).toBe(false);
    expect(readiness.checks.botProtection).toBe(false);
    expect(readiness.checks.distributedRateLimit).toBe(true);
  });
});
