/**
 * Pravila skrbništva koja ne ovise o bazi.
 *
 * Dob se računa po GODIŠTU, jednako kao svugdje drugdje u sustavu
 * (čl. 22 GP / čl. 3 Akademije) — točan datum rođenja se ne čuva.
 */

/** Je li igrač tog godišta maloljetan u tekućoj godini. */
export function isMinorByBirthYear(
  birthYear: number,
  now: Date = new Date()
): boolean {
  return now.getFullYear() - birthYear < 18;
}
