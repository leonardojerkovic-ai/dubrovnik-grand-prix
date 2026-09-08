/**
 * Pravila skrbništva koja ne ovise o bazi.
 *
 * Dob se računa po GODIŠTU, jednako kao svugdje drugdje u sustavu
 * (čl. 22 GP / čl. 3 Akademije) — točan datum rođenja se ne čuva.
 */

/**
 * Godina od koje igrač vodi vlastiti račun.
 *
 * Šesnaest, a ne osamnaest: junior koji ozbiljno igra dovoljno je samostalan
 * da sam upravlja prijavama, a granica od 18 značila bi da mu račun vodi
 * roditelj sve do kraja srednje škole. Mlađi od toga idu pod skrbništvo, u
 * skladu s Politikom privatnosti prema kojoj maloljetnike registriraju
 * roditelji.
 *
 * Roditelj i dalje može voditi i starije dijete — samo se to više ne događa
 * samo od sebe, nego mu se izda kod i poveže ga administrator.
 */
export const SELF_ACCOUNT_AGE = 16;

/**
 * Vodi li igrač tog godišta račun sam, ili ga vodi roditelj/skrbnik.
 *
 * Vraća true za dijete kojemu račun vodi netko drugi.
 */
export function needsGuardian(
  birthYear: number,
  now: Date = new Date()
): boolean {
  return now.getFullYear() - birthYear < SELF_ACCOUNT_AGE;
}

/** Je li igrač tog godišta maloljetan (za prikaz i evidenciju). */
export function isMinorByBirthYear(
  birthYear: number,
  now: Date = new Date()
): boolean {
  return now.getFullYear() - birthYear < 18;
}
