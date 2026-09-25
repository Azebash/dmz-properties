"use client";

import { useDeferredValue, useEffect, useState } from "react";
import type { Property } from "@/lib/content";
import { PropertyCard } from "@/components/property-card";
import { discoverProperties, filterKeys, parseCatalogueFilters, type CatalogueFilters } from "@/lib/property-discovery";

export function PropertyBrowser({ properties, initialFilters }: {
  properties: Property[];
  initialFilters: CatalogueFilters;
}) {
  const [filters, setFilters] = useState(initialFilters);
  const deferredQuery = useDeferredValue(filters.q);
  const types = [...new Set(properties.map((property) => property.type))];
  const ownershipTypes = [...new Set(properties.map((property) => property.ownership))];

  useEffect(() => {
    const restore = () => setFilters(parseCatalogueFilters(
      Object.fromEntries(new URLSearchParams(window.location.search)), properties,
    ));
    window.addEventListener("popstate", restore);
    return () => window.removeEventListener("popstate", restore);
  }, [properties]);

  function change(next: CatalogueFilters, mode: "push" | "replace" = "push") {
    setFilters(next);
    const params = new URLSearchParams(window.location.search);
    for (const key of filterKeys) params.delete(key);
    for (const key of filterKeys) {
      const value = next[key];
      if (value && value !== "all" && value !== "newest") params.set(key, value);
    }
    const search = params.toString();
    const url = `${window.location.pathname}${search ? `?${search}` : ""}${window.location.hash}`;
    window.history[mode === "push" ? "pushState" : "replaceState"](null, "", url);
  }

  function clearFilters() {
    change({ q: "", type: "all", ownership: "all", availability: "all", minPrice: "", maxPrice: "",
      minSize: "", maxSize: "", sort: "newest" });
  }

  const filtered = discoverProperties(properties, { ...filters, q: deferredQuery });
  const hasActiveFilters = filterKeys.some((key) => filters[key] !== (
    key === "sort" ? "newest" : key === "type" || key === "ownership" || key === "availability" ? "all" : ""
  ));

  return (
    <section className="section-shell listing-page-grid">
      <h2 className="sr-only">Available properties</h2>
      <div className="property-filters" aria-label="Filter properties">
        <div className="filter-search">
          <label htmlFor="property-search">Search properties</label>
          <input id="property-search" type="search" value={filters.q} maxLength={120}
            onChange={(event) => change({ ...filters, q: event.target.value }, "replace")}
            placeholder="Name, location, or reference" />
        </div>
        <div className="filter-control">
          <label htmlFor="property-type">Property type</label>
          <select id="property-type" value={filters.type}
            onChange={(event) => change({ ...filters, type: event.target.value })}>
            <option value="all">All types</option>
            {types.map((item) => <option key={item}>{item}</option>)}
          </select>
        </div>
        <div className="filter-control">
          <label htmlFor="ownership">Source</label>
          <select id="ownership" value={filters.ownership}
            onChange={(event) => change({ ...filters, ownership: event.target.value })}>
            <option value="all">All sources</option>
            {ownershipTypes.map((item) => <option key={item}>{item}</option>)}
          </select>
        </div>
        <div className="filter-control">
          <label htmlFor="min-price">Minimum price (NGN)</label>
          <input id="min-price" type="number" min="0" max="1000000000000" step="0.01"
            value={filters.minPrice} onChange={(event) => change({ ...filters, minPrice: event.target.value }, "replace")} />
        </div>
        <div className="filter-control">
          <label htmlFor="max-price">Maximum price (NGN)</label>
          <input id="max-price" type="number" min="0" max="1000000000000" step="0.01"
            value={filters.maxPrice} onChange={(event) => change({ ...filters, maxPrice: event.target.value }, "replace")} />
        </div>
        <div className="filter-control">
          <label htmlFor="min-size">Minimum plot size (sqm)</label>
          <input id="min-size" type="number" min="0" max="10000000" step="0.01"
            value={filters.minSize} onChange={(event) => change({ ...filters, minSize: event.target.value }, "replace")} />
        </div>
        <div className="filter-control">
          <label htmlFor="max-size">Maximum plot size (sqm)</label>
          <input id="max-size" type="number" min="0" max="10000000" step="0.01"
            value={filters.maxSize} onChange={(event) => change({ ...filters, maxSize: event.target.value }, "replace")} />
        </div>
        <div className="filter-control filter-sort">
          <label htmlFor="property-sort">Sort by</label>
          <select id="property-sort" value={filters.sort}
            onChange={(event) => change({ ...filters, sort: event.target.value as CatalogueFilters["sort"] })}>
            <option value="newest">Newest published</option>
            <option value="price_asc">Price: low to high (NGN)</option>
            <option value="price_desc">Price: high to low (NGN)</option>
            <option value="relevance">Search relevance</option>
          </select>
        </div>
        <div className="filter-control filter-availability">
          <label htmlFor="property-availability">Availability check</label>
          <select id="property-availability" value={filters.availability}
            onChange={(event) => change({ ...filters, availability: event.target.value as CatalogueFilters["availability"] })}>
            <option value="all">All listings</option>
            <option value="available">Recently confirmed available</option>
            <option value="on_hold">On hold</option>
            <option value="unconfirmed">Needs reconfirmation</option>
          </select>
        </div>
        <p className="filter-hint">Availability confirmations expire after 14 days; even a recently confirmed listing must be reconfirmed before payment. Price filters include only stated NGN amounts, plot-size filters only stated sizes, and price sorting puts other currencies and prices on request last.</p>
      </div>

      <div className="filter-results">
        <p className="results-count" aria-live="polite">
          {filtered.length} {filtered.length === 1 ? "property" : "properties"}
        </p>
        {hasActiveFilters ? (
          <button className="button button-secondary" type="button" onClick={clearFilters}>Reset all filters</button>
        ) : null}
      </div>

      {filtered.length ? (
        <div className="property-grid">
          {filtered.map((property, index) => <PropertyCard key={property.slug} property={property} eager={index === 0} />)}
        </div>
      ) : (
        <div className="empty-note">
          <h2>No matching properties</h2>
          <p>Adjust the filters or contact us for current off-site availability.</p>
          <button className="button button-secondary" type="button" onClick={clearFilters}>Clear filters</button>
        </div>
      )}
    </section>
  );
}
