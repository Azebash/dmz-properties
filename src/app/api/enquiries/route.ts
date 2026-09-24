import { NextRequest, NextResponse } from "next/server";
import {
  formatEnquiry,
  isHoneypotSubmission,
  parseEnquiry,
} from "@/lib/enquiries";
import { isEnquiryRateLimited, verifyTurnstile } from "@/lib/enquiry-security";
import { isPublishedPropertyReference } from "@/lib/public-properties";
import {
  isSupabaseEnquiryRateLimited,
  persistEnquiry,
} from "@/lib/admin/enquiry-persistence";
import { isEnquiryPersistenceEnabled } from "@/lib/supabase/service";

function logDeliveryIssue(code: string, status: number) {
  console.error(
    JSON.stringify({
      level: "error",
      event: "enquiry_delivery_issue",
      code,
      status,
    }),
  );
}


export async function POST(request: NextRequest) {
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 20_000) {
    return NextResponse.json({ message: "Submission is too large." }, { status: 413 });
  }

  const origin = request.headers.get("origin");
  if (!origin || origin !== request.nextUrl.origin) {
    logDeliveryIssue("invalid_origin", 403);
    return NextResponse.json({ message: "Invalid submission origin." }, { status: 403 });
  }

  const turnstilePair = [
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
    process.env.TURNSTILE_SECRET_KEY,
  ];
  const upstashPair = [
    process.env.UPSTASH_REDIS_REST_URL,
    process.env.UPSTASH_REDIS_REST_TOKEN,
  ];
  if (
    turnstilePair.filter(Boolean).length === 1 ||
    upstashPair.filter(Boolean).length === 1
  ) {
    logDeliveryIssue("security_configuration_incomplete", 503);
    return NextResponse.json(
      { message: "Enquiry security is temporarily unavailable." },
      { status: 503 },
    );
  }

  const identifier = request.headers.get("x-forwarded-for")?.split(",")[0] || "local";
  const persistenceEnabled = isEnquiryPersistenceEnabled();
  let rateLimited: boolean;
  if (persistenceEnabled) {
    try {
      rateLimited = await isSupabaseEnquiryRateLimited(identifier);
    } catch {
      logDeliveryIssue("supabase_rate_limit_fallback", 503);
      rateLimited = await isEnquiryRateLimited(identifier);
    }
  } else {
    rateLimited = await isEnquiryRateLimited(identifier);
  }
  if (rateLimited) {
    return NextResponse.json(
      { message: "Too many submissions. Please wait and try again." },
      { status: 429 },
    );
  }

  let input: Record<string, unknown>;
  try {
    input = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ message: "Invalid form submission." }, { status: 400 });
  }

  // Quietly accept honeypot submissions so bots do not learn the filter.
  if (isHoneypotSubmission(input)) {
    return NextResponse.json({ message: "Enquiry received." });
  }

  const turnstileToken =
    typeof input.turnstileToken === "string" ? input.turnstileToken : "";
  if (!(await verifyTurnstile(turnstileToken, identifier))) {
    logDeliveryIssue("turnstile_failed", 403);
    return NextResponse.json(
      { message: "Security verification failed. Please refresh and try again." },
      { status: 403 },
    );
  }

  const parsed = parseEnquiry(input);
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.message },
      { status: 400 },
    );
  }
  const enquiry = parsed.data;
  if (enquiry.propertyReference) {
    let recognized;
    try {
      recognized = await isPublishedPropertyReference(enquiry.propertyReference);
    } catch {
      logDeliveryIssue("property_inventory_unavailable", 503);
      return NextResponse.json(
        { message: "We could not verify the selected property. Please try again." },
        { status: 503 },
      );
    }
    if (!recognized) {
      return NextResponse.json(
        { message: "The selected property reference is not recognized." },
        { status: 400 },
      );
    }
  }

  let persisted = false;
  if (persistenceEnabled) {
    try {
      await persistEnquiry(enquiry);
      persisted = true;
    } catch {
      logDeliveryIssue("supabase_persistence_failed", 503);
      return NextResponse.json(
        { message: "We could not safely record your enquiry. Please try again." },
        { status: 503 },
      );
    }
  }

  const apiKey = process.env.RESEND_API_KEY;
  const toEmail = process.env.ENQUIRY_TO_EMAIL;
  const fromEmail = process.env.ENQUIRY_FROM_EMAIL;

  if (!apiKey || !toEmail || !fromEmail) {
    logDeliveryIssue("email_not_configured", 503);
    if (persisted) {
      return NextResponse.json({
        message: "Your enquiry has been received. Our team will follow up shortly.",
      });
    }
    return NextResponse.json(
      { message: "Enquiry delivery is not configured yet. Please contact us directly." },
      { status: 503 },
    );
  }

  let emailResponse: Response;
  try {
    emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: toEmail.split(",").map((email) => email.trim()),
        reply_to: enquiry.email,
        subject: `DMZ enquiry: ${enquiry.interest} - ${enquiry.name}`,
        text: formatEnquiry(enquiry),
      }),
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    logDeliveryIssue("email_provider_unavailable", 503);
    if (persisted) {
      return NextResponse.json({
        message: "Your enquiry has been received. Our team will follow up shortly.",
      });
    }
    return NextResponse.json(
      { message: "The enquiry service is temporarily unavailable. Please try again." },
      { status: 503 },
    );
  }

  if (!emailResponse.ok) {
    logDeliveryIssue("email_provider_rejected", emailResponse.status);
    if (persisted) {
      return NextResponse.json({
        message: "Your enquiry has been received. Our team will follow up shortly.",
      });
    }
    return NextResponse.json(
      { message: "We could not deliver your enquiry. Please try again shortly." },
      { status: 502 },
    );
  }

  try {
    const acknowledgementResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [enquiry.email],
        subject: "We received your DMZ Properties enquiry",
        text: [
          `Hello ${enquiry.name},`,
          "",
          "Thank you for contacting DMZ Properties. We have received your enquiry and will review the details before responding.",
          "",
          `Enquiry type: ${enquiry.interest}`,
          `Property reference: ${enquiry.propertyReference || "General enquiry"}`,
          "",
          "For your security, do not make a payment based only on an informal message. Confirm the property-specific process and payment instructions before transferring funds.",
          "",
          "DMZ Properties",
        ].join("\n"),
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!acknowledgementResponse.ok) {
      logDeliveryIssue("acknowledgement_rejected", acknowledgementResponse.status);
    }
  } catch {
    logDeliveryIssue("acknowledgement_unavailable", 503);
  }

  return NextResponse.json({ message: "Enquiry received." });
}
