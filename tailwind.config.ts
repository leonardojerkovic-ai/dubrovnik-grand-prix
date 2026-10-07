import type { Config } from "tailwindcss";
import { BOJE, TEKST } from "./lib/design-tokens";

/**
 * Dizajn tokeni — Dubrovnik Grand Prix
 *
 * Boje stoje u lib/design-tokens.ts da ih može čitati i kod koji ne ide
 * kroz Tailwind (SVG atributi u grafu rejtinga).
 *
 * Najmanja veličina teksta je text-xs (12 px) — ispod toga se uz uppercase,
 * tracking i text-ink/60 na mobitelu teško čita. Pravilo ne stoji ovdje kao
 * dogovor nego ga provodi test lib/dizajn/velicina-teksta.test.ts, koji svaku
 * proizvoljnu veličinu pretvori u piksele, pa hvata i rem zapis. U SVG-u
 * (fontSize atribut) ni on ne pomaže, pa tamo vrijedi pažnja.
 */
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: BOJE,
      /**
       * Sporedni tekst ima dvije nijanse, muted i subtle, i stoje samo među
       * text-* klasama — pozadina ili obrub u njima nema smisla.
       */
      textColor: TEKST,
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        // Serif, samo za naslov na naslovnici.
        hero: ["var(--font-hero)", "Georgia", "serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      backgroundImage: {
        "checker-pattern": `repeating-conic-gradient(${BOJE.navy.DEFAULT} 0% 25%, transparent 0% 50%)`,
      },
    },
  },
  plugins: [],
};

export default config;
