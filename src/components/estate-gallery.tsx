"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  estateImages,
  galleryCategories,
  type EstateImage,
} from "@/lib/gallery";

type GalleryCategory = (typeof galleryCategories)[number];

export function EstateGallery() {
  const [category, setCategory] = useState<GalleryCategory>("All");
  const [selected, setSelected] = useState<EstateImage | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const filtered =
    category === "All"
      ? estateImages
      : estateImages.filter((image) => image.category === category);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (selected && !dialog.open) dialog.showModal();
    if (!selected && dialog.open) dialog.close();
  }, [selected]);

  return (
    <>
      <div className="gallery-filters" aria-label="Filter gallery">
        {galleryCategories.map((item) => (
          <button
            key={item}
            type="button"
            aria-pressed={category === item}
            onClick={() => setCategory(item)}
          >
            {item}
          </button>
        ))}
      </div>

      <p className="results-count" aria-live="polite">
        {filtered.length} photographs
      </p>

      <div className="estate-gallery-grid">
        {filtered.map((image, index) => (
          <figure key={image.src} className={index % 5 === 0 ? "gallery-wide" : ""}>
            <button
              type="button"
              aria-label={`View larger: ${image.caption}`}
              onClick={() => setSelected(image)}
            >
              <Image
                src={image.src}
                alt={image.alt}
                fill
                loading={index === 0 ? "eager" : "lazy"}
                fetchPriority={index === 0 ? "high" : "auto"}
                sizes="(max-width: 640px) 100vw, (max-width: 1000px) 50vw, 33vw"
              />
            </button>
            <figcaption>
              <span>{image.category}</span>
              {image.caption}
            </figcaption>
          </figure>
        ))}
      </div>

      <dialog
        ref={dialogRef}
        className="gallery-dialog"
        onClose={() => setSelected(null)}
        onClick={(event) => {
          if (event.target === event.currentTarget) setSelected(null);
        }}
      >
        {selected ? (
          <div className="gallery-dialog-content">
            <button type="button" onClick={() => setSelected(null)}>
              Close
            </button>
            <div className="gallery-dialog-image">
              <Image src={selected.src} alt={selected.alt} fill sizes="95vw" />
            </div>
            <p>{selected.caption}</p>
          </div>
        ) : null}
      </dialog>
    </>
  );
}
