import "server-only";

import { createHash } from "node:crypto";
import type { Enquiry } from "@/lib/enquiries";
import type { Json } from "@/lib/supabase/database.types";
import { createServiceClient } from "@/lib/supabase/service";

export function toEnquiryPayload(enquiry: Enquiry): Json {
  return { ...enquiry };
}

export async function persistEnquiry(enquiry: Enquiry) {
  const supabase = createServiceClient();
  const { data, error } = await supabase.rpc("ingest_enquiry", {
    payload: toEnquiryPayload(enquiry),
  });
  if (error || !data) {
    throw new Error(error?.message || "Supabase did not return an enquiry ID");
  }
  return data;
}

export async function isSupabaseEnquiryRateLimited(identifier: string) {
  const supabase = createServiceClient();
  const identifierHash = createHash("sha256").update(identifier).digest("hex");
  const { data, error } = await supabase.rpc("check_enquiry_rate_limit", {
    p_identifier_hash: identifierHash,
    p_max_requests: 5,
    p_window_seconds: 60,
  });
  if (error || typeof data !== "boolean") {
    throw new Error(error?.message || "Supabase did not return a rate-limit result");
  }
  return data;
}
