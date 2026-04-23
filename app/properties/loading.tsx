import { Container } from "@/components/ui/Container";

export default function Loading() {
  return (
    <>
      {/* Hero skeleton */}
      <div className="relative flex min-h-[62vh] items-end bg-ink/90">
        <div className="relative z-10 w-full pb-24 pt-32">
          <Container>
            <div className="flex flex-col gap-4">
              <div className="h-3 w-32 animate-pulse rounded-sm bg-paper/20" />
              <div className="h-12 w-80 animate-pulse rounded-sm bg-paper/20" />
              <div className="h-4 w-[440px] max-w-full animate-pulse rounded-sm bg-paper/15" />
            </div>
          </Container>
        </div>
      </div>

      {/* Accordion filter card skeleton */}
      <div className="relative z-20 -mt-9">
        <Container>
          <div className="rounded-sm border border-sand bg-paper px-6 py-5 shadow-[0_8px_40px_rgba(11,14,19,0.14)]">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_1fr_auto]">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex flex-col gap-1.5">
                  <div className="h-2.5 w-14 animate-pulse rounded-sm bg-sand" />
                  <div className="h-11 animate-pulse rounded-sm bg-sand" />
                </div>
              ))}
              <div className="flex flex-col justify-end sm:col-span-2 lg:col-span-1">
                <div className="h-11 animate-pulse rounded-sm bg-sand" />
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-sand pt-3">
              <div className="h-3 w-24 animate-pulse rounded-sm bg-sand" />
              <div className="h-3 w-14 animate-pulse rounded-sm bg-sand" />
            </div>
          </div>
        </Container>
      </div>

      {/* Results grid skeleton */}
      <Container className="py-10 lg:py-16">
        <div className="mb-6 flex items-center justify-between">
          <div className="h-4 w-24 animate-pulse rounded-sm bg-sand" />
          <div className="h-9 w-32 animate-pulse rounded-sm bg-sand" />
        </div>
        <ul
          aria-hidden="true"
          className="grid grid-cols-1 gap-x-6 gap-y-10 md:grid-cols-2 lg:grid-cols-3"
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <li key={i} className="flex flex-col gap-3">
              <div className="aspect-[16/9] animate-pulse rounded-sm bg-sand" />
              <div className="h-5 w-3/4 animate-pulse rounded-sm bg-sand" />
              <div className="h-4 w-1/2 animate-pulse rounded-sm bg-sand" />
              <div className="h-4 w-1/3 animate-pulse rounded-sm bg-sand" />
            </li>
          ))}
        </ul>
      </Container>
    </>
  );
}
