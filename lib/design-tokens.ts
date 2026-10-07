/**
 * Boje dizajn sustava — jedno mjesto istine.
 *
 * Paleta je izvedena iz grba kluba (šahovnica u hrvatskim bojama, plavi
 * obruč). Tailwind config ih čita odavde, pa su iste vrijednosti dostupne i
 * kodu koji ne može koristiti Tailwind klase — SVG atributima u grafu
 * rejtinga. Dok su bile upisane rukom na više mjesta, promjena palete ih je
 * zaobilazila.
 *
 * Boje medalja (zlato, srebro, bronca u medal-disc.tsx) namjerno nisu
 * ovdje: one nisu dio palete stranice nego prikaz odličja.
 */
export const BOJE = {
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
} as const;
