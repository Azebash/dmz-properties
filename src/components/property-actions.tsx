"use client";

import { useState } from "react";
import { trackEvent } from "@/lib/analytics-client";

export function PropertyActions({ title }: { title: string }) {
  const [message, setMessage] = useState("");

  async function shareProperty() {
    const shareData = {
      title: `${title} | DMZ Properties`,
      text: `View ${title} represented by DMZ Properties.`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        trackEvent("share", { method: "native", content_type: "property", item_id: title });
        setMessage("Property shared.");
      } else {
        await navigator.clipboard.writeText(window.location.href);
        trackEvent("share", { method: "clipboard", content_type: "property", item_id: title });
        setMessage("Property link copied.");
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setMessage("Unable to share automatically. Copy the address from your browser.");
    }
  }

  return (
    <div className="property-actions no-print">
      <button className="text-button" type="button" onClick={shareProperty}>
        Share property
      </button>
      <button
        className="text-button"
        type="button"
        onClick={() => {
          trackEvent("print_property", { property_name: title });
          window.print();
        }}
      >
        Print or save PDF
      </button>
      {message ? <span role="status">{message}</span> : null}
    </div>
  );
}
