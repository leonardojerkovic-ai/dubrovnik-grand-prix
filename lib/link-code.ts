import crypto from "crypto";

/**
 * Pristupni kod kojim igrač sam poveže svoj račun s igračkim profilom.
 *
 * Bez njega admin mora ručno odobriti svaku vezu, što je pri stotinjak
 * članova posao koji se ne isplati. Kod dokazuje da je osoba ta koja tvrdi
 * da jest, pa odobrenje više ne treba.
 *
 * U bazi se čuva samo otisak koda, nikad sam kod — procurjeli redak tako
 * nikome ne omogućuje preuzimanje tuđeg profila. Zato se kod prikazuje
 * točno jednom, pri generiranju; ako se izgubi, izdaje se nov.
 */

/**
 * Znakovi bez onih koji se brkaju pri čitanju s papira ili ekrana:
 * nema 0/O, 1/I/L, ni 5/S.
 */
const ALPHABET = "ABCDEFGHJKMNPQRTUVWXYZ2346789";

const GROUPS = 3;
const GROUP_LEN = 4;

/** Novi kod u obliku ABCD-EFGH-JKMN. */
export function generateLinkCode(): string {
  const bytes = crypto.randomBytes(GROUPS * GROUP_LEN);
  const chars = Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]);

  const groups: string[] = [];
  for (let i = 0; i < GROUPS; i++) {
    groups.push(chars.slice(i * GROUP_LEN, (i + 1) * GROUP_LEN).join(""));
  }
  return groups.join("-");
}

/**
 * Priprema korisnikov unos za usporedbu: velika slova, bez razmaka i crtica.
 * Ljudi kod prepisuju s papira, pa se ne smije zamjeriti na obliku.
 */
export function normalizeLinkCode(input: string): string {
  return input.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

/** Otisak koji se sprema i po kojem se traži. */
export function hashLinkCode(code: string): string {
  return crypto
    .createHash("sha256")
    .update(normalizeLinkCode(code))
    .digest("hex");
}

/** Osnovna provjera oblika prije nego se ide u bazu. */
export function looksLikeLinkCode(input: string): boolean {
  const normalized = normalizeLinkCode(input);
  if (normalized.length !== GROUPS * GROUP_LEN) return false;
  return [...normalized].every((c) => ALPHABET.includes(c));
}
