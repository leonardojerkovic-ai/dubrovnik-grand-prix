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

/**
 * Igrači koji se u unosu pojavljuju više puta.
 *
 * Plasman je jedinstven, ali igrač je u padajućem izborniku odabran dvaput —
 * recimo na 7. i 12. mjestu. Niz 1..N je tada ispravan, pa validateRanks sve
 * propusti. Posljedice se ne vide: N se računa iz broja redaka, pa svi dobiju
 * bodove po pogrešnom N, drugi upsert prepiše prvi (jedinstven je
 * (tournamentId, playerId)), a u bazi ostane N−1 redaka i rupa na mjestu
 * koje je prepisano. Poruka pri spremanju glasi „Spremljeno".
 *
 * Vraća ID-eve, ne poruku: imena zna samo pozivatelj, a bez imena poruka
 * adminu ne znači ništa.
 */
export function duplicatePlayerIds(rows: RankedRow[]): string[] {
  const broj = new Map<string, number>();
  for (const row of rows) {
    broj.set(row.playerId, (broj.get(row.playerId) ?? 0) + 1);
  }
  return [...broj.entries()]
    .filter(([, n]) => n > 1)
    .map(([playerId]) => playerId);
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
