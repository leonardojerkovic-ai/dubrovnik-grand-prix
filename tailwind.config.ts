import type { Config } from "tailwindcss";

/**
 * Dizajn tokeni — Dubrovnik Grand Prix
 * Paleta izvedena iz grba kluba (šahovnica u hrvatskim bojama, plavi obruč).
 */
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#0B2A5B", // primarna — tekst na svijetlom, pozadine kartica
          dark: "#071D40",
          light: "#12386F",
        },
        sky: {
          DEFAULT: "#6FA8DC", // sekundarna — pozadine sekcija, badge-ovi
          light: "#DCEBFA",
        },
        crimson: "#C41E3A", // šahovnica akcent — natjecateljska razina, upozorenja
        gold: {
          DEFAULT: "#D4A93A", // Grand Prix akcent — istaknuti elementi, medalje
          light: "#F0D98C",
        },
        paper: "#F7F6F2", // pozadina stranice
        ink: "#161616", // primarni tekst
        academy: "#1F5C3F", // zelena vrpca — vizualno razlikuje GP Akademije od glavnog GP-a
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      backgroundImage: {
        "checker-pattern":
          "repeating-conic-gradient(#0B2A5B 0% 25%, transparent 0% 50%)",
      },
    },
  },
  plugins: [],
};

export default config;
