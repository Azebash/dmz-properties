import { NextResponse } from "next/server";
import { getReadiness } from "@/lib/readiness";
import { isSupabaseReachable } from "@/lib/supabase/readiness-probe";

export async function GET() {
  const configuration = getReadiness();
  const supabaseReachable = await isSupabaseReachable();
  const ready = configuration.ready && supabaseReachable;
  return NextResponse.json(
    {
      scope: "operational",
      status: ready ? "ready" : "not_ready",
      checks: { ...configuration.checks, supabaseReachable },
    },
    {
      status: ready ? 200 : 503,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
