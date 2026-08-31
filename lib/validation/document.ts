import { z } from "zod";

export const documentSchema = z.object({
  title: z.string().min(1, "Naziv je obavezan").max(200),
  fileUrl: z.string().url("Mora biti valjan URL (npr. link na PDF)"),
  category: z.enum(["PRAVILNIK", "ZAPISNIK", "OSTALO"]),
  seasonId: z.string().optional().or(z.literal("")),
});

export type DocumentFormValues = z.infer<typeof documentSchema>;
