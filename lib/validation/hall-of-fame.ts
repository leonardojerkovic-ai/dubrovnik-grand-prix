import { z } from "zod";

export const hallOfFameSchema = z.object({
  seasonId: z.string().min(1, "Sezona je obavezna"),
  categoryCode: z.string().min(1, "Kategorija je obavezna").max(20),
  playerId: z.string().min(1, "Igrač je obavezan"),
  place: z.coerce.number().int().min(1).max(3),
  pointsTotal: z.coerce.number().int().min(0),
});

export type HallOfFameFormValues = z.infer<typeof hallOfFameSchema>;
