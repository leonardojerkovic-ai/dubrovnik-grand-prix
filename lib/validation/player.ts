import { z } from "zod";

export const TITLES = [
  "GM",
  "IM",
  "FM",
  "CM",
  "WGM",
  "WIM",
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
  birthDate: z.string().optional().or(z.literal("")),
  isClubMember: z.coerce.boolean().default(false),
});

export type PlayerFormValues = z.infer<typeof playerSchema>;
