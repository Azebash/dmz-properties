import { describe, expect, it } from "vitest";
import {
  formatEnquiry,
  isHoneypotSubmission,
  parseEnquiry,
  RateLimiter,
} from "../src/lib/enquiries";

const validInput = {
  name: "Ada Buyer",
  email: "ADA@EXAMPLE.COM",
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
});

describe("formatEnquiry", () => {
  it("produces a readable notification body", () => {
    const result = parseEnquiry(validInput);
    if (!result.success) throw new Error("Fixture must be valid");

    const body = formatEnquiry(result.data);
    expect(body).toContain("Name: Ada Buyer");
    expect(body).toContain("Interest: Buying a plot");
    expect(body).toContain(validInput.message);
  });
});
