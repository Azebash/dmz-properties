import Link from "next/link";
import type { DeveloperPrice } from "@/lib/area-guide-copy";
import { buyingEnquiry, formatPropertyPrice } from "@/lib/buying-options";
import { TrackedLink } from "@/components/tracked-link";

export function DeveloperPriceEnquiry({ price, reference }: { price: DeveloperPrice | null; reference?: string }) {
  const resale = buyingEnquiry("resale", reference);
  return (
    <div className="developer-price-enquiry">
      {price?.visible ? (
        <>
          <p className="eyebrow">Developer price · land only</p>
          <p className="buying-price"><strong>{formatPropertyPrice(price.amount)}</strong> for a {price.plotSizeSqm} sqm plot</p>
          <p className="buying-price-date">Price confirmed <time dateTime={price.confirmedAt}>{price.confirmedAt}</time></p>
          <p>The quoted price is for land. Ask us about the estate&apos;s approved building requirements.</p>
        </>
      ) : <p>Talk to us for the developer&apos;s current plot price.</p>}
      <p>Looking for a better deal? We may be able to find you a resale from an existing owner at a lower price.</p>
      <TrackedLink className="text-link" href={resale.whatsapp} eventName="whatsapp_click"
        eventData={{ placement: "resale_options", ...(reference ? { property_reference: reference } : {}) }} newTab>
        Ask about resale options
      </TrackedLink>
      <p className="buying-price-note">Confirm current availability, price, and additional charges with us before payment.</p>
    </div>
  );
}

export function BuyingOptions({ price }: { price: DeveloperPrice | null }) {
  return (
    <section className="buying-options" aria-labelledby="buying-options-title">
      <div className="section-heading">
        <h2 id="buying-options-title">Looking to buy in KYC Homes Phase II?</h2>
        <p>Explore developer plots or ask us about resales from existing owners. Tell us your budget, and we&apos;ll help you find suitable options.</p>
      </div>
      <div className="buying-routes">
        <article>
          <h3>Developer plots</h3>
          <p>Buy directly from KYC Interproject Limited, with DMZ guiding your enquiry, inspection, and purchase process.</p>
          <DeveloperPriceEnquiry price={price} />
          <Link className="button button-secondary" href={buyingEnquiry("developer").contact}>Ask about developer plots</Link>
        </article>
        <article>
          <h3>Owner resales</h3>
          <p>Tell us what you&apos;re looking for and your budget. We&apos;ll discuss current options from existing owners and confirm the asking price and applicable charges before you commit.</p>
          <p>We check ownership and the seller&apos;s authority to sell before presenting a resale to you.</p>
          <Link className="button button-primary" href={buyingEnquiry("resale").contact}>Tell us your budget</Link>
        </article>
      </div>
      <div className="button-row">
        <Link className="button button-primary" href={buyingEnquiry("options").contact}>Talk to us about your options</Link>
        <Link className="text-link" href="/book-inspection">Book an inspection</Link>
      </div>
    </section>
  );
}
