import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { categorySlug } from "@/lib/content";
import { getPublishedArticles } from "@/lib/public-articles";
import { Breadcrumbs } from "@/components/breadcrumbs";

type TopicPageProps = {
  params: Promise<{ topic: string }>;
};

export const revalidate = 60;

export async function generateMetadata({ params }: TopicPageProps): Promise<Metadata> {
  const topic = (await params).topic;
  const articles = await getPublishedArticles();
  const category = [...new Set(articles.map((article) => article.category))]
    .find((name) => categorySlug(name) === topic);
  if (!category) return {};

  return {
    title: `${category} Insights`,
    description: `${category} articles and practical property guidance from DMZ Properties.`,
    alternates: { canonical: `/insights/topics/${topic}` },
  };
}

export default async function TopicPage({ params }: TopicPageProps) {
  const topic = (await params).topic;
  const articles = await getPublishedArticles();
  const category = [...new Set(articles.map((article) => article.category))]
    .find((name) => categorySlug(name) === topic);
  if (!category) notFound();

  const topicArticles = articles.filter((article) => article.category === category);

  return (
    <main>
      <div className="section-shell article-breadcrumbs">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Insights", href: "/insights" },
            { label: category },
          ]}
        />
      </div>
      <section className="section-shell page-hero">
        <p className="eyebrow">Insight topic</p>
        <h1 className="page-title">{category}</h1>
        <p>Practical property information organized around this topic.</p>
      </section>
      <section className="section-shell article-list listing-page-grid">
        {topicArticles.map((article) => (
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
