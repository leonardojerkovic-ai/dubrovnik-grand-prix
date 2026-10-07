/**
 * Rokovi čuvanja traga izmjena (audit_log).
 *
 * U retku stoje dvije vrste podatka pa imaju dva roka. Tko, što, kada i
 * opis su mali i upravo ono zbog čega trag postoji — oni ostaju dvije
 * godine, da trag iz prošle sezone živi do kraja tekuće. Sadržaj izmjene
 * (before/after) nosi cijele zapise igrača, a kod brisanja je before
 * jedini preostali zapis o obrisanom igraču; on se prazni nakon šest
 * mjeseci, kad je dovoljna činjenica da je promjena bila.
 *
 * Brisanje NE radi aplikacija nego .github/workflows/keep-alive.yml, i
 * tamo stoje iste vrijednosti ('6 months', '2 years'). Promjena ovdje
 * traži promjenu i tamo, i u izjavi o privatnosti (12.5).
 */
export const AUDIT_SADRZAJ_MJESECI = 6;
export const AUDIT_TRAG_GODINA = 2;

/** Je li sadržaj izmjene (before/after) za ovaj zapis već ispražnjen. */
export function sadrzajIstekao(at: Date, now: Date = new Date()): boolean {
  const granica = new Date(now);
  granica.setMonth(granica.getMonth() - AUDIT_SADRZAJ_MJESECI);
  return at < granica;
}
