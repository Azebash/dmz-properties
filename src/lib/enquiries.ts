export const allowedInterests = [
  "Buying a plot",
  "Buying a developed property",
  "Selling my KYC Homes Phase II property",
  "Booking an inspection",
  "General question",
] as const;

export const allowedInspectionPreferences = [
  "Physical inspection",
  "Live video inspection",
  "Representative inspection",
] as const;

export type Enquiry = {
  submissionKey: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  interest: (typeof allowedInterests)[number];
  timeline: string;
  budget: string;
  propertyReference: string;
  inspectionPreference: string;
  inspectionDate: string;
  alternateDate: string;
  timeZone: string;
  contactMethod: "WhatsApp" | "Phone" | "Email";
  contactTime: string;
  sourcePage: string;
  referrer: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  referralCode: string;
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
  const submissionKey = text(input.submissionKey, 40);
  const name = text(input.name, 100);
  const email = text(input.email, 200).toLowerCase();
  const phone = text(input.phone, 40);
  const location = text(input.location, 100);
  const interest = text(input.interest, 100);
  const timeline = text(input.timeline, 100);
  const budget = text(input.budget, 100);
  const propertyReference = text(input.propertyReference, 100);
  const inspectionPreference = text(input.inspectionPreference, 100);
  const inspectionDate = text(input.inspectionDate, 20);
  const alternateDate = text(input.alternateDate, 20);
  const timeZone = text(input.timeZone, 100);
  const contactMethod = text(input.contactMethod, 30);
  const contactTime = text(input.contactTime, 100);
  const sourcePage = text(input.sourcePage, 500);
  const referrer = text(input.referrer, 500);
  const utmSource = text(input.utmSource, 100);
  const utmMedium = text(input.utmMedium, 100);
  const utmCampaign = text(input.utmCampaign, 150);
  const referralCode = text(input.referralCode, 100);
  const message = text(input.message, 3000);
  const consent = text(input.consent, 20);

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(submissionKey)) {
    return { success: false, message: "Invalid submission identifier." };
  }

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

  if (
    inspectionPreference &&
    !allowedInspectionPreferences.includes(
      inspectionPreference as (typeof allowedInspectionPreferences)[number],
    )
  ) {
    return { success: false, message: "Please select a valid inspection type." };
  }

  const isCalendarDate = (value: string) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const date = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
  };

  if (
    interest === "Booking an inspection" &&
    (!inspectionPreference || !isCalendarDate(inspectionDate) || !timeZone)
  ) {
    return {
      success: false,
      message: "Please select an inspection type and preferred date.",
    };
  }


  if (inspectionDate && inspectionDate < new Date().toISOString().slice(0, 10)) {
    return { success: false, message: "Inspection dates cannot be in the past." };
  }

  if (alternateDate && !isCalendarDate(alternateDate)) {
    return { success: false, message: "Please provide a valid alternate date." };
  }

  if (consent !== "accepted") {
    return { success: false, message: "Please accept the privacy notice." };
  }

  return {
    success: true,
    data: {
      submissionKey,
      name,
      email,
      phone,
      location,
      interest: interest as Enquiry["interest"],
      timeline,
      budget,
      propertyReference,
      inspectionPreference,
      inspectionDate,
      alternateDate,
      timeZone,
      contactMethod: contactMethod as Enquiry["contactMethod"],
      contactTime,
      sourcePage,
      referrer,
      utmSource,
      utmMedium,
      utmCampaign,
      referralCode,
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
    private readonly maximumEntries = 5_000,
  ) {}

  isLimited(identifier: string, now = Date.now()) {
    if (this.attempts.size >= this.maximumEntries) {
      for (const [key, attempt] of this.attempts) {
        if (attempt.resetAt <= now) this.attempts.delete(key);
      }
      while (this.attempts.size >= this.maximumEntries) {
        const oldest = this.attempts.keys().next().value;
        if (oldest === undefined) break;
        this.attempts.delete(oldest);
      }
    }

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
    `Preferred inspection date: ${enquiry.inspectionDate || "Not selected"}`,
    `Alternate inspection date: ${enquiry.alternateDate || "Not selected"}`,
    `Time zone: ${enquiry.timeZone || "Not provided"}`,
    `Preferred contact: ${enquiry.contactMethod}`,
    `Preferred contact time: ${enquiry.contactTime || "Not provided"}`,
    `First landing page: ${enquiry.sourcePage || "Not recorded"}`,
    `Referrer: ${enquiry.referrer || "Direct / not recorded"}`,
    `Campaign source: ${enquiry.utmSource || "Not recorded"}`,
    `Campaign medium: ${enquiry.utmMedium || "Not recorded"}`,
    `Campaign name: ${enquiry.utmCampaign || "Not recorded"}`,
    `Referral code: ${enquiry.referralCode || "Not recorded"}`,
    "",
    enquiry.message,
  ].join("\n");
}
