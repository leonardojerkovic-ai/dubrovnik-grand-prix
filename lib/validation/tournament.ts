import { z } from "zod";
import { GP_RESTRICTION_CODES } from "@/lib/scoring/gp/tournament-scope";

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
  // Prazno = turnir otvoren svima. Obrazac nudi jednu kategoriju, ali se
  // sprema kao popis jer čl. 20 st. 2 načelno dopušta i kombinaciju.
  restrictedCategory: z
    .enum(GP_RESTRICTION_CODES as [string, ...string[]])
    .optional()
    .or(z.literal("")),
}).refine((v) => !v.isJuniorFinal || v.isFinal, {
  // Juniorsko Finale je završni turnir (čl. 3), pa mu rezultat mora biti
  // zaštićen od odbacivanja (čl. 20 st. 6). Bez isFinal bio bi tretiran kao
  // redovni rezultat i mogao bi ispasti iz zbroja.
  message: "Juniorsko Finale mora biti označeno i kao završni turnir.",
  path: ["isJuniorFinal"],
});

export type TournamentFormValues = z.infer<typeof tournamentSchema>;
