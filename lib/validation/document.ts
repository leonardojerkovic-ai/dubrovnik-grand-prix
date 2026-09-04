import { z } from "zod";

export const documentSchema = z.object({
  title: z.string().min(1, "Naziv je obavezan").max(200),
  /**
   * Puni URL (vanjski dokument) ili putanja unutar stranice, npr.
   * "/dokumenti/pravilnik.pdf" za datoteku u public/dokumenti.
   *
   * Vlastita putanja je bolja gdje god je moguća: poveznica ne istječe, ne
   * ovisi o tuđim dozvolama, a verzija dokumenta stoji u repozitoriju uz
   * ostatak projekta.
   */
  fileUrl: z
    .string()
    .min(1, "Poveznica je obavezna")
    .refine(
      (v) => v.startsWith("/") || /^https?:\/\//.test(v),
      "Upiši puni URL (https://…) ili putanju unutar stranice (/dokumenti/…)"
    ),
  category: z.enum(["PRAVILNIK", "ZAPISNIK", "OSTALO"]),
  seasonId: z.string().optional().or(z.literal("")),
});

export type DocumentFormValues = z.infer<typeof documentSchema>;
