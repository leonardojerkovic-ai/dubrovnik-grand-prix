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
 * Samostalna registracija novog korisnika.
 *
 * NE SPAJA automatski s postojećim igračkim profilom. Ime, prezime i godište
 * javno su dostupni na FIDE stranicama, pa bi automatsko spajanje značilo da
 * se bilo tko može registrirati kao postojeći član kluba i preuzeti njegove
 * prijave i rezultate. Umjesto toga:
 *
 *  - postoji li podudarni profil (jedan ili više), račun se stvara BEZ
 *    povezanog profila i označava kao zahtjev koji administrator odobrava
 *    u Admin -> Korisnici;
 *  - ne postoji li nijedan, stvara se nov profil i odmah povezuje — nema
 *    tuđe povijesti koju bi se moglo preuzeti.
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

  if (candidates.length > 0) {
    // Postoji podudarni profil — račun se stvara BEZ veze na njega.
    // Povezivanje odobrava administrator (vidi napomenu iznad).
    await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: "PLAYER",
        gdprConsentAt,
        needsPlayerLink: true,
        // Kod više podudaranja ne nagađamo koji je pravi.
        pendingPlayerId: candidates.length === 1 ? candidates[0]!.id : null,
        claimedName: `${lastName} ${firstName}`,
        claimedBirthYear: birthYear,
      },
    });
    redirect("/prijava?registered=1&pending=1");
  }

  // Nema podudarnog profila — nova osoba, nema tuđe povijesti koju bi se
  // moglo preuzeti, pa se profil stvara i povezuje odmah.
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

  redirect("/prijava?registered=1");
}
