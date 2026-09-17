export type Property = {
  slug: string;
  title: string;
  type: string;
  location: string;
  price: string;
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
};

export type Article = {
  slug: string;
  title: string;
  category: string;
  readTime: string;
  excerpt: string;
  publishedAt: string;
  updatedAt: string;
  sections: { heading: string; body: string }[];
};

// Replace these representative records with approved live inventory before launch.
export const properties: Property[] = [
  {
    slug: "residential-plot-kyc-homes-phase-ii",
    title: "Residential Plot",
    type: "Land",
    location: "KYC Homes Phase II",
    price: "Price on request",
    status: "Verified",
    ownership: "Developer inventory",
    size: "Confirmed on enquiry",
    image: "/images/estate/estate-street.webp",
    imageLabel: "Estate context",
    gallery: [
      "/images/estate/estate-street.webp",
      "/images/estate/completed-home-01.webp",
      "/images/estate/development-progress-03.webp",
    ],
    description:
      "A development-ready residential opportunity within KYC Homes Phase II, supported by a clear purchase process and firsthand estate guidance.",
    features: [
      "Within KYC Homes Phase II",
      "Developer-held inventory",
      "Physical and remote inspection available",
      "Documentation reviewed before commitment",
    ],
    reference: "DMZ-KYC-001",
    updatedAt: "2026-09-17",
  },
  {
    slug: "client-resale-plot-kyc-homes-phase-ii",
    title: "Owner Resale Plot",
    type: "Resale land",
    location: "KYC Homes Phase II",
    price: "Price on request",
    status: "Verified resale",
    ownership: "Client owned",
    size: "Confirmed on enquiry",
    image: "/images/estate/completed-home-03.webp",
    imageLabel: "Estate context",
    gallery: [
      "/images/estate/completed-home-03.webp",
      "/images/estate/completed-home-02.webp",
      "/images/estate/completed-home-04.webp",
    ],
    description:
      "A privately owned plot offered for resale after ownership and authority-to-sell checks are completed by DMZ Properties.",
    features: [
      "Existing owner resale",
      "Ownership review required",
      "Transfer process confirmed before sale",
      "Physical and remote inspection available",
    ],
    reference: "DMZ-KYC-002",
    updatedAt: "2026-09-17",
  },
  {
    slug: "developing-home-kyc-homes-phase-ii",
    title: "Developing Residence",
    type: "Residential",
    location: "KYC Homes Phase II",
    price: "Price on request",
    status: "Available",
    ownership: "Client owned",
    size: "Details on enquiry",
    image: "/images/estate/development-progress-01.webp",
    imageLabel: "Estate development",
    gallery: [
      "/images/estate/development-progress-01.webp",
      "/images/estate/development-progress-02.webp",
      "/images/estate/development-progress-03.webp",
    ],
    description:
      "A residential property within the estate for buyers seeking an established setting rather than an undeveloped plot.",
    features: [
      "Residential property",
      "Located within KYC Homes Phase II",
      "Owner-held property",
      "Inspection required before commitment",
    ],
    reference: "DMZ-KYC-003",
    updatedAt: "2026-09-17",
  },
];

export const articles: Article[] = [
  {
    slug: "kyc-homes-phase-ii-abuja-guide",
    title: "A practical guide to KYC Homes Phase II, Abuja",
    category: "Area guide",
    readTime: "5 min read",
    excerpt:
      "What buyers should know about the titled estate in Sabon Lugbe, its established homes, active development, and available purchase routes.",
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
    ],
  },
  {
    slug: "questions-before-buying-land",
    title: "Seven questions to ask before buying land",
    category: "Buying guide",
    readTime: "5 min read",
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
    readTime: "4 min read",
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
    readTime: "6 min read",
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

export function getProperty(slug: string) {
  return properties.find((property) => property.slug === slug);
}

export function getArticle(slug: string) {
  return articles.find((article) => article.slug === slug);
}
