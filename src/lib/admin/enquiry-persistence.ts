import "server-only";

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
