import { searchProperties } from "@/lib/db/properties";
import { listArticles } from "@/lib/journal";
import { Hero } from "@/components/marketing/Hero";
import { SubBrandBlocks } from "@/components/marketing/SubBrandBlocks";
import { FeaturedStrip } from "@/components/marketing/FeaturedStrip";
import { DiasporaSteps } from "@/components/marketing/DiasporaSteps";
import { JournalCard } from "@/components/marketing/JournalCard";

// Re-run at most every 60s so published changes appear without a full redeploy.
export const revalidate = 60;

const FALLBACK_HERO = {
  src: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=2000&q=80",
  alt: "Contemporary Lagos duplex front elevation at golden hour with stone-clad entrance and double garage",
};

export default async function HomePage() {
  const [{ results: featured }, articles] = await Promise.all([
    searchProperties({ sortBy: "newest", limit: 3 }),
    listArticles(),
  ]);

  const heroChoice = pickHeroImage(featured);
  const latestArticle = articles[0];

  return (
    <>
      <Hero imageSrc={heroChoice.src} imageAlt={heroChoice.alt} />
      <SubBrandBlocks />
      <FeaturedStrip properties={featured} />
      <DiasporaSteps />
      {latestArticle ? (
        <JournalCard article={latestArticle} variant="feature" />
      ) : null}
    </>
  );
}

function pickHeroImage(
  properties: Awaited<ReturnType<typeof searchProperties>>["results"],
): { src: string; alt: string } {
  const withImage = properties.find((p) => p.primaryImage);
  if (!withImage) return FALLBACK_HERO;
  return {
    src: withImage.primaryImage,
    alt: `${withImage.title} — ${withImage.location.area}, ${withImage.location.city}`,
  };
}
