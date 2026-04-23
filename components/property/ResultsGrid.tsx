import type { PropertySearchResult } from "@/lib/db/properties";
import { PropertyCard } from "./PropertyCard";

type Props = {
  results: PropertySearchResult[];
};

export function ResultsGrid({ results }: Props) {
  return (
    <ul className="grid grid-cols-1 gap-x-6 gap-y-10 md:grid-cols-2 lg:grid-cols-3">
      {results.map((r) => (
        <li key={r.id}>
          <PropertyCard property={r} />
        </li>
      ))}
    </ul>
  );
}
