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
  const mjesta: number[] = [];

  // Prolazi se jednom: novo mjesto počinje tek kad komparator vrati nešto
  // različito od nule. Dijeljeni se tako svi upišu s mjestom prvoga u
  // skupini, a sljedeća skupina dobije mjesto po svojem položaju u nizu —
  // odatle 1, 2, 2, 4.
  let prethodni: T | undefined;
  let mjestoSkupine = 0;

  poredani.forEach((element, idx) => {
    if (
      idx === 0 ||
      prethodni === undefined ||
      usporedi(prethodni, element) !== 0
    ) {
      mjestoSkupine = idx + 1;
      prethodni = element;
    }
    mjesta.push(mjestoSkupine);
  });

  return mjesta.map((mjesto, idx) => ({
    mjesto,
    dijeljeno: mjesta[idx - 1] === mjesto || mjesta[idx + 1] === mjesto,
  }));
}
