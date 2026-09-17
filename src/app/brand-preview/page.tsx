import type { Metadata } from "next";
import { BrandLockup } from "@/components/brand-lockup";
import { BrandMark } from "@/components/brand-mark";

export const metadata: Metadata = {
  title: "Brand Preview",
  robots: { index: false, follow: false },
};

export default function BrandPreviewPage() {
  return (
    <main className="brand-preview">
      <header className="brand-preview-header">
        <div>
          <p>DMZ Properties / Identity 01</p>
          <h1>The Plotline</h1>
        </div>
        <p className="brand-preview-summary">
          A precise property mark built around boundaries, access, and forward
          development.
        </p>
      </header>

      <section className="brand-board" aria-label="Logo system preview">
        <div className="brand-tile brand-tile-primary">
          <span className="brand-label">Primary lockup</span>
          <BrandLockup className="brand-lockup-large" />
        </div>

        <div className="brand-tile brand-tile-concept">
          <span className="brand-label">Concept</span>
          <BrandMark className="brand-construction-mark" title="DMZ mark" />
          <div className="construction-lines" aria-hidden="true" />
          <p>Boundary / connection / access</p>
        </div>

        <div className="brand-tile brand-tile-dark">
          <span className="brand-label">Reversed</span>
          <BrandLockup className="brand-lockup-large" />
          <p>Property, properly considered.</p>
        </div>

        <div className="brand-tile brand-tile-sign">
          <span className="brand-label">Site marker</span>
          <div className="site-sign">
            <BrandMark className="site-sign-mark" />
            <strong>AVAILABLE</strong>
            <span>Verified property</span>
          </div>
        </div>

        <div className="brand-tile brand-tile-colors">
          <span className="brand-label">Core palette</span>
          <div className="color-row">
            <div className="color-swatch swatch-forest">
              <span>Forest</span>
              <small>#173F32</small>
            </div>
            <div className="color-swatch swatch-plotline">
              <span>Plotline</span>
              <small>#87A91F</small>
            </div>
            <div className="color-swatch swatch-paper">
              <span>Paper</span>
              <small>#F5F7F2</small>
            </div>
          </div>
        </div>

        <div className="brand-tile brand-tile-document">
          <span className="brand-label">Document system</span>
          <div className="document-sheet">
            <BrandLockup />
            <div className="document-copy">
              <small>PROPERTY BRIEF / 001</small>
              <strong>Residential Plot</strong>
              <p>KYC Homes Phase II</p>
            </div>
            <div className="document-rule" />
            <span>VERIFIED</span>
          </div>
        </div>
      </section>
    </main>
  );
}
