import type { Title } from "@prisma/client";

/**
 * Koja se titula pokazuje uz rezultat odigranog turnira.
 *
 * Zapisana (`titleSnapshotUsed`) ima prednost: ona je titula iz trenutka
 * spremanja rezultata, pa tablica turnira iz 2027. ne pokazuje napredovanje
 * iz 2028.
 *
 * Prazno znači da je turnir spremljen prije uvođenja tog polja. Tada se pada
 * na igračevu trenutnu titulu — isto što se prikazivalo i dosad, pa stare
 * tablice ne dobivaju prazne ćelije.
 *
 * `NONE` je vrijednost, ne praznina: igrač bez titule zapisan je kao NONE i
 * to se ne smije zamijeniti s „nije zapisano", inače bi mu se prikazala
 * današnja titula iako je tada bio bez nje.
 */
export function prikazanaTitula(
  zapisana: Title | null | undefined,
  trenutna: Title
): Title {
  return zapisana ?? trenutna;
}

/**
 * Puni naziv titule ili kategorije, redom kojim se ispisuje legenda.
 *
 * Uz ime na ljestvici stoji samo oznaka — „III", „MK", „WIM". Šahist je
 * čita bez razmišljanja, ali ljestvicu Akademije najviše gledaju roditelji,
 * kojima „V" ispred djetetova imena ne znači ništa.
 *
 * Redoslijed ključeva je redoslijed jačine i namjerno je isti kao u enumu
 * `Title` u shemi: legenda se ispisuje od najviše titule prema najnižoj.
 */
const OPISI_TITULA: Record<string, string> = {
  GM: "velemajstor",
  IM: "međunarodni majstor",
  WGM: "velemajstorica",
  FM: "FIDE majstor",
  WIM: "međunarodna majstorica",
  CM: "kandidat majstor",
  WFM: "FIDE majstorica",
  WCM: "kandidatkinja majstorica",
  MK: "majstorski kandidat",
  I: "prva kategorija",
  II: "druga kategorija",
  III: "treća kategorija",
  IV: "četvrta kategorija",
  V: "peta kategorija",
};

/** Puni naziv oznake; `null` za NONE, prazno i sve što nije poznata titula. */
export function opisTitule(titula: string | null | undefined): string | null {
  if (!titula) return null;
  return OPISI_TITULA[titula] ?? null;
}

/**
 * Stavke legende za titule koje se u tablici STVARNO pojavljuju.
 *
 * Legenda sa svih četrnaest oznaka ispod tablice u kojoj su dvije bila bi
 * duža od onoga što objašnjava. Svaka oznaka dolazi jednom, redom jačine.
 */
export function legendaTitula(
  titule: Iterable<string | null | undefined>
): { oznaka: string; opis: string }[] {
  const prisutne = new Set<string>();
  for (const t of titule) if (t) prisutne.add(t);

  return Object.entries(OPISI_TITULA)
    .filter(([oznaka]) => prisutne.has(oznaka))
    .map(([oznaka, opis]) => ({ oznaka, opis }));
}
