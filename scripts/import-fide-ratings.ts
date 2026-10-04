/**
 * Uvoz mjesečnih FIDE rejtinga.
 *
 * Dva izvora istih podataka:
 *
 *   --izvor=lichess  (zadano)  Lichessov FIDE API, jedan poziv po igraču.
 *                              Radi svugdje, pa i s GitHubovih poslužitelja.
 *   --izvor=fide                Službene FIDE liste, zip od 7–13 MB po tempu.
 *                              FIDE odbija promet iz podatkovnih centara, pa
 *                              ovo radi samo s kućnog priključka.
 *
 * Lichess je izvedeni izvor — iste te liste povlači sam. Put do izvornika
 * namjerno ostaje, za slučaj da Lichess ukine endpoint ili da treba
 * provjeriti koja je brojka prava.
 *
 * Pokretanje:
 *   npm run fide:import                      — sva tri tempa, preko Lichessa
 *   npm run fide:import -- --dry-run         — bez upisa u bazu
 *   npm run fide:import -- --type=RAPID
 *   npm run fide:import -- --date=2026-10-01
 *   npm run fide:import -- --izvor=fide      — sa službenih lista, lokalno
 *   npm run fide:import -- --usporedi        — usporedi oba izvora, bez upisa
 */

import { unzipSync } from "fflate";
import { PrismaClient } from "@prisma/client";
import {
  extractPlayers,
  ratingListUrl,
  type FideRatingType,
} from "../lib/fide/parse-rating-list";
import {
  dohvatiIgraca,
  rejtinziIzOdgovora,
  type RejtinziPoTempu,
} from "../lib/fide/lichess";

const prisma = new PrismaClient();

const ALL_TYPES: FideRatingType[] = ["STANDARD", "RAPID", "BLITZ"];

/** Datum liste — prvi dan tekućeg mjeseca, u ponoć UTC. */
function currentListDate(now: Date = new Date()): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

/**
 * Od kojeg se dana u mjesecu datum liste više ne smije pogađati.
 *
 * FIDE objavljuje listu za idući mjesec nekoliko dana prije njegova
 * početka. Tko uvoz pokrene 29. rujna preuzme LISTOPADSKU listu, a skripta
 * bi je datirala kao rujansku i time pregazila vrijednosti po kojima su
 * računati F_R (čl. 24) i kategorije (čl. 22) za sve odigrano u rujnu.
 *
 * Šteta se ne vidi — brojevi u bazi ostanu razumni, samo su krivi. Zato se
 * u tom razdoblju datum mora navesti izričito.
 */
const DAN_OD_KOJEG_SE_PITA = 25;

function citajDatumListe(args: string[], now: Date = new Date()): Date {
  const zadano = args.find((a) => a.startsWith("--date="))?.split("=")[1];

  if (zadano) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(zadano)) {
      throw new Error(`Datum „${zadano}" nije oblika GGGG-MM-DD.`);
    }
    const datum = new Date(`${zadano}T00:00:00.000Z`);
    if (Number.isNaN(datum.getTime())) {
      throw new Error(`Datum „${zadano}" ne postoji.`);
    }
    return datum;
  }

  if (now.getUTCDate() >= DAN_OD_KOJEG_SE_PITA) {
    const tekuci = currentListDate(now);
    const sljedeci = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)
    );
    const iso = (d: Date) => d.toISOString().slice(0, 10);

    throw new Error(
      [
        `Danas je ${iso(now)}, a FIDE listu za idući mjesec objavljuje prije`,
        "njegova početka. Ne mogu znati koju si listu preuzeo, pa datum",
        "navedi izričito:",
        "",
        `    npm run fide:import -- --date=${iso(sljedeci)}   (lista za idući mjesec)`,
        `    npm run fide:import -- --date=${iso(tekuci)}   (lista za tekući mjesec)`,
        "",
        "Pogrešan datum pregazi vrijednosti po kojima su već računati bodovi.",
      ].join("\n")
    );
  }

  return currentListDate(now);
}

/**
 * Čita raspakiranu datoteku red po red bez sastavljanja jednog golemog
 * teksta u memoriji — liste imaju preko milijun redaka.
 */
function* iterateLines(bytes: Uint8Array): Generator<string> {
  const decoder = new TextDecoder("latin1");
  let start = 0;
  for (let i = 0; i < bytes.length; i++) {
    if (bytes[i] === 0x0a) {
      yield decoder.decode(bytes.subarray(start, i)).replace(/\r$/, "");
      start = i + 1;
    }
  }
  if (start < bytes.length) {
    yield decoder.decode(bytes.subarray(start)).replace(/\r$/, "");
  }
}

/**
 * Razmotava lanac uzroka koji `fetch` skriva.
 *
 * Kad veza ne uspije, Node baci Error s porukom „fetch failed", a pravi
 * razlog — istek vremena, odbijena veza, greška u TLS-u, DNS — stoji u
 * `cause`, po potrebi u više razina. Bez ovoga zapisnik zadatka kaže samo
 * da nije uspjelo, što nije dovoljno ni za jednu odluku.
 */
function opisiGresku(err: unknown): string {
  const dijelovi: string[] = [];
  let trenutni: unknown = err;

  for (let dubina = 0; dubina < 5 && trenutni instanceof Error; dubina++) {
    const kod = (trenutni as { code?: string }).code;
    dijelovi.push(kod ? `${trenutni.message} (${kod})` : trenutni.message);
    trenutni = (trenutni as { cause?: unknown }).cause;
  }

  return dijelovi.join(" ← ");
}

const POKUSAJA = 3;
const CEKANJE_MS = 15_000;
/** FIDE liste su 7–13 MB; runneru zna trebati i pola minute. */
const ISTEK_MS = 120_000;

async function dohvatiUzPonavljanje(url: string): Promise<Response> {
  let zadnja: unknown;

  for (let pokusaj = 1; pokusaj <= POKUSAJA; pokusaj++) {
    try {
      const res = await fetch(url, {
        headers: {
          // FIDE poslužitelj zna odbiti vezu bez uobičajenih zaglavlja.
          "User-Agent":
            "Mozilla/5.0 (compatible; SK-Dubrovnik-GP/1.0; +https://www.dubrovnikgrandprix.com)",
          Accept: "application/zip, application/octet-stream, */*",
        },
        signal: AbortSignal.timeout(ISTEK_MS),
      });
      if (!res.ok) {
        throw new Error(`FIDE je vratio ${res.status} ${res.statusText}`);
      }
      return res;
    } catch (err) {
      zadnja = err;
      console.log(`  pokušaj ${pokusaj}/${POKUSAJA} nije uspio: ${opisiGresku(err)}`);
      if (pokusaj < POKUSAJA) {
        await new Promise((r) => setTimeout(r, CEKANJE_MS * pokusaj));
      }
    }
  }

  throw new Error(
    `Preuzimanje ${url} nije uspjelo nakon ${POKUSAJA} pokušaja: ${opisiGresku(zadnja)}`
  );
}

async function downloadList(type: FideRatingType): Promise<Uint8Array> {
  const url = ratingListUrl(type);
  console.log(`  preuzimam ${url}`);

  const res = await dohvatiUzPonavljanje(url);

  const zipped = new Uint8Array(await res.arrayBuffer());
  console.log(`  preuzeto ${(zipped.length / 1024 / 1024).toFixed(1)} MB`);

  const files = unzipSync(zipped);
  const names = Object.keys(files);
  if (names.length === 0) {
    throw new Error(`Arhiva ${url} je prazna.`);
  }

  const content = files[names[0]!]!;
  console.log(
    `  raspakirano ${names[0]} (${(content.length / 1024 / 1024).toFixed(1)} MB)`
  );
  return content;
}

export type Izvor = "lichess" | "fide";

/** Rejtinzi svih igrača, po FIDE ID-u. */
type Prikupljeno = Map<string, RejtinziPoTempu>;

/** Pristojan razmak između poziva Lichessu. */
const RAZMAK_MS = 250;

function prazno(): RejtinziPoTempu {
  return { STANDARD: null, RAPID: null, BLITZ: null };
}

/**
 * Lichess daje sva tri tempa u jednom odgovoru, pa se prolazi JEDNOM kroz
 * igrače umjesto jednom po tempu.
 */
async function sLichessa(fideIds: string[]): Promise<Prikupljeno> {
  const prikupljeno: Prikupljeno = new Map();
  let nepronadenih = 0;

  console.log(`\nDohvaćam s Lichessa (${fideIds.length} igrača)…`);

  for (const fideId of fideIds) {
    const igrac = await dohvatiIgraca(fideId, {
      naPredah: (s) => console.log(`  Lichess traži predah, čekam ${s} s…`),
    });

    if (!igrac) {
      nepronadenih++;
      prikupljeno.set(fideId, prazno());
    } else {
      prikupljeno.set(fideId, rejtinziIzOdgovora(igrac));
    }

    await new Promise((r) => setTimeout(r, RAZMAK_MS));
  }

  if (nepronadenih > 0) {
    console.log(
      `  nije pronađeno ${nepronadenih} igrača — redovito su to oni koji još nisu ni na jednoj FIDE listi`
    );
  }

  return prikupljeno;
}

/** Službene liste: jedan zip po tempu, pa izdvajanje naših igrača. */
async function sFideListi(
  fideIds: string[],
  types: FideRatingType[]
): Promise<Prikupljeno> {
  const prikupljeno: Prikupljeno = new Map(fideIds.map((id) => [id, prazno()]));
  const trazeni = new Set(fideIds);

  for (const type of types) {
    console.log(`\n[${type}]`);
    const content = await downloadList(type);
    const nadeni = extractPlayers(iterateLines(content), trazeni, type);
    console.log(`  pronađeno ${nadeni.size} od ${trazeni.size} igrača`);

    for (const [fideId, rejting] of nadeni) {
      const zapis = prikupljeno.get(fideId);
      if (zapis) zapis[type] = rejting;
    }
  }

  return prikupljeno;
}

async function prikupi(
  izvor: Izvor,
  fideIds: string[],
  types: FideRatingType[]
): Promise<Prikupljeno> {
  return izvor === "lichess"
    ? sLichessa(fideIds)
    : sFideListi(fideIds, types);
}

async function upisiTempo(
  type: FideRatingType,
  prikupljeno: Prikupljeno,
  byFideId: Map<string, string>,
  listDate: Date,
  dryRun: boolean
): Promise<number> {
  const column = {
    STANDARD: "standard",
    RAPID: "rapid",
    BLITZ: "blitz",
  }[type] as "standard" | "rapid" | "blitz";

  let written = 0;
  let bezRejtinga = 0;

  for (const [fideId, playerId] of byFideId) {
    const rating = prikupljeno.get(fideId)?.[type] ?? null;
    if (rating === null) {
      bezRejtinga++;
      continue;
    }

    if (dryRun) {
      console.log(`  [probno] ${fideId} -> ${rating}`);
      written++;
      continue;
    }

    await prisma.$transaction([
      prisma.playerRatingCurrent.upsert({
        where: { playerId },
        create: { playerId, [column]: rating },
        update: { [column]: rating },
      }),
      // Ponovno pokretanje ne smije stvoriti duplikat — otud upsert.
      prisma.playerRatingSnapshot.upsert({
        where: {
          playerId_ratingType_snapshotDate: {
            playerId,
            ratingType: type,
            snapshotDate: listDate,
          },
        },
        create: {
          playerId,
          ratingType: type,
          ratingValue: rating,
          snapshotDate: listDate,
        },
        update: { ratingValue: rating },
      }),
    ]);
    written++;
  }

  console.log(
    `  ${type}: upisano ${written}, bez rejtinga u tom tempu ${bezRejtinga}`
  );
  return written;
}

/**
 * Uspoređuje oba izvora i ispisuje samo ono što se razlikuje.
 *
 * Lichess je izvedeni izvor i zna odstupiti od službene liste. Poznat
 * slučaj: igraču kojemu je FIDE povukao rejting Lichess je vrijednost i
 * dalje vraćao. Razlika je bila mala, ali kriva vrijednost ulazi u F_R
 * (čl. 24) i rejtinšku kategoriju (čl. 22) jednako kao i ispravna.
 *
 * Ništa ne upisuje. Traži službene liste, pa radi samo s kućnog priključka.
 */
async function usporedi(
  imena: Map<string, string>,
  types: FideRatingType[]
): Promise<void> {
  const fideIds = [...imena.keys()];

  const sLichessaPodaci = await sLichessa(fideIds);
  const sFidePodaci = await sFideListi(fideIds, types);

  const razlike: {
    ime: string;
    tempo: FideRatingType;
    lichess: number | null;
    fide: number | null;
  }[] = [];

  for (const fideId of fideIds) {
    for (const tempo of types) {
      const lichess = sLichessaPodaci.get(fideId)?.[tempo] ?? null;
      const fide = sFidePodaci.get(fideId)?.[tempo] ?? null;
      if (lichess !== fide) {
        razlike.push({ ime: imena.get(fideId) ?? fideId, tempo, lichess, fide });
      }
    }
  }

  const ukupno = fideIds.length * types.length;
  console.log(`\nUsporedio ${ukupno} vrijednosti (${fideIds.length} igrača × ${types.length} tempa).`);

  if (razlike.length === 0) {
    console.log("Izvori se poklapaju u svemu.");
    return;
  }

  const prazno = (x: number | null) => (x === null ? "—" : String(x));

  console.log(`\nRAZLIKA: ${razlike.length}\n`);
  console.log("  igrač                          tempo      Lichess   FIDE");
  console.log("  " + "-".repeat(62));
  for (const r of razlike.sort((a, b) => a.ime.localeCompare(b.ime, "hr"))) {
    console.log(
      `  ${r.ime.padEnd(30).slice(0, 30)} ${r.tempo.padEnd(10)} ` +
        `${prazno(r.lichess).padStart(7)}   ${prazno(r.fide).padStart(5)}`
    );
  }
  console.log(
    "\nMjerodavna je službena lista. Gdje se razlikuju, uvezi s --izvor=fide."
  );
}

/**
 * Zastavice koje skripta poznaje.
 *
 * Nepoznata se ODBIJA, ne preskače. Tiho preskakanje znači da skripta radi
 * nešto drugo nego što je traženo, i to bez ijedne riječi: zastavica
 * --usporedi, upisana prije nego je uvedena, pokrenula je pravi uvoz i
 * upisala vrijednosti u bazu.
 */
const POZNATE_ZASTAVICE = [
  "--dry-run",
  "--usporedi",
  "--type=",
  "--date=",
  "--izvor=",
];

function provjeriZastavice(args: string[]): void {
  const nepoznate = args.filter(
    (a) => !POZNATE_ZASTAVICE.some((z) => (z.endsWith("=") ? a.startsWith(z) : a === z))
  );

  if (nepoznate.length > 0) {
    throw new Error(
      [
        `Nepoznata zastavica: ${nepoznate.join(", ")}`,
        "",
        "Dopušteno:",
        "  --dry-run              bez upisa u bazu",
        "  --usporedi             usporedi oba izvora, bez upisa",
        "  --type=STANDARD        samo jedan tempo",
        "  --date=GGGG-MM-DD      datum liste",
        "  --izvor=lichess|fide   odakle se povlači",
        "",
        "Ništa nije upisano.",
      ].join("\n")
    );
  }
}

async function main() {
  const args = process.argv.slice(2);
  provjeriZastavice(args);
  const dryRun = args.includes("--dry-run");
  const typeArg = args.find((a) => a.startsWith("--type="))?.split("=")[1];
  const samoUsporedi = args.includes("--usporedi");
  const izvorArg = args.find((a) => a.startsWith("--izvor="))?.split("=")[1];
  const izvor: Izvor = (izvorArg ?? "lichess").toLowerCase() as Izvor;

  if (izvor !== "lichess" && izvor !== "fide") {
    throw new Error(`Nepoznat izvor: ${izvorArg}. Dopušteno: lichess, fide.`);
  }

  const types = typeArg
    ? [typeArg.toUpperCase() as FideRatingType]
    : ALL_TYPES;

  if (types.some((t) => !ALL_TYPES.includes(t))) {
    throw new Error(`Nepoznat tempo: ${typeArg}. Dopušteno: ${ALL_TYPES.join(", ")}`);
  }

  const listDate = citajDatumListe(args);
  console.log(
    `Uvoz FIDE rejtinga za ${listDate.toISOString().slice(0, 10)}` +
      ` — izvor: ${izvor === "lichess" ? "Lichess" : "službene FIDE liste"}` +
      (dryRun ? " (probno, bez upisa)" : "")
  );

  const players = await prisma.player.findMany({
    where: { fideId: { not: null } },
    select: { id: true, fideId: true, firstName: true, lastName: true },
  });

  const withId = players.filter(
    (p): p is {
      id: string;
      fideId: string;
      firstName: string;
      lastName: string;
    } => Boolean(p.fideId)
  );

  if (withId.length === 0) {
    console.log("Nema igrača s upisanim FIDE ID-om — nema se što uvesti.");
    return;
  }
  console.log(`Igrača s FIDE ID-om: ${withId.length}`);

  const byFideId = new Map<string, string>();
  for (const igrac of withId) byFideId.set(igrac.fideId, igrac.id);

  if (samoUsporedi) {
    const imena = new Map<string, string>();
    for (const igrac of withId) {
      imena.set(igrac.fideId, `${igrac.lastName} ${igrac.firstName}`);
    }
    await usporedi(imena, types);
    return;
  }
  const prikupljeno = await prikupi(izvor, [...byFideId.keys()], types);

  console.log("");
  let total = 0;
  for (const type of types) {
    total += await upisiTempo(type, prikupljeno, byFideId, listDate, dryRun);
  }

  if (!dryRun && total > 0) {
    await prisma.auditLog.create({
      data: {
        actorEmail: "sustav@github-actions",
        actorRole: "SYSTEM",
        action: "UPDATE",
        entity: "PlayerRating",
        summary: `Automatski uvoz FIDE rejtinga (${types.join(", ")}, izvor ${izvor}): ${total} vrijednosti`,
        after: { listDate: listDate.toISOString(), types, izvor, written: total },
      },
    });
  }

  console.log(`\nGotovo. Upisanih vrijednosti: ${total}`);
}

main()
  .catch((err) => {
    console.error("\nUvoz nije uspio:", opisiGresku(err) || String(err));
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
