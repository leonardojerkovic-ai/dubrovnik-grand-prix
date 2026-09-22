/**
 * Hrvatska množina uz broj.
 *
 * 1 sat, 2–4 sata, 5+ sati; iznimka su brojevi 11–14, koji uvijek idu s
 * oblikom za "mnogo" (11 sati, ne 11 sat). Bez ovoga se u sučelju pojavljuju
 * spojevi poput "3 sati" ili "1 zlatnih".
 */
export function plural(
  n: number,
  one: string,
  few: string,
  many: string
): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}
