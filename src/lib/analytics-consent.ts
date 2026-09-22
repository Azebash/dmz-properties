export type AnalyticsConsent = "unknown" | "accepted" | "declined";

const storageKey = "dmz-analytics-consent";
const consentEvent = "dmz-analytics-consent-change";

export function subscribeToAnalyticsConsent(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(consentEvent, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(consentEvent, callback);
  };
}

export function getAnalyticsConsent(): AnalyticsConsent {
  const stored = window.localStorage.getItem(storageKey);
  return stored === "accepted" || stored === "declined" ? stored : "unknown";
}

export function getServerAnalyticsConsent(): AnalyticsConsent {
  return "unknown";
}

export function setAnalyticsConsent(
  choice: Exclude<AnalyticsConsent, "unknown">,
) {
  window.localStorage.setItem(storageKey, choice);
  window.dispatchEvent(new Event(consentEvent));
}
