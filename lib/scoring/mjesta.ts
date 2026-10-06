/**
 * Mjesta na ljestvici kad neki igrači mjesto DIJELE.
 *
 * Komparatori ljestvica vraćaju 0 kad su igrači po pravilniku jednaki — čl. 18
 * GP-a („Ako su i svi rezultati koji ulaze u zbroj jednaki, igrači dijele
 * mjesto") i čl. 15 st. 6 Akademije. Prikaz je to dosad gubio: svaka je
 * tablica, CSV i izračun medalja uzimao redni broj u nizu, pa su se dva
 * jednaka igrača prikazivala kao 3. i 4. Tko je od njih „treći" ovisilo je o
 * redoslijedu u memoriji, a ne o ijednom pravilu — i po tome se dodjeljivala
 * brončana medalja.
 *
 * Ovdje se iz poretka i komparatora izvode stvarna mjesta, uz standardno
 * natjecateljsko brojanje: 1, 2, 2, 4 — dijeljeno mjesto preskače sljedeći
 * broj, jer su oba igrača ispred četvrtog.
 */

export interface Mjesto {
  /** Mjesto kako se objavljuje. Jednako za sve koji ga dijele. */
  mjesto: number;
  /** Dijeli li ga s barem jednim drugim igračem. */
  dijeljeno: boolean;
}

/**
 * Niz MORA već biti poredan istim komparatorom koji se predaje.
 * Vraća po jedan zapis za svaki element, u istom redoslijedu.
 */
export function mjestaIzPoretka<T>(
  poredani: T[],
  usporedi: (a: T, b: T) => number
): Mjesto[] {
  const n = poredani.length;
  const mjesta: number[] = new Array(n);

  let i = 0;
  while (i < n) {
    // Koliko ih je jednako ovome
    let j = i + 1;
    while (j < n && usporedi(poredani[i], poredani[j]) === 0) j++;
    for (let k = i; k < j; k++) mjesta[k] = i + 1;
    i = j;
  }

  return mjesta.map((mjesto, idx) => ({
    mjesto,
    dijeljeno:
      (idx > 0 && mjesta[idx - 1] === mjesto) ||
      (idx < n - 1 && mjesta[idx + 1] === mjesto),
  }));
}
