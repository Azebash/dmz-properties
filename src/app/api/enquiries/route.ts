import { NextRequest, NextResponse } from "next/server";
import {
  formatEnquiry,
  isHoneypotSubmission,
  parseEnquiry,
  RateLimiter,
} from "@/lib/enquiries";

const rateLimiter = new RateLimiter(5, 60_000);

export async function POST(request: NextRequest) {
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 20_000) {
    return NextResponse.json({ message: "Submission is too large." }, { status: 413 });
  }

  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) {
    return NextResponse.json({ message: "Invalid submission origin." }, { status: 403 });
  }

  const identifier = request.headers.get("x-forwarded-for")?.split(",")[0] || "local";
  if (rateLimiter.isLimited(identifier)) {
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

  const parsed = parseEnquiry(input);
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.message },
      { status: 400 },
    );
  }
  const enquiry = parsed.data;

  const apiKey = process.env.RESEND_API_KEY;
  const toEmail = process.env.ENQUIRY_TO_EMAIL;
  const fromEmail = process.env.ENQUIRY_FROM_EMAIL;

  if (!apiKey || !toEmail || !fromEmail) {
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
    return NextResponse.json(
      { message: "The enquiry service is temporarily unavailable. Please try again." },
      { status: 503 },
    );
  }

  if (!emailResponse.ok) {
    return NextResponse.json(
      { message: "We could not deliver your enquiry. Please try again shortly." },
      { status: 502 },
    );
  }

  try {
    await fetch("https://api.resend.com/emails", {
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
  } catch {
    // The internal notification is authoritative; acknowledgement is best effort.
  }

  return NextResponse.json({ message: "Enquiry received." });
}
