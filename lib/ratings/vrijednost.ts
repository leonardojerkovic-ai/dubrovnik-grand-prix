/**
 * Sitnice oko rejtinga koje se tumače na više mjesta, pa moraju značiti
 * isto na svima. Bez Prisme, da se mogu testirati.
 */

export type Tempo = "STANDARD" | "RAPID" | "BLITZ";

export function tempoKaoPolje(tempo: string): "standard" | "rapid" | "blitz" {
  return tempo === "STANDARD" ? "standard" : tempo === "RAPID" ? "rapid" : "blitz";
}

/**
 * Nula u bazi znači „nema rejtinga", ne rejting nula.
 *
 * Tako je zapisuje i FIDE u svojim listama i Swiss-Manager u izvozima, a
 * kroz uvoz je takva dospjela i ovamo. Prikazana kao 0 izgleda kao da je
 * netko izgubio podatak.
 */
export function bezNule(vrijednost: number | null | undefined): number | null {
  return vrijednost === null || vrijednost === undefined || vrijednost === 0
    ? null
    : vrijednost;
}
