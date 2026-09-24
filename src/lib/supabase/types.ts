import type { Database } from "@/lib/supabase/database.types";

export type StaffProfileRow =
  Database["public"]["Tables"]["staff_profiles"]["Row"];
export type PropertyRow = Database["public"]["Tables"]["properties"]["Row"];
export type PropertyMediaRow = Database["public"]["Tables"]["property_media"]["Row"];
export type ArticleRow = Database["public"]["Tables"]["articles"]["Row"];
export type EnquiryRow = Database["public"]["Tables"]["enquiries"]["Row"];
export type PropertyStatus = Database["public"]["Enums"]["property_status"];
