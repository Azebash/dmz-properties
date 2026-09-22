export type Attribution = {
  sourcePage: string;
  referrer: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  referralCode: string;
};

const attributionKey = "dmz-session-attribution";

declare global {
  interface Window {
    gtag?: (command: "event", name: string, parameters?: Record<string, unknown>) => void;
  }
}

export function trackEvent(name: string, parameters?: Record<string, unknown>) {
  window.gtag?.("event", name, parameters);
}

export function storeAttribution() {
  const params = new URLSearchParams(window.location.search);
  const existing = getAttribution();
  const normalizedLocation = `${window.location.origin}${window.location.pathname}`;
  let normalizedReferrer = "";
  if (document.referrer) {
    try {
      const referrerUrl = new URL(document.referrer);
      normalizedReferrer = `${referrerUrl.origin}${referrerUrl.pathname}`;
    } catch {
      normalizedReferrer = "";
    }
  }
  const incoming = {
    sourcePage: existing.sourcePage || normalizedLocation,
    referrer: existing.referrer || normalizedReferrer,
    utmSource: existing.utmSource || params.get("utm_source") || "",
    utmMedium: existing.utmMedium || params.get("utm_medium") || "",
    utmCampaign: existing.utmCampaign || params.get("utm_campaign") || "",
    referralCode: existing.referralCode || params.get("ref") || "",
  };

  window.sessionStorage.setItem(attributionKey, JSON.stringify(incoming));
}

export function getAttribution(): Attribution {
  try {
    const stored = window.sessionStorage.getItem(attributionKey);
    if (!stored) {
      return {
        sourcePage: "",
        referrer: "",
        utmSource: "",
        utmMedium: "",
        utmCampaign: "",
        referralCode: "",
      };
    }
    return JSON.parse(stored) as Attribution;
  } catch {
    return {
      sourcePage: "",
      referrer: "",
      utmSource: "",
      utmMedium: "",
      utmCampaign: "",
      referralCode: "",
    };
  }
}
