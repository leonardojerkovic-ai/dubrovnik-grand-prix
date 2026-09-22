import Link from "next/link";
import type { MedalCategory } from "@prisma/client";
import { MedalDisc, awardLabel, isSpecial } from "@/components/medal-disc";
import { plural } from "@/lib/plural";

/**
 * Vitrina medalja na profilu igrača — čl. 19 Akademije.
 *
 * Brojač razdvaja odličja ukupnog poretka od posebnih medalja: kategorijska
 * medalja nije zlatna nego posebna, pa bi je brojanje u zlatne izjednačilo s
 * pobjedom na turniru.
 */

export interface PlayerMedalItem {
  id: string;
  seasonLabel: string;
  tournamentName: string | null;
  tournamentId: string | null;
  category: MedalCategory;
  place: number;
}

const PLACE_FORMS: Record<number, [string, string, string]> = {
  1: ["zlatna", "zlatne", "zlatnih"],
  2: ["srebrna", "srebrne", "srebrnih"],
  3: ["brončana", "brončane", "brončanih"],
};

function Count({
  category,
  place,
  value,
  label,
}: {
  category: MedalCategory;
  place: number;
  value: number;
  label: string;
}) {
  return (
    <span className="flex items-center gap-2">
      <MedalDisc category={category} place={place} />
      <span className="text-sm text-ink/70">
        <strong className="text-navy tabular-nums">{value}</strong> {label}
      </span>
    </span>
  );
}

export function PlayerMedals({ items }: { items: PlayerMedalItem[] }) {
  if (items.length === 0) return null;

  const overall = items.filter((i) => !isSpecial(i.category));
  const special = items.filter((i) => isSpecial(i.category));

  const counts = [1, 2, 3]
    .map((place) => ({
      place,
      value: overall.filter((i) => i.place === place).length,
    }))
    .filter((c) => c.value > 0);

  return (
    <section className="mb-8">
      <h2 className="mb-2 text-sm font-semibold text-navy">Medalje</h2>

      <div className="rounded-lg border border-navy/10 bg-white">
        <div className="flex flex-wrap items-center gap-5 border-b border-navy/10 px-4 py-3">
          {counts.map((c) => (
            <Count
              key={c.place}
              category="UKUPNO"
              place={c.place}
              value={c.value}
              label={(() => {
                const forms = PLACE_FORMS[c.place];
                return forms ? plural(c.value, ...forms) : "";
              })()}
            />
          ))}
          {special.length > 0 && (
            <span className="flex items-center gap-2">
              <span className="text-sm text-ink/70">
                <strong className="text-navy tabular-nums">
                  {special.length}
                </strong>{" "}
                {plural(special.length, "posebna", "posebne", "posebnih")}
              </span>
            </span>
          )}
        </div>

        <ul className="divide-y divide-navy/10">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-baseline justify-between gap-3 px-4 py-2 text-sm"
            >
              <span className="flex min-w-0 items-center gap-2 text-navy">
                <MedalDisc category={item.category} place={item.place} />
                {item.tournamentId ? (
                  <Link
                    href={`/turniri/${item.tournamentId}`}
                    className="truncate hover:underline"
                  >
                    {item.tournamentName}
                  </Link>
                ) : (
                  <>Konačni poredak {item.seasonLabel}</>
                )}
              </span>
              <span className="shrink-0 text-xs text-ink/60">
                {awardLabel(item.category, item.place)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
