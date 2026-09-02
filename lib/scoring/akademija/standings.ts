/**
 * Ljestvica — GP Akademije
 * Reference: čl. 11 (kvalifikacija za finale), čl. 14 (konačni poredak), čl. 15 (tie-break)
 */

export interface AkademijaTournamentResult {
  tournamentId: string;
  isFinal: boolean;
  gpPoints: number;
  /** Konačni plasman igrača na tom turniru — potreban za tie-break kriterije čl. 15 st. 2 i 4 */
  rank: number;
  /** Je li igrač bio prvoplasiran na tom turniru — za čl. 15 st. 2 */
  wasFirstPlace: boolean;
}

export interface AkademijaStandingEntry {
  playerId: string;
  /** Zbroj koji ulazi u konačni poredak: najviše 4 najbolja kvalifikacijska + finale (čl. 14) */
  total: number;
  countedResults: AkademijaTournamentResult[];
  allResults: AkademijaTournamentResult[];
}

const MAX_QUALIFIER_RESULTS = 4; // čl. 14 — "najviše 4 najbolja rezultata"

/**
 * Sastavlja konačni zbroj igrača — čl. 14.
 * Uzima najbolja 4 rezultata iz kvalifikacijske serije + obavezan (ne može
 * se odbaciti) rezultat završnog turnira, ako postoji.
 */
export function buildPlayerStanding(
  playerId: string,
  results: AkademijaTournamentResult[]
): AkademijaStandingEntry {
  const qualifiers = results.filter((r) => !r.isFinal);
  const finals = results.filter((r) => r.isFinal);

  const sortedQualifiers = [...qualifiers].sort(
    (a, b) => b.gpPoints - a.gpPoints
  );
  const countedQualifiers = sortedQualifiers.slice(0, MAX_QUALIFIER_RESULTS);

  const countedResults = [...countedQualifiers, ...finals].sort(
    (a, b) => b.gpPoints - a.gpPoints
  );

  const total = countedResults.reduce((sum, r) => sum + r.gpPoints, 0);

  return { playerId, total, countedResults, allResults: results };
}

/**
 * Provjera prava nastupa na Prvenstvu Akademije (top 8) — čl. 11.
 * Uvjet: član ŠK Dubrovnik, odigrao najmanje 3 kvalifikacijska turnira
 * (uključujući i one odigrane prije učlanjenja — čl. 11 st. 4).
 */
export function isEligibleForFinal(input: {
  isClubMember: boolean;
  qualifiersPlayed: number;
}): boolean {
  return input.isClubMember && input.qualifiersPlayed >= 3;
}

/**
 * Razrješenje ravnopravnosti kod jednakog konačnog zbroja — čl. 15.
 * Redoslijed kriterija:
 *   1. veći ukupni zbroj SVIH rezultata (uključujući odbačene)
 *   2. veći broj prvih mjesta na turnirima sezone
 *   3. veći broj odigranih turnira
 *   4. bolji plasman na Prvenstvu Akademije
 *   5. bolji plasman na posljednjem zajednički odigranom turniru
 *   6. dijeljeno mjesto
 *
 * Kriterij 5. (posljednji zajednički odigrani turnir) zahtijeva podatak o
 * DATUMU turnira da bi se odredilo "posljednji" — ovdje se očekuje da je
 * `allResults` već filtriran/sortiran kronološki od strane pozivatelja
 * (uparivanje turnira koje su OBA igrača odigrala treba raditi izvan ove
 * funkcije, na razini servisa koji ima pristup punom kalendaru).
 */
export type ComparableAkademijaStanding = Pick<
  AkademijaStandingEntry,
  "total" | "allResults"
>;

export function compareStandings(
  a: ComparableAkademijaStanding,
  b: ComparableAkademijaStanding
): number {
  if (a.total !== b.total) return b.total - a.total;

  const sumAll = (e: ComparableAkademijaStanding) =>
    e.allResults.reduce((s, r) => s + r.gpPoints, 0);
  const allA = sumAll(a);
  const allB = sumAll(b);
  if (allA !== allB) return allB - allA;

  const firstPlacesA = a.allResults.filter((r) => r.wasFirstPlace).length;
  const firstPlacesB = b.allResults.filter((r) => r.wasFirstPlace).length;
  if (firstPlacesA !== firstPlacesB) return firstPlacesB - firstPlacesA;

  if (a.allResults.length !== b.allResults.length) {
    return b.allResults.length - a.allResults.length;
  }

  const finalA = a.allResults.find((r) => r.isFinal);
  const finalB = b.allResults.find((r) => r.isFinal);
  if (finalA && finalB && finalA.rank !== finalB.rank) {
    return finalA.rank - finalB.rank; // manji rank = bolji plasman
  }

  // Kriterij 5 (posljednji zajednički turnir) namjerno nije ovdje —
  // vidi napomenu u JSDoc-u iznad, rješava se na servisnom sloju.

  return 0; // dijeljeno mjesto
}

export function sortStandings(
  entries: AkademijaStandingEntry[]
): AkademijaStandingEntry[] {
  return [...entries].sort(compareStandings);
}
