import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { Container } from "@/components/ui/Container";
import { PropertyCard } from "@/components/property/PropertyCard";
import { searchProperties } from "@/lib/db/properties";
import { formatDate } from "@/lib/format";
import { getArticle, listArticles, listSlugs } from "@/lib/journal";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const slugs = await listSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) return { title: "Article not found" };
  return {
    title: article.title,
    description: article.excerpt,
    alternates: { canonical: `/journal/${slug}` },
    openGraph: {
      title: article.title,
      description: article.excerpt,
      type: "article",
      publishedTime: article.publishedAt,
      authors: [article.author],
      images: article.coverImage ? [{ url: article.coverImage }] : undefined,
    },
  };
}

export default async function ArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) notFound();

  const [related, articles] = await Promise.all([
    relatedProperties(article),
    listArticles(),
  ]);
  const relatedArticles = articles
    .filter((a) => a.slug !== slug && a.category === article.category)
    .slice(0, 3);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.excerpt,
    author: { "@type": "Person", name: article.author },
    datePublished: article.publishedAt,
    image: article.coverImage ? [article.coverImage] : undefined,
    publisher: {
      "@type": "Organization",
      name: "Sunwealth Real Estate Limited",
    },
  };

  return (
    <article>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Container>
        <header className="mx-auto max-w-3xl pt-16 pb-10 lg:pt-24">
          <Link
            href="/journal"
            className="mb-6 inline-block text-xs uppercase tracking-widest text-stone transition-colors hover:text-gold-deep"
          >
            ← Journal
          </Link>
          <p className="mb-3 font-mono text-xs uppercase tracking-widest text-gold-deep">
            {article.category}
          </p>
          <h1 className="font-display text-4xl leading-[1.1] text-ink md:text-5xl lg:text-[3.25rem]">
            {article.title}
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-stone">
            {article.excerpt}
          </p>
          <p className="mt-6 text-sm text-stone">
            {article.author}
            {" · "}
            <span className="font-mono">{formatDate(article.publishedAt)}</span>
            {" · "}
            <span className="font-mono">{article.readingMinutes} min read</span>
          </p>
        </header>
      </Container>

      {article.coverImage ? (
        <div className="relative mx-auto aspect-[16/9] w-full max-w-5xl bg-sand">
          <Image
            src={article.coverImage}
            alt={article.coverAlt ?? article.title}
            fill
            priority
            sizes="(min-width: 1280px) 1024px, 100vw"
            className="object-cover"
            data-placeholder="true"
          />
        </div>
      ) : null}

      <Container>
        <div className="mx-auto max-w-[680px] py-16 lg:py-20">
          <div className="prose-article">
            <MDXRemote source={article.body} />
          </div>
        </div>
      </Container>

      {related.length > 0 ? (
        <div className="bg-sand/40 py-20 lg:py-28">
          <Container>
            <h2 className="mb-10 font-display text-2xl text-ink md:text-3xl">
              Related properties
            </h2>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {related.map((p) => (
                <PropertyCard key={p.id} property={p} />
              ))}
            </div>
          </Container>
        </div>
      ) : null}

      {relatedArticles.length > 0 ? (
        <Container>
          <div className="py-20 lg:py-28">
            <h2 className="mb-8 font-display text-2xl text-ink md:text-3xl">
              More in {article.category}
            </h2>
            <ul className="flex flex-col divide-y divide-stone/30">
              {relatedArticles.map((a) => (
                <li key={a.slug}>
                  <Link
                    href={`/journal/${a.slug}`}
                    className="group flex flex-col gap-1 py-5 transition-colors hover:text-gold-deep"
                  >
                    <p className="font-display text-xl text-ink group-hover:text-gold-deep">
                      {a.title}
                    </p>
                    <p className="text-sm text-stone line-clamp-2">
                      {a.excerpt}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </Container>
      ) : null}
    </article>
  );
}

async function relatedProperties(article: Awaited<ReturnType<typeof getArticle>>) {
  if (!article) return [];
  const areas = article.relatedAreas ?? [];
  if (areas.length === 0) return [];
  const { results } = await searchProperties({ area: areas, limit: 3 });
  return results;
}
