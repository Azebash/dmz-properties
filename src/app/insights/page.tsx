import type { Metadata } from "next";
import Link from "next/link";
import { articles } from "@/lib/content";

export const metadata: Metadata = {
  title: "Property Insights",
  description:
    "Practical guidance, estate updates, and property knowledge from DMZ Properties.",
};

export default function InsightsPage() {
  return (
    <main>
      <section className="section-shell page-hero">
        <p className="eyebrow">Insights</p>
        <h1 className="page-title">Useful before persuasive.</h1>
        <p>
          Clear explanations and local property knowledge to help buyers ask
          better questions and make better-informed decisions.
        </p>
      </section>
      <section className="section-shell article-list listing-page-grid">
        {articles.map((article) => (
          <article key={article.slug} className="article-row">
            <p>{article.category}</p>
            <h2>
              <Link href={`/insights/${article.slug}`}>{article.title}</Link>
            </h2>
            <span>{article.readTime}</span>
          </article>
        ))}
      </section>
    </main>
  );
}
