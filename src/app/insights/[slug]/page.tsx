import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { articles, getArticle } from "@/lib/content";
import { siteUrl } from "@/lib/site";
import { Breadcrumbs } from "@/components/breadcrumbs";

type ArticlePageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return articles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({
  params,
}: ArticlePageProps): Promise<Metadata> {
  const article = getArticle((await params).slug);

  if (!article) return {};

  return {
    title: article.title,
    description: article.excerpt,
    alternates: { canonical: `/insights/${article.slug}` },
    openGraph: {
      type: "article",
      title: article.title,
      description: article.excerpt,
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt,
    },
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const article = getArticle((await params).slug);

  if (!article) notFound();

  const articleData = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.excerpt,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    author: { "@type": "Organization", name: "DMZ Properties" },
    publisher: { "@type": "Organization", name: "DMZ Properties" },
    mainEntityOfPage: `${siteUrl}/insights/${article.slug}`,
  };

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleData) }}
      />
      <div className="section-shell article-breadcrumbs">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Insights", href: "/insights" },
            { label: article.title },
          ]}
        />
      </div>
      <header className="section-shell page-hero">
        <p className="eyebrow">{article.category}</p>
        <h1 className="page-title">{article.title}</h1>
        <p>{article.excerpt}</p>
      </header>
      <article className="section-shell article-grid">
        <aside className="article-aside">
          <p>{article.readTime}</p>
          <p>Published {article.publishedAt}</p>
          <p>DMZ Properties</p>
        </aside>
        <div className="article-body">
          {article.sections.map((section) => (
            <section key={section.heading}>
              <h2>{section.heading}</h2>
              <p>{section.body}</p>
            </section>
          ))}
          <Link className="button button-secondary section-action" href="/contact">
            Discuss your requirements
          </Link>
        </div>
      </article>
    </main>
  );
}
