/**
 * Dodjela nagrada na turniru — opći mehanizam.
 *
 * Za razliku od medalja Akademije (lib/scoring/akademija/medals.ts), gdje
 * kategorije propisuje čl. 19, nagrade na turnirima glavnog GP-a nisu u
 * pravilniku — one se objavljuju u raspisu svakog turnira. Zato se ovdje
 * kriteriji ne ugrađuju u kod nego dolaze kao podaci: svaka nagrada nosi
 * svoje uvjete, broj primjeraka i mjesto u redoslijedu priznanja.
 *
 * Pravilo dodjele isto je kao u Akademiji: nagrade se NE kumuliraju. Igrač
 * prima samo najviše priznanje koje je ostvario, a nagrada koja time ostane
 * slobodna pripada sljedećem igraču koji zadovoljava njezine uvjete — i to
 * opetovano, ako i on već ima nagradu.
 *
 * Nagrade za ukupni poredak nisu poseban slučaj: one su obične nagrade bez
 * ijednog kriterija, samo s najvišim prioritetom. Time pobjednik turnira ne
 * može istovremeno uzeti i nagradu za najboljeg veterana, a ta veteranska
 * nagrada pada na sljedećeg veterana.
 */

export interface PrizeCriteria {
  /** Prazno = oba spola. */
  gender?: "M" | "F" | null;
  /** Rođen te godine ili KASNIJE (mlađi) — npr. U20 za sezonu 2027 daje 2007. */
  birthYearMin?: number | null;
  /** Rođen te godine ili RANIJE (stariji) — npr. S50 za sezonu 2027 daje 1977. */
  birthYearMax?: number | null;
  /** Donja granica rejtinga, uključivo. */
  ratingMin?: number | null;
  /** Gornja granica rejtinga, ISKLJUČIVO — U1800 znači ratingMax 1800. */
  ratingMax?: number | null;
  /** Samo članovi ŠK Dubrovnik na dan turnira (čl. 4). */
  clubMembersOnly?: boolean;
}

export interface PrizeDefinition extends PrizeCriteria {
  id: string;
  /** Manji broj = više priznanje. Ukupna mjesta imaju najmanje vrijednosti. */
  priority: number;
  /** Koliko se nagrada te vrste dodjeljuje. */
  count: number;
}

export interface PrizeCandidate {
  playerId: string;
  rank: number;
  birthYear: number;
  gender: "M" | "F";
  /**
   * Rejting odgovarajućeg tempa NA DAN TURNIRA, onakav kakav je zabilježen
   * uz rezultat — ne trenutni. Isti izvor koji koristi F_R (čl. 24) i
   * rejtinška kategorija (čl. 22).
   */
  rating: number | null;
  /** Je li igrač bio član na dan turnira (čl. 4). */
  wasClubMember: boolean;
}

export interface PrizeAward {
  prizeId: string;
  playerId: string;
  /** 1, 2, 3 … unutar te nagrade. */
  place: number;
  rank: number;
}

/**
 * Igrač bez rejtinga računa se kao 1400 — isto kao kod F_R (čl. 24) i
 * kategorije U1800 (čl. 22). Time neregistrirani igrač automatski ulazi u
 * rejtinške nagrade s gornjom granicom, što je i namjera tih nagrada.
 */
const UNRATED_AS = 1400;

export function matchesCriteria(
  candidate: PrizeCandidate,
  criteria: PrizeCriteria
): boolean {
  if (criteria.gender && candidate.gender !== criteria.gender) return false;

  if (
    criteria.birthYearMin !== null &&
    criteria.birthYearMin !== undefined &&
    candidate.birthYear < criteria.birthYearMin
  ) {
    return false;
  }

  if (
    criteria.birthYearMax !== null &&
    criteria.birthYearMax !== undefined &&
    candidate.birthYear > criteria.birthYearMax
  ) {
    return false;
  }

  const rating = candidate.rating ?? UNRATED_AS;

  if (
    criteria.ratingMin !== null &&
    criteria.ratingMin !== undefined &&
    rating < criteria.ratingMin
  ) {
    return false;
  }

  if (
    criteria.ratingMax !== null &&
    criteria.ratingMax !== undefined &&
    rating >= criteria.ratingMax
  ) {
    return false;
  }

  if (criteria.clubMembersOnly && !candidate.wasClubMember) return false;

  return true;
}

/**
 * Dodjeljuje sve nagrade jednog turnira.
 *
 * @param ranking igrači u konačnom poretku, od prvoga prema posljednjemu.
 *   Poredak se uzima iz redoslijeda niza, ne iz polja `rank`.
 * @param prizes definicije nagrada; obilaze se po `priority` uzlazno
 */
export function assignPrizes(
  ranking: PrizeCandidate[],
  prizes: PrizeDefinition[]
): PrizeAward[] {
  const ordered = [...prizes].sort((a, b) => a.priority - b.priority);
  const awardedPlayers = new Set<string>();
  const awards: PrizeAward[] = [];

  for (const prize of ordered) {
    let place = 1;
    for (const candidate of ranking) {
      if (place > prize.count) break;
      if (awardedPlayers.has(candidate.playerId)) continue;
      if (!matchesCriteria(candidate, prize)) continue;

      awards.push({
        prizeId: prize.id,
        playerId: candidate.playerId,
        place,
        rank: candidate.rank,
      });
      awardedPlayers.add(candidate.playerId);
      place += 1;
    }
  }

  return awards;
}

/**
 * Je li nagrada prenesena — nije pripala najbolje plasiranom igraču koji
 * zadovoljava njezine uvjete. Koristi se u prikazu, da se uz takvu nagradu
 * ispiše objašnjenje.
 */
export function wasPrizeTransferred(
  award: PrizeAward,
  prize: PrizeDefinition,
  ranking: PrizeCandidate[]
): boolean {
  const eligible = ranking.filter((c) => matchesCriteria(c, prize));
  const expected = eligible[award.place - 1];
  return expected !== undefined && expected.playerId !== award.playerId;
}

/**
 * Pretvara dobnu ili veteransku kategoriju iz čl. 22 u granice godišta.
 * Admin forma time može nuditi poznate kategorije, a u bazi ostaje jedan
 * opći mehanizam umjesto dva paralelna.
 *
 * @param seasonStartYear G — godina u kojoj sezona počinje
 */
export function ageBoundsForCategory(
  category: "U12" | "U16" | "U20" | "S50" | "S65",
  seasonStartYear: number
): { birthYearMin: number | null; birthYearMax: number | null } {
  switch (category) {
    case "U12":
      return { birthYearMin: seasonStartYear - 12, birthYearMax: null };
    case "U16":
      return { birthYearMin: seasonStartYear - 16, birthYearMax: null };
    case "U20":
      return { birthYearMin: seasonStartYear - 20, birthYearMax: null };
    case "S50":
      return { birthYearMin: null, birthYearMax: seasonStartYear - 50 };
    case "S65":
      return { birthYearMin: null, birthYearMax: seasonStartYear - 65 };
  }
}
