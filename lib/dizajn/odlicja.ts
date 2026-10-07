/**
 * Boje odličja za prva tri mjesta — jedno pravilo za dva prikaza.
 *
 * Koriste ih medaljica na turniru i profilu (medal-disc.tsx) i rang-bedž na
 * ljestvici. Dok je mapiranje stajalo samo u medal-disc, ljestvica je prva
 * tri mjesta prikazivala jednako kao i sva ostala, iako su boje odličja već
 * postojale pola koraka dalje.
 *
 * Izmjereni kontrast teksta na vlastitoj podlozi (na bijelom): zlato 7,58:1,
 * srebro 10,48:1, bronca 5,10:1 — sve iznad 4,5:1.
 */
export const TON_ZLATO = "bg-gold text-navy-dark";
export const TON_SREBRO = "bg-navy/15 text-navy";
export const TON_BRONCA = "bg-medalja-bronca/20 text-medalja-bronca-tekst";

export function tonOdlicja(place: number): string | null {
  if (place === 1) return TON_ZLATO;
  if (place === 2) return TON_SREBRO;
  if (place === 3) return TON_BRONCA;
  return null;
}

/**
 * Do kojeg se mjesta na ljestvici crta šahovnica. Dalje od toga poredak je
 * dug niz u kojem naizmjenično tamna polja vizualno nadjačaju imena i
 * bodove, a to su podaci zbog kojih ljestvica postoji.
 */
export const ZADNJE_ISTAKNUTO_MJESTO = 8;
