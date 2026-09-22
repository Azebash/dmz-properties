"use client";

import { useEffect } from "react";
import { storeAttribution } from "@/lib/analytics-client";

export function AttributionCapture() {
  useEffect(() => {
    storeAttribution();
  }, []);

  return null;
}
