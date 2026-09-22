import { createHash } from "node:crypto";
import { RateLimiter } from "@/lib/enquiries";

const localLimiter = new RateLimiter(5, 60_000);
const rateLimitScript =
  "local current=redis.call('INCR',KEYS[1]); if current==1 then redis.call('EXPIRE',KEYS[1],ARGV[1]); end; return current";

type SecurityEnvironment = {
  UPSTASH_REDIS_REST_URL?: string;
  UPSTASH_REDIS_REST_TOKEN?: string;
  TURNSTILE_SECRET_KEY?: string;
};

function securityEnvironment(): SecurityEnvironment {
  return {
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
    TURNSTILE_SECRET_KEY: process.env.TURNSTILE_SECRET_KEY,
  };
}

export async function isEnquiryRateLimited(
  identifier: string,
  fetcher: typeof fetch = fetch,
  environment: SecurityEnvironment = securityEnvironment(),
) {
  const url = environment.UPSTASH_REDIS_REST_URL?.replace(/\/$/, "");
  const token = environment.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) return localLimiter.isLimited(identifier);

  const identifierHash = createHash("sha256").update(identifier).digest("hex");
  const key = `dmz:enquiry-rate:${identifierHash}`;

  try {
    const response = await fetcher(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(["EVAL", rateLimitScript, "1", key, "60"]),
      signal: AbortSignal.timeout(3_000),
    });

    if (!response.ok) throw new Error("Rate-limit provider rejected request");
    const result = (await response.json()) as { result?: number };
    return Number(result.result) > 5;
  } catch {
    console.warn(
      JSON.stringify({
        level: "warn",
        event: "distributed_rate_limit_fallback",
      }),
    );
    return localLimiter.isLimited(identifier);
  }
}

export async function verifyTurnstile(
  token: string,
  identifier: string,
  fetcher: typeof fetch = fetch,
  environment: SecurityEnvironment = securityEnvironment(),
) {
  const secret = environment.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (!token) return false;

  try {
    const response = await fetcher(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          secret,
          response: token,
          remoteip: identifier,
        }),
        signal: AbortSignal.timeout(5_000),
      },
    );
    if (!response.ok) return false;
    const result = (await response.json()) as { success?: boolean };
    return result.success === true;
  } catch {
    return false;
  }
}
