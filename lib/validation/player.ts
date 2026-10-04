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
})
  .refine(
    (v) =>
      !v.memberSince ||
      !v.memberUntil ||
      new Date(v.memberUntil) >= new Date(v.memberSince),
    {
      message: "Datum prestanka ne može biti prije datuma učlanjenja",
      path: ["memberUntil"],
    }
  )
  /**
   * Skinuta kvačica „član" uz upisan datum učlanjenja, a bez datuma
   * prestanka, protuslovna je: po čl. 4 članstvo se provjerava NA DAN
   * turnira, a takav zapis ne kaže od kada igrač više nije član. Dok se to
   * dopuštalo, wasClubMemberOn je takvog igrača smatrao članom za svaki dan
   * — pa je i na novim turnirima ulazio na službenu ljestvicu, a dijete
   * pogrešno označeno kao član nije se moglo vratiti u nečlanove.
   *
   * Prazan memberSince i dalje je dopušten: tada se ništa ne tvrdi o
   * prošlosti i pada se natrag na trenutno stanje.
   */
  .refine((v) => v.isClubMember || !v.memberSince || !!v.memberUntil, {
    message:
      "Igrač nije označen kao član, a ima upisan datum učlanjenja — upiši i datum prestanka članstva („Član do“). Bez njega se ne može znati od kada više nije član, pa bi na turnirima i dalje ulazio kao član (čl. 4).",
    path: ["memberUntil"],
  });

export type PlayerFormValues = z.infer<typeof playerSchema>;
