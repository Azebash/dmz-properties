import type { Database } from "@/lib/supabase/database.types";

export type EnquiryStatus = Database["public"]["Enums"]["enquiry_status"];
export type InspectionStatus = Database["public"]["Enums"]["inspection_status"];

// These choices guide the UI; the audited database functions enforce transitions.
export const enquiryNextStatuses: Record<EnquiryStatus, EnquiryStatus[]> = {
  new: ["qualified", "lost", "spam"],
  qualified: ["inspection", "offer", "lost", "spam"],
  inspection: ["qualified", "offer", "lost"],
  offer: ["won", "lost"],
  won: [],
  lost: ["qualified"],
  spam: ["new"],
};

export const inspectionNextStatuses: Record<InspectionStatus, InspectionStatus[]> = {
  requested: ["confirmed", "cancelled"],
  confirmed: ["completed", "cancelled", "no_show"],
  completed: [],
  cancelled: ["requested"],
  no_show: [],
};

export const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
