/**
 * Spremljeni predlošci nagradnog fonda.
 *
 * Čuvaju se u pregledniku onoga tko ih je spremio, ne u bazi. Nagradni fond
 * se iz turnira u turnir ponavlja gotovo nepromijenjen, pa je cilj ušteda
 * prepisivanja — ne zajednički zapis. Tko radi s drugog računala, predloška
 * nema, i to je u redu.
 *
 * Svako čitanje i pisanje je u try/catch: u anonimnom prozoru ili uz
 * isključenu pohranu pristup zna baciti iznimku, a alat mora raditi i tada.
 */

const KLJUC = "dgp:novcane-nagrade:predlosci";

export interface Predlozak<T> {
  godinaSezone: string;
  redci: T[];
}

export type Predlosci<T> = Record<string, Predlozak<T>>;

export function ucitajPredloske<T>(): Predlosci<T> {
  try {
    const zapis = window.localStorage.getItem(KLJUC);
    if (!zapis) return {};
    const procitano: unknown = JSON.parse(zapis);
    if (!procitano || typeof procitano !== "object") return {};
    return procitano as Predlosci<T>;
  } catch {
    return {};
  }
}

/** Vraća novo stanje, ili staro ako se spremanje nije moglo izvesti. */
export function spremiPredlozak<T>(
  naziv: string,
  predlozak: Predlozak<T>
): Predlosci<T> {
  const svi = ucitajPredloske<T>();
  const novi = { ...svi, [naziv]: predlozak };
  try {
    window.localStorage.setItem(KLJUC, JSON.stringify(novi));
    return novi;
  } catch {
    return svi;
  }
}

export function obrisiPredlozak<T>(naziv: string): Predlosci<T> {
  const svi = ucitajPredloske<T>();
  const { [naziv]: _uklonjen, ...ostali } = svi;
  try {
    window.localStorage.setItem(KLJUC, JSON.stringify(ostali));
    return ostali;
  } catch {
    return svi;
  }
}
