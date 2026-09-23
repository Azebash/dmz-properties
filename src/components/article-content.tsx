import Link from "next/link";
import type { Article } from "@/lib/content";

export function ArticleContent({
  article,
  preview = false,
}: {
  article: Article;
  preview?: boolean;
}) {
  return (
    <>
      <header className="section-shell page-hero">
        <p className="eyebrow">{article.category}</p>
        <h1 className="page-title">{article.title}</h1>
        <p>{article.excerpt}</p>
      </header>
      <article className="section-shell article-grid">
        <aside className="article-aside">
          <p>{article.readTime}</p>
          {!preview ? <p>Published {article.publishedAt}</p> : null}
          <p>Updated {article.updatedAt}</p>
          <p>DMZ Properties</p>
        </aside>
        <div className="article-body">
          {article.sections.map((section, index) => (
            <section key={index}>
              <h2>{section.heading}</h2>
              <p>{section.body}</p>
            </section>
          ))}
          <Link className="button button-secondary section-action" href="/contact">
            Discuss your requirements
          </Link>
        </div>
      </article>
    </>
  );
}
