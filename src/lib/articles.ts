// ============================================================
// MDX article loading. Articles live in src/content/articles/*.mdx
// and use gray-matter frontmatter:
//   ---
//   title: "..."
//   date: 2024-01-15
//   author: "..."
//   excerpt: "..."
//   ---
// ============================================================

import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

export interface ArticleFrontmatter {
  title: string;
  date: string; // ISO yyyy-mm-dd
  author?: string;
  excerpt?: string;
}

export interface ArticleSummary extends ArticleFrontmatter {
  slug: string;
}

export interface Article extends ArticleSummary {
  content: string;
}

const ARTICLES_DIR = path.join(process.cwd(), "src", "content", "articles");

function articlesDirExists(): boolean {
  try {
    return fs.statSync(ARTICLES_DIR).isDirectory();
  } catch {
    return false;
  }
}

function listMdxFiles(): string[] {
  if (!articlesDirExists()) return [];
  return fs
    .readdirSync(ARTICLES_DIR)
    .filter((f) => f.endsWith(".mdx") || f.endsWith(".md"));
}

function slugFromFile(filename: string): string {
  return filename.replace(/\.(md|mdx)$/i, "");
}

function normalizeFrontmatter(
  raw: Record<string, unknown>,
  slug: string
): ArticleFrontmatter {
  const title =
    typeof raw.title === "string" && raw.title.trim()
      ? raw.title
      : slug.replace(/-/g, " ");
  let date: string;
  if (raw.date instanceof Date) {
    date = raw.date.toISOString().slice(0, 10);
  } else if (typeof raw.date === "string") {
    date = raw.date;
  } else {
    date = "";
  }
  const author = typeof raw.author === "string" ? raw.author : undefined;
  const excerpt = typeof raw.excerpt === "string" ? raw.excerpt : undefined;
  return { title, date, author, excerpt };
}

/** Returns the list of articles, newest first. */
export function getAllArticles(): ArticleSummary[] {
  const files = listMdxFiles();
  const items: ArticleSummary[] = files.map((file) => {
    const filePath = path.join(ARTICLES_DIR, file);
    const raw = fs.readFileSync(filePath, "utf8");
    const { data } = matter(raw);
    const slug = slugFromFile(file);
    return { slug, ...normalizeFrontmatter(data, slug) };
  });
  items.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  return items;
}

/** Read a single article by slug. Returns null if not found. */
export function getArticleBySlug(slug: string): Article | null {
  if (!articlesDirExists()) return null;
  // Look for either .mdx or .md
  const candidates = [`${slug}.mdx`, `${slug}.md`];
  const file = candidates.find((c) =>
    fs.existsSync(path.join(ARTICLES_DIR, c))
  );
  if (!file) return null;
  const raw = fs.readFileSync(path.join(ARTICLES_DIR, file), "utf8");
  const { data, content } = matter(raw);
  const fm = normalizeFrontmatter(data, slug);
  return { slug, ...fm, content };
}

/** Format an article date for display. */
export function formatArticleDate(date: string): string {
  if (!date) return "";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
