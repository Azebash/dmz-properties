import type { Metadata } from "next";
import Link from "next/link";
import { articleCategories, articles, categorySlug } from "@/lib/content";

export const metadata: Metadata = {
  title: "Property Insights",
  description:
    "Practical guidance, estate updates, and property knowledge from DMZ Properties.",
  alternates: { canonical: "/insights" },
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
      <nav className="section-shell topic-nav" aria-label="Insight topics">
        <span>Browse by topic</span>
        {articleCategories.map((category) => (
          <Link key={category} href={`/insights/topics/${categorySlug(category)}`}>
            {category}
          </Link>
        ))}
      </nav>
      <section className="section-shell article-list listing-page-grid">
        {articles.map((article) => (
          <article key={article.slug} className="article-row">
            <p>
              <Link href={`/insights/topics/${categorySlug(article.category)}`}>
                {article.category}
              </Link>
            </p>
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
