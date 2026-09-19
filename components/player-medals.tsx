import Link from "next/link";
import type { MedalCategory } from "@prisma/client";

/**
 * Vitrina medalja na profilu igrača — čl. 19 Akademije.
 *
 * Djeci i roditeljima je ovo zanimljiviji dio profila od zbroja bodova, pa
 * brojač stoji na vrhu, a popis ispod njega.
 */

export interface PlayerMedalItem {
  id: string;
  seasonLabel: string;
  tournamentName: string | null;
  tournamentId: string | null;
  category: MedalCategory;
  place: number;
}

const PLACE_LABELS: Record<number, string> = {
  1: "zlatnih",
  2: "srebrnih",
  3: "brončanih",
};

function awardLabel(item: PlayerMedalItem): string {
  if (item.category === "UKUPNO") return `${item.place}. mjesto`;
  if (item.place === 1) {
    return item.category === "ZENE"
      ? "najbolja igračica"
      : `najbolji u kategoriji ${item.category}`;
  }
  return `${item.category} — ${item.place}. mjesto`;
}

function Count({ place, value }: { place: number; value: number }) {
  const tone =
    place === 1
      ? "bg-gold text-navy-dark"
      : place === 2
        ? "bg-navy/15 text-navy"
        : "bg-[#b06a2c]/20 text-[#8a4f1d]";
  return (
    <span className="flex items-center gap-2">
      <span
        aria-hidden
        className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${tone}`}
      >
        {place}
      </span>
      <span className="text-sm text-ink/70">
        <strong className="text-navy tabular-nums">{value}</strong>{" "}
        {PLACE_LABELS[place] ?? ""}
      </span>
    </span>
  );
}

export function PlayerMedals({ items }: { items: PlayerMedalItem[] }) {
  if (items.length === 0) return null;

  const counts: { place: number; value: number }[] = [1, 2, 3]
    .map((place) => ({
      place,
      value: items.filter((i) => i.place === place).length,
    }))
    .filter((c) => c.value > 0);

  return (
    <section className="mb-8">
      <h2 className="mb-2 text-sm font-semibold text-navy">Medalje</h2>

      <div className="rounded-lg border border-navy/10 bg-white">
        <div className="flex flex-wrap gap-5 border-b border-navy/10 px-4 py-3">
          {counts.map((c) => (
            <Count key={c.place} place={c.place} value={c.value} />
          ))}
        </div>

        <ul className="divide-y divide-navy/10">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-baseline justify-between gap-3 px-4 py-2 text-sm"
            >
              <span className="min-w-0 text-navy">
                {item.tournamentId ? (
                  <Link
                    href={`/turniri/${item.tournamentId}`}
                    className="hover:underline"
                  >
                    {item.tournamentName}
                  </Link>
                ) : (
                  <>Konačni poredak {item.seasonLabel}</>
                )}
              </span>
              <span className="shrink-0 text-xs text-ink/60">
                {awardLabel(item)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
