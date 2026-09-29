"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { hashLinkCode, looksLikeLinkCode } from "@/lib/link-code";
import { claimPlayerByLinkCode } from "@/lib/claim-link-code";
import { needsGuardian } from "@/lib/guardian-rules";
import { registrationSchema } from "@/lib/validation/registration";
import { fieldErrorsFrom } from "@/lib/validation/errors";
import { checkRateLimit, rateLimitMessage } from "@/lib/rate-limit";
import { requestIp } from "@/lib/request-ip";

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
  formData: FormData,
): Promise<RegistrationState> {
  // Broji se po adresi zahtjeva, ne po e-pošti: tko masovno upisuje račune
  // svaki put upiše drugu adresu.
  const limit = await checkRateLimit("registracija", await requestIp());
  if (!limit.allowed) {
    return { errors: { _form: [rateLimitMessage(limit.retryAt)] } };
  }

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
    return { errors: fieldErrorsFrom(parsed.error) };
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

  // Pristupni kod, ako je unesen, dokazuje identitet i povezuje račun
  // odmah — bez čekanja na odobrenje administratora.
  const rawCode = String(formData.get("linkCode") ?? "").trim();
  // Roditelj koji sam ne igra ne treba prazan igrački profil koji nikad
  // neće nastupiti — račun mu služi samo za upravljanje djecom.
  // Označava da se osoba registrira samo radi vođenja djece i da joj ne
  // treba vlastiti igrački profil. Ne odlučuje o tome hoće li se dijete
  // voditi kroz skrbništvo — to određuje njegova dob.
  const asGuardian = formData.get("asGuardian") === "on";

  if (rawCode.length > 0) {
    if (!looksLikeLinkCode(rawCode)) {
      return { errors: { linkCode: ["Kod nije ispravnog oblika."] } };
    }

    const target = await prisma.player.findUnique({
      where: { linkCodeHash: hashLinkCode(rawCode) },
      select: { id: true, userId: true, linkCodeUsedAt: true, birthYear: true },
    });

    // Ista poruka za nepostojeći, iskorišten i već zauzet kod — inače bi se
    // pogađanjem moglo doznati koji kodovi postoje.
    if (!target || target.userId || target.linkCodeUsedAt) {
      return {
        errors: { linkCode: ["Kod nije valjan ili je već iskorišten."] },
      };
    }

    // Račun i povezivanje idu zajedno. Zauzme li kod u međuvremenu netko
    // drugi, poništava se i stvaranje računa — inače bi ostao račun bez
    // profila, a korisnik bi vidio samo poruku o grešci i ne bi znao da se
    // ipak registrirao.
    //
    // Poništava se bacanjem iznimke, jer Prisma na običan povratak iz
    // transakcije ne vraća ništa unatrag.
    const CODE_TAKEN = "KOD_ZAUZET";
    let linked = true;
    try {
      await prisma.$transaction(async (tx) => {
        const created = await tx.user.create({
          data: { email, passwordHash, role: "PLAYER", gdprConsentAt },
          select: { id: true },
        });

        // Dob odlučuje, ne kvačica. Da o tome odlučuje korisnik, roditelj koji
        // je zaboravi označiti dobio bi djetetov profil kao SVOJ — račun bi
        // radio, ali bi ime djeteta stajalo kao njegovo, a djetetov profil bio
        // bi trajno zauzet. Greška koja se ne primijeti dok netko ne pogleda
        // pobliže.
        const guardian = needsGuardian(target.birthYear);

        if (
          !(await claimPlayerByLinkCode(
            tx,
            target.id,
            guardian ? {} : { userId: created.id },
          ))
        ) {
          throw new Error(CODE_TAKEN);
        }

        if (guardian) {
          await tx.guardianLink.create({
            data: { guardianUserId: created.id, playerId: target.id },
          });
        }
      });
    } catch (error) {
      if (!(error instanceof Error) || error.message !== CODE_TAKEN)
        throw error;
      linked = false;
    }

    if (!linked) {
      return {
        errors: { linkCode: ["Kod nije valjan ili je već iskorišten."] },
      };
    }

    redirect("/prijava?registered=1&linked=1");
  }

  // Korisnik je označio da se registrira samo kao roditelj ili skrbnik.
  // Obećanje na obrascu glasi doslovno: "Tvom računu se neće stvoriti
  // igrački profil." Bez ove grane obećanje se nije ispunjavalo — račun je
  // svejedno dobivao prazan profil koji nikad ne nastupa, a taj se profil
  // potom pojavljuje na javnom popisu igrača.
  //
  // Podudaranje s postojećim profilima ovdje se namjerno preskače: tko ne
  // igra, nema svoj profil koji bi preuzeo.
  if (asGuardian) {
    await prisma.user.create({
      data: { email, passwordHash, role: "PLAYER", gdprConsentAt },
    });
    redirect("/prijava?registered=1");
  }

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
