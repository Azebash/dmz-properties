export function getReadiness() {
  const supabaseConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
  const persistenceConfigured = Boolean(
    process.env.SUPABASE_PERSIST_ENQUIRIES === "true" &&
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SECRET_KEY,
  );
  const checks = {
    canonicalUrl: Boolean(
      process.env.NEXT_PUBLIC_SITE_URL ||
        process.env.VERCEL_PROJECT_PRODUCTION_URL ||
        process.env.VERCEL_URL,
    ),
    emailDelivery: Boolean(
      process.env.RESEND_API_KEY &&
        process.env.ENQUIRY_TO_EMAIL &&
        process.env.ENQUIRY_FROM_EMAIL,
    ),
    botProtection: Boolean(
      process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY &&
        process.env.TURNSTILE_SECRET_KEY,
    ),
    distributedRateLimit: Boolean(
      persistenceConfigured ||
        (process.env.UPSTASH_REDIS_REST_URL &&
          process.env.UPSTASH_REDIS_REST_TOKEN),
    ),
    supabase: supabaseConfigured,
    enquiryPersistence: persistenceConfigured,
  };

  return {
    ready: Boolean(
      checks.canonicalUrl &&
        checks.supabase &&
        checks.enquiryPersistence &&
        checks.distributedRateLimit,
    ),
    checks,
  };
}
