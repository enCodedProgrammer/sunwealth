import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { AnimateIn } from "@/components/ui/AnimateIn";
import { formatDate } from "@/lib/format";
import type { JournalArticleMeta } from "@/lib/journal";

type Variant = "feature" | "card";

type Props = {
  article: JournalArticleMeta;
  variant?: Variant;
};

export function JournalCard({ article, variant = "card" }: Props) {
  if (variant === "feature") {
    return (
      <section className="py-20 lg:py-28">
        <Container>
          <AnimateIn className="mb-10">
            <p className="mb-2 text-xs uppercase tracking-widest text-ink/45">
              From the Journal
            </p>
            <h2 className="font-display text-3xl text-ink md:text-4xl">
              Reading, not marketing.
            </h2>
          </AnimateIn>

          <AnimateIn delay={120}>
            <Link
              href={`/journal/${article.slug}`}
              className="group grid grid-cols-1 gap-8 overflow-hidden rounded-sm border border-sand bg-paper transition-colors duration-300 hover:border-gold hover:shadow-[0_4px_24px_rgba(201,162,84,0.08)] md:grid-cols-2"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-sand md:aspect-auto">
                {article.coverImage ? (
                  <Image
                    src={article.coverImage}
                    alt={article.coverAlt ?? article.title}
                    fill
                    sizes="(min-width: 768px) 50vw, 100vw"
                    className="object-cover motion-safe:transition-transform motion-safe:duration-700 motion-safe:group-hover:scale-[1.03]"
                    data-placeholder="true"
                  />
                ) : null}
              </div>
              <div className="flex flex-col justify-center gap-4 p-6 md:p-10">
                <p className="font-mono text-xs uppercase tracking-widest text-gold-deep">
                  {article.category}
                </p>
                <h3 className="font-display text-2xl leading-tight text-ink md:text-3xl">
                  {article.title}
                </h3>
                <p className="text-base leading-relaxed text-ink/70">
                  {article.excerpt}
                </p>
                <p className="text-xs text-ink/45">
                  <span className="font-mono">{formatDate(article.publishedAt)}</span>
                  {" · "}
                  <span className="font-mono">{article.readingMinutes} min read</span>
                </p>
              </div>
            </Link>
          </AnimateIn>
        </Container>
      </section>
    );
  }

  return (
    <Link
      href={`/journal/${article.slug}`}
      className="group flex flex-col gap-4 overflow-hidden rounded-sm border border-sand bg-paper transition-colors duration-300 hover:border-gold hover:shadow-[0_4px_20px_rgba(201,162,84,0.08)]"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-sand">
        {article.coverImage ? (
          <Image
            src={article.coverImage}
            alt={article.coverAlt ?? article.title}
            fill
            sizes="(min-width: 768px) 50vw, 100vw"
            className="object-cover motion-safe:transition-transform motion-safe:duration-700 motion-safe:group-hover:scale-[1.04]"
            data-placeholder="true"
          />
        ) : null}
      </div>
      <div className="flex flex-col gap-2 p-5">
        <p className="font-mono text-[11px] uppercase tracking-widest text-gold-deep">
          {article.category}
        </p>
        <h3 className="font-display text-xl leading-tight text-ink line-clamp-2">
          {article.title}
        </h3>
        <p className="text-sm leading-relaxed text-ink/70 line-clamp-3">
          {article.excerpt}
        </p>
        <p className="pt-1 text-xs text-ink/45">
          <span className="font-mono">{formatDate(article.publishedAt)}</span>
          {" · "}
          <span className="font-mono">{article.readingMinutes} min read</span>
        </p>
      </div>
    </Link>
  );
}
