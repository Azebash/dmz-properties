import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublishedProperty } from "@/lib/public-properties";
import { getPublicAreaGuide } from "@/lib/public-area-guide";
import { PropertyDetail } from "@/components/property-detail";

type PropertyPageProps = {
  params: Promise<{ slug: string }>;
};

export const revalidate = 60;

export async function generateMetadata({
  params,
}: PropertyPageProps): Promise<Metadata> {
  const property = await getPublishedProperty((await params).slug);

  if (!property) return {};

  return {
    title: property.seoTitle || property.title,
    description: property.seoDescription || property.description,
    alternates: {
      canonical: `/properties/${property.slug}`,
    },
    openGraph: {
      title: property.title,
      description: property.description,
      images: [property.image],
    },
  };
}

export default async function PropertyPage({ params }: PropertyPageProps) {
  const [property, guide] = await Promise.all([
    getPublishedProperty((await params).slug), getPublicAreaGuide(),
  ]);
  if (!property) notFound();
  return <PropertyDetail property={property} developerPrice={guide.developerPrice} />;
}
