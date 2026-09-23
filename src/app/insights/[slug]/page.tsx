import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { categorySlug } from "@/lib/content";
import { getPublishedArticle, getPublishedArticles } from "@/lib/public-articles";
import { siteUrl } from "@/lib/site";
import { Breadcrumbs } from "@/components/breadcrumbs";

type ArticlePageProps = {
  params: Promise<{ slug: string }>;
};

export const revalidate = 60;

export async function generateMetadata({
  params,
}: ArticlePageProps): Promise<Metadata> {
  const article = await getPublishedArticle((await params).slug);

  if (!article) return {};

  return {
    title: article.seoTitle || article.title,
    description: article.seoDescription || article.excerpt,
    alternates: { canonical: `/insights/${article.slug}` },
    openGraph: {
      type: "article",
      title: article.title,
      description: article.excerpt,
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt,
      images: ["/opengraph-image"],
    },
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const [article, articles] = await Promise.all([
    getPublishedArticle((await params).slug),
    getPublishedArticles(),
  ]);

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
  const relatedArticles = articles
    .filter((candidate) => candidate.slug !== article.slug)
    .slice(0, 2);

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
          <p>Updated {article.updatedAt}</p>
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
      <section className="section-shell related-reading">
        <div className="related-reading-heading">
          <h2>Continue your research</h2>
          <Link href={`/insights/topics/${categorySlug(article.category)}`}>
            More {article.category.toLowerCase()}
          </Link>
        </div>
        <div className="related-reading-grid">
          {relatedArticles.map((related) => (
            <article key={related.slug}>
              <span>{related.category}</span>
              <h3>
                <Link href={`/insights/${related.slug}`}>{related.title}</Link>
              </h3>
              <p>{related.excerpt}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
