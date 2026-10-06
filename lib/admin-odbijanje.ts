import { redirect } from "next/navigation";

/**
 * Odbijanje admin radnje uz poruku koja se stvarno vidi.
 *
 * Server akcije koje su odbijanje javljale bacanjem iznimke u produkciji ne
 * kažu ništa: Next zamijeni `error.message` općom engleskom porukom
 * („An error occurred in the Server Components render…"), pa je app/error.tsx
 * prikazivao baš nju. Posljedica: pažljivo napisana uputa — „igrač ima
 * rezultate, upiši mu Član do ili označi Preminuo" — nikad nije došla do
 * admina, a on je vidio samo da nešto ne radi.
 *
 * Zato se odbijanje javlja preusmjeravanjem natrag na popis, s porukom u
 * adresi. Stranica je pročita i prikaže (vidi components/admin-notice.tsx).
 * Poruka nije tajna ni korisnički unos, nego naš stalni tekst, pa u adresi
 * ne može ništa pokvariti.
 */
export function odbij(putanja: string, poruka: string): never {
  redirect(`${putanja}?greska=${encodeURIComponent(poruka)}`);
}

/** Čita poruku iz searchParams, bez obzira dolazi li kao niz ili polje. */
export function porukaIzAdrese(
  searchParams: Record<string, string | string[] | undefined> | undefined
): string | undefined {
  const v = searchParams?.greska;
  if (Array.isArray(v)) return v[0];
  return v;
}

/**
 * Napomena, ne odbijanje: radnja je prošla, ali ima nešto što admin mora
 * znati. Ide kroz isti mehanizam adrese, samo pod drugim parametrom, da se ne
 * prikaže crveno kao greška.
 */
export function napomeni(putanja: string, poruka: string): never {
  redirect(`${putanja}?napomena=${encodeURIComponent(poruka)}`);
}

/** Čita napomenu iz searchParams. */
export function napomenaIzAdrese(
  searchParams: Record<string, string | string[] | undefined> | undefined
): string | undefined {
  const v = searchParams?.napomena;
  if (Array.isArray(v)) return v[0];
  return v;
}
