/**
 * Određivanje aktivne stavke navigacije.
 *
 * Izdvojeno iz zaglavlja da se može testirati bez Reacta i bez
 * usePathname — i jer se isto pravilo koristi na tri mjesta (desktop
 * izbornik, padajući izbornik ljestvica, mobilni panel).
 *
 * Pravilo: stavka je aktivna na svojoj stranici i na svemu ispod nje
 * (/igraci je aktivan i na /igraci/marko-maric). Iznimka je "/", koja bi
 * inače bila aktivna svugdje, pa se ona traži točno.
 */

/** Segmenti putanje, bez praznih. */
function segmenti(put: string): string[] {
  return ocisti(put)
    .split("/")
    .filter((dio) => dio !== "");
}

function ocisti(put: string): string {
  const bezUpita = put.split(/[?#]/)[0] ?? "";
  if (bezUpita.length > 1 && bezUpita.endsWith("/")) {
    return bezUpita.slice(0, -1);
  }
  return bezUpita;
}

export function jeAktivna(pathname: string | null | undefined, href: string): boolean {
  if (!pathname || !href) return false;
  const put = ocisti(pathname);
  const cilj = ocisti(href);
  if (cilj === "" || cilj === "/") return put === "" || put === "/";
  return put === cilj || put.startsWith(`${cilj}/`);
}

/**
 * Ljestvice imaju dva oblika putanje: tekuća sezona je /ljestvice/<kategorija>,
 * a arhivska /ljestvice/<sezona>/<kategorija>. Na arhivskoj stranici nijedna
 * stavka izbornika nije odgovarala, pa se iz izbornika nije vidjelo koju
 * ljestvicu gledate. Kategorija je u oba slučaja zadnji segment, pa se po
 * njemu i uparuje.
 */
export function jeAktivnaLjestvica(
  pathname: string | null | undefined,
  href: string,
): boolean {
  if (jeAktivna(pathname, href)) return true;
  if (!pathname) return false;
  const put = segmenti(pathname);
  const cilj = segmenti(href);
  if (put.length !== 3 || cilj.length !== 2) return false;
  if (put[0] !== "ljestvice" || cilj[0] !== "ljestvice") return false;
  return put[2] === cilj[1];
}
