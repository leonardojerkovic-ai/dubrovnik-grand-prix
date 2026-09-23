/**
 * Normalizacija adrese e-pošte.
 *
 * Domena je po standardu neosjetljiva na velika i mala slova, a i svi veći
 * davatelji tako tretiraju i lokalni dio. Korisnici to i očekuju: tko se
 * registrirao kao Ivan@gmail.com prijavljuje se kao ivan@gmail.com.
 *
 * Bez ovoga se adresa spremala onako kako je upisana, a usporedba je bila
 * doslovna, pa su nastajala tri problema odjednom:
 *   - ista osoba mogla je imati dva računa,
 *   - prijava je javljala "pogrešna lozinka" iako je lozinka točna,
 *   - zahtjev za reset lozinke tiho nije poslao ništa, jer poruka o uspjehu
 *     namjerno ne otkriva postoji li adresa (vidi zaboravljena-lozinka).
 *
 * Koristi se na SVAKOM mjestu gdje adresa ulazi u sustav ili se po njoj
 * traži zapis — inače se problem samo premjesti.
 */
export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}
