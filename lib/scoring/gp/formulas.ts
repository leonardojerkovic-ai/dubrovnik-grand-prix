/**
 * Bodovni engine — Dubrovnik Grand Prix (glavni sustav)
 * Reference: PRAVILNIK DUBROVNIK GRAND PRIXA (radna verzija), čl. 5-9
 *
 * NAPOMENA O PRILOG A: kontrolni primjer u dokumentu (klupska razina,
 * ubrzani tempo, N=19, prosj. rejting 1676,4) sadrži manje računske
 * nepodudarnosti za R=5 i R=10 (dokument navodi 64 i 38, precizan izračun
 * formule iz čl. 5-6 daje 63 i 37). Ova implementacija slijedi formulu
 * doslovno kako je zapisana u tekstu pravilnika. Provjeriti s voditeljem
 * GP-a prije službenog usvajanja pravilnika.
 */

import { clamp, log2, round3, roundHalfUp } from "../utils";

export type TournamentLevel = "KLUPSKA" | "NATJECATELJSKA" | "VRHUNSKA";
export type Tempo = "STANDARD" | "RAPID" | "BLITZ";

/** Faktor razine turnira FC — čl. 11 */
const LEVEL_FACTOR: Record<TournamentLevel, number> = {
  KLUPSKA: 1.0,
  NATJECATELJSKA: 1.25,
  VRHUNSKA: 1.5,
};

/** Faktor tempa igre FT — čl. 8 */
const TEMPO_FACTOR: Record<Tempo, number> = {
  STANDARD: 1.0,
  RAPID: 0.9,
  BLITZ: 0.75,
};

/**
 * Faktor broja igrača FN — čl. 6
 * FN = min(1,50 ; 0,80 + 0,16 × log2(N / 7))
 * Turnir s manje od 6 igrača ne ulazi u GP (provjerava se odvojeno, vidi isEligibleTournament).
 */
export function calculateFN(playerCount: number): number {
  const raw = 0.8 + 0.16 * log2(playerCount / 7);
  return round3(Math.min(1.5, raw));
}

/**
 * Faktor jačine turnira FR — čl. 7
 * FR = 1,00 + (prosječni rejting − 1750) × 0,0008
 * Zaokruženo na 3 decimale, ograničeno na [0,80 ; 1,30].
 *
 * @param averageRating prosjek FIDE rejtinga svih sudionika odgovarajućeg
 *   tempa (igraču bez rejtinga tog tempa pripisuje se 1400 — to treba
 *   riješiti PRIJE poziva ove funkcije, pri izračunu averageRating).
 */
export function calculateFR(averageRating: number): number {
  const raw = 1.0 + (averageRating - 1750) * 0.0008;
  return round3(clamp(raw, 0.8, 1.3));
}

export function getFC(level: TournamentLevel): number {
  return LEVEL_FACTOR[level];
}

export function getFT(tempo: Tempo): number {
  return TEMPO_FACTOR[tempo];
}

export interface GpPointsInput {
  /** N — broj igrača koji su odigrali barem jednu partiju */
  playerCount: number;
  /** R — konačni plasman igrača (nakon isključenja igrača koji nisu odigrali nijednu partiju) */
  rank: number;
  level: TournamentLevel;
  tempo: Tempo;
  /** Prosječni rejting sudionika odgovarajućeg tempa (bez rejtinga -> 1400 po čl. 7) */
  averageRating: number;
}

/**
 * Puni izračun GP bodova za jednog igrača — čl. 5.
 *
 * GP = round[ 100 × ((N − R + 1) / N)^1,35 × FN × FR × FC × FT ]
 *
 * Umnožak faktora FN×FR×FC×FT ograničen je na maksimalno 2,50 (čl. 9).
 * Igrač koji je odigrao barem jednu partiju dobiva minimalno 1 GP bod (čl. 9).
 */
export function calculateGpPoints(input: GpPointsInput): number {
  const { playerCount: N, rank: R, level, tempo, averageRating } = input;

  if (N < 6) {
    throw new Error(
      "Turnir s manje od 6 igrača ne ulazi u GP (čl. 6) — bodovi se ne računaju."
    );
  }
  if (R < 1 || R > N) {
    throw new Error(`Nevažeći plasman R=${R} za N=${N} igrača.`);
  }

  const fn = calculateFN(N);
  const fr = calculateFR(averageRating);
  const fc = getFC(level);
  const ft = getFT(tempo);

  const rawProduct = fn * fr * fc * ft;
  const product = Math.min(2.5, rawProduct); // čl. 9 — gornja granica umnoška

  const ratio = (N - R + 1) / N;
  const raw = 100 * Math.pow(ratio, 1.35) * product;

  return Math.max(1, roundHalfUp(raw)); // čl. 9 — minimalno 1 bod
}

/**
 * Izračunava prosječni rejting sudionika za potrebe FR — čl. 7.
 * Igraču bez važećeg rejtinga odgovarajućeg tempa pripisuje se 1400.
 */
export function calculateAverageRating(
  ratings: Array<number | null | undefined>
): number {
  if (ratings.length === 0) {
    throw new Error("Popis rejtinga ne smije biti prazan.");
  }
  const effective = ratings.map((r) => (r == null ? 1400 : r));
  const sum = effective.reduce((acc, r) => acc + r, 0);
  return sum / effective.length;
}

/** Provjera minimalnog broja igrača za ulazak turnira u GP — čl. 6. */
export function isEligibleTournament(playerCount: number): boolean {
  return playerCount >= 6;
}
