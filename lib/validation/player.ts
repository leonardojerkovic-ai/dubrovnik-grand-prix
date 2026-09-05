import { z } from "zod";

/**
 * Titule redom kojim ih FIDE navodi: GM, IM, WGM, FM, WIM, CM, WFM, WCM.
 * Ispod njih su nacionalne kategorije Hrvatskog šahovskog saveza.
 *
 * Isti redoslijed vrijedi i pri sortiranju igrača — vidi lib/players/sort.ts.
 */
export const TITLES = [
  "GM",
  "IM",
  "WGM",
  "FM",
  "WIM",
  "CM",
  "WFM",
  "WCM",
  "MK",
  "I",
  "II",
  "III",
  "IV",
  "V",
  "NONE",
] as const;

export const playerSchema = z.object({
  firstName: z.string().min(1, "Ime je obavezno").max(100),
  lastName: z.string().min(1, "Prezime je obavezno").max(100),
  fideId: z
    .string()
    .regex(/^\d+$/, "FIDE ID mora sadržavati samo brojeve")
    .optional()
    .or(z.literal("")),
  title: z.enum(TITLES).default("NONE"),
  gender: z.enum(["M", "F"]),
  birthYear: z.coerce
    .number()
    .int()
    .min(1900)
    .max(new Date().getFullYear()),
  // Opcionalan — obavezan tek za Akademiju igrače (čl. 3), provjerava se posebno
  isClubMember: z.coerce.boolean().default(false),
  deceased: z.coerce.boolean().default(false),
  deceasedYear: z.coerce
    .number()
    .int()
    .min(1900)
    .max(new Date().getFullYear())
    .optional()
    .or(z.literal("").transform(() => undefined)),
  // Datum učlanjenja — bez njega se članstvo na dan ranijeg turnira ne može
  // provjeriti (čl. 4). memberUntil je prazan dok je igrač član.
  memberSince: z.string().optional().or(z.literal("")),
  memberUntil: z.string().optional().or(z.literal("")),
}).refine(
  (v) =>
    !v.memberSince ||
    !v.memberUntil ||
    new Date(v.memberUntil) >= new Date(v.memberSince),
  { message: "Datum prestanka ne može biti prije datuma učlanjenja", path: ["memberUntil"] }
);

export type PlayerFormValues = z.infer<typeof playerSchema>;
