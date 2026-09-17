"use client";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="system-page section-shell">
      <p className="eyebrow">Something went wrong</p>
      <h1>We could not load this page.</h1>
      <p>
        The issue may be temporary. Try loading the page again before returning
        to the property catalogue.
      </p>
      <button className="button button-primary" type="button" onClick={reset}>
        Try again
      </button>
    </main>
  );
}
