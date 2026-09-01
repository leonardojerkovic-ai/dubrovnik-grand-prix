/**
 * Poredak prijavljenih igrača na javnoj stranici turnira:
 * 1. rejting (viši prvi), 2. titula, 3. prezime po hrvatskoj abecedi.
 */

const TITLE_RANK: Record<string, number> = {
  GM: 1, IM: 2, WGM: 3, FM: 4, WIM: 5, CM: 6, WCM: 7, MK: 8,
  I: 9, II: 10, III: 11, IV: 12, V: 13, NONE: 14,
};
const DEFAULT_TITLE_RANK = 14;

export interface SortablePlayerEntry {
  firstName: string;
  lastName: string;
  title: string;
  rating: number | null;
}

export function compareByRatingTitleSurname(a: SortablePlayerEntry, b: SortablePlayerEntry): number {
  const ratingA = a.rating ?? 0;
  const ratingB = b.rating ?? 0;
  if (ratingA !== ratingB) return ratingB - ratingA;
  const rankA = TITLE_RANK[a.title] ?? DEFAULT_TITLE_RANK;
  const rankB = TITLE_RANK[b.title] ?? DEFAULT_TITLE_RANK;
  if (rankA !== rankB) return rankA - rankB;
  return a.lastName.localeCompare(b.lastName, "hr");
}

export function sortPlayersByRatingTitleSurname<T extends SortablePlayerEntry>(players: T[]): T[] {
  return [...players].sort(compareByRatingTitleSurname);
}
