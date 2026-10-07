/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  // Type-checking i ESLint namjerno NISU isključeni. Ranije su se
  // preskakali jer je build zapinjao, ali uzrok su bile stvarne greške
  // tipova (8 njih u 6 datoteka) koje su u međuvremenu popravljene.
  // Ako build ovdje padne, to je signal da nešto stvarno ne valja —
  // popravi grešku umjesto da vratiš ignoriranje.
  //
  // Prije pusha lokalno: `npm run typecheck` i `npm run test`.

  /**
   * Sigurnosna zaglavlja.
   *
   * Vercel ih sam ne dodaje, a stranica ima prijavu, admin sučelje i
   * poveznicu za reset lozinke u kojoj je token dio putanje.
   *
   * CSP namjerno NIJE ovdje: Next ubacuje vlastite inline skripte, pa bi
   * ispravan CSP tražio nonce kroz middleware i lako bi se razišao s
   * Vercelovim skriptama. To je zaseban posao, ne jednoredna zakrpa.
   *
   * HSTS također nije: Vercel i tako preusmjerava na HTTPS, a
   * max-age s includeSubDomains veže i poddomene koje možda nemaju
   * certifikat. Uvodi se kad se zna popis poddomena.
   */
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Stranica se ne smije ugraditi u tuđi okvir — time otpada
          // clickjacking, gdje korisnik misli da klika na nešto drugo.
          { key: "X-Frame-Options", value: "DENY" },
          // I moderni ekvivalent istoga, koji X-Frame-Options zamjenjuje.
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
          // Preglednik ne smije pogađati tip sadržaja mimo onoga što smo
          // rekli; inače se podmetnuta datoteka može izvršiti kao skripta.
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Kod odlaska na tuđu stranicu šalje se samo ime naše domene, bez
          // putanje. Bitno jer je token za reset lozinke dio putanje
          // (/resetiraj-lozinku/<token>).
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Ništa od ovoga stranici ne treba, pa neka ne može ni tražiti.
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
