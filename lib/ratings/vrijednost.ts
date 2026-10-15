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

/**
 * Stupci rejtinga u `player_ratings_current`, u istom redoslijedu u kojem se
 * prikazuju. Postoji zato da obilazak svih tempa ne bude tri puta prepisan
 * niz — a promjena na jednom mjestu zahvati i prikaz i čišćenje nula.
 */
export const TEMPO_POLJA = ["standard", "rapid", "blitz"] as const;

export type TempoPolje = (typeof TEMPO_POLJA)[number];
