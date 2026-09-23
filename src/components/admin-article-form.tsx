"use client";

import { useActionState, useState } from "react";
import { saveArticleAction } from "@/app/admin/(protected)/content/actions";
import type { ArticleRow } from "@/lib/supabase/types";

type Section = { heading: string; body: string };

function articleSections(body: ArticleRow["body"] | undefined): Section[] {
  if (!Array.isArray(body)) return [];
  return body.flatMap((section) => {
    if (
      section && typeof section === "object" && !Array.isArray(section) &&
      typeof section.heading === "string" && typeof section.body === "string"
    ) return [{ heading: section.heading, body: section.body }];
    return [];
  });
}

export function AdminArticleForm({ article }: { article?: ArticleRow }) {
  const existing = articleSections(article?.body);
  const [count, setCount] = useState(Math.max(1, existing.length));
  const [state, action, pending] = useActionState(saveArticleAction, { error: "" });

  return (
    <form action={action} className="admin-editor">
      <input type="hidden" name="id" value={article?.id || ""} />
      <div className="admin-form-grid">
        <div className="field field-full">
          <label htmlFor="article-title">Title</label>
          <input id="article-title" name="title" defaultValue={article?.title} maxLength={160} required />
        </div>
        <div className="field">
          <label htmlFor="article-slug">URL slug</label>
          <input id="article-slug" name="slug" defaultValue={article?.slug} maxLength={120} readOnly={!!article?.published_at} required />
        </div>
        <div className="field">
          <label htmlFor="article-category">Topic</label>
          <input id="article-category" name="category" defaultValue={article?.category} maxLength={100} required />
        </div>
        <div className="field field-full">
          <label htmlFor="article-excerpt">Search and listing summary</label>
          <textarea id="article-excerpt" name="excerpt" defaultValue={article?.excerpt} minLength={20} maxLength={500} required />
        </div>
        <div className="field">
          <label htmlFor="article-read-time">Estimated reading time (minutes)</label>
          <input id="article-read-time" name="readTimeMinutes" type="number" min={1} max={30} defaultValue={article?.read_time_minutes || 3} required />
        </div>
      </div>

      <div className="admin-article-sections">
        <h2>Article sections</h2>
        {Array.from({ length: count }, (_, index) => (
          <fieldset key={index}>
            <legend>Section {index + 1}</legend>
            <div className="field">
              <label htmlFor={`article-heading-${index}`}>Heading</label>
              <input id={`article-heading-${index}`} name={`sectionHeading${index + 1}`} maxLength={140} defaultValue={existing[index]?.heading || ""} required />
            </div>
            <div className="field">
              <label htmlFor={`article-body-${index}`}>Body</label>
              <textarea id={`article-body-${index}`} name={`sectionBody${index + 1}`} minLength={30} maxLength={6000} defaultValue={existing[index]?.body || ""} required />
            </div>
          </fieldset>
        ))}
        {count < 12 ? (
          <button className="button button-secondary" type="button" onClick={() => setCount(count + 1)}>
            Add section
          </button>
        ) : null}
      </div>

      <div className="admin-form-grid admin-seo-fields">
        <div className="field field-full">
          <label htmlFor="article-seo-title">Custom SEO title (optional)</label>
          <input id="article-seo-title" name="seoTitle" defaultValue={article?.seo_title || ""} />
        </div>
        <div className="field field-full">
          <label htmlFor="article-seo-description">Custom SEO description (optional)</label>
          <textarea id="article-seo-description" name="seoDescription" defaultValue={article?.seo_description || ""} />
        </div>
      </div>
      {state.error ? <p className="admin-auth-error" role="alert">{state.error}</p> : null}
      <button className="button button-primary" type="submit" disabled={pending}>
        {pending ? "Saving..." : article ? "Save article" : "Create draft"}
      </button>
    </form>
  );
}
