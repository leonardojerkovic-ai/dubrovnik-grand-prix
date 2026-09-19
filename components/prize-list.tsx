import Link from "next/link";
import { AwardDisc } from "@/components/medal-disc";

/**
 * Dodijeljene nagrade na stranici turnira.
 *
 * Kao i kod medalja Akademije, uz prenesenu nagradu stoji objašnjenje — bez
 * njega prikaz izgleda kao greška, jer se iz tablice rezultata ne vidi zašto
 * je nagrada za najboljeg veterana otišla šestoplasiranom umjesto trećem.
 */

export interface PrizeListItem {
  prizeId: string;
  label: string;
  shortLabel: string | null;
  place: number;
  playerId: string;
  playerName: string;
  transferred: boolean;
  note: string | null;
}

export function PrizeList({ items }: { items: PrizeListItem[] }) {
  if (items.length === 0) return null;

  return (
    <ul className="divide-y divide-navy/10 rounded-lg border border-navy/10 bg-white">
      {items.map((item) => (
        <li
          key={`${item.prizeId}-${item.place}`}
          className="flex items-start gap-3 px-4 py-3"
        >
          <AwardDisc label={item.shortLabel} place={item.place} />
          <div className="min-w-0">
            <Link
              href={`/igraci/${item.playerId}`}
              className="font-medium text-navy hover:underline"
            >
              {item.playerName}
            </Link>
            <p className="text-xs text-ink/70">
              {item.label}
              {item.place > 1 && ` — ${item.place}. mjesto`}
            </p>
            {item.transferred && (
              <p className="mt-0.5 text-xs text-ink/55">
                Prenesena — igrači ispred u ovoj skupini već su primili višu
                nagradu.
              </p>
            )}
            {item.note && (
              <p className="mt-0.5 text-xs text-ink/55">{item.note}</p>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
