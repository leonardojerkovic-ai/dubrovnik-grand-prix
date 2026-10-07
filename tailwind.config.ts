import type { Config } from "tailwindcss";
import { BOJE } from "./lib/design-tokens";

/**
 * Dizajn tokeni — Dubrovnik Grand Prix
 *
 * Boje stoje u lib/design-tokens.ts da ih može čitati i kod koji ne ide
 * kroz Tailwind (SVG atributi u grafu rejtinga).
 */
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: BOJE,
      /**
       * Najmanja veličina teksta na stranici je text-xs (12 px). Ispod toga
       * se u kombinaciji s uppercase, tracking i text-ink/60 na mobitelu
       * teško čita, pa se text-[10px] i text-[11px] ne koriste.
       */
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
