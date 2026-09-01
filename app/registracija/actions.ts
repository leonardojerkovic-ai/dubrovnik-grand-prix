"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { registrationSchema } from "@/lib/validation/registration";

export type RegistrationState = {
  errors?: Record<string, string[]>;
  message?: string;
};

/**
 * Samostalna registracija novog korisnika/igrača.
 *
 * SPAJANJE S POSTOJEĆIM PROFILOM: ako klub već ima Player zapis (unesen kroz
 * admin panel) koji odgovara imenu/prezimenu/godištu koje osoba upiše i taj
 * zapis još nema povezan User račun, novi User se spaja s TIM postojećim
 * Player zapisom umjesto da se kreira duplikat. Podudaranje je namjerno
 * strogo (ime + prezime, case-insensitive, TE godište) da se izbjegne
 * pogrešno spajanje dvoje različitih ljudi istog imena.
 *
 * Ako se pronađe VIŠE od jednog mogućeg podudaranja (npr. dva igrača s
 * istim imenom i godištem), spajanje se preskače i kreira se nov profil —
 * sigurnije je imati privremeni duplikat nego pogrešno spojiti račun s
 * tuđim profilom. Admin to onda ručno riješi kroz Prisma Studio.
 *
 * GDPR: registracija zahtijeva potvrdu privole (gdprConsent), vremenski
 * žig privole se sprema na User.gdprConsentAt kao dokaz. Vidi /privatnost
 * za napomenu o maloljetnicima — ovaj obrazac ne provjerava dob unesenu
 * korisnikom (samostalna prijava), pa je odgovornost kluba osigurati da
 * mlađi igrači budu registrirani od strane roditelja/skrbnika ili unešeni
 * ručno kroz admin panel bez User računa.
 */
export async function registerPlayer(
  _prevState: RegistrationState,
  formData: FormData
): Promise<RegistrationState> {
  const parsed = registrationSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    password: formData.get("password"),
    gender: formData.get("gender"),
    birthYear: formData.get("birthYear"),
    gdprConsent: formData.get("gdprConsent"),
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const { firstName, lastName, email, password, gender, birthYear } =
    parsed.data;

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return { errors: { email: ["Račun s ovim emailom već postoji."] } };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const gdprConsentAt = new Date();

  // Traži postojeći, još nepovezani Player zapis koji odgovara imenu i godištu.
  const candidates = await prisma.player.findMany({
    where: {
      userId: null,
      birthYear,
      firstName: { equals: firstName, mode: "insensitive" },
      lastName: { equals: lastName, mode: "insensitive" },
    },
  });

  if (candidates.length === 1) {
    // Točno jedno podudaranje — spoji novi račun s postojećim profilom.
    const player = candidates[0];
    await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: "PLAYER",
        gdprConsentAt,
        player: { connect: { id: player.id } },
      },
    });
  } else {
    // Nema podudaranja ili ih je više (dvosmisleno) — kreiraj nov profil.
    await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: "PLAYER",
        gdprConsentAt,
        player: {
          create: {
            firstName,
            lastName,
            gender,
            birthYear,
            isClubMember: false, // admin ručno potvrđuje članstvo (čl. 4)
          },
        },
      },
    });
  }

  redirect("/prijava?registered=1");
}
