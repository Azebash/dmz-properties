import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const persistenceMock = vi.hoisted(() => vi.fn());
vi.mock("@/lib/admin/enquiry-persistence", () => ({
  persistEnquiry: persistenceMock,
}));

import { POST } from "../src/app/api/enquiries/route";

const futureDate = new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10);
const alternateFutureDate = new Date(Date.now() + 8 * 86_400_000)
  .toISOString()
  .slice(0, 10);

const validInput = {
  submissionKey: "11111111-1111-4111-8111-111111111111",
  name: "Ada Buyer",
  email: "ada@example.com",
  phone: "+2348000000000",
  location: "London",
  interest: "Buying a plot",
  timeline: "Within 3 months",
  budget: "NGN 10,000,000",
  propertyReference: "DMZ-KYC-001",
  inspectionPreference: "Live video inspection",
  inspectionDate: futureDate,
  alternateDate: alternateFutureDate,
  timeZone: "GMT",
  contactMethod: "WhatsApp",
  contactTime: "Weekdays after 18:00 GMT",
  sourcePage: "https://example.com/?utm_source=facebook",
  referrer: "https://facebook.com/",
  utmSource: "facebook",
  utmMedium: "paid-social",
  utmCampaign: "diaspora-september",
  referralCode: "ABUJA01",
  message: "I would like to arrange a remote inspection.",
  consent: "accepted",
};

const originalEmailEnvironment = {
  apiKey: process.env.RESEND_API_KEY,
  toEmail: process.env.ENQUIRY_TO_EMAIL,
  fromEmail: process.env.ENQUIRY_FROM_EMAIL,
  turnstileSiteKey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
  turnstileSecret: process.env.TURNSTILE_SECRET_KEY,
  upstashUrl: process.env.UPSTASH_REDIS_REST_URL,
  upstashToken: process.env.UPSTASH_REDIS_REST_TOKEN,
  supabaseSecret: process.env.SUPABASE_SECRET_KEY,
  persistEnquiries: process.env.SUPABASE_PERSIST_ENQUIRIES,
};

function restoreEnvironment(key: string, value: string | undefined) {
  if (value === undefined) delete process.env[key];
  else process.env[key] = value;
}

beforeEach(() => {
  persistenceMock.mockReset();
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  delete process.env.RESEND_API_KEY;
  delete process.env.ENQUIRY_TO_EMAIL;
  delete process.env.ENQUIRY_FROM_EMAIL;
  delete process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  delete process.env.TURNSTILE_SECRET_KEY;
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;
  delete process.env.SUPABASE_SECRET_KEY;
  delete process.env.SUPABASE_PERSIST_ENQUIRIES;
});

function createRequest(
  body: Record<string, unknown>,
  identifier: string,
  headers: Record<string, string> = {},
) {
  return new NextRequest("http://localhost/api/enquiries", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "http://localhost",
      "x-forwarded-for": identifier,
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  restoreEnvironment("RESEND_API_KEY", originalEmailEnvironment.apiKey);
  restoreEnvironment("ENQUIRY_TO_EMAIL", originalEmailEnvironment.toEmail);
  restoreEnvironment("ENQUIRY_FROM_EMAIL", originalEmailEnvironment.fromEmail);
  restoreEnvironment(
    "NEXT_PUBLIC_TURNSTILE_SITE_KEY",
    originalEmailEnvironment.turnstileSiteKey,
  );
  restoreEnvironment("TURNSTILE_SECRET_KEY", originalEmailEnvironment.turnstileSecret);
  restoreEnvironment("UPSTASH_REDIS_REST_URL", originalEmailEnvironment.upstashUrl);
  restoreEnvironment("UPSTASH_REDIS_REST_TOKEN", originalEmailEnvironment.upstashToken);
  restoreEnvironment("SUPABASE_SECRET_KEY", originalEmailEnvironment.supabaseSecret);
  restoreEnvironment(
    "SUPABASE_PERSIST_ENQUIRIES",
    originalEmailEnvironment.persistEnquiries,
  );
});

describe("POST /api/enquiries", () => {
  it("rejects invalid submissions before contacting the email service", async () => {
    const emailFetch = vi.fn();
    vi.stubGlobal("fetch", emailFetch);

    const response = await POST(
      createRequest({ ...validInput, email: "invalid" }, "invalid-input"),
    );

    expect(response.status).toBe(400);
    expect(emailFetch).not.toHaveBeenCalled();
  });

  it("quietly accepts honeypot submissions", async () => {
    const response = await POST(
      createRequest({ ...validInput, website: "https://spam.example" }, "honeypot"),
    );
    expect(response.status).toBe(200);
  });

  it("rejects cross-origin submissions", async () => {
    const response = await POST(
      createRequest(validInput, "cross-origin", { origin: "https://attacker.example" }),
    );
    expect(response.status).toBe(403);
  });

  it("rejects submissions without an origin header", async () => {
    const response = await POST(
      createRequest(validInput, "missing-origin", { origin: "" }),
    );
    expect(response.status).toBe(403);
  });

  it("reports missing delivery configuration", async () => {
    const response = await POST(createRequest(validInput, "missing-config"));
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({
      message: expect.stringContaining("not configured"),
    });
  });

  it("succeeds without email when Supabase persistence succeeds", async () => {
    process.env.SUPABASE_PERSIST_ENQUIRIES = "true";
    persistenceMock.mockResolvedValue("enquiry-id");

    const response = await POST(createRequest(validInput, "persisted-no-email"));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      message: expect.stringContaining("received"),
    });
    expect(persistenceMock).toHaveBeenCalledOnce();
  });

  it("fails safely when required Supabase persistence fails", async () => {
    process.env.SUPABASE_PERSIST_ENQUIRIES = "true";
    persistenceMock.mockRejectedValue(new Error("offline"));

    const response = await POST(createRequest(validInput, "persistence-failure"));
    expect(response.status).toBe(503);
    expect(persistenceMock).toHaveBeenCalledOnce();
  });

  it("fails closed when security-provider keys are only partially configured", async () => {
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = "site-key-without-secret";
    const response = await POST(createRequest(validInput, "partial-security"));
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({
      message: expect.stringContaining("security"),
    });
  });

  it("delivers the internal notification and buyer acknowledgement", async () => {
    process.env.RESEND_API_KEY = "test-key";
    process.env.ENQUIRY_TO_EMAIL = "team@example.com";
    process.env.ENQUIRY_FROM_EMAIL = "DMZ Properties <enquiries@example.com>";
    const emailFetch = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", emailFetch);

    const response = await POST(createRequest(validInput, "successful-delivery"));

    expect(response.status).toBe(200);
    expect(emailFetch).toHaveBeenCalledTimes(2);
    const internalMessage = JSON.parse(String(emailFetch.mock.calls[0][1]?.body));
    const acknowledgement = JSON.parse(String(emailFetch.mock.calls[1][1]?.body));
    expect(internalMessage.to).toEqual(["team@example.com"]);
    expect(internalMessage.reply_to).toBe(validInput.email);
    expect(internalMessage.text).toContain("Campaign source: facebook");
    expect(acknowledgement.to).toEqual([validInput.email]);
  });

  it("returns a delivery error when the provider rejects the notification", async () => {
    process.env.RESEND_API_KEY = "test-key";
    process.env.ENQUIRY_TO_EMAIL = "team@example.com";
    process.env.ENQUIRY_FROM_EMAIL = "DMZ Properties <enquiries@example.com>";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("{}", { status: 500 })),
    );

    const response = await POST(createRequest(validInput, "failed-delivery"));
    expect(response.status).toBe(502);
  });

  it("reports success but logs when only the acknowledgement fails", async () => {
    process.env.RESEND_API_KEY = "test-key";
    process.env.ENQUIRY_TO_EMAIL = "team@example.com";
    process.env.ENQUIRY_FROM_EMAIL = "DMZ Properties <enquiries@example.com>";
    const emailFetch = vi
      .fn()
      .mockResolvedValueOnce(new Response("{}", { status: 200 }))
      .mockResolvedValueOnce(new Response("{}", { status: 500 }));
    vi.stubGlobal("fetch", emailFetch);

    const response = await POST(createRequest(validInput, "acknowledgement-failure"));
    expect(response.status).toBe(200);
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining("acknowledgement_rejected"),
    );
  });

  it("rejects unknown property references", async () => {
    const response = await POST(
      createRequest(
        { ...validInput, propertyReference: "UNKNOWN-PROPERTY" },
        "unknown-property",
      ),
    );
    expect(response.status).toBe(400);
  });

  it("rate limits repeated requests from the same address", async () => {
    let response: Response | undefined;
    for (let attempt = 0; attempt < 6; attempt += 1) {
      response = await POST(
        createRequest({ ...validInput, email: "invalid" }, "repeated-address"),
      );
    }
    expect(response?.status).toBe(429);
  });
});
