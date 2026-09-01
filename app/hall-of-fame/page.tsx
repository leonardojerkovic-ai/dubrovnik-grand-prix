import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Hall of Fame",
  description: "Pobjednici i najbolji plasmani kroz povijest Dubrovnik Grand Prixa.",
};

export default async function HallOfFamePage() {
  const entries = await prisma.hallOfFame.findMany({
    orderBy: [{ seasonId: "desc" }, { categoryCode: "asc" }, { place: "asc" }],
    include: { season: true, player: true },
  });

  const grouped = entries.reduce<Record<string, { season: (typeof entries)[number]["season"]; items: typeof entries }>>((acc, e) => {
    const key = `${e.seasonId}-${e.categoryCode}`;
    (acc[key] ??= { season: e.season, items: [] }).items.push(e);
    return acc;
  }, {});

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-display text-2xl font-bold text-navy mb-8">Hall of Fame</h1>
      {Object.keys(grouped).length === 0 && <p className="text-ink/60">Još nema zabilježenih pobjednika.</p>}
      <div className="grid gap-6 md:grid-cols-2">
        {Object.entries(grouped).map(([key, group]) => {
          const firstItem = group.items[0];
          if (!firstItem) return null;
          return <div key={key} className="rounded-lg border border-navy/10 bg-white p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink/50"><span className={group.season.system === "AKADEMIJA" ? "text-academy" : "text-navy"}>{group.season.system === "GP" ? "Dubrovnik GP" : "Akademija"}</span>{" "}{group.season.yearLabel} · {firstItem.categoryCode}</p>
            <ol className="grid gap-2">{group.items.map((e) => <li key={e.id} className="flex items-center gap-3"><span className="rank-badge" data-parity={e.place % 2 === 0 ? "even" : "odd"} data-place={e.place === 1 ? "1" : undefined}>{e.place}</span><span className="font-medium text-navy">{e.player.lastName} {e.player.firstName}</span><span className="ml-auto font-mono text-sm text-ink/50">{e.pointsTotal}</span></li>)}</ol>
          </div>;
        })}
      </div>
    </div>
  );
}
