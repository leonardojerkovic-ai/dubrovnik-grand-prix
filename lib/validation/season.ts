import { z } from "zod";

export const seasonSchema = z
  .object({
    system: z.enum(["GP", "AKADEMIJA"]),
    yearLabel: z.string().min(1, "Oznaka sezone je obavezna").max(20),
    startDate: z.string().min(1, "Datum početka je obavezan"),
    endDate: z.string().min(1, "Datum kraja je obavezan"),
    isActive: z.coerce.boolean().default(false),
  })
  .refine((data) => new Date(data.endDate) > new Date(data.startDate), {
    message: "Datum kraja mora biti nakon datuma početka",
    path: ["endDate"],
  });

export type SeasonFormValues = z.infer<typeof seasonSchema>;
