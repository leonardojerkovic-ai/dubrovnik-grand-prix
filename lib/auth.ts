import { normalizeEmail } from "@/lib/email-address";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  ADRESA_NEPOZNATA,
  adresaIzZaglavlja,
  kljucPrijave,
  RATE_LIMITS,
} from "@/lib/rate-limit-rules";
import { requestIp } from "@/lib/request-ip";
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
 * IP s kojeg stiže pokušaj prijave, ili null ako se nije mogao pročitati.
 *
 * Prvo iz zaglavlja koja NextAuth sam predaje u authorize — to je izravan
 * put i ne ovisi o tome izvršava li se kod unutar Nextovog zahtjeva. Ako ih
 * nema, pokušava se next/headers. Kad ni to ne uspije, vraća se null:
 * prijava se nastavlja, ali bez ograničenja po stroju.
 *
 * Zapisuje se samo u produkciji. Lokalno `next dev` ne dobiva ni
 * x-forwarded-for ni x-real-ip — preglednik ih ne šalje, a pred njim nema
 * posrednika — pa bi svaka prijava u razvoju ispisala grešku i naučila nas
 * da je preskačemo. U produkciji iza Vercela je izostanak tih zaglavlja
 * stvarno neobičan i treba se vidjeti.
 */
async function adresaPrijave(req: unknown): Promise<string | null> {
  const zaglavlja = (
    req as { headers?: Record<string, string | string[] | undefined> } | undefined
  )?.headers;

  const izAuth = adresaIzZaglavlja(zaglavlja);
  if (izAuth !== null) return izAuth;

  const izZahtjeva = await requestIp();
  if (izZahtjeva !== ADRESA_NEPOZNATA) return izZahtjeva;

  if (process.env.NODE_ENV === "production") {
    console.error(
      "[prijava] IP se nije mogao pročitati ni iz authorize ni iz next/headers; " +
        "ograničenje po stroju se preskače za ovaj pokušaj.",
    );
  }
  return null;
}

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
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = normalizeEmail(credentials.email);

        /*
          Tri brojača, jer nijedan ne vidi sva tri napada:

            par adresa + IP   8 / 15 min   pogađanje jednog računa s jednog
                                           stroja; dok se brojalo samo po
                                           adresi, tko zna tuđu adresu mogao
                                           ju je zaključati
            račun             50 / sat     isti račun s mnogo IP adresa, što
                                           par ne vidi jer je svaki par nov;
                                           SAMO ZAPISUJE, ne odbija
            stroj             30 / 15 min  mnogo računa s jednog stroja, što
                                           par ne vidi jer svaka adresa ima
                                           svoju kvotu

          Redoslijed nije slučajan. Najuži brojač ide prvi i, ako odbije,
          vraća se odmah — pokušaj koji je on zaustavio ne smije trošiti ni
          kvotu računa ni kvotu stroja. Inače bi netko tko u dvorani uporno
          pogađa jedan račun potrošio zajedničku kvotu te mreže i izbacio sve
          ostale s tog wi-fija.

          Neuspjeli pokušaj se broji jednako kao uspjeli, jer upravo njih ima
          puno kad netko pogađa lozinku.
        */
        const ip = await adresaPrijave(req);

        const poParu = await checkRateLimit("prijava", kljucPrijave(email, ip ?? ADRESA_NEPOZNATA));
        if (!poParu.allowed) return null;

        // Svjesna odluka: brojač po računu ne zaključava, samo javlja. Zašto
        // i što to košta piše uz prijavaRacun u rate-limit-rules.ts.
        // Zapisuje se trenutak prelaska praga, a ne svaki pokušaj iznad
        // njega, da raspršeni napad ne zatrpa log.
        const poRacunu = await checkRateLimit("prijavaRacun", email);
        if (poRacunu.allowed && poRacunu.remaining === 0) {
          console.warn(
            `[prijava] račun ${email} je u zadnjih sat vremena dobio ` +
              `${RATE_LIMITS.prijavaRacun.limit} pokušaja prijave s više IP ` +
              "adresa — moguće raspršeno pogađanje lozinke. Prijava se ne blokira.",
          );
        }

        // Bez poznatog IP-a se ovaj brojač preskače. Da se umjesto adrese
        // upisivala zajednička oznaka, svi neprepoznati dijelili bi jedan
        // brojač od 30 i prvih trideset pokušaja zaključalo bi prijavu
        // cijeloj stranici — tiho, jer ništa ne bi puklo.
        if (ip !== null) {
          const poStroju = await checkRateLimit("prijavaIp", ip);
          if (!poStroju.allowed) return null;
        }

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
         * takva sesija dosad živjela.
         *
         * Token izdan prije ove izmjene nema `prijavljenOd`, pa se računa kao
         * najstariji mogući (0). Prvo sam ga ostavljao na miru „da promjena
         * nikoga ne izbaci bez razloga", ali taj razlog ne stoji:
         * sessionsValidFrom je prazan svima dok sami ne resetiraju lozinku,
         * pa se poništava samo onome kome je to i cilj — a upravo je stara
         * sesija ono što je napadač mogao preuzeti prije ove izmjene.
         */
        const prijavljenOd =
          typeof token.prijavljenOd === "number" ? token.prijavljenOd : 0;
        if (
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
