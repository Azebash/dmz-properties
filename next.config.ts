import type { NextConfig } from "next";

const scriptSources = [
  "'self'",
  "'unsafe-inline'",
  "https://www.googletagmanager.com",
  "https://challenges.cloudflare.com",
];
if (process.env.NODE_ENV === "development") scriptSources.push("'unsafe-eval'");

let supabaseOrigin: string | undefined;
try {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    supabaseOrigin = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin;
  }
} catch {
  supabaseOrigin = undefined;
}

const connectSources = [
  "'self'",
  "https://www.google-analytics.com",
  "https://region1.google-analytics.com",
  "https://challenges.cloudflare.com",
];
const mediaSources = ["'self'", "data:"];
if (supabaseOrigin) {
  connectSources.push(supabaseOrigin);
  mediaSources.push(supabaseOrigin);
}

const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src ${scriptSources.join(" ")}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src ${mediaSources.join(" ")}`,
  `media-src ${mediaSources.join(" ")}`,
  "font-src 'self'",
  `connect-src ${connectSources.join(" ")}`,
  "frame-src https://challenges.cloudflare.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  experimental: { serverActions: { bodySizeLimit: "3.5mb" } },
  async redirects() {
    return [
      {
        source: "/areas/kyc-estate",
        destination: "/areas/kyc-homes-phase-ii",
        permanent: true,
      },
    ];
  },
  async headers() {
    const securityHeaders = [
      { key: "Content-Security-Policy", value: contentSecurityPolicy },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=()",
      },
    ];
    if (process.env.NODE_ENV === "production") {
      securityHeaders.push({
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload",
      });
    }

    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
