import Link from "next/link";
import type { MedalCategory } from "@prisma/client";

/**
 * Prikaz dodijeljenih medalja — čl. 19 Akademije.
 *
 * Uz kategorijsku medalju koja nije pripala prvom igraču svoje kategorije
 * stoji objašnjenje. Bez njega prikaz izgleda kao pogreška: roditelj vidi da
 * je medalju za U12 dobio četvrtoplasirani i nema načina saznati zašto.
 */

const CATEGORY_LABELS: Record<MedalCategory, string> = {
  UKUPNO: "Ukupni poredak",
  U12: "U12",
  U10: "U10",
  U08: "U08",
  ZENE: "Igračice",
};

export interface MedalListItem {
  category: MedalCategory;
  place: number;
  playerId: string;
  playerName: string;
  transferred: boolean;
  note: string | null;
}

/**
 * Naziv priznanja. Na turniru se kategorijska medalja dodjeljuje samo
 * najboljem u kategoriji, pa tamo nema smisla pisati "1. mjesto"; u konačnom
 * poretku sezone ih je po tri, pa mjesto treba navesti.
 */
function awardLabel(item: MedalListItem): string {
  if (item.category === "UKUPNO") return `${item.place}. mjesto`;
  if (item.place === 1) {
    return item.category === "ZENE"
      ? "Najbolja igračica"
      : `Najbolji u kategoriji ${item.category}`;
  }
  return `${CATEGORY_LABELS[item.category]} — ${item.place}. mjesto`;
}

function MedalDisc({ place }: { place: number }) {
  const tone =
    place === 1
      ? "bg-gold text-navy-dark"
      : place === 2
        ? "bg-navy/15 text-navy"
        : "bg-[#b06a2c]/20 text-[#8a4f1d]";
  return (
    <span
      aria-hidden
      className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${tone}`}
    >
      {place}
    </span>
  );
}

export function MedalList({ items }: { items: MedalListItem[] }) {
  if (items.length === 0) return null;

  return (
    <ul className="divide-y divide-navy/10 rounded-lg border border-navy/10 bg-white">
      {items.map((item) => (
        <li
          key={`${item.category}-${item.place}`}
          className="flex items-start gap-3 px-4 py-3"
        >
          <MedalDisc place={item.place} />
          <div className="min-w-0">
            <Link
              href={`/igraci/${item.playerId}`}
              className="font-medium text-navy hover:underline"
            >
              {item.playerName}
            </Link>
            <p className="text-xs text-ink/70">{awardLabel(item)}</p>
            {item.transferred && (
              <p className="mt-0.5 text-xs text-ink/55">
                Prenesena — igrači ispred u ovoj kategoriji već su primili višu
                medalju (čl. 19).
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
