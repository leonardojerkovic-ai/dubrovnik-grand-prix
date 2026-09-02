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
};

export default nextConfig;
