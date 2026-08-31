/**
 * Ljestvice — Dubrovnik Grand Prix (glavni sustav)
 * Reference: čl. 15-18 (Opći GP) i čl. 19-22 (kategorijske ljestvice)
 *
 * Ova logika je namjerno odvojena od izračuna bodova po turniru
 * (formulas.ts) — radi na već izračunatim gpPoints rezultatima.
 */

export interface PlayerTournamentResult {
  tournamentId: string;
  /** Je li ovo završni turnir (GP Finale / Juniorsko GP Finale) */
  isFinal: boolean;
  gpPoints: number;
}

export interface StandingEntry {
  playerId: string;
  /** Ukupan zbroj bodova koji ulazi u konačni poredak */
  total: number;
  /** Rezultati koji su ušli u zbroj, poredani od najboljeg prema najlošijem (za tie-break, čl. 18) */
  countedResults: PlayerTournamentResult[];
  /** Svi rezultati igrača u ovoj sezoni/ljestvici (uključujući odbačene) — za transparentnost/audit */
  allResults: PlayerTournamentResult[];
}

/**
 * Izračunava broj redovnih rezultata koji ulaze u zbroj — čl. 16 (Opći GP)
 * i čl. 20. st. 3 (kategorijske ljestvice): polovica broja redovnih turnira
 * u kalendaru te ljestvice, zaokruženo na veći cijeli broj, minimalno 5.
 *
 * @param regularTournamentsInCalendar broj redovnih (ne-završnih) turnira
 *   objavljenih u kalendaru za tu ljestvicu (Opći GP ili pojedina kategorija)
 */
export function calculateQuota(regularTournamentsInCalendar: number): number {
  const half = Math.ceil(regularTournamentsInCalendar / 2);
  return Math.max(5, half);
}

/**
 * Sastavlja konačni zbroj bodova jednog igrača za jednu ljestvicu (Opći GP
 * ili jednu kategorijsku ljestvicu) — čl. 16-17 / čl. 20.
 *
 * Pravilo: od SVIH redovnih rezultata igrača na toj ljestvici uzima se
 * najboljih `quota` rezultata. Rezultat završnog turnira (ako postoji) se
 * DODAJE povrh toga i nikad se ne odbacuje (zaštićen, čl. 17 i čl. 20 st. 6).
 *
 * @param results svi rezultati igrača relevantni za ovu ljestvicu (i redovni
 *   i eventualni završni) — filtriranje po kategoriji/sezoni radi se prije poziva
 * @param quota broj redovnih rezultata koji se računaju (calculateQuota)
 */
export function buildPlayerStanding(
  playerId: string,
  results: PlayerTournamentResult[],
  quota: number
): StandingEntry {
  const regular = results.filter((r) => !r.isFinal);
  const finals = results.filter((r) => r.isFinal);

  const sortedRegular = [...regular].sort((a, b) => b.gpPoints - a.gpPoints);
  const countedRegular = sortedRegular.slice(0, quota);

  // Zaštićeni rezultat finala (čl. 17) — dodaje se povrh kvote, ne ulazi u
  // usporedbu "najboljih quota", uvijek se broji ako postoji.
  const countedResults = [...countedRegular, ...finals].sort(
    (a, b) => b.gpPoints - a.gpPoints
  );

  const total = countedResults.reduce((sum, r) => sum + r.gpPoints, 0);

  return {
    playerId,
    total,
    countedResults,
    allResults: results,
  };
}

/**
 * Razrješenje ravnopravnosti kod jednakog zbroja — čl. 18.
 * Uspoređuju se pojedinačni rezultati koji ulaze u zbroj, redoslijedom
 * od najboljeg prema najlošijem: bolji prvi rezultat pobjeđuje, zatim
 * bolji drugi, itd. Ako su svi rezultati koji ulaze u zbroj jednaki,
 * igrači dijele mjesto (funkcija vraća 0).
 *
 * Vraća: negativan broj ako `a` treba biti ispred `b`, pozitivan obrnuto, 0 = dijele mjesto.
 * Rezultati u `countedResults` MORAJU već biti sortirani od najboljeg prema najlošijem
 * (buildPlayerStanding to osigurava).
 */
export function compareStandings(a: StandingEntry, b: StandingEntry): number {
  if (a.total !== b.total) return b.total - a.total;

  const len = Math.max(a.countedResults.length, b.countedResults.length);
  for (let i = 0; i < len; i++) {
    const av = a.countedResults[i]?.gpPoints ?? 0;
    const bv = b.countedResults[i]?.gpPoints ?? 0;
    if (av !== bv) return bv - av;
  }
  return 0; // dijele mjesto
}

/** Sortira cijelu ljestvicu primjenom čl. 18 tie-break pravila. */
export function sortStandings(entries: StandingEntry[]): StandingEntry[] {
  return [...entries].sort(compareStandings);
}
