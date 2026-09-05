/**
 * Poredak prijavljenih igrača na javnoj stranici turnira:
 *   1. rejting (viši prvi) — koristi rejting odgovarajućeg tempa turnira
 *   2. titula (viša prvo) — po vrijednosti FIDE/nacionalnih titula
 *   3. prezime po hrvatskoj abecedi (Č, Ć, Š, Ž, Đ na svom mjestu)
 *
 * Ovo je prikaz za javnost (tko je prijavljen), NE utječe na GP bodovanje.
 */

/**
 * Vrijednost titula, redom kojim ih FIDE navodi:
 * GM, IM, WGM, FM, WIM, CM, WFM, WCM, pa bez titule.
 *
 * Ispod njih idu nacionalne kategorije Hrvatskog šahovskog saveza —
 * majstorski kandidat pa prva do pete. One nisu dio FIDE poretka, ali se u
 * klupskim popisima navode i moraju stajati ispod FIDE titula.
 */
const TITLE_RANK: Record<string, number> = {
  GM: 1,
  IM: 2,
  WGM: 3,
  FM: 4,
  WIM: 5,
  CM: 6,
  WFM: 7,
  WCM: 8,
  MK: 9,
  I: 10,
  II: 11,
  III: 12,
  IV: 13,
  V: 14,
  NONE: 15,
};

/** Rang za igrače bez titule ili s nepoznatom oznakom. */
const TITLE_UNRANKED = TITLE_RANK.NONE!;

export interface SortablePlayerEntry {
  firstName: string;
  lastName: string;
  title: string;
  /** Rejting relevantan za tempo turnira; null/0 tretira se kao najniži */
  rating: number | null;
}

export function compareByRatingTitleSurname(
  a: SortablePlayerEntry,
  b: SortablePlayerEntry
): number {
  const ratingA = a.rating ?? 0;
  const ratingB = b.rating ?? 0;
  if (ratingA !== ratingB) return ratingB - ratingA; // viši rejting prvo

  const rankA = TITLE_RANK[a.title] ?? TITLE_UNRANKED;
  const rankB = TITLE_RANK[b.title] ?? TITLE_UNRANKED;
  if (rankA !== rankB) return rankA - rankB; // niži rank broj = viša titula prvo

  return a.lastName.localeCompare(b.lastName, "hr");
}

export function sortPlayersByRatingTitleSurname<T extends SortablePlayerEntry>(
  players: T[]
): T[] {
  return [...players].sort(compareByRatingTitleSurname);
}
