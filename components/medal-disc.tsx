import type { MedalCategory } from "@prisma/client";

/**
 * Zajednički prikaz jedne medalje — koriste ga i popis na turniru i vitrina
 * na profilu igrača, da se oznake ne razilaze između te dvije stranice.
 *
 * Medalje ukupnog poretka nose broj mjesta i boju odličja. Kategorijske
 * medalje iz čl. 19 nisu ni zlatne ni srebrne ni brončane — one su posebne
 * medalje, pa u krugu stoji oznaka kategorije, a ne brojka.
 */

export const CATEGORY_SHORT: Record<MedalCategory, string> = {
  UKUPNO: "",
  U12: "U12",
  U10: "U10",
  U08: "U08",
  ZENE: "Ž",
};

export const CATEGORY_LABELS: Record<MedalCategory, string> = {
  UKUPNO: "Ukupni poredak",
  U12: "U12",
  U10: "U10",
  U08: "U08",
  ZENE: "Igračice",
};

export function isSpecial(category: MedalCategory): boolean {
  return category !== "UKUPNO";
}

function toneFor(place: number): string {
  if (place === 1) return "bg-gold text-navy-dark";
  if (place === 2) return "bg-navy/15 text-navy";
  return "bg-[#b06a2c]/20 text-[#8a4f1d]";
}

export function MedalDisc({
  category,
  place,
}: {
  category: MedalCategory;
  place: number;
}) {
  const special = isSpecial(category);
  return (
    <span
      aria-hidden
      className={`inline-flex h-7 shrink-0 items-center justify-center rounded-full font-bold ${toneFor(place)} ${
        special ? "w-auto px-2 text-[10px] tracking-tight" : "w-7 text-xs"
      }`}
    >
      {special ? CATEGORY_SHORT[category] : place}
    </span>
  );
}

/**
 * Naziv priznanja. Na turniru se kategorijska medalja dodjeljuje samo
 * najboljem u kategoriji, pa tamo nema smisla pisati mjesto; u konačnom
 * poretku sezone ih je po tri, pa mjesto treba navesti.
 */
export function awardLabel(category: MedalCategory, place: number): string {
  if (category === "UKUPNO") return `${place}. mjesto`;
  if (place === 1) {
    return category === "ZENE"
      ? "Posebna medalja — najbolja igračica"
      : `Posebna medalja — najbolji u kategoriji ${category}`;
  }
  return `Posebna medalja — ${CATEGORY_LABELS[category]}, ${place}. mjesto`;
}
