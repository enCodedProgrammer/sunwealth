// Re-export the card variant of JournalCard under a name that matches the
// journal index's conceptual model. Keeps the filename list in pages.md tidy.
import { JournalCard } from "./JournalCard";
import type { JournalArticleMeta } from "@/lib/journal";

export function ArticleCard({ article }: { article: JournalArticleMeta }) {
  return <JournalCard article={article} variant="card" />;
}
