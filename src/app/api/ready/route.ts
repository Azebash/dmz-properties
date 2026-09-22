import { NextResponse } from "next/server";
import { getReadiness } from "@/lib/readiness";

export function GET() {
  const readiness = getReadiness();
  return NextResponse.json(
    {
      status: readiness.ready ? "ready" : "not_ready",
      checks: readiness.checks,
    },
    {
      status: readiness.ready ? 200 : 503,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
