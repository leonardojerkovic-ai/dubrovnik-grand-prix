/**
 * Bodovni engine — GP Akademije
 * Reference: PRAVILNIK GRAND PRIXA AKADEMIJE, sezona 2026/27, čl. 7-9, 13
 *
 * Kontrolni primjer iz priloga (N=14, mjesta 1,2,3,5,7,10,14 -> 104,94,85,66,49,26,3)
 * te tablica finala za 8 sudionika (150,125,102,80,59,40,23,9) potpuno se
 * poklapaju s ovom implementacijom — provjereno.
 */

import { log2, round3, roundHalfUp } from "../utils";

/**
 * Faktor broja igrača FN — čl. 8
 * FN = 0,80 + 0,20 × log2(N / 6), zaokruženo na 3 decimale, max 1,40.
 */
export function calculateFN(playerCount: number): number {
  const raw = 0.8 + 0.2 * log2(playerCount / 6);
  return round3(Math.min(1.4, raw));
}

export interface AkademijaPointsInput {
  /** N — broj igrača koji su odigrali barem jednu partiju (svi, neovisno o pravu na bodove ili klupskoj pripadnosti — čl. 4) */
  playerCount: number;
  /** R — konačni plasman igrača */
  rank: number;
}

/**
 * GP bodovi za kvalifikacijski turnir — čl. 7-8.
 * GP = round[ 100 × ((N − R + 1) / N)^1,35 × FN ]
 * Minimalno 3 boda za igrača koji je odigrao barem jednu partiju (čl. 9).
 *
 * NAPOMENA: ova formula vrijedi samo za igrače koji imaju pravo na bodove
 * (čl. 3 — dobna/rejting granica). Provjeru prava na bodove treba napraviti
 * PRIJE poziva ove funkcije; N i dalje uključuje SVE igrače (čl. 4. st. 2),
 * i one bez prava na bodove.
 */
export function calculateQualifierPoints(input: AkademijaPointsInput): number {
  const { playerCount: N, rank: R } = input;

  if (N < 7) {
    throw new Error(
      "Turnir s manje od 7 igrača ne ulazi u GP Akademije (čl. 6)."
    );
  }
  if (R < 1 || R > N) {
    throw new Error(`Nevažeći plasman R=${R} za N=${N} igrača.`);
  }

  const fn = calculateFN(N);
  const ratio = (N - R + 1) / N;
  const raw = 100 * Math.pow(ratio, 1.35) * fn;

  return Math.max(3, roundHalfUp(raw));
}

/**
 * GP bodovi za Prvenstvo Akademije (završni turnir) — čl. 13.
 * Iznimno od čl. 8, koristi se FIKSNI FN = 1,50 neovisno o broju sudionika.
 * Minimalno 3 boda (čl. 9) i dalje vrijedi za manji broj sudionika.
 */
export function calculateFinalPoints(input: AkademijaPointsInput): number {
  const { playerCount: N, rank: R } = input;

  if (R < 1 || R > N) {
    throw new Error(`Nevažeći plasman R=${R} za N=${N} igrača.`);
  }

  const FIXED_FN = 1.5;
  const ratio = (N - R + 1) / N;
  const raw = 100 * Math.pow(ratio, 1.35) * FIXED_FN;

  return Math.max(3, roundHalfUp(raw));
}

/** Provjera minimalnog broja igrača za ulazak kvalifikacijskog turnira u GP Akademije — čl. 6. */
export function isEligibleQualifier(playerCount: number): boolean {
  return playerCount >= 7;
}

/**
 * Provjera prava na GP bodove za pojedinog igrača — čl. 3.
 *
 * Igrač mora: (a) pripadati godištu G−14 ili mlađem, gdje je G godina u
 * kojoj sezona počinje, i (b) na dan svog prvog turnira Akademije u sezoni
 * imati FIDE rapid rejting niži od 1600 ili ga uopće nemati.
 *
 * Dob se veže uz GODIŠTE, ne uz točan datum rođenja. Time Akademija koristi
 * isto načelo kao GP (čl. 22), a klub ne mora čuvati točne datume rođenja
 * djece — godište je dovoljno za sve odluke koje sustav donosi.
 *
 * Za sezonu 2026/27 (G = 2026) pravo imaju godišta 2012. i mlađa.
 */
export function isEligibleForPoints(input: {
  birthYear: number;
  seasonStartYear: number;
  rapidRatingAtFirstTournament: number | null | undefined;
}): boolean {
  const { birthYear, seasonStartYear, rapidRatingAtFirstTournament } = input;

  const ageOk = birthYear >= seasonStartYear - 14;

  const ratingOk =
    rapidRatingAtFirstTournament == null ||
    rapidRatingAtFirstTournament < 1600;

  return ageOk && ratingOk;
}
