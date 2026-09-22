import { createClient } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/admin/auth";

async function authorizedClient() {
  await requireStaff();
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

export async function listAdminEnquiries() {
  const supabase = await authorizedClient();
  const { data, error } = await supabase
    .from("enquiries")
    .select(
      "id, name, email, phone, enquiry_type, property_reference, status, assigned_to, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw new Error(`Unable to load enquiries: ${error.message}`);
  return data;
}

export async function listAdminInspections() {
  const supabase = await authorizedClient();
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

export async function listAdminSellerSubmissions() {
  const supabase = await authorizedClient();
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
