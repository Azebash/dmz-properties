"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import Script from "next/script";

type Consent = "unknown" | "accepted" | "declined";

const storageKey = "dmz-analytics-consent";
const consentEvent = "dmz-analytics-consent-change";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(consentEvent, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(consentEvent, callback);
  };
}

function getSnapshot(): Consent {
  const stored = window.localStorage.getItem(storageKey);
  return stored === "accepted" || stored === "declined" ? stored : "unknown";
}

function getServerSnapshot(): Consent {
  return "unknown";
}

export function Analytics() {
  const measurementId = process.env.NEXT_PUBLIC_GA_ID;
  const consent = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  if (!measurementId) return null;

  function chooseConsent(choice: Exclude<Consent, "unknown">) {
    window.localStorage.setItem(storageKey, choice);
    window.dispatchEvent(new Event(consentEvent));
  }

  return (
    <>
      {consent === "accepted" ? (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${measurementId}', { anonymize_ip: true });
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
              onClick={() => chooseConsent("declined")}
            >
              Decline
            </button>
            <button
              className="button button-primary"
              type="button"
              onClick={() => chooseConsent("accepted")}
            >
              Allow analytics
            </button>
          </div>
        </aside>
      ) : null}
    </>
  );
}
