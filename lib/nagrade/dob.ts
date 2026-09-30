/**
 * Granice godišta za dobnu nagradu.
 *
 * Za razliku od ageBoundsForCategory (lib/scoring/prizes), koja poznaje samo
 * pet kategorija iz čl. 22, ovdje se oznaka čita općenito. Raspis nagrada
 * nije vezan uz pravilnik — Klub može objaviti S60, U14 ili bilo koju drugu
 * granicu, pa je popis oznaka podatak, a ne dio koda.
 */

export interface GraniceGodista {
  /** Rođen te godine ili KASNIJE — mlađi od granice. */
  birthYearMin: number | null;
  /** Rođen te godine ili RANIJE — stariji od granice. */
  birthYearMax: number | null;
}

export const PRAZNE_GRANICE: GraniceGodista = {
  birthYearMin: null,
  birthYearMax: null,
};

/** Oznake koje obrazac nudi kao gotov izbor. Popis se smije mijenjati. */
export const PONUDENE_KATEGORIJE = [
  "U08",
  "U10",
  "U12",
  "U14",
  "U16",
  "U18",
  "U20",
  "S40",
  "S50",
  "S60",
  "S65",
  "S70",
] as const;

/**
 * Čita oznaku oblika U<broj> ili S<broj> i pretvara je u granice godišta.
 *
 * @param seasonStartYear G — godina u kojoj sezona počinje
 * @returns null ako oznaka nije tog oblika
 */
export function granicePoOznaci(
  oznaka: string,
  seasonStartYear: number
): GraniceGodista | null {
  const podudaranje = /^([US])\s*(\d{1,3})$/i.exec(oznaka.trim());
  if (!podudaranje) return null;

  const slovo = podudaranje[1]!.toUpperCase();
  const godina = Number(podudaranje[2]);
  if (godina <= 0 || godina > 120) return null;

  return slovo === "U"
    ? { birthYearMin: seasonStartYear - godina, birthYearMax: null }
    : { birthYearMin: null, birthYearMax: seasonStartYear - godina };
}
