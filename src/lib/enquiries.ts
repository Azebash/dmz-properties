export const allowedInterests = [
  "Buying a plot",
  "Buying a developed property",
  "Selling my KYC Homes Phase II property",
  "Booking an inspection",
  "General question",
] as const;

export type Enquiry = {
  name: string;
  email: string;
  phone: string;
  location: string;
  interest: (typeof allowedInterests)[number];
  timeline: string;
  budget: string;
  propertyReference: string;
  inspectionPreference: string;
  contactMethod: "WhatsApp" | "Phone" | "Email";
  contactTime: string;
  message: string;
  consent: "accepted";
};

type ParseResult =
  | { success: true; data: Enquiry }
  | { success: false; message: string };

function text(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

export function parseEnquiry(input: Record<string, unknown>): ParseResult {
  const name = text(input.name, 100);
  const email = text(input.email, 200).toLowerCase();
  const phone = text(input.phone, 40);
  const location = text(input.location, 100);
  const interest = text(input.interest, 100);
  const timeline = text(input.timeline, 100);
  const budget = text(input.budget, 100);
  const propertyReference = text(input.propertyReference, 100);
  const inspectionPreference = text(input.inspectionPreference, 100);
  const contactMethod = text(input.contactMethod, 30);
  const contactTime = text(input.contactTime, 100);
  const message = text(input.message, 3000);
  const consent = text(input.consent, 20);

  if (name.length < 2) {
    return { success: false, message: "Please provide your full name." };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, message: "Please provide a valid email address." };
  }

  if (phone.length < 7) {
    return { success: false, message: "Please provide a valid phone number." };
  }

  if (!allowedInterests.includes(interest as Enquiry["interest"])) {
    return { success: false, message: "Please select a valid enquiry type." };
  }

  if (message.length < 10) {
    return { success: false, message: "Please provide more information about your enquiry." };
  }

  if (!["WhatsApp", "Phone", "Email"].includes(contactMethod)) {
    return { success: false, message: "Please select a preferred contact method." };
  }

  if (consent !== "accepted") {
    return { success: false, message: "Please accept the privacy notice." };
  }

  return {
    success: true,
    data: {
      name,
      email,
      phone,
      location,
      interest: interest as Enquiry["interest"],
      timeline,
      budget,
      propertyReference,
      inspectionPreference,
      contactMethod: contactMethod as Enquiry["contactMethod"],
      contactTime,
      message,
      consent: "accepted",
    },
  };
}

export function isHoneypotSubmission(input: Record<string, unknown>) {
  return text(input.website, 200).length > 0;
}

export class RateLimiter {
  private readonly attempts = new Map<
    string,
    { count: number; resetAt: number }
  >();

  constructor(
    private readonly maximumAttempts: number,
    private readonly windowMilliseconds: number,
  ) {}

  isLimited(identifier: string, now = Date.now()) {
    const current = this.attempts.get(identifier);

    if (!current || current.resetAt <= now) {
      this.attempts.set(identifier, {
        count: 1,
        resetAt: now + this.windowMilliseconds,
      });
      return false;
    }

    current.count += 1;
    return current.count > this.maximumAttempts;
  }
}

export function formatEnquiry(enquiry: Enquiry) {
  return [
    `Name: ${enquiry.name}`,
    `Email: ${enquiry.email}`,
    `Phone: ${enquiry.phone}`,
    `Location: ${enquiry.location || "Not provided"}`,
    `Interest: ${enquiry.interest}`,
    `Timeline: ${enquiry.timeline || "Not provided"}`,
    `Budget / expected price: ${enquiry.budget || "Not provided"}`,
    `Property reference: ${enquiry.propertyReference || "General enquiry"}`,
    `Inspection preference: ${enquiry.inspectionPreference || "Not selected"}`,
    `Preferred contact: ${enquiry.contactMethod}`,
    `Preferred contact time: ${enquiry.contactTime || "Not provided"}`,
    "",
    enquiry.message,
  ].join("\n");
}
