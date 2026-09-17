import Image from "next/image";
import Link from "next/link";
import type { Property } from "@/lib/content";

export function PropertyCard({
  property,
  priority = false,
}: {
  property: Property;
  priority?: boolean;
}) {
  return (
    <article className="property-card">
      <Link href={`/properties/${property.slug}`} tabIndex={-1} aria-hidden="true">
        <div className="property-image">
          <Image
            src={property.image}
            alt={`${property.title} in ${property.location}`}
            fill
            priority={priority}
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
      </div>
    </article>
  );
}
