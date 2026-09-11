import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import Container from "@/components/Container";
import EmptyState from "@/components/EmptyState";
import { Card, CardBody } from "@/components/Card";
import { formatArticleDate, getAllArticles } from "@/lib/articles";

export const metadata: Metadata = {
  title: "Articles",
  description: "Hot takes, recaps, and league lore.",
};

export default function ArticlesPage() {
  const articles = getAllArticles();

  return (
    <>
      <PageHeader
        eyebrow="Read Up"
        title="Articles"
        subtitle="Hot takes, weekly recaps, draft postmortems, and the occasional manifesto."
      />
      <Container>
        {articles.length === 0 ? (
          <EmptyState
            title="No articles yet"
            description="The first article is being workshopped on a group chat near you. Check back soon."
          />
        ) : (
          <ul className="space-y-4">
            {articles.map((a) => (
              <li key={a.slug}>
                <Link
                  href={`/articles/${a.slug}`}
                  className="block"
                >
                  <Card variant="scoreboard" className="transition-all hover:border-result/60">
                    <CardBody>
                      <p className="font-[family-name:var(--font-heading)] text-[11px] font-semibold uppercase tracking-widest text-record">
                        {formatArticleDate(a.date)}
                        {a.author && ` · ${a.author}`}
                      </p>
                      <h2 className="mt-1 text-xl font-bold text-ink">
                        {a.title}
                      </h2>
                      {a.excerpt && (
                        <p className="mt-2 text-sm text-ink-soft">{a.excerpt}</p>
                      )}
                      <p className="mt-3 inline-flex items-center text-xs font-medium text-result">
                        Read article →
                      </p>
                    </CardBody>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Container>
    </>
  );
}
