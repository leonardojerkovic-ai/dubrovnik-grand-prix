/**
 * Verzioniranje pravilnika i snapshot izračuna.
 *
 * ZAŠTO: čl. 30 GP pravilnika i čl. 23 Akademije zabranjuju retroaktivnu
 * primjenu izmjena na već odigrane turnire. Ako se u bazi čuva samo konačni
 * broj bodova, svaka izmjena faktora (razina, tempo, formula) tiho mijenja
 * značenje prošlih rezultata i prigovor po čl. 29 nemoguće je razriješiti.
 * Zato se uz svaki rezultat sprema i kako je nastao.
 *
 * Dva sustava imaju ODVOJENU numeraciju verzija. Izmjena GP pravilnika ne
 * smije prividno ostarjeti akademijske rezultate i obratno.
 */

import {
  calculateFN as gpFN,
  calculateFR as gpFR,
  getFC,
  getFT,
  type Tempo,
  type TournamentLevel,
} from "./gp/formulas";
import { calculateFN as akdFN } from "./akademija/formulas";

/** Trenutne verzije. Podignuti pri svakoj izmjeni koja mijenja izračun. */
export const RULEBOOK_VERSIONS = {
  GP: "GP-2.2",
  AKADEMIJA: "AKD-1.1",
} as const;

export type SystemType = keyof typeof RULEBOOK_VERSIONS;

/** Zaokruživanje pomoćnih vrijednosti za zapis — ne utječe na bodove. */
function r6(value: number): number {
  return Math.round(value * 1e6) / 1e6;
}

const EXPONENT = 1.35;

export interface GpScoringSnapshot {
  system: "GP";
  ruleVersion: string;
  n: number;
  r: number;
  ratio: number;
  fn: number;
  fr: number;
  fc: number;
  ft: number;
  product: number;
  averageRating: number;
  level: TournamentLevel;
  tempo: Tempo;
  points: number;
  computedAt: string;
}

export interface AkademijaScoringSnapshot {
  system: "AKADEMIJA";
  ruleVersion: string;
  n: number;
  r: number;
  ratio: number;
  fn: number;
  isFinal: boolean;
  eligible: boolean;
  points: number | null;
  computedAt: string;
}

export type ScoringSnapshot = GpScoringSnapshot | AkademijaScoringSnapshot;

/**
 * Rekonstruira faktore korištene u izračunu GP bodova (čl. 5-9).
 * Vrijednosti moraju biti identične onima koje je koristio calculateGpPoints —
 * zato se pozivaju iste funkcije, a ne prepisuje formula.
 */
export function buildGpSnapshot(input: {
  playerCount: number;
  rank: number;
  level: TournamentLevel;
  tempo: Tempo;
  averageRating: number;
  points: number;
  ruleVersion?: string | null;
}): GpScoringSnapshot {
  const { playerCount: n, rank: r, level, tempo, averageRating, points } = input;

  const fn = gpFN(n);
  const fr = gpFR(averageRating);
  const fc = getFC(level);
  const ft = getFT(tempo);
  const product = Math.min(2.5, fn * fr * fc * ft); // čl. 9 — gornja granica
  const ratio = Math.pow((n - r + 1) / n, EXPONENT);

  return {
    system: "GP",
    ruleVersion: input.ruleVersion ?? RULEBOOK_VERSIONS.GP,
    n,
    r,
    ratio: r6(ratio),
    fn,
    fr,
    fc,
    ft,
    product: r6(product),
    averageRating: r6(averageRating),
    level,
    tempo,
    points,
    computedAt: new Date().toISOString(),
  };
}

/**
 * Snapshot za Akademiju. Nema FR, FC ni FT — formula ih ne poznaje (čl. 7).
 * Završni turnir koristi fiksni FN = 1,50 neovisno o broju sudionika (čl. 13).
 */
export function buildAkademijaSnapshot(input: {
  playerCount: number;
  rank: number;
  isFinal: boolean;
  eligible: boolean;
  points: number | null;
  ruleVersion?: string | null;
}): AkademijaScoringSnapshot {
  const { playerCount: n, rank: r, isFinal, eligible, points } = input;

  const fn = isFinal ? 1.5 : akdFN(n);
  const ratio = Math.pow((n - r + 1) / n, EXPONENT);

  return {
    system: "AKADEMIJA",
    ruleVersion: input.ruleVersion ?? RULEBOOK_VERSIONS.AKADEMIJA,
    n,
    r,
    ratio: r6(ratio),
    fn,
    isFinal,
    eligible,
    points,
    computedAt: new Date().toISOString(),
  };
}
