import Link from "next/link";
import { AwardDisc } from "@/components/medal-disc";

/**
 * Osvojene nagrade na turnirima glavnog GP-a, na profilu igrača.
 *
 * Odvojeno od medalja Akademije, jer su to dva sustava s vlastitim
 * pravilima — isto načelo kojim se i drugdje na stranici GP i Akademija
 * vizualno razlikuju.
 */

export interface PlayerPrizeItem {
  id: string;
  tournamentId: string;
  tournamentName: string;
  label: string;
  shortLabel: string | null;
  place: number;
}

export function PlayerPrizes({ items }: { items: PlayerPrizeItem[] }) {
  if (items.length === 0) return null;

  return (
    <section className="mb-8">
      <h2 className="mb-2 text-sm font-semibold text-navy">Nagrade</h2>

      <ul className="divide-y divide-navy/10 rounded-lg border border-navy/10 bg-white">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex items-baseline justify-between gap-3 px-4 py-2 text-sm"
          >
            <span className="flex min-w-0 items-center gap-2 text-navy">
              <AwardDisc label={item.shortLabel} place={item.place} />
              <Link
                href={`/turniri/${item.tournamentId}`}
                className="truncate hover:underline"
              >
                {item.tournamentName}
              </Link>
            </span>
            <span className="shrink-0 text-xs text-ink/60">
              {item.label}
              {item.place > 1 && ` — ${item.place}. mjesto`}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
