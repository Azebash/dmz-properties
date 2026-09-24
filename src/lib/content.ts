export type Property = {
  slug: string;
  title: string;
  type: string;
  location: string;
  price: string;
  priceAmount?: number;
  currency?: string;
  status: string;
  ownership: string;
  size: string;
  image: string;
  imageLabel: string;
  gallery: string[];
  description: string;
  features: string[];
  reference: string;
  updatedAt: string;
  lastVerifiedAt?: string;
  seoTitle?: string;
  seoDescription?: string;
};

export type Article = {
  slug: string;
  title: string;
  category: string;
  readTime: string;
  excerpt: string;
  publishedAt: string;
  updatedAt: string;
  seoTitle?: string;
  seoDescription?: string;
  sections: { heading: string; body: string }[];
};

export const estateUpdateCategory = "Estate update";

// Current developer inventory. Reconfirm availability and terms before commitment.
export const properties: Property[] = [
  {
    slug: "600sqm-virgin-land-kyc-homes-phase-ii",
    title: "600 sqm Virgin Land",
    type: "Land",
    location: "KYC Homes Phase II",
    price: "NGN 14,000,000",
    priceAmount: 14_000_000,
    currency: "NGN",
    status: "Developer inventory",
    ownership: "Developer inventory",
    size: "600 sqm",
    image: "/images/estate/estate-street.webp",
    imageLabel: "Estate context",
    gallery: [
      "/images/estate/estate-street.webp",
      "/images/estate/completed-home-01.webp",
      "/images/estate/development-progress-03.webp",
    ],
    description:
      "Virgin residential land sold directly by KYC Interproject Limited within KYC Homes Phase II, Sabon Lugbe. Current price and availability must be reconfirmed before payment.",
    features: [
      "600 sqm virgin land",
      "NGN 14,000,000 current developer price",
      "Direct KYC Interproject Limited inventory",
      "4-bedroom fully detached duplex development format",
      "Physical and remote inspection available",
      "Full or part payment options subject to approved terms",
    ],
    reference: "DMZ-KYC-001",
    updatedAt: "2026-09-17",
    lastVerifiedAt: "2026-09-17",
  },
];

export const articles: Article[] = [
  {
    slug: "kyc-homes-phase-ii-abuja-guide",
    title: "A practical guide to KYC Homes Phase II, Abuja",
    category: "Area guide",
    readTime: "5 min read",
    excerpt:
      "What buyers should know about the Sabon Lugbe estate, its established homes, active development, and available purchase routes.",
    publishedAt: "2026-09-17",
    updatedAt: "2026-09-17",
    sections: [
      {
        heading: "Location and setting",
        body: "KYC Homes Phase II is located in Sabon Lugbe along the Airport Road corridor in Abuja, Federal Capital Territory. Buyers should confirm the specific access route and the position of any plot or property during inspection.",
      },
      {
        heading: "An estate at different stages",
        body: "The estate includes hundreds of developed properties alongside ongoing residential construction. That combination allows buyers to assess an established built environment while considering land, resale, or developing-property opportunities.",
      },
      {
        heading: "Two purchase routes",
        body: "Opportunities may come from current developer inventory or from an existing owner's resale. Each route requires its own documentation, confirmation, payment, and transfer process before commitment.",
      },
      {
        heading: "Developer product at publication",
        body: "At this guide's original publication on 17 September 2026, KYC Interproject Limited's quoted virgin-land price was NGN 14,000,000 for a 600 sqm plot. Phase II follows a 4-bedroom fully detached duplex development format. Full or part payment may be available, but buyers must reconfirm availability, charges, payment schedules, and official instructions before transferring funds.",
      },
    ],
  },
  {
    slug: "questions-before-buying-land",
    title: "Seven questions to ask before buying land",
    category: "Buying guide",
    readTime: "3 min read",
    excerpt:
      "A practical framework for checking ownership, documentation, access, costs, and development conditions before committing.",
    publishedAt: "2026-09-17",
    updatedAt: "2026-09-17",
    sections: [
      {
        heading: "Start with ownership",
        body: "Confirm who owns the property, whether the seller has authority to sell, and whether the records match the exact plot being presented. A convincing story is not a substitute for documentary evidence.",
      },
      {
        heading: "Understand the complete cost",
        body: "Ask for the purchase price, documentation costs, transfer fees, development obligations, and any recurring estate charges. Decisions are easier when the total commitment is visible from the beginning.",
      },
    ],
  },
  {
    slug: "developer-sale-versus-owner-resale",
    title: "Developer sale or owner resale: what changes?",
    category: "Explainer",
    readTime: "2 min read",
    excerpt:
      "Both routes can be legitimate, but they require different checks, documentation, and expectations.",
    publishedAt: "2026-09-17",
    updatedAt: "2026-09-17",
    sections: [
      {
        heading: "The source of the property",
        body: "Developer inventory is sold through the estate's established allocation process. An owner resale transfers an existing client's interest, so the seller's identity, allocation, payment history, and authority to transfer require separate confirmation.",
      },
      {
        heading: "Verification still matters",
        body: "Being located within a known estate does not remove the need to verify a specific transaction. The property, owner, records, fees, and transfer procedure should all align before payment.",
      },
    ],
  },
  {
    slug: "remote-property-inspection",
    title: "How to inspect property when you are abroad",
    category: "Remote buying",
    readTime: "2 min read",
    excerpt:
      "Use live video, location evidence, independent checks, and a documented process to make remote property decisions clearer.",
    publishedAt: "2026-09-17",
    updatedAt: "2026-09-17",
    sections: [
      {
        heading: "Request a live inspection",
        body: "A live video call allows you to ask questions, see the access route, examine surrounding development, and verify that the footage relates to the property under discussion.",
      },
      {
        heading: "Keep an evidence trail",
        body: "Important representations, approved prices, payment instructions, receipts, and transfer documents should be recorded. Remote convenience should never mean informal documentation.",
      },
    ],
  },
];

export function categorySlug(category: string) {
  return category.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
