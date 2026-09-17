"use client";

import { useDeferredValue, useState } from "react";
import type { Property } from "@/lib/content";
import { PropertyCard } from "@/components/property-card";

export function PropertyBrowser({ properties }: { properties: Property[] }) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [ownership, setOwnership] = useState("all");
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());

  const types = [...new Set(properties.map((property) => property.type))];
  const ownershipTypes = [
    ...new Set(properties.map((property) => property.ownership)),
  ];

  const filtered = properties.filter((property) => {
    const matchesQuery =
      !deferredQuery ||
      property.title.toLowerCase().includes(deferredQuery) ||
      property.location.toLowerCase().includes(deferredQuery) ||
      property.reference.toLowerCase().includes(deferredQuery);
    const matchesType = type === "all" || property.type === type;
    const matchesOwnership =
      ownership === "all" || property.ownership === ownership;

    return matchesQuery && matchesType && matchesOwnership;
  });

  return (
    <section className="section-shell listing-page-grid">
      <h2 className="sr-only">Available properties</h2>
      <div className="property-filters" aria-label="Filter properties">
        <div className="filter-search">
          <label htmlFor="property-search">Search properties</label>
          <input
            id="property-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Name, location, or reference"
          />
        </div>
        <div className="filter-control">
          <label htmlFor="property-type">Property type</label>
          <select
            id="property-type"
            value={type}
            onChange={(event) => setType(event.target.value)}
          >
            <option value="all">All types</option>
            {types.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </div>
        <div className="filter-control">
          <label htmlFor="ownership">Source</label>
          <select
            id="ownership"
            value={ownership}
            onChange={(event) => setOwnership(event.target.value)}
          >
            <option value="all">All sources</option>
            {ownershipTypes.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </div>
      </div>

      <p className="results-count" aria-live="polite">
        {filtered.length} {filtered.length === 1 ? "property" : "properties"}
      </p>

      {filtered.length ? (
        <div className="property-grid">
          {filtered.map((property, index) => (
            <PropertyCard
              key={property.slug}
              property={property}
              priority={index === 0}
            />
          ))}
        </div>
      ) : (
        <div className="empty-note">
          <h2>No matching properties</h2>
          <p>Adjust the filters or contact us for current off-site availability.</p>
          <button
            className="button button-secondary"
            type="button"
            onClick={() => {
              setQuery("");
              setType("all");
              setOwnership("all");
            }}
          >
            Clear filters
          </button>
        </div>
      )}
    </section>
  );
}
