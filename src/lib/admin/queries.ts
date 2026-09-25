import { createClient } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/admin/auth";
import { redirect } from "next/navigation";
import {
  dueFollowUpPageSize, enquiryInboxPageSize, enquiryInboxRange,
  followUpRange, followUpStatuses, lagosToday,
} from "@/lib/admin/follow-ups";

async function authorizedClient() {
  await requireStaff();
  return createClient();
}

async function authorizedPropertyClient() {
  const staff = await requireStaff();
  if (staff.role !== "administrator" && staff.role !== "property_manager") {
    redirect("/admin/access-denied");
  }
  return createClient();
}

export async function listAdminProperties() {
  const supabase = await authorizedClient();
  const { data, error } = await supabase
    .from("properties")
    .select(
      "id, reference, title, source, status, price_amount, price_currency, location_name, last_verified_at, updated_at",
    )
    .order("updated_at", { ascending: false })
    .limit(100);
  if (error) throw new Error(`Unable to load properties: ${error.message}`);
  return data;
}

export async function getAdminProperty(id: string) {
  const supabase = await authorizedClient();
  const { data, error } = await supabase
    .from("properties")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`Unable to load property: ${error.message}`);
  return data;
}

export async function getAdminPropertyMedia(propertyId: string) {
  const supabase = await authorizedPropertyClient();
  const { data, error } = await supabase.from("property_media")
    .select("*").eq("property_id", propertyId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw new Error(`Unable to load property media: ${error.message}`);
  return data;
}

export async function getAdminPropertyDocuments(propertyId: string) {
  const supabase = await authorizedPropertyClient();
  const { data, error } = await supabase.from("property_documents")
    .select("id,property_id,document_type,display_name,notes,verification_status,created_at")
    .eq("property_id", propertyId).order("created_at", { ascending: false });
  if (error) throw new Error(`Unable to load property documents: ${error.message}`);
  return data;
}

export async function listAdminEnquiries(page = 1) {
  const supabase = await authorizedPropertyClient();
  const { from, to } = enquiryInboxRange(page);
  const { data, error, count } = await supabase
    .from("enquiries")
    .select(
      "id, name, email, phone, enquiry_type, property_reference, status, assigned_to, follow_up_on, created_at",
      { count: "exact" },
    )
    .order("created_at", { ascending: false }).order("id", { ascending: false })
    .range(from, to);
  if (error) throw new Error(`Unable to load enquiries: ${error.message}`);
  return { items: data, total: count || 0, page, pageSize: enquiryInboxPageSize };
}

export async function listDueEnquiryFollowUps(page = 1) {
  const supabase = await authorizedPropertyClient();
  const { from, to } = followUpRange(page);
  const { data, error, count } = await supabase.from("enquiries")
    .select("id,name,property_reference,assigned_to,follow_up_on,created_at", { count: "exact" })
    .in("status", followUpStatuses).lte("follow_up_on", lagosToday())
    .order("follow_up_on", { ascending: true })
    .order("created_at", { ascending: true }).order("id", { ascending: true })
    .range(from, to);
  if (error) throw new Error(`Unable to load due follow-ups: ${error.message}`);
  return { items: data, total: count || 0, page, pageSize: dueFollowUpPageSize };
}

export async function getAdminEnquiry(id: string) {
  const supabase = await authorizedPropertyClient();
  const { data, error } = await supabase
    .from("enquiries")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`Unable to load enquiry: ${error.message}`);
  return data;
}

export async function listAdminInspections() {
  const supabase = await authorizedPropertyClient();
  const { data, error } = await supabase
    .from("inspections")
    .select(
      "id, property_id, status, inspection_type, preferred_date, alternate_date, time_zone, scheduled_at, assigned_to, created_at",
    )
    .order("preferred_date", { ascending: true })
    .limit(100);
  if (error) throw new Error(`Unable to load inspections: ${error.message}`);
  return data;
}

export async function getAdminInspection(id: string) {
  const supabase = await authorizedPropertyClient();
  const { data, error } = await supabase
    .from("inspections")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`Unable to load inspection: ${error.message}`);
  return data;
}

export async function getAdminActivity(entityType: "enquiry" | "inspection" | "article" | "area_guide" | "staff_profile", id: string) {
  const staff = await requireStaff();
  if (staff.role !== "administrator") return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("audit_events")
    .select("id, action, created_at, actor_id, previous_value, next_value, actor:staff_profiles(display_name)")
    .eq("entity_type", entityType)
    .eq("entity_id", id)
    .order("created_at", { ascending: false })
    .limit(30);
  if (error) throw new Error(`Unable to load activity: ${error.message}`);
  return data;
}

export async function listAdminSellerSubmissions() {
  const supabase = await authorizedPropertyClient();
  const { data, error } = await supabase
    .from("seller_submissions")
    .select(
      "id, owner_name, owner_phone, owner_email, status, asking_price, property_description, reviewed_by, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw new Error(`Unable to load seller submissions: ${error.message}`);
  return data;
}

export async function listAdminArticles() {
  const supabase = await authorizedClient();
  const { data, error } = await supabase
    .from("articles")
    .select(
      "id, slug, title, category, status, author_id, published_at, updated_at",
    )
    .order("updated_at", { ascending: false })
    .limit(100);
  if (error) throw new Error(`Unable to load articles: ${error.message}`);
  return data;
}

export async function getAdminArticle(id: string) {
  const supabase = await authorizedClient();
  const { data, error } = await supabase
    .from("articles")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`Unable to load article: ${error.message}`);
  return data;
}

export async function getAdminAreaGuide(slug: string) {
  const supabase = await authorizedClient();
  const { data, error } = await supabase.from("area_guides").select("*").eq("slug", slug).maybeSingle();
  if (error) throw new Error(`Unable to load area guide: ${error.message}`);
  return data;
}

export async function listAdminStaff() {
  const staff = await requireStaff();
  if (staff.role !== "administrator") redirect("/admin/access-denied");
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("staff_directory");
  if (error) throw new Error(`Unable to load staff directory: ${error.message}`);
  return data;
}

export async function getDefaultLeadOwner() {
  const staff = await requireStaff();
  if (staff.role !== "administrator") redirect("/admin/access-denied");
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_default_lead_owner");
  if (error) throw new Error(`Unable to load default lead owner: ${error.message}`);
  return data;
}
