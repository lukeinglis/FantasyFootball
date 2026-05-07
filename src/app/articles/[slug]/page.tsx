import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import PageHeader from "@/components/PageHeader";
import Container from "@/components/Container";
import {
  formatArticleDate,
  getAllArticles,
  getArticleBySlug,
} from "@/lib/articles";

export function generateStaticParams() {
  return getAllArticles().map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) return { title: "Article not found" };
  return {
    title: article.title,
    description: article.excerpt,
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) notFound();

  return (
    <>
      <PageHeader
        eyebrow={
          [formatArticleDate(article.date), article.author]
            .filter(Boolean)
            .join(" · ") || undefined
        }
        title={article.title}
        subtitle={article.excerpt}
      >
        <Link
          href="/articles"
          className="rounded-md border border-white/10 px-3 py-1.5 text-xs text-gray-200 hover:bg-white/5"
        >
          ← All articles
        </Link>
      </PageHeader>
      <Container>
        <article className="prose prose-invert prose-league max-w-3xl">
          <MDXRemote
            source={article.content}
            options={{
              mdxOptions: {
                remarkPlugins: [remarkGfm],
              },
              parseFrontmatter: false,
            }}
          />
        </article>
      </Container>
    </>
  );
}
