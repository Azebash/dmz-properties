import Link from "next/link";

export default function NotFound() {
  return (
    <main className="system-page section-shell">
      <p className="eyebrow">404 / Not found</p>
      <h1>This property page has moved or does not exist.</h1>
      <p>
        Browse current opportunities or contact us if you followed a property
        link that should still be active.
      </p>
      <div className="button-row">
        <Link className="button button-primary" href="/properties">
          View properties
        </Link>
        <Link className="text-link" href="/contact">
          Make an enquiry
        </Link>
      </div>
    </main>
  );
}
