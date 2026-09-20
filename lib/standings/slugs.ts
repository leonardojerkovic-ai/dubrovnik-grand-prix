import type { GpCategoryCode } from "@/lib/standings/gp";

/**
 * Preslikavanje adrese ljestvice na sustav i kategoriju.
 *
 * Stoji izdvojeno jer ga koriste i stranica ljestvice i izvoz u CSV; dvije
 * kopije istog popisa razišle bi se prvom novom kategorijom.
 */
export type StandingSlugConfig = {
  system: "GP" | "AKADEMIJA";
  category?: GpCategoryCode;
  title: string;
};

export const STANDING_SLUGS: Record<string, StandingSlugConfig> = {
  "opci-gp": { system: "GP", category: "OPCI", title: "Opći GP" },
  zene: { system: "GP", category: "ZENE", title: "Žene" },
  u20: { system: "GP", category: "U20", title: "Juniori U20" },
  u16: { system: "GP", category: "U16", title: "Kadeti U16" },
  u12: { system: "GP", category: "U12", title: "Mlađi kadeti U12" },
  s50: { system: "GP", category: "S50", title: "Veterani +50" },
  s65: { system: "GP", category: "S65", title: "Veterani +65" },
  u1800: { system: "GP", category: "U1800", title: "U1800" },
  akademija: { system: "AKADEMIJA", title: "GP Akademije" },
};

/**
 * Oznaka sezone u adresi.
 *
 * Akademijske sezone imaju oznaku oblika "2026/27", a kosa crta u putanji
 * znači novi segment — zato se u adresi piše "2026-27". Preslikavanje je
 * jednoznačno jer oznaka sezone inače ne sadrži crticu.
 */
export function seasonSlug(yearLabel: string): string {
  return yearLabel.replace("/", "-");
}

export function yearLabelFromSlug(slug: string): string {
  // "2026-27" -> "2026/27"; "2027" ostaje "2027"
  return slug.includes("-") ? slug.replace("-", "/") : slug;
}
