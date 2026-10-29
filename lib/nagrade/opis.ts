import type { NovcanaNagrada } from "./dodjela";

/**
 * Uvjeti nagrade u jednoj rečenici, za izvještaj.
 *
 * Postoji zbog poruke o nedodijeljenoj nagradi: „nitko ne zadovoljava
 * uvjete" ne govori ništa dok se ne vidi KOJE uvjete. S ovim ispisom
 * organizator odmah vidi traži li raspis nešto čega na turniru nema —
 * juniora, igračicu, člana — pa može uvjet promijeniti ili nagradu ukinuti.
 *
 * Nagrada bez ijednog uvjeta vraća prazno: nju zadovoljavaju svi, pa je i
 * nema što opisivati.
 */
export function opisUvjeta(nagrada: NovcanaNagrada): string {
  const dijelovi: string[] = [];

  if (nagrada.oznaka) {
    dijelovi.push(nagrada.oznaka);
  } else if (nagrada.birthYearMin != null && nagrada.birthYearMax != null) {
    dijelovi.push(`godište ${nagrada.birthYearMin}–${nagrada.birthYearMax}`);
  } else if (nagrada.birthYearMin != null) {
    dijelovi.push(`godište ${nagrada.birthYearMin} i mlađi`);
  } else if (nagrada.birthYearMax != null) {
    dijelovi.push(`godište ${nagrada.birthYearMax} i stariji`);
  }

  if (nagrada.gender === "F") dijelovi.push("igračice");
  if (nagrada.gender === "M") dijelovi.push("igrači");

  const doZnak = nagrada.rejtingDoUkljucivo ? "≤" : "<";
  if (nagrada.ratingMin != null && nagrada.ratingMax != null) {
    dijelovi.push(`rejting ≥ ${nagrada.ratingMin} i ${doZnak} ${nagrada.ratingMax}`);
  } else if (nagrada.ratingMin != null) {
    dijelovi.push(`rejting ≥ ${nagrada.ratingMin}`);
  } else if (nagrada.ratingMax != null) {
    dijelovi.push(`rejting ${doZnak} ${nagrada.ratingMax}`);
  }

  if (nagrada.titule && nagrada.titule.length > 0) {
    dijelovi.push(`titula ${nagrada.titule.join(" ili ")}`);
  }

  if (nagrada.clubMembersOnly) dijelovi.push("članovi Kluba");

  return dijelovi.join(", ");
}
