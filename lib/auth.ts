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

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });
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
            // Ime i profil se dohvaćaju u istom upitu — zaglavlju trebaju,
            // a zaseban upit bi bio čisti trošak.
            player: { select: { id: true, firstName: true, lastName: true } },
          },
        });
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
