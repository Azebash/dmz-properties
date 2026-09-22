import { readFile } from "node:fs/promises";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import {
  getSupabaseConfig,
  isSupabaseConfigured,
} from "../src/lib/supabase/config";
import { updateSession } from "../src/lib/supabase/proxy";

const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const originalKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

beforeEach(() => {
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
});

afterEach(() => {
  if (originalUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  else process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
  if (originalKey === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  else process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = originalKey;
});

describe("Supabase configuration", () => {
  it("fails explicitly when configuration is absent", () => {
    expect(isSupabaseConfigured()).toBe(false);
    expect(() => getSupabaseConfig()).toThrow("Supabase is not configured");
  });

  it("returns only the public client configuration", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://project.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "publishable";
    expect(getSupabaseConfig()).toEqual({
      url: "https://project.supabase.co",
      publishableKey: "publishable",
    });
  });

  it("redirects protected admin paths to setup when unconfigured", async () => {
    const response = await updateSession(
      new NextRequest("http://localhost/admin"),
    );
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost/admin/login?setup=required",
    );
  });
});

describe("Supabase migration security", () => {
  it("enables RLS and revokes client grants for every operational table", async () => {
    const migration = await readFile(
      path.join(
        process.cwd(),
        "supabase/migrations/20260918000100_initial_operational_schema.sql",
      ),
      "utf8",
    );
    const tables = [
      "staff_profiles",
      "properties",
      "property_media",
      "property_documents",
      "articles",
      "enquiries",
      "inspections",
      "seller_submissions",
      "audit_events",
    ];

    for (const table of tables) {
      expect(migration).toContain(
        `alter table public.${table} enable row level security;`,
      );
      expect(migration).toContain(
        `revoke all on table public.${table} from anon, authenticated;`,
      );
    }
    expect(migration).not.toContain("grant insert on public.enquiries to anon");
    expect(migration).not.toContain(
      "grant select, insert, update, delete on public.properties to authenticated",
    );
    expect(migration).toContain("grant select on public.properties to authenticated");
    expect(migration).toContain(
      "('property-media', 'property-media', false",
    );
    expect(migration).not.toContain("Public reads property media objects");
    expect(migration).toContain("set search_path = ''");
  });

  it("restricts idempotent enquiry ingestion to the service role", async () => {
    const migration = await readFile(
      path.join(
        process.cwd(),
        "supabase/migrations/20260918000200_enquiry_ingestion.sql",
      ),
      "utf8",
    );
    expect(migration).toContain("add column submission_key uuid not null unique");
    expect(migration).toContain("on conflict (submission_key) do nothing");
    expect(migration).toContain(
      "revoke all on function public.ingest_enquiry(jsonb) from public, anon, authenticated",
    );
    expect(migration).toContain(
      "grant execute on function public.ingest_enquiry(jsonb) to service_role",
    );
  });

  it("restricts distributed rate limiting to the service role", async () => {
    const migration = await readFile(
      path.join(
        process.cwd(),
        "supabase/migrations/20260918000300_distributed_rate_limit.sql",
      ),
      "utf8",
    );
    expect(migration).toContain("create table private.enquiry_rate_limits");
    expect(migration).toContain(
      "revoke all on function public.check_enquiry_rate_limit(text, integer, integer)",
    );
    expect(migration).toContain(
      "grant execute on function public.check_enquiry_rate_limit(text, integer, integer)",
    );
    const fixMigration = await readFile(
      path.join(
        process.cwd(),
        "supabase/migrations/20260918000400_fix_rate_limit_parameters.sql",
      ),
      "utf8",
    );
    expect(fixMigration).toContain("p_identifier_hash text");
    expect(fixMigration).toContain(
      "return current_count > p_max_requests",
    );
  });
});
