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

/**
 * Zadovoljava li igračeva dobna oznaka uvjet nagrade — UGNIJEŽĐENO.
 *
 * Vrijedi samo kad godište nije poznato, pa je oznaka iz izvoza jedini
 * podatak o dobi. Dotad se tražilo doslovno poklapanje, uz obrazloženje da
 * se iz oznake ne smije ništa zaključivati. To obrazloženje nije točno:
 * oznaka JEST granica godišta i iz nje slijedi pripadnost svim širim
 * razredima iste obitelji.
 *
 *   U10 znači rođen ≥ G−10, dakle i ≥ G−12 i ≥ G−16 → zadovoljava U12, U16
 *   S65 znači rođen ≤ G−65, dakle i ≤ G−60 i ≤ G−50 → zadovoljava S60, S50
 *
 * Smjer je suprotan za dvije obitelji: kod U manji broj zadovoljava veći,
 * kod S veći broj zadovoljava manji. Obitelji se ne miješaju — U20 nije S20.
 *
 * Oznaka koja nije oblika U<broj> ili S<broj> uspoređuje se doslovno, jer
 * se iz nje doista ne može ništa izvesti.
 */
export function oznakaZadovoljava(
  oznakaIgraca: string,
  oznakaNagrade: string
): boolean {
  const igrac = rastaviOznaku(oznakaIgraca);
  const nagrada = rastaviOznaku(oznakaNagrade);

  if (!igrac || !nagrada) {
    return oznakaIgraca.trim().toUpperCase() === oznakaNagrade.trim().toUpperCase();
  }

  if (igrac.slovo !== nagrada.slovo) return false;

  return igrac.slovo === "U"
    ? igrac.godina <= nagrada.godina
    : igrac.godina >= nagrada.godina;
}

function rastaviOznaku(
  oznaka: string
): { slovo: "U" | "S"; godina: number } | null {
  const podudaranje = /^([US])\s*(\d{1,3})$/i.exec(oznaka.trim());
  if (!podudaranje) return null;

  const godina = Number(podudaranje[2]);
  if (godina <= 0 || godina > 120) return null;

  return { slovo: podudaranje[1]!.toUpperCase() as "U" | "S", godina };
}
