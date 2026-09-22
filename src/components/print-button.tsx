"use client";

import { trackEvent } from "@/lib/analytics-client";

export function PrintButton({ label = "Print or save PDF" }: { label?: string }) {
  return (
    <button
      className="button button-secondary no-print"
      type="button"
      onClick={() => {
        trackEvent("print_buyer_guide");
        window.print();
      }}
    >
      {label}
    </button>
  );
}
