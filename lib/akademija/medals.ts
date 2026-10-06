import { prisma } from "@/lib/prisma";
import {
  opisiRazlikeDodjele,
  type NacinDodjele,
} from "@/lib/dodjela/razlike";
import {
  assignMedals,
  medalEventForTournament,
  wasTransferred,
  type MedalCandidate,
} from "@/lib/scoring/akademija/medals";
import { getAkademijaAgeCategories } from "@/lib/scoring/akademija/categories";
import type { MedalCategory } from "@prisma/client";

/**
 * Izračun i spremanje medalja jednog turnira — čl. 19 Akademije.
 *
 * Zašto se sprema, a ne računa u letu: dodjela ovisi o CIJELOM poretku, jer
 * kategorijska medalja koja ostane slobodna prelazi na sljedećeg igrača.
 * Medalje se uz to fizički uručuju na dan turnira, pa zapis mora ostati
 * onakav kakav je te subote bio — naknadni ispravak jednog plasmana ne smije
 * tiho promijeniti tko je što već primio.
 *
 * Medalje postoje samo u Akademiji. Glavni GP pravilnik ih ne poznaje, pa se
 * za njegove turnire ne radi ništa.
 */
/**
 * `nacin` odlučuje smije li izračun promijeniti već dodijeljene medalje.
 *
 * "pri-unosu" — zove se iz spremanja rezultata. Ako automatske medalje za
 * ovaj turnir već postoje, one su ono što je na turniru uručeno, pa se NE
 * diraju: izračun se samo usporedi i razlike se vrate pozivatelju da ih
 * javi adminu. Ako medalja još nema, prvi izračun se primjenjuje — on i jest
 * ono što će se uručiti.
 *
 * "izricito" — admin je sam pritisnuo „Izračunaj medalje". Tada se primjenjuje
 * bez pitanja; to je svjesna odluka i stoji u auditu.
 */
export async function syncTournamentMedals(
  tournamentId: string,
  nacin: NacinDodjele = "izricito"
): Promise<{
  awarded: number;
  keptManual: number;
  /**
   * Razlike između uručenog i novog izračuna, kad je dodjela zamrznuta.
   * Prazno znači da izračun daje isto što je već dodijeljeno.
   */
  razlike: string[];
  /** Je li izračun samo uspoređen, bez upisa. */
  zamrznuto: boolean;
  skipped: "not-akademija" | "no-results" | null;
}> {
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: { season: true },
  });

  if (!tournament || tournament.season.system !== "AKADEMIJA") {
    return {
      awarded: 0,
      keptManual: 0,
      razlike: [],
      zamrznuto: false,
      skipped: "not-akademija",
    };
  }

  const results = await prisma.tournamentResult.findMany({
    where: { tournamentId, gamesPlayed: true },
    orderBy: { rank: "asc" },
    include: {
      player: { select: { id: true, birthYear: true, gender: true } },
    },
  });

  if (results.length === 0) {
    return {
      awarded: 0,
      keptManual: 0,
      razlike: [],
      zamrznuto: false,
      skipped: "no-results",
    };
  }

  const seasonStartYear = tournament.season.startDate.getFullYear();

  const ranking: MedalCandidate[] = results.map((r) => ({
    playerId: r.playerId,
    rank: r.rank,
    ageCategories: getAkademijaAgeCategories(
      r.player.birthYear,
      seasonStartYear
    ),
    isFemale: r.player.gender === "F",
  }));

  const computed = assignMedals(
    ranking,
    medalEventForTournament(tournament.isFinal)
  );

  // Ručno unesene medalje su odluka admina i ponovni izračun ih ne dira.
  // Automatski izračunata dodjela mora im se skloniti s puta: i mjesto u
  // kategoriji i sam igrač su zauzeti (čl. 19 st. 4 — jedan igrač, jedna
  // medalja), inače bi upis pao na parcijalne jedinstvene indekse.
  const manual = await prisma.medal.findMany({
    where: { tournamentId, manual: true },
  });
  const takenSlots = new Set(manual.map((m) => `${m.category}/${m.place}`));
  const takenPlayers = new Set(manual.map((m) => m.playerId));

  const toCreate = computed.filter(
    (a) =>
      !takenSlots.has(`${a.category}/${a.place}`) &&
      !takenPlayers.has(a.playerId)
  );

  // Što je već dodijeljeno automatski — to je ono što je na turniru uručeno.
  const dodijeljene = await prisma.medal.findMany({
    where: { tournamentId, manual: false },
    select: { category: true, place: true, playerId: true },
  });

  if (nacin === "pri-unosu" && dodijeljene.length > 0) {
    const razlike = await opisiRazlikeDodjele(
      dodijeljene.map((m) => ({
        kljuc: `${m.category}/${m.place}`,
        playerId: m.playerId,
      })),
      toCreate.map((a) => ({
        kljuc: `${a.category}/${a.place}`,
        playerId: a.playerId,
      }))
    );
    return {
      awarded: 0,
      keptManual: manual.length,
      razlike,
      zamrznuto: true,
      skipped: null,
    };
  }

  await prisma.$transaction([
    prisma.medal.deleteMany({ where: { tournamentId, manual: false } }),
    prisma.medal.createMany({
      data: toCreate.map((a) => ({
        seasonId: tournament.seasonId,
        tournamentId,
        playerId: a.playerId,
        category: a.category as MedalCategory,
        place: a.place,
        manual: false,
      })),
    }),
  ]);

  return {
    awarded: toCreate.length,
    keptManual: manual.length,
    razlike: [],
    zamrznuto: false,
    skipped: null,
  };
}



export interface TournamentMedalView {
  category: MedalCategory;
  place: number;
  playerId: string;
  playerName: string;
  /** Vodi li ime na profil — nečlanovima se profil ne objavljuje. */
  playerIsClubMember: boolean;
  manual: boolean;
  note: string | null;
  /** Medalja nije pripala prvom igraču svoje kategorije — vidi wasTransferred. */
  transferred: boolean;
}

/**
 * Medalje jednog turnira, pripremljene za prikaz. Uz svaku stoji je li
 * prenesena, jer se to iz tablice rezultata ne može iščitati.
 */
export async function getTournamentMedals(
  tournamentId: string
): Promise<TournamentMedalView[]> {
  const [tournament, medals] = await Promise.all([
    prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: { season: true },
    }),
    prisma.medal.findMany({
      where: { tournamentId },
      orderBy: [{ category: "asc" }, { place: "asc" }],
      include: {
        player: {
          select: { firstName: true, lastName: true, isClubMember: true },
        },
      },
    }),
  ]);

  if (!tournament || medals.length === 0) return [];

  const results = await prisma.tournamentResult.findMany({
    where: { tournamentId, gamesPlayed: true },
    orderBy: { rank: "asc" },
    include: {
      player: { select: { id: true, birthYear: true, gender: true } },
    },
  });

  const seasonStartYear = tournament.season.startDate.getFullYear();
  const ranking: MedalCandidate[] = results.map((r) => ({
    playerId: r.playerId,
    rank: r.rank,
    ageCategories: getAkademijaAgeCategories(
      r.player.birthYear,
      seasonStartYear
    ),
    isFemale: r.player.gender === "F",
  }));

  const rankOf = new Map<string, number>(
    results.map((r) => [r.playerId, r.rank])
  );

  return medals.map((m) => ({
    category: m.category,
    place: m.place,
    playerId: m.playerId,
    playerName: `${m.player.lastName} ${m.player.firstName}`,
    playerIsClubMember: m.player.isClubMember,
    manual: m.manual,
    note: m.note,
    transferred: wasTransferred(
      {
        playerId: m.playerId,
        category: m.category,
        place: m.place,
        rank: rankOf.get(m.playerId) ?? 0,
      },
      ranking
    ),
  }));
}

export interface PlayerMedalView {
  id: string;
  seasonLabel: string;
  /** Naziv turnira, ili prazno ako je riječ o medalji za konačni poredak. */
  tournamentName: string | null;
  tournamentId: string | null;
  category: MedalCategory;
  place: number;
}

/**
 * Sve medalje jednog igrača, najnovije prve — za vitrinu na profilu.
 * Poredak ide po datumu turnira; medalje za konačni poredak sezone nemaju
 * turnir pa dolaze na početak svoje sezone.
 */
export async function getPlayerMedals(
  playerId: string
): Promise<PlayerMedalView[]> {
  const medals = await prisma.medal.findMany({
    where: { playerId },
    include: {
      season: { select: { yearLabel: true } },
      tournament: { select: { id: true, name: true, date: true } },
    },
    orderBy: [{ seasonId: "desc" }, { place: "asc" }],
  });

  return medals
    .sort((a, b) => {
      const da = a.tournament?.date?.getTime() ?? Infinity;
      const db = b.tournament?.date?.getTime() ?? Infinity;
      if (da !== db) return db - da;
      return a.place - b.place;
    })
    .map((m) => ({
      id: m.id,
      seasonLabel: m.season.yearLabel,
      tournamentName: m.tournament?.name ?? null,
      tournamentId: m.tournament?.id ?? null,
      category: m.category,
      place: m.place,
    }));
}

/**
 * Izračun i spremanje medalja za KONAČNI POREDAK sezone — čl. 19 st. 3.
 *
 * Te medalje ne pripadaju nijednom turniru, pa se zapisuju s praznim
 * tournamentId. Parcijalni jedinstveni indeksi iz migracije ih zato drže
 * odvojeno od turnirskih: jedan igrač može imati i medalju s turnira i
 * medalju za konačni poredak, jer je riječ o dva odvojena "poretka" u
 * smislu čl. 19 st. 4.
 *
 * Pokreće se ručno, na kraju sezone — ne automatski pri svakom rezultatu,
 * jer konačni poredak ima smisla tek kad su svi turniri odigrani.
 */
export async function syncSeasonMedals(seasonId: string): Promise<{
  awarded: number;
  keptManual: number;
  /**
   * Medalje koje izračun NIJE dodijelio jer bi pripale igraču na dijeljenom
   * mjestu. Čl. 15 st. 6 kaže da takvi igrači dijele mjesto, a ne koji od
   * njih dobiva medalju — to odlučuje Klub, pa se dodjeljuje ručno.
   */
  unresolved: number;
  skipped: "not-akademija" | "no-standings" | null;
}> {
  const season = await prisma.season.findUnique({ where: { id: seasonId } });
  if (!season || season.system !== "AKADEMIJA") {
    return { awarded: 0, keptManual: 0, unresolved: 0, skipped: "not-akademija" };
  }

  const { getAkademijaStandings } = await import("@/lib/standings/akademija");
  const standings = await getAkademijaStandings(seasonId);

  if (!standings || standings.length === 0) {
    return { awarded: 0, keptManual: 0, unresolved: 0, skipped: "no-standings" };
  }

  const players = await prisma.player.findMany({
    where: { id: { in: standings.map((row) => row.player.id) } },
    select: { id: true, birthYear: true, gender: true },
  });
  const byId = new Map(players.map((p) => [p.id, p]));

  const seasonStartYear = season.startDate.getFullYear();

  // Redoslijed niza JE poredak — tie-break po čl. 15 već je primijenjen u
  // getAkademijaStandings, pa se ovdje ne smije ponovno sortirati. Mjesto se
  // uzima iz ljestvice (row.place), ne iz rednog broja u nizu: dijeljeno
  // mjesto ponavlja isti broj.
  const dijeliMjesto = new Map(
    standings.map((row) => [row.player.id, row.sharedPlace])
  );
  const ranking: MedalCandidate[] = standings.flatMap((row) => {
    const player = byId.get(row.player.id);
    if (!player) return [];
    return [
      {
        playerId: row.player.id,
        rank: row.place,
        ageCategories: getAkademijaAgeCategories(
          player.birthYear,
          seasonStartYear
        ),
        isFemale: player.gender === "F",
      },
    ];
  });

  const computed = assignMedals(ranking, "KONACNI_POREDAK");

  /**
   * Medalja igraču na dijeljenom mjestu se NE dodjeljuje automatski.
   *
   * Dosad je o tome odlučivao redoslijed u memoriji: dva igrača s potpuno
   * jednakim rezultatima prikazivala su se kao 3. i 4., a bronca je išla onome
   * koji je slučajno bio prvi u nizu. Čl. 15 st. 6 kaže samo da dijele mjesto,
   * ne i kome pripada medalja — pa to ostaje odluka Kluba, kroz ručnu dodjelu
   * (koja je zabilježena u auditu i nosi obrazloženje).
   */
  const nerazrijesene = computed.filter((a) => dijeliMjesto.get(a.playerId));

  const manual = await prisma.medal.findMany({
    where: { seasonId, tournamentId: null, manual: true },
  });
  const takenSlots = new Set(manual.map((m) => `${m.category}/${m.place}`));
  const takenPlayers = new Set(manual.map((m) => m.playerId));

  const toCreate = computed.filter(
    (a) =>
      !dijeliMjesto.get(a.playerId) &&
      !takenSlots.has(`${a.category}/${a.place}`) &&
      !takenPlayers.has(a.playerId)
  );

  await prisma.$transaction([
    prisma.medal.deleteMany({
      where: { seasonId, tournamentId: null, manual: false },
    }),
    prisma.medal.createMany({
      data: toCreate.map((a) => ({
        seasonId,
        tournamentId: null,
        playerId: a.playerId,
        category: a.category as MedalCategory,
        place: a.place,
        manual: false,
      })),
    }),
  ]);

  return {
    awarded: toCreate.length,
    keptManual: manual.length,
    unresolved: nerazrijesene.length,
    skipped: null,
  };
}

export interface SeasonMedalView {
  category: MedalCategory;
  place: number;
  playerId: string;
  playerName: string;
  /** Vodi li ime na profil — nečlanovima se profil ne objavljuje. */
  playerIsClubMember: boolean;
}

/** Medalje za konačni poredak sezone — za Hall of Fame. */
export async function getSeasonMedals(
  seasonId: string
): Promise<SeasonMedalView[]> {
  const medals = await prisma.medal.findMany({
    where: { seasonId, tournamentId: null },
    orderBy: [{ category: "asc" }, { place: "asc" }],
    include: {
      player: {
        select: { firstName: true, lastName: true, isClubMember: true },
      },
    },
  });

  return medals.map((m) => ({
    category: m.category,
    place: m.place,
    playerId: m.playerId,
    playerName: `${m.player.lastName} ${m.player.firstName}`,
    playerIsClubMember: m.player.isClubMember,
  }));
}
