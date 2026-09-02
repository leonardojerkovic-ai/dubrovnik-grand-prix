/**
 * Dobne kategorije — Dubrovnik Grand Prix (glavni sustav)
 * Reference: čl. 22
 *
 * "Za sezonu koja počinje u godini G, kategorija U12 obuhvaća godište G−12
 *  i mlađe, U16 godište G−16 i mlađe, a U20 godište G−20 i mlađe."
 *
 * VAŽNO: kategorije su UGNIJEŽĐENE, ne isključive. Igrač rođen G−12 ili
 * mlađi automatski zadovoljava i uvjet za U16 i za U20 (jer je "mlađe"
 * godište od G−16 i G−20). Primjer za sezonu 2026 (G=2026):
 *   - rođen 2014. -> U12 (2014>=2014), U16 (2014>=2010), U20 (2014>=2006) -> sve tri
 *   - rođen 2013. -> NIJE U12 (2013<2014), ALI JEST U16 (2013>=2010) i U20 (2013>=2006)
 *   - rođen 2009. -> NIJE U12, NIJE U16, JEST U20 (2009>=2006)
 *   - rođen 2005. -> nijedna dobna kategorija (za sezonu 2026)
 *
 * Napomena o retroaktivnosti (čl. 22 st. 3): dobne i veteranske kategorije
 * ovise samo o godištu igrača i godini početka sezone. Oboje je nepromjenjivo
 * tijekom sezone, pa izračun daje isti rezultat u siječnju i u prosincu i
 * snapshot nije potreban. Rejtinška kategorija (U1800) jest promjenjiva, pa
 * se za nju koristi rejting zabilježen uz rezultat turnira.
 */

export type GpAgeCategory = "U12" | "U16" | "U20";
export type GpVeteranCategory = "S50" | "S65";

/**
 * Vraća sve dobne kategorije kojima igrač pripada za zadanu GP sezonu,
 * prema godištu (birthYear) — čl. 22. Rezultat može sadržavati 0, 1, 2 ili
 * sve 3 kategorije istovremeno (vidi napomenu u vrhu datoteke).
 *
 * @param birthYear godište igrača
 * @param seasonStartYear G — godina u kojoj GP sezona počinje
 */
export function getGpAgeCategories(
  birthYear: number,
  seasonStartYear: number
): GpAgeCategory[] {
  const categories: GpAgeCategory[] = [];
  if (birthYear >= seasonStartYear - 12) categories.push("U12");
  if (birthYear >= seasonStartYear - 16) categories.push("U16");
  if (birthYear >= seasonStartYear - 20) categories.push("U20");
  return categories;
}

/** Pomoćna funkcija: pripada li igrač konkretnoj dobnoj kategoriji. */
export function isInGpAgeCategory(
  birthYear: number,
  seasonStartYear: number,
  category: GpAgeCategory
): boolean {
  return getGpAgeCategories(birthYear, seasonStartYear).includes(category);
}

/**
 * Veteranske kategorije — S50 i S65.
 * Čl. 22: za sezonu s godinom početka G, S50 obuhvaća sve rođene G−50 i
 * ranije, S65 sve rođene G−65 i ranije.
 * Primjer za sezonu 2026: S50 = 1976. i ranije, S65 = 1961. i ranije.
 *
 * Kategorije su ugniježđene kao i dobne (U12/U16/U20): igrač koji
 * zadovoljava S65 automatski zadovoljava i S50.
 */
export function getGpVeteranCategories(
  birthYear: number,
  seasonStartYear: number
): GpVeteranCategory[] {
  const categories: GpVeteranCategory[] = [];
  if (birthYear <= seasonStartYear - 50) categories.push("S50");
  if (birthYear <= seasonStartYear - 65) categories.push("S65");
  return categories;
}

export function isInGpVeteranCategory(
  birthYear: number,
  seasonStartYear: number,
  category: GpVeteranCategory
): boolean {
  return getGpVeteranCategories(birthYear, seasonStartYear).includes(
    category
  );
}

/**
 * U1800 kategorija — čl. 22.
 *
 * Koristi se FIDE rejting TEMPA TOG TURNIRA na dan njegova održavanja:
 * standardni za standard, rapid za rapid, blitz za blitz. Dosljedno je to
 * s faktorom FR iz čl. 7, koji uzima rejting istog tempa, i pravednije za
 * natjecanje u kojemu većina turnira nije standardnog tempa — igrač se
 * mjeri onom disciplinom u kojoj je toga dana igrao.
 *
 * Posljedica koju treba imati na umu: isti igrač može pripadati U1800 na
 * rapid turniru, a ne pripadati na standardnom, ako mu se rejtinzi razlikuju
 * preko granice. To NIJE greška nego namjera pravila.
 *
 * Igrač BEZ rejtinga tog tempa računa se kao 1400 (isto kao kod FR u čl. 7),
 * pa automatski pripada U1800. Napomena za UI sloj: na profilu igrača takav
 * se rejting PRIKAZUJE kao 0, ne kao 1400 — to je čisto pitanje prikaza.
 *
 * @param tempoRating FIDE rejting odgovarajućeg tempa NA DAN TURNIRA
 *   (isti princip snapshota kao i za FR — ne trenutni rejting)
 */
export function isInU1800Category(
  tempoRating: number | null | undefined
): boolean {
  const effectiveRating = tempoRating ?? 1400;
  return effectiveRating < 1800;
}
