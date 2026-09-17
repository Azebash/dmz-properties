import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "../src/app/api/enquiries/route";

const validInput = {
  name: "Ada Buyer",
  email: "ada@example.com",
  phone: "+2348000000000",
  location: "London",
  interest: "Buying a plot",
  timeline: "Within 3 months",
  budget: "NGN 10,000,000",
  propertyReference: "DMZ-KYC-001",
  inspectionPreference: "Live video inspection",
  contactMethod: "WhatsApp",
  contactTime: "Weekdays after 18:00 GMT",
  message: "I would like to arrange a remote inspection.",
  consent: "accepted",
};

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
  vi.unstubAllGlobals();
  delete process.env.RESEND_API_KEY;
  delete process.env.ENQUIRY_TO_EMAIL;
  delete process.env.ENQUIRY_FROM_EMAIL;
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

  it("reports missing delivery configuration", async () => {
    const response = await POST(createRequest(validInput, "missing-config"));
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({
      message: expect.stringContaining("not configured"),
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
