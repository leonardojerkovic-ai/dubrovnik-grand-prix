import crypto from "crypto";

/**
 * Tokeni za reset lozinke.
 *
 * Korisniku se emailom šalje IZVORNI token, a u bazu ide samo njegov
 * SHA-256 otisak. Tko god dođe do retka u bazi, ne može iz njega izvesti
 * poveznicu za promjenu lozinke.
 *
 * SHA-256 bez soli je ovdje dovoljan (za razliku od lozinki, gdje treba
 * bcrypt): token je 32 nasumična bajta, pa nema rječnika po kojem bi se
 * pogađao, a provjera mora biti brza.
 */

/** Novi nasumični token — vraća ono što ide u poveznicu. */
export function generateResetToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/** Otisak koji se sprema i po kojem se traži. */
export function hashResetToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}
