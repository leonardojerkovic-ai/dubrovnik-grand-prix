/**
 * Uvoz mjesečnih FIDE rejtinga.
 *
 * Pokreće se u GitHub Actions (.github/workflows/fide-ratings.yml), ne na
 * Vercelu: službene liste su 7–13 MB u zipu i preko milijun redaka, što je
 * previše za serverless funkciju s ograničenim trajanjem. Runner nema to
 * ograničenje, ispis je vidljiv u GitHub sučelju, a Vercel u tome ne sudjeluje.
 *
 * Pokretanje:
 *   npm run fide:import              — sva tri tempa
 *   npm run fide:import -- --dry-run — bez upisa u bazu
 *   npm run fide:import -- --type=RAPID
 */

import { unzipSync } from "fflate";
import { PrismaClient } from "@prisma/client";
import {
  extractPlayers,
  ratingListUrl,
  type FideRatingType,
} from "../lib/fide/parse-rating-list";

const prisma = new PrismaClient();

const ALL_TYPES: FideRatingType[] = ["STANDARD", "RAPID", "BLITZ"];

/** Datum liste — prvi dan tekućeg mjeseca, u ponoć UTC. */
function currentListDate(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
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

async function importType(
  type: FideRatingType,
  players: { id: string; fideId: string }[],
  listDate: Date,
  dryRun: boolean
): Promise<number> {
  console.log(`\n[${type}]`);

  const byFideId = new Map(players.map((p) => [p.fideId, p.id]));
  const content = await downloadList(type);
  const found = extractPlayers(
    iterateLines(content),
    new Set(byFideId.keys()),
    type
  );

  console.log(`  pronađeno ${found.size} od ${byFideId.size} igrača`);

  const column = {
    STANDARD: "standard",
    RAPID: "rapid",
    BLITZ: "blitz",
  }[type] as "standard" | "rapid" | "blitz";

  let written = 0;

  for (const [fideId, rating] of found) {
    const playerId = byFideId.get(fideId)!;
    if (rating === null) continue;

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

  const missing = [...byFideId.keys()].filter((id) => !found.has(id));
  if (missing.length > 0) {
    console.log(
      `  nije pronađeno na listi (vjerojatno neocijenjeni u ovom tempu): ${missing.join(", ")}`
    );
  }

  return written;
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const typeArg = args.find((a) => a.startsWith("--type="))?.split("=")[1];

  const types = typeArg
    ? [typeArg.toUpperCase() as FideRatingType]
    : ALL_TYPES;

  if (types.some((t) => !ALL_TYPES.includes(t))) {
    throw new Error(`Nepoznat tempo: ${typeArg}. Dopušteno: ${ALL_TYPES.join(", ")}`);
  }

  const listDate = currentListDate();
  console.log(
    `Uvoz FIDE rejtinga za ${listDate.toISOString().slice(0, 10)}${dryRun ? " (probno, bez upisa)" : ""}`
  );

  const players = await prisma.player.findMany({
    where: { fideId: { not: null } },
    select: { id: true, fideId: true },
  });

  const withId = players.filter(
    (p): p is { id: string; fideId: string } => Boolean(p.fideId)
  );

  if (withId.length === 0) {
    console.log("Nema igrača s upisanim FIDE ID-om — nema se što uvesti.");
    return;
  }
  console.log(`Igrača s FIDE ID-om: ${withId.length}`);

  let total = 0;
  for (const type of types) {
    total += await importType(type, withId, listDate, dryRun);
  }

  if (!dryRun && total > 0) {
    await prisma.auditLog.create({
      data: {
        actorEmail: "sustav@github-actions",
        actorRole: "SYSTEM",
        action: "UPDATE",
        entity: "PlayerRating",
        summary: `Automatski uvoz FIDE rejtinga (${types.join(", ")}): ${total} vrijednosti`,
        after: { listDate: listDate.toISOString(), types, written: total },
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
