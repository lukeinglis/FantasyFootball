import Link from "next/link";
import { Card, CardBody, CardHeader } from "@/components/Card";
import EmptyState from "@/components/EmptyState";
import { formatArticleDate, getAllArticles } from "@/lib/articles";

export default function ArticlesPreview() {
  const articles = getAllArticles().slice(0, 3);

  return (
    <Card>
      <CardHeader
        title="Latest Articles"
        description="Hot takes, recaps, and league lore."
        action={
          <Link
            href="/articles"
            className="text-xs font-medium text-[#DD550C] hover:underline"
          >
            All articles →
          </Link>
        }
      />
      <CardBody>
        {articles.length === 0 ? (
          <EmptyState
            icon={<span>📝</span>}
            title="No articles yet"
            description="The first hot take is coming soon."
          />
        ) : (
          <ul className="space-y-3">
            {articles.map((a) => (
              <li key={a.slug}>
                <Link
                  href={`/articles/${a.slug}`}
                  className="block rounded-lg bg-[#0C2340]/60 px-3 py-2 transition-colors hover:bg-[#0C2340]"
                >
                  <p className="font-medium text-white">{a.title}</p>
                  <p className="mt-1 line-clamp-2 text-xs text-gray-400">
                    {a.excerpt || "Read the full article →"}
                  </p>
                  <p className="mt-1 text-[11px] uppercase tracking-wide text-[#DD550C]/70">
                    {formatArticleDate(a.date)}
                    {a.author && ` · ${a.author}`}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}
