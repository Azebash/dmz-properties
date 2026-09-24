export const business = {
  brandName: "DMZ Properties",
  legalName: "DMZ Enterprises Ltd",
  registrationNumber: "RC 9121009",
  founder: {
    name: "Hafiz Bashir",
    title: "Founder, DMZ Properties",
    relationship:
      "Hafiz Bashir is a staff member of KYC Interproject Limited, the developer of KYC Homes Phase II.",
  },
  phone: {
    display: "0810 370 4005",
    international: "+234 810 370 4005",
    href: "tel:+2348103704005",
    whatsapp: "https://wa.me/2348103704005",
  },
  address: {
    street:
      "Suite A108, Garki Mall, Off Kabo Street, Damaturu Crescent, Garki II",
    city: "Abuja",
    region: "Federal Capital Territory",
    country: "Nigeria",
    display:
      "Suite A108, Garki Mall, Off Kabo Street, Damaturu Crescent, Garki II, Abuja",
  },
} as const;

export const estate = {
  name: "KYC Homes Phase II",
  developer: "KYC Interproject Limited",
  developerRegistrationNumber: "RC 873737",
  location: "Sabon Lugbe East Layout, Airport Road, Abuja, FCT",
  coordinates: {
    latitude: 8.951194,
    longitude: 7.396083,
  },
  propertyType: "4-bedroom fully detached duplex",
  plotSize: "600 sqm plots",
  resalePricePolicy: "Set by the individual property owner",
  postAllocationCharges: [
    "Infrastructure",
    "Development levy",
    "Building plan",
    "Legal fee",
    "Administrative charges",
  ],
} as const;
