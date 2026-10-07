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
  /**
   * Odličja. Zlato je gold iz palete, srebro je navy s prozirnošću, a bronca
   * je jedina boja koja nije izvedena iz grba — nema je čime zamijeniti, a
   * bez nje se treće mjesto ne razlikuje od ostalih.
   *
   * Stoje ovdje jer ih dijele dva mjesta: medaljica na turniru i profilu
   * (medal-disc.tsx) i rang-bedž na ljestvici. Dok su bile upisane rukom u
   * medal-disc, drugo mjesto ih nije moglo koristiti bez prepisivanja hexa.
   */
  medalja: {
    bronca: "#B06A2C",
    "bronca-tekst": "#8A4F1D",
  },
} as const;

/**
 * Dvije nijanse sporednog teksta, i nijedna više.
 *
 * Prije ih je bilo pet (text-ink/60, /65, /70, /75, /80). Razlika između
 * susjednih se ne primjećuje, a pri svakoj novoj komponenti trebalo je
 * nagađati koja je "prava". Sada su imenovane: muted za sve sporedno,
 * subtle za ono što treba biti nešto čitljivije (legende, pomoćni tekst uz
 * podatak).
 *
 * Zapisane su s prozirnošću, ne kao pune boje, jer stoje i na papiru i na
 * bijelom, pa moraju raditi na oba. Izmjereni kontrast: muted 4,74:1 na
 * bijelom i 4,59:1 na papiru, subtle 8,06:1 i 7,70:1 — sve iznad 4,5:1
 * koliko WCAG traži za tekst. Niže od 0,6 se ne smije ići.
 */
export const TEKST = {
  muted: "rgb(22 22 22 / 0.6)",
  subtle: "rgb(22 22 22 / 0.75)",
} as const;
