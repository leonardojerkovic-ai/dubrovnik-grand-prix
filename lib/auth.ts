import { normalizeEmail } from "@/lib/email-address";
import { checkRateLimit } from "@/lib/rate-limit";
import bcrypt from "bcryptjs";
import type { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";

/**
 * Koliko dugo se rola iz JWT-a smatra svježom prije ponovne provjere u bazi.
 * Kompromis između brzine (bez upita pri svakom zahtjevu) i toga da
 * promjena ovlasti proradi bez odjave korisnika.
 */
const ROLE_REFRESH_MS = 60_000;

/**
 * Prijava ide isključivo emailom i lozinkom.
 *
 * Google prijava je uklonjena jer je bila nedovršena i, što je važnije,
 * zaobilazila bi tri stvari koje registracija obavlja: godište i spol
 * (potrebni za dobne kategorije i žensku ljestvicu), zapis privole
 * (gdprConsentAt, jedini dokaz pristanka), i pristupni kod kojim se račun
 * povezuje s igračkim profilom. Račun otvoren Googleom završio bi prazan i
 * u redu za ručno odobrenje — upravo ondje gdje ne želimo biti.
 *
 * PrismaAdapter je uklonjen zajedno s njom: uz JWT sesije i jedini
 * Credentials provider ne radi ništa, a tražio bi tablice Account,
 * Session i VerificationToken kojih u shemi nema.
 */
export const authOptions: AuthOptions = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/prijava",
  },
  providers: [
    CredentialsProvider({
      name: "Email i lozinka",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Lozinka", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = normalizeEmail(credentials.email);

        // Broji se po adresi e-pošte, dakle po računu koji se napada.
        // Neuspjeli pokušaj se broji jednako kao uspjeli, jer upravo njih
        // ima puno kad netko pogađa lozinku.
        const limit = await checkRateLimit("prijava", email);
        if (!limit.allowed) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.passwordHash) return null;

        const valid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );
        if (!valid) return null;

        return { id: user.id, email: user.email, role: user.role };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Prijava: rola dolazi izravno iz authorize()/adaptera.
      if (user) {
        token.role = (user as { role?: string }).role ?? "PLAYER";
        /**
         * Trenutak prijave, za poništavanje sesija pri promjeni lozinke.
         *
         * NE koristi se `iat` iz JWT-a: NextAuth token ponovno potpisuje pri
         * svakom zahtjevu, pa je `iat` uvijek svjež i stara sesija bi se
         * njime činila novom. Ovo polje se upisuje jednom, pri prijavi, i
         * dalje se samo prenosi.
         */
        token.prijavljenOd = Date.now();
        // Namjerno se NE postavlja roleCheckedAt: ime i profil dohvaćaju se
        // pri prvom sljedećem osvježavanju tokena, odmah nakon prijave.
        return token;
      }

      // Sesija je JWT, pa bi rola upisana pri prijavi ostala zamrznuta do
      // isteka tokena (zadano 30 dana). Oduzimanje admin prava tako ne bi
      // odmah djelovalo. Zato se rola periodički osvježava iz baze —
      // najviše jednom u ROLE_REFRESH_MS, da se ne radi upit pri svakom
      // getServerSession().
      const lastCheck =
        typeof token.roleCheckedAt === "number" ? token.roleCheckedAt : 0;

      if (token.email && Date.now() - lastCheck > ROLE_REFRESH_MS) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email as string },
          select: {
            role: true,
            sessionsValidFrom: true,
            // Ime i profil se dohvaćaju u istom upitu — zaglavlju trebaju,
            // a zaseban upit bi bio čisti trošak.
            player: { select: { id: true, firstName: true, lastName: true } },
          },
        });

        /**
         * Sesija izdana prije reseta lozinke više ne vrijedi.
         *
         * Provjera ide u istom upitu kao i rola, pa u najgorem slučaju
         * zaostaje ROLE_REFRESH_MS (minutu) — umjesto 30 dana, koliko je
         * takva sesija dosad živjela. Tokeni izdani prije ove izmjene nemaju
         * `prijavljenOd`; njih se ne poništava, da promjena nikoga ne izbaci
         * bez razloga.
         */
        const prijavljenOd =
          typeof token.prijavljenOd === "number" ? token.prijavljenOd : null;
        if (
          prijavljenOd !== null &&
          dbUser?.sessionsValidFrom &&
          prijavljenOd < dbUser.sessionsValidFrom.getTime()
        ) {
          token.ponisteno = true;
        }
        // Obrisan korisnik pada na PLAYER — nikad ne zadržava ovlasti.
        token.role = dbUser?.role ?? "PLAYER";
        token.playerId = dbUser?.player?.id ?? null;
        token.displayName = dbUser?.player
          ? `${dbUser.player.firstName} ${dbUser.player.lastName}`
          : null;
        token.roleCheckedAt = Date.now();
      }

      return token;
    },
    async session({ session, token }) {
      /**
       * Poništena sesija: korisniku se oduzima identitet, pa je svaka naša
       * provjera (`session?.user?.email`) tretira kao neprijavljenog.
       *
       * NextAuth v4 nema način da iz callbacka izbriše kolačić, pa se token
       * ostavlja da istekne sam — ali bez ičega u sebi ne otvara ništa.
       */
      if (token.ponisteno) {
        return { ...session, user: {}, expires: new Date(0).toISOString() };
      }

      if (session.user) {
        const u = session.user as {
          role?: string;
          playerId?: string | null;
          displayName?: string | null;
        };
        u.role = (token.role as string) ?? "PLAYER";
        u.playerId = (token.playerId as string | null) ?? null;
        u.displayName = (token.displayName as string | null) ?? null;
      }
      return session;
    },
  },
};
