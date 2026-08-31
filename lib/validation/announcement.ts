import { z } from "zod";

export const announcementSchema = z.object({
  title: z.string().min(1, "Naslov je obavezan").max(200),
  body: z.string().min(1, "Sadržaj je obavezan"),
  tournamentId: z.string().optional().or(z.literal("")),
  seasonId: z.string().optional().or(z.literal("")),
});

export type AnnouncementFormValues = z.infer<typeof announcementSchema>;
