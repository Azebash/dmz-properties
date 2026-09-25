import Image from "next/image";
import Link from "next/link";
import type { Property } from "@/lib/content";
import { availabilityLabel } from "@/lib/property-availability";

export function PropertyCard({
  property,
  eager = false,
}: {
  property: Property;
  eager?: boolean;
}) {
  return (
    <article className="property-card">
      <Link href={`/properties/${property.slug}`} tabIndex={-1} aria-hidden="true">
        <div className="property-image">
          <Image
            src={property.image}
            alt={property.media?.[0]?.alt || (property.imageLabel === "Estate context"
              ? `Estate context in ${property.location}, not a photo of the specific property`
              : property.imageLabel === "Images pending"
                ? `Property media pending verification for ${property.title}`
                : `${property.title} in ${property.location}`)}
            fill
            unoptimized={property.image.startsWith("/api/property-media/")}
            loading={eager ? "eager" : "lazy"}
            fetchPriority={eager ? "high" : "auto"}
            sizes="(max-width: 640px) 100vw, (max-width: 900px) 50vw, 33vw"
          />
          <span className="property-status">{property.status}</span>
          <span className="property-image-label">{property.imageLabel}</span>
        </div>
      </Link>
      <div className="property-content">
        <p className="property-meta">
          <span>{property.type}</span>
          <span>{property.location}</span>
        </p>
        <h3>
          <Link href={`/properties/${property.slug}`}>{property.title}</Link>
        </h3>
        <p className="property-price">{property.price}</p>
        <p className="property-availability">{availabilityLabel(property.availabilityStatus, property.availabilityCheckedAt)}</p>
      </div>
    </article>
  );
}
