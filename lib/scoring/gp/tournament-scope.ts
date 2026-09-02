/**
 * Koje ljestvice obuhvaćaju koji turnir — čl. 20 st. 2 GP pravilnika.
 *
 * "U pojedinu kategorijsku GP ljestvicu uključuje se turnir samo ako uvjeti
 *  nastupa na tom turniru obuhvaćaju sve igrače koji pripadaju kategoriji za
 *  koju se vodi ljestvica."
 *
 * Smjer je bitan i lako se pogriješi: prvenstvo U20 ULAZI u ljestvice U16 i
 * U12 (svi kadeti smjeli su nastupiti), ali prvenstvo U16 NE ULAZI u U20
 * (nisu svi juniori smjeli). Isto vrijedi za veterane: prvenstvo +50 ulazi
 * u ljestvicu +65, ali ne obrnuto.
 */

/** Ljestvice koje se vode u GP sustavu. */
export type GpStandingCode =
  | "OPCI"
  | "ZENE"
  | "U20"
  | "U16"
  | "U12"
  | "S50"
  | "S65"
  | "U1800";

/** Kategorije na koje turnir može biti ograničen (čl. 14) — bez Općeg. */
export type GpRestrictionCode = Exclude<GpStandingCode, "OPCI">;

export const GP_RESTRICTION_CODES: GpRestrictionCode[] = [
  "ZENE",
  "U20",
  "U16",
  "U12",
  "S50",
  "S65",
  "U1800",
];

export const GP_RESTRICTION_LABELS: Record<GpRestrictionCode, string> = {
  ZENE: "Žene",
  U20: "Juniori U20",
  U16: "Kadeti U16",
  U12: "Mlađi kadeti U12",
  S50: "Veterani +50",
  S65: "Veterani +65",
  U1800: "U1800",
};

/**
 * Za svako ograničenje: koje su ljestvice u cijelosti obuhvaćene njime.
 * Čitati kao "tko sve smije nastupiti na turniru ograničenom na X".
 */
const STANDINGS_COVERED_BY: Record<GpRestrictionCode, GpStandingCode[]> = {
  // Svi U16 i U12 igrači su ujedno U20 igrači.
  U20: ["U20", "U16", "U12"],
  U16: ["U16", "U12"],
  U12: ["U12"],
  // Svi +65 igrači su ujedno +50 igrači.
  S50: ["S50", "S65"],
  S65: ["S65"],
  ZENE: ["ZENE"],
  U1800: ["U1800"],
};

export function isValidRestrictionCode(
  value: unknown
): value is GpRestrictionCode {
  return (
    typeof value === "string" &&
    (GP_RESTRICTION_CODES as string[]).includes(value)
  );
}

/** Čita netipizirano polje iz baze i vraća samo prepoznate oznake. */
export function parseRestrictions(value: unknown): GpRestrictionCode[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isValidRestrictionCode);
}

export interface TournamentScope {
  restrictedCategories: unknown;
  isFinal: boolean;
  isJuniorFinal: boolean;
}

/**
 * Ulazi li turnir u zadanu ljestvicu.
 *
 * Završni turniri imaju vlastito pravilo i ne prolaze kroz st. 2:
 *  - GP Finale (čl. 20 st. 4) — u Opći GP i u sve kategorijske ljestvice
 *    kojima igrač pripada. Pripadnost igrača provjerava se zasebno.
 *  - Juniorsko Finale (čl. 20 st. 5) — u U20 te u ljestvice čiji su svi
 *    pripadnici imali pravo kvalificirati se, dakle U16 i U12.
 *    Nikad u Opći GP (čl. 24).
 */
export function tournamentEntersStanding(
  tournament: TournamentScope,
  standing: GpStandingCode
): boolean {
  if (tournament.isJuniorFinal) {
    return standing === "U20" || standing === "U16" || standing === "U12";
  }

  if (tournament.isFinal) {
    return true;
  }

  const restrictions = parseRestrictions(tournament.restrictedCategories);

  // Turnir otvoren svima ulazi u Opći GP i u sve kategorijske ljestvice.
  if (restrictions.length === 0) return true;

  // Turnir s ograničenim pravom nastupa ne ulazi u Opći GP (čl. 15).
  if (standing === "OPCI") return false;

  // Uz više ograničenja nastupiti smije tko zadovoljava sva, pa je ljestvica
  // obuhvaćena samo ako je obuhvaćena svakim od njih.
  return restrictions.every((r) =>
    STANDINGS_COVERED_BY[r].includes(standing)
  );
}

/**
 * Ljestvice u koje turnir ulazi — za prikaz adminu pri unosu turnira.
 * Prazan popis znači da turnir neće ući ni u jednu ljestvicu.
 */
export function standingsForTournament(
  tournament: TournamentScope,
  allStandings: GpStandingCode[]
): GpStandingCode[] {
  return allStandings.filter((s) => tournamentEntersStanding(tournament, s));
}
