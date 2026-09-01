import { z } from "zod";

export const registrationSchema = z.object({
  firstName: z.string().min(1, "Ime je obavezno").max(100),
  lastName: z.string().min(1, "Prezime je obavezno").max(100),
  email: z.string().email("Neispravan email"),
  password: z.string().min(8, "Lozinka mora imati barem 8 znakova"),
  gender: z.enum(["M", "F"]),
  birthYear: z.coerce.number().int().min(1900).max(new Date().getFullYear()),
  gdprConsent: z.literal("on", {
    errorMap: () => ({ message: "Moraš prihvatiti Politiku privatnosti za registraciju." }),
  }),
});

export type RegistrationFormValues = z.infer<typeof registrationSchema>;
