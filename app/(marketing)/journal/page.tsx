import type { Metadata } from "next";
import { Suspense } from "react";
import { Container } from "@/components/ui/Container";
import { ArticleCard } from "@/components/marketing/ArticleCard";
import { CategoryFilter } from "@/components/marketing/CategoryFilter";
import {
  JOURNAL_CATEGORIES,
  listArticles,
  type JournalCategory,
} from "@/lib/journal";

export const metadata: Metadata = {
  title: "Journal — Sunwealth Real Estate",
  description:
    "Long-form reading on the Lagos property market, title documents, diaspora buying, and what our inspections actually look like.",
};

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function resolveCategory(raw: unknown): JournalCategory | null {
  const candidate = Array.isArray(raw) ? raw[0] : raw;
  if (typeof candidate !== "string") return null;
  return (JOURNAL_CATEGORIES as readonly string[]).includes(candidate)
    ? (candidate as JournalCategory)
    : null;
}

export default async function JournalIndexPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const activeCategory = resolveCategory(params.category);
  const articles = await listArticles();
  const filtered = activeCategory
    ? articles.filter((a) => a.category === activeCategory)
    : articles;

  return (
    <Container>
      <div className="py-16 lg:py-24">
        <header className="mb-10 flex flex-col gap-3">
          <h1 className="font-display text-4xl text-ink md:text-5xl">Journal</h1>
          <p className="max-w-2xl text-base leading-relaxed text-stone">
            Reading, not marketing. Market trends, legal explainers, diaspora
            buying guides, and the occasional inspection story — written by the
            people doing the work.
          </p>
        </header>

        <div className="mb-10">
          <Suspense fallback={null}>
            <CategoryFilter categories={[...JOURNAL_CATEGORIES]} />
          </Suspense>
        </div>

        {filtered.length === 0 ? (
          <p className="py-20 text-center text-sm text-stone">
            No articles in this category yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {filtered.map((a) => (
              <ArticleCard key={a.slug} article={a} />
            ))}
          </div>
        )}
      </div>
    </Container>
  );
}
