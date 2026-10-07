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
 * Za gumb "Ljestvice", koji sam nije poveznica nego otvara izbornik: aktivan
 * je kad smo na bilo kojoj od stranica u njemu.
 */
export function jeAktivnaSkupina(
  pathname: string | null | undefined,
  hrefovi: readonly string[],
): boolean {
  return hrefovi.some((href) => jeAktivna(pathname, href));
}
