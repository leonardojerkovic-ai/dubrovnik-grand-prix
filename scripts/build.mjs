// Build za Vercel i lokalno. Ponašanje ovisi o okolini:
//
//  - production (VERCEL_ENV=production): primijeni migracije, pa generiraj
//    klijenta i izgradi aplikaciju. Migracija ide prije builda, pa ako padne,
//    deployment padne i nova verzija ne ide živa.
//
//  - sve ostalo (preview, lokalni razvoj): samo provjeri jesu li migracije
//    primijenjene. Preview gleda u produkcijsku bazu (nema zasebne), pa on
//    NIKAD sam ne primjenjuje migracije: inače bi prva izgradnja bilo koje
//    grane mijenjala produkcijsku shemu prije nego je itko pogleda.
//    Migraciju primjenjuje čovjek, svjesno, pa ponovo pokreće deployment.
//
// Vidi docs/odluke.md o tome zašto migracije moraju biti kompatibilne unatrag.

import { execSync } from "node:child_process";

// console.log je u ovom projektu upozorenje u lintu; za ispis koristimo stdout.
const info = (...poruke) => process.stdout.write(poruke.join(" ") + "\n");

const okolina = process.env.VERCEL_ENV;
const jeProdukcija = okolina === "production";

function pokreni(naredba) {
  info(`\n> ${naredba}`);
  execSync(naredba, { stdio: "inherit" });
}

function provjeriMigracije() {
  if (!process.env.DATABASE_URL) {
    // Lokalno bez .env-a nema s čime provjeriti; build ostaje upotrebljiv.
    info(
      "\nPreskačem provjeru migracija: DATABASE_URL nije postavljen."
    );
    return;
  }

  info("\n> prisma migrate status");
  let izlaz = "";
  try {
    izlaz = execSync("npx prisma migrate status", {
      encoding: "utf8",
      stdio: "pipe",
    });
  } catch (greska) {
    const ispis = `${greska.stdout ?? ""}${greska.stderr ?? ""}`;
    if (ispis.includes("have not yet been applied")) {
      console.error(ispis);
      console.error(`
Build prekinut: u bazi ima neprimijenjenih migracija.

Preview ih ne primjenjuje sam, jer gleda u produkcijsku bazu. Da bi prva
izgradnja bilo koje grane sama mijenjala produkcijsku shemu, a nitko je nije
pogledao.

Što učiniti:
  1. Pregledaj migracije u prisma/migrations/ na ovoj grani.
  2. S vlastitog računala primijeni ih svjesno:
       npx prisma migrate deploy
     (uz DATABASE_URL i DIRECT_URL koji pokazuju na bazu koju želiš mijenjati)
  3. Ponovno pokreni deployment na Verceleu.
`);
      process.exit(1);
    }
    // Nešto drugo (npr. baza nedostupna) — ne skrivamo, nego prikazujemo.
    console.error(ispis);
    process.exit(1);
  }
  info(izlaz.trim());
}

if (jeProdukcija) {
  pokreni("npx prisma migrate deploy");
  pokreni("npx prisma generate");
  pokreni("npx next build");
} else {
  provjeriMigracije();
  pokreni("npx prisma generate");
  pokreni("npx next build");
}
