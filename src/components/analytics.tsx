"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import Link from "next/link";
import Script from "next/script";
import { usePathname } from "next/navigation";
import { trackEvent } from "@/lib/analytics-client";
import {
  getAnalyticsConsent,
  getServerAnalyticsConsent,
  setAnalyticsConsent,
  subscribeToAnalyticsConsent,
} from "@/lib/analytics-consent";

export function Analytics() {
  const measurementId = process.env.NEXT_PUBLIC_GA_ID;
  const consent = useSyncExternalStore(
    subscribeToAnalyticsConsent,
    getAnalyticsConsent,
    getServerAnalyticsConsent,
  );
  const pathname = usePathname();
  const lastTrackedPath = useRef("");

  useEffect(() => {
    if (
      consent === "accepted" &&
      window.gtag &&
      lastTrackedPath.current !== pathname
    ) {
      trackEvent("page_view", { page_path: pathname });
      lastTrackedPath.current = pathname;
    }
  }, [consent, pathname]);

  if (!measurementId) return null;

  return (
    <>
      {consent === "accepted" ? (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
            strategy="afterInteractive"
          />
          <Script
            id="google-analytics"
            strategy="afterInteractive"
            onReady={() => {
              trackEvent("page_view", { page_path: pathname });
              lastTrackedPath.current = pathname;
            }}
          >
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${measurementId}', { anonymize_ip: true, send_page_view: false });
            `}
          </Script>
        </>
      ) : null}

      {consent === "unknown" ? (
        <aside className="consent-banner" aria-label="Analytics preference">
          <div>
            <strong>Help us understand website use</strong>
            <p>
              We use optional analytics only with your permission. Read our{" "}
              <Link href="/privacy">privacy policy</Link>.
            </p>
          </div>
          <div className="consent-actions">
            <button
              className="button button-secondary"
              type="button"
              onClick={() => setAnalyticsConsent("declined")}
            >
              Decline
            </button>
            <button
              className="button button-primary"
              type="button"
              onClick={() => setAnalyticsConsent("accepted")}
            >
              Allow analytics
            </button>
          </div>
        </aside>
      ) : null}
    </>
  );
}
