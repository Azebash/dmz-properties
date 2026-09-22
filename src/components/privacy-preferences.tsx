"use client";

import { useSyncExternalStore } from "react";
import {
  getAnalyticsConsent,
  getServerAnalyticsConsent,
  setAnalyticsConsent,
  subscribeToAnalyticsConsent,
} from "@/lib/analytics-consent";

export function PrivacyPreferences() {
  const consent = useSyncExternalStore(
    subscribeToAnalyticsConsent,
    getAnalyticsConsent,
    getServerAnalyticsConsent,
  );

  return (
    <div className="privacy-preferences">
      <p>
        Current optional analytics preference: <strong>{consent}</strong>
      </p>
      <div>
        <button
          className="button button-secondary"
          type="button"
          onClick={() => setAnalyticsConsent("declined")}
        >
          Decline analytics
        </button>
        <button
          className="button button-primary"
          type="button"
          onClick={() => setAnalyticsConsent("accepted")}
        >
          Allow analytics
        </button>
      </div>
    </div>
  );
}
