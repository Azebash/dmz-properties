import { describe, expect, it } from "vitest";
import {
  formatEnquiry,
  isHoneypotSubmission,
  parseEnquiry,
  RateLimiter,
} from "../src/lib/enquiries";

const futureDate = new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10);
const alternateFutureDate = new Date(Date.now() + 8 * 86_400_000)
  .toISOString()
  .slice(0, 10);

const validInput = {
  submissionKey: "11111111-1111-4111-8111-111111111111",
  name: "Ada Buyer",
  email: "ADA@EXAMPLE.COM",
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

describe("parseEnquiry", () => {
  it("accepts and normalizes a complete enquiry", () => {
    const result = parseEnquiry(validInput);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("ada@example.com");
      expect(result.data.interest).toBe("Buying a plot");
    }
  });

  it.each([
    ["name", "A"],
    ["email", "not-an-email"],
    ["phone", "123"],
    ["interest", "Unexpected option"],
    ["message", "Too short"],
    ["contactMethod", "Carrier pigeon"],
    ["consent", ""],
  ])("rejects an invalid %s", (field, value) => {
    const result = parseEnquiry({ ...validInput, [field]: value });
    expect(result.success).toBe(false);
  });

  it("limits user-controlled text lengths", () => {
    const result = parseEnquiry({
      ...validInput,
      message: "a".repeat(4_000),
    });

    expect(result.success).toBe(true);
    if (result.success) expect(result.data.message).toHaveLength(3_000);
  });

  it("requires an inspection type and date for inspection requests", () => {
    const result = parseEnquiry({
      ...validInput,
      interest: "Booking an inspection",
      inspectionPreference: "",
      inspectionDate: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid inspection preferences and impossible dates", () => {
    expect(
      parseEnquiry({ ...validInput, inspectionPreference: "Unlisted option" }).success,
    ).toBe(false);
    expect(
      parseEnquiry({ ...validInput, inspectionDate: "2026-02-30" }).success,
    ).toBe(false);
  });

  it("requires a time zone for inspection requests", () => {
    expect(
      parseEnquiry({
        ...validInput,
        interest: "Booking an inspection",
        timeZone: "",
      }).success,
    ).toBe(false);
  });
});

describe("spam controls", () => {
  it("detects a completed honeypot", () => {
    expect(isHoneypotSubmission({ website: "https://spam.example" })).toBe(true);
    expect(isHoneypotSubmission({ website: "" })).toBe(false);
  });

  it("limits repeated attempts and resets after the window", () => {
    const limiter = new RateLimiter(2, 1_000);

    expect(limiter.isLimited("visitor", 0)).toBe(false);
    expect(limiter.isLimited("visitor", 100)).toBe(false);
    expect(limiter.isLimited("visitor", 200)).toBe(true);
    expect(limiter.isLimited("visitor", 1_001)).toBe(false);
  });

  it("bounds retained identifiers in the local fallback", () => {
    const limiter = new RateLimiter(1, 10_000, 2);
    expect(limiter.isLimited("first", 0)).toBe(false);
    expect(limiter.isLimited("second", 0)).toBe(false);
    expect(limiter.isLimited("third", 0)).toBe(false);
    expect(limiter.isLimited("first", 1)).toBe(false);
  });
});

describe("formatEnquiry", () => {
  it("produces a readable notification body", () => {
    const result = parseEnquiry(validInput);
    if (!result.success) throw new Error("Fixture must be valid");

    const body = formatEnquiry(result.data);
    expect(body).toContain("Name: Ada Buyer");
    expect(body).toContain("Interest: Buying a plot");
    expect(body).toContain("Campaign source: facebook");
    expect(body).toContain("Referral code: ABUJA01");
    expect(body).toContain(validInput.message);
  });
});
