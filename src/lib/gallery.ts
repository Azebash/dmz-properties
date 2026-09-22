export type EstateImage = {
  src: string;
  alt: string;
  caption: string;
  category: "Completed homes" | "Construction" | "Interiors";
};

export const estateImages: EstateImage[] = [
  {
    src: "/images/estate/estate-hero.webp",
    alt: "Completed detached homes within KYC Homes Phase II",
    caption: "Completed detached residences",
    category: "Completed homes",
  },
  {
    src: "/images/estate/estate-street.webp",
    alt: "Developed residential street at KYC Homes Phase II",
    caption: "Established estate streetscape",
    category: "Completed homes",
  },
  {
    src: "/images/estate/completed-home-01.webp",
    alt: "Completed cream detached residence at KYC Homes Phase II",
    caption: "Completed private residence",
    category: "Completed homes",
  },
  {
    src: "/images/estate/completed-home-02.webp",
    alt: "Completed residence with landscaped frontage at KYC Homes Phase II",
    caption: "Landscaped residential frontage",
    category: "Completed homes",
  },
  {
    src: "/images/estate/completed-home-03.webp",
    alt: "Completed home and perimeter treatment at KYC Homes Phase II",
    caption: "Owner-developed property",
    category: "Completed homes",
  },
  {
    src: "/images/estate/completed-home-04.webp",
    alt: "Coordinated homes along a KYC Homes Phase II street",
    caption: "Coordinated building line",
    category: "Completed homes",
  },
  {
    src: "/images/estate/completed-residence.webp",
    alt: "Finished brick entrance and gate at a KYC Homes Phase II residence",
    caption: "Finished residential entrance",
    category: "Completed homes",
  },
  {
    src: "/images/estate/residence-exterior.webp",
    alt: "Finished detached residence exterior at KYC Homes Phase II",
    caption: "Detached residence exterior",
    category: "Completed homes",
  },
  {
    src: "/images/estate/development-progress-01.webp",
    alt: "Detached residence under construction at KYC Homes Phase II",
    caption: "Detached residence construction progress",
    category: "Construction",
  },
  {
    src: "/images/estate/development-progress-02.webp",
    alt: "Ground-floor structural works at KYC Homes Phase II",
    caption: "Structural work in progress",
    category: "Construction",
  },
  {
    src: "/images/estate/development-progress-03.webp",
    alt: "Duplex shell under construction at KYC Homes Phase II",
    caption: "Duplex shell and roof works",
    category: "Construction",
  },
  {
    src: "/images/estate/residence-kitchen.webp",
    alt: "Fitted residential kitchen within KYC Homes Phase II",
    caption: "Fitted residential kitchen",
    category: "Interiors",
  },
  {
    src: "/images/estate/residence-pool.webp",
    alt: "Private tiled swimming pool within a KYC Homes Phase II residence",
    caption: "Private residential pool",
    category: "Interiors",
  },
];

export const galleryCategories = [
  "All",
  "Completed homes",
  "Construction",
  "Interiors",
] as const;
