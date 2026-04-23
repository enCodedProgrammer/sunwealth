import Link from "next/link";
import { Container } from "@/components/ui/Container";

export default function NotFound() {
  return (
    <Container className="py-20 lg:py-32">
      <div className="flex max-w-xl flex-col gap-4">
        <p className="font-mono text-xs uppercase tracking-wide text-stone">
          404
        </p>
        <h1 className="font-display text-4xl leading-tight text-ink md:text-5xl">
          We couldn&rsquo;t find that listing.
        </h1>
        <p className="text-stone">
          It may have been sold, let, or unpublished. Browse our current
          listings or ask our concierge to help you find something similar.
        </p>
        <div className="mt-2">
          <Link
            href="/properties"
            className="inline-flex h-11 items-center rounded-sm bg-gold px-6 font-medium text-ink transition-colors hover:bg-gold-deep"
          >
            Browse properties
          </Link>
        </div>
      </div>
    </Container>
  );
}
