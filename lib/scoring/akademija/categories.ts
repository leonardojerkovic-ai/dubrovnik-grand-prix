/**
 * Kategorije — GP Akademije
 * Reference: čl. 20
 *
 * "Za sezonu koja počinje u godini G, kategorija U12 obuhvaća godište G−12
 *  i mlađe, U10 godište G−10 i mlađe, a U08 godište G−8 i mlađe."
 *
 * Kategorije su UGNIJEŽĐENE, kao i u glavnom GP-u (vidi
 * lib/scoring/gp/categories.ts), ali u suprotnom smjeru od intuicije: što je
 * igrač mlađi, to više kategorija zadovoljava. Za sezonu 2026/27 (G=2026):
 *   - rođen 2018. -> U08 (2018>=2018), U10 (2018>=2016), U12 (2018>=2014)
 *   - rođen 2016. -> NIJE U08, JEST U10 i U12
 *   - rođen 2015. -> samo U12
 *   - rođen 2013. -> nijedna kategorija
 *
 * Pripadnost ovisi samo o godištu i godini početka sezone; oboje je
 * nepromjenjivo tijekom sezone, pa snapshot nije potreban.
 */

export type AkademijaAgeCategory = "U12" | "U10" | "U08";

/**
 * Sve dobne kategorije kojima igrač pripada u zadanoj sezoni Akademije —
 * čl. 20. Vraćeni niz može imati 0, 1, 2 ili 3 člana.
 *
 * Poredak u nizu je od šire prema užoj kategoriji (U12, U10, U08) i time se
 * poklapa s redoslijedom priznanja iz lib/scoring/akademija/medals.ts.
 *
 * @param birthYear godište igrača
 * @param seasonStartYear G — godina u kojoj sezona Akademije počinje
 */
export function getAkademijaAgeCategories(
  birthYear: number,
  seasonStartYear: number
): AkademijaAgeCategory[] {
  const categories: AkademijaAgeCategory[] = [];
  if (birthYear >= seasonStartYear - 12) categories.push("U12");
  if (birthYear >= seasonStartYear - 10) categories.push("U10");
  if (birthYear >= seasonStartYear - 8) categories.push("U08");
  return categories;
}

/** Pomoćna funkcija: pripada li igrač konkretnoj kategoriji Akademije. */
export function isInAkademijaAgeCategory(
  birthYear: number,
  seasonStartYear: number,
  category: AkademijaAgeCategory
): boolean {
  return getAkademijaAgeCategories(birthYear, seasonStartYear).includes(
    category
  );
}
