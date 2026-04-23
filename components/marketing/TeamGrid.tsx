const TEAM = [
  {
    name: "[PLACEHOLDER] Adaeze Okafor",
    role: "Founder & Managing Director",
    bio: "Twenty years in Lagos real estate, with a focus on titled land and luxury sales.",
  },
  {
    name: "[PLACEHOLDER] Tunde Balogun",
    role: "Head of Sales",
    bio: "Leads the sales desk across Ikoyi, Banana Island and VGC.",
  },
  {
    name: "[PLACEHOLDER] Ifeoma Nwachukwu",
    role: "Head of Diaspora",
    bio: "Primary point of contact for clients based in the UK, US, Canada and the UAE.",
  },
  {
    name: "[PLACEHOLDER] Chidi Eze",
    role: "Head of Land",
    bio: "Specialises in excised plots and emerging corridors — Ibeju-Lekki, Epe, Ikorodu.",
  },
];

export function TeamGrid() {
  return (
    <section>
      <div className="mb-8 flex items-end justify-between gap-6">
        <h2 className="font-display text-3xl text-ink md:text-4xl">The team.</h2>
        <p className="text-xs italic text-stone">
          {"Placeholder names and photos — replace with real team profiles before launch."}
        </p>
      </div>
      <ul className="grid grid-cols-2 gap-6 md:grid-cols-4">
        {TEAM.map((m) => (
          <li
            key={m.name}
            className="flex flex-col gap-3 rounded-sm border border-stone/30 bg-paper p-5"
            data-placeholder="true"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-sand font-display text-xl text-ink">
              {initialsOf(m.name.replace("[PLACEHOLDER] ", ""))}
            </div>
            <h3 className="font-display text-lg text-ink leading-tight">
              {m.name}
            </h3>
            <p className="font-mono text-[11px] uppercase tracking-widest text-gold-deep">
              {m.role}
            </p>
            <p className="text-sm leading-relaxed text-stone">{m.bio}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}
