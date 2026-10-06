import { prisma } from "@/lib/prisma";
import {
  buildPlayerStanding,
  minuteIzVremena,
  poredajAkademiju,
  type AkademijaTournamentResult,
} from "@/lib/scoring/akademija/standings";

export type AkademijaStandingRow = {
  player: {
    id: string;
    firstName: string;
    lastName: string;
    title: string;
    isClubMember: boolean;
  };
  total: number;
  countedResults: AkademijaTournamentResult[];
  allResults: AkademijaTournamentResult[];
  /** Mjesto kako se objavljuje — jednako za igrače koji ga dijele (čl. 15). */
  place: number;
  /** Dijeli li ovo mjesto s nekim. */
  sharedPlace: boolean;
};

/**
 * Dohvaća i sastavlja konačni poredak GP Akademije za zadanu sezonu (čl. 14).
 *
 * Pravo na bodove (čl. 3) NE provjerava se ovdje, i to je namjerno: utvrđuje
 * se i zaključava pri unosu rezultata (resolveAcademyEligibility), pa igrač
 * bez prava ima gpPoints = null. Ljestvica takav zapis broji kao 0, pa on na
 * njoj stoji s nula bodova. Dogovoreno je da to ostaje kako je: igrače
 * starije od granice ili s rapidom iznad 1600 na prvom nastupu Klub na
 * turnire Akademije ne prima, pa stanje u praksi ne nastaje. Prijave takvih
 * igrača odbija checkEligibility (lib/scoring/eligibility.ts).
 */
export async function getAkademijaStandings(
  seasonId: string
): Promise<AkademijaStandingRow[] | null> {
  const season = await prisma.season.findUnique({
    where: { id: seasonId },
    include: {
      tournaments: {
        // Kronološki, da redoslijed ne dolazi iz baze. Komparator na njega
        // više ne računa (vidi kriterij 5), ali nepredvidiv redoslijed nema
        // nikakvu vrijednost.
        orderBy: { date: "asc" },
        include: {
          results: {
            where: { gamesPlayed: true },
            include: { player: true },
          },
        },
      },
    },
  });

  if (!season || season.system !== "AKADEMIJA") return null;

  const playerMap = new Map<
    string,
    {
      player: AkademijaStandingRow["player"];
      results: AkademijaTournamentResult[];
    }
  >();

  for (const t of season.tournaments) {
    for (const r of t.results) {
      // čl. 4 — članstvo NA DAN TURNIRA, ne trenutno stanje.
      if (!r.wasClubMember) continue;

      const entry = playerMap.get(r.playerId) ?? {
        player: {
          isClubMember: r.player.isClubMember,
          id: r.player.id,
          firstName: r.player.firstName,
          lastName: r.player.lastName,
          title: r.player.title,
        },
        results: [],
      };
      entry.results.push({
        tournamentId: t.id,
        dan: t.date.getTime(),
        pocetak: minuteIzVremena(t.startTime),
        isFinal: t.isFinal,
        gpPoints: r.gpPoints ?? 0,
        rank: r.rank,
        wasFirstPlace: r.rank === 1,
      });
      playerMap.set(r.playerId, entry);
    }
  }

  type BezMjesta = Omit<AkademijaStandingRow, "place" | "sharedPlace">;
  const standings: BezMjesta[] = Array.from(
    playerMap.entries()
  ).map(([playerId, { player, results }]) => {
    const built = buildPlayerStanding(playerId, results);
    return { player, ...built };
  });

  // Poredak I mjesta dolaze iz poredajAkademiju: kriterij 5 nije tranzitivan,
  // pa obično sortiranje ne bi dalo ni stabilan poredak ni ispravna dijeljena
  // mjesta (čl. 15 st. 6).
  return poredajAkademiju(standings, (a, b) => {
    // Prezime i ime, pa id kao zadnji ključ: dva igrača istog imena nisu
    // rijetkost u klubu, a bez njega bi im redoslijed opet bio nedefiniran.
    const po = (x: typeof a) =>
      `${x.player.lastName} ${x.player.firstName}`;
    const imena = po(a).localeCompare(po(b), "hr");
    return imena !== 0 ? imena : a.player.id.localeCompare(b.player.id);
  }).map(({ entry, mjesto, dijeljeno }) => ({
    ...entry,
    place: mjesto,
    sharedPlace: dijeljeno,
  }));
}
