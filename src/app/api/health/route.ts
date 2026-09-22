import { NextResponse } from "next/server";
import { getReadiness } from "@/lib/readiness";

export function GET() {
  return NextResponse.json(
    {
      status: "ok",
      service: "dmz-properties",
      revision: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || "local",
      timestamp: new Date().toISOString(),
      readiness: getReadiness(),
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
