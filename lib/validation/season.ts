import { z } from "zod";

export const seasonSchema = z
  .object({
    system: z.enum(["GP", "AKADEMIJA"]),
    yearLabel: z.string().min(1, "Oznaka sezone je obavezna").max(20),
    startDate: z.string().min(1, "Datum početka je obavezan"),
    endDate: z.string().min(1, "Datum kraja je obavezan"),
    isActive: z.coerce.boolean().default(false),
    /**
     * Verzija pravilnika po kojoj se boduje ova sezona, npr. "GP-2.3" ili
     * "AKD-1.2". Kopira se u snapshot svakog rezultata, pa se poslije vidi
     * po kojoj je verziji bod nastao (čl. 30 GP / čl. 23 Akademije).
     */
    rulebookVersion: z
      .string()
      .max(20)
      .optional()
      .or(z.literal("")),
  })
  .refine((data) => new Date(data.endDate) > new Date(data.startDate), {
    message: "Datum kraja mora biti nakon datuma početka",
    path: ["endDate"],
  });

export type SeasonFormValues = z.infer<typeof seasonSchema>;
