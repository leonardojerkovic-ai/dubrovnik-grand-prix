import { z } from "zod";

export const tournamentSchema = z.object({
  seasonId: z.string().min(1, "Sezona je obavezna"),
  name: z.string().min(1, "Naziv je obavezan").max(200),
  date: z.string().min(1, "Datum je obavezan"),
  format: z.enum(["SWISS", "ROUND_ROBIN"]),
  rounds: z.coerce.number().int().min(1).max(20),
  level: z.enum(["KLUPSKA", "NATJECATELJSKA", "VRHUNSKA"]).optional().or(z.literal("")),
  tempo: z.enum(["STANDARD", "RAPID", "BLITZ"]),
  baseMinutes: z.coerce.number().int().min(1).max(180).optional().or(z.literal("")),
  incrementSeconds: z.coerce.number().int().min(0).max(60).optional().or(z.literal("")),
  isFinal: z.coerce.boolean().default(false),
  isJuniorFinal: z.coerce.boolean().default(false),
  status: z
    .enum(["NAJAVA", "PRIJAVE_OTVORENE", "U_TIJEKU", "ZAVRSEN"])
    .default("NAJAVA"),
});

export type TournamentFormValues = z.infer<typeof tournamentSchema>;
