import type { FideRatingType } from "./parse-rating-list";

/**
 * Rejtinzi preko Lichessova FIDE API-ja.
 *
 * Postoji zato što FIDE odbija promet iz podatkovnih centara — veza na
 * ratings.fide.com s GitHubovih poslužitelja istekne prije nego se
 * uspostavi. Lichess iste te službene liste povlači sam i nudi ih po
 * igraču, a njega ne blokira nitko, pa mjesečni uvoz opet može raditi bez
 * ručnog pokretanja.
 *
 * Lichess je IZVEDENI izvor. Službena lista ostaje mjerodavna i put do nje
 * se namjerno čuva (vidi --izvor=fide u scripts/import-fide-ratings.ts).
 */

const BAZA = "https://lichess.org/api/fide/player";

export interface LichessIgrac {
  id: number;
  name: string;
  federation?: string;
  year?: number;
  standard?: number;
  rapid?: number;
  blitz?: number;
  gender?: string;
}

export type RejtinziPoTempu = Record<FideRatingType, number | null>;

/**
 * Izvlači tri rejtinga iz odgovora.
 *
 * Neocijenjenom igraču Lichess polje izostavi, ali se u izvorima zna
 * pojaviti i nula. Oboje znači „nema rejtinga", pa se oboje svodi na null —
 * inače bi igrač s nulom ulazio u rejtinške kategorije kao da ima 0 bodova,
 * umjesto da se računa kao neocijenjen (čl. 24).
 */
export function rejtinziIzOdgovora(igrac: LichessIgrac): RejtinziPoTempu {
  const vrijednost = (x: number | undefined): number | null =>
    x === undefined || x === null || x === 0 ? null : x;

  return {
    STANDARD: vrijednost(igrac.standard),
    RAPID: vrijednost(igrac.rapid),
    BLITZ: vrijednost(igrac.blitz),
  };
}

export interface MogucnostiDohvata {
  /** Koliko se puta ponavlja pri greški na mreži. */
  pokusaja?: number;
  /** Istek jednog poziva. */
  istekMs?: number;
  /** Poziva se kad Lichess zatraži predah (HTTP 429). */
  naPredah?: (sekundi: number) => void;
}

const PREDAH_S = 60;

/**
 * Dohvaća jednog igrača. Vraća null kad igrač ne postoji na Lichessu —
 * to su redovito igrači koji još nisu ni na jednoj FIDE rejting-listi.
 */
export async function dohvatiIgraca(
  fideId: string,
  mogucnosti: MogucnostiDohvata = {}
): Promise<LichessIgrac | null> {
  const { pokusaja = 3, istekMs = 20_000, naPredah } = mogucnosti;
  let zadnja: unknown;

  for (let pokusaj = 1; pokusaj <= pokusaja; pokusaj++) {
    try {
      const res = await fetch(`${BAZA}/${encodeURIComponent(fideId)}`, {
        headers: {
          Accept: "application/json",
          "User-Agent":
            "SK-Dubrovnik-GP (klupska evidencija rejtinga; info@dubrovnikgrandprix.com)",
        },
        signal: AbortSignal.timeout(istekMs),
      });

      if (res.status === 404) return null;

      if (res.status === 429) {
        naPredah?.(PREDAH_S);
        await new Promise((r) => setTimeout(r, PREDAH_S * 1000));
        continue;
      }

      if (!res.ok) {
        throw new Error(`Lichess je vratio ${res.status} ${res.statusText}`);
      }

      return (await res.json()) as LichessIgrac;
    } catch (err) {
      zadnja = err;
      if (pokusaj < pokusaja) {
        await new Promise((r) => setTimeout(r, 2000 * pokusaj));
      }
    }
  }

  throw zadnja instanceof Error
    ? zadnja
    : new Error(`Dohvat igrača ${fideId} nije uspio.`);
}
