/**
 * Provjera konačnog plasmana (R) pri unosu rezultata turnira.
 *
 * Plasman mora biti jedinstven — čl. 10 Akademije to kaže izrijekom
 * ("Konačni plasman (R) uvijek je jedinstven"), a čl. 10 GP pravilnika
 * traži isto posredno, tražeći jedinstven plasman utvrđen pomoćnim
 * kriterijima turnira.
 *
 * Uz to mora činiti niz 1..N: formula iz čl. 5 računa (N − R + 1) / N, pa
 * plasman izvan tog raspona daje besmislen omjer, a rupa u nizu znači da je
 * netko ispušten iz unosa.
 */

export interface RankedRow {
  rank: number;
  playerId: string;
}

/** Vraća poruku o grešci na hrvatskom, ili null ako je poredak ispravan. */
export function validateRanks(rows: RankedRow[]): string | null {
  const n = rows.length;
  if (n === 0) return null;

  const seen = new Map<number, number>();

  for (const row of rows) {
    if (!Number.isInteger(row.rank)) {
      return `Plasman mora biti cijeli broj (uneseno: ${row.rank}).`;
    }
    if (row.rank < 1 || row.rank > n) {
      return `Plasman ${row.rank} je izvan raspona 1–${n}.`;
    }
    seen.set(row.rank, (seen.get(row.rank) ?? 0) + 1);
  }

  const duplicates = [...seen.entries()]
    .filter(([, count]) => count > 1)
    .map(([rank]) => rank)
    .sort((a, b) => a - b);

  if (duplicates.length > 0) {
    return (
      "Plasman se ne smije ponavljati (čl. 10) — dvostruko unesen: " +
      `${duplicates.join(", ")}. ` +
      "Ravnopravnost razriješite pomoćnim kriterijima turnira."
    );
  }

  const missing: number[] = [];
  for (let r = 1; r <= n; r++) {
    if (!seen.has(r)) missing.push(r);
  }
  if (missing.length > 0) {
    return `Nedostaju plasmani: ${missing.join(", ")}. Očekuje se niz 1–${n}.`;
  }

  return null;
}
