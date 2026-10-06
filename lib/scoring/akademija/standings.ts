/**
 * Ljestvica — GP Akademije
 * Reference: čl. 11 (kvalifikacija za finale), čl. 14 (konačni poredak), čl. 15 (tie-break)
 */


export interface AkademijaTournamentResult {
  tournamentId: string;
  isFinal: boolean;
  /**
   * Dan turnira, kao broj (Date.getTime()). Potreban za čl. 15 st. 5 —
   * „posljednji zajednički odigrani turnir" — koji se bez datuma ne može
   * odrediti. Broj, a ne Date, da komparator ostane čista funkcija bez
   * ovisnosti o vremenskoj zoni.
   */
  dan: number;
  /**
   * Vrijeme početka u minutama od ponoći, ako je upisano (Tournament
   * .startTime je neobavezan tekst „HH:MM"). Služi samo za razlučivanje dvaju
   * turnira istog dana u kriteriju 5.
   */
  pocetak?: number | null;
  gpPoints: number;
  /** Konačni plasman igrača na tom turniru — potreban za tie-break kriterije čl. 15 st. 2 i 4 */
  rank: number;
  /** Je li igrač bio prvoplasiran na tom turniru — za čl. 15 st. 2 */
  wasFirstPlace: boolean;
}

export interface AkademijaStandingEntry {
  playerId: string;
  /** Zbroj koji ulazi u konačni poredak: najviše 4 najbolja kvalifikacijska + finale (čl. 14) */
  total: number;
  countedResults: AkademijaTournamentResult[];
  allResults: AkademijaTournamentResult[];
}

const MAX_QUALIFIER_RESULTS = 4; // čl. 14 — "najviše 4 najbolja rezultata"

/**
 * Sastavlja konačni zbroj igrača — čl. 14.
 * Uzima najbolja 4 rezultata iz kvalifikacijske serije + obavezan (ne može
 * se odbaciti) rezultat završnog turnira, ako postoji.
 */
export function buildPlayerStanding(
  playerId: string,
  results: AkademijaTournamentResult[]
): AkademijaStandingEntry {
  const qualifiers = results.filter((r) => !r.isFinal);
  const finals = results.filter((r) => r.isFinal);

  const sortedQualifiers = [...qualifiers].sort(
    (a, b) => b.gpPoints - a.gpPoints
  );
  const countedQualifiers = sortedQualifiers.slice(0, MAX_QUALIFIER_RESULTS);

  const countedResults = [...countedQualifiers, ...finals].sort(
    (a, b) => b.gpPoints - a.gpPoints
  );

  const total = countedResults.reduce((sum, r) => sum + r.gpPoints, 0);

  return { playerId, total, countedResults, allResults: results };
}

/**
 * Provjera prava nastupa na Prvenstvu Akademije (top 8) — čl. 11.
 * Uvjet: član ŠK Dubrovnik, odigrao najmanje 3 kvalifikacijska turnira
 * (uključujući i one odigrane prije učlanjenja — čl. 11 st. 4).
 */
export function isEligibleForFinal(input: {
  isClubMember: boolean;
  qualifiersPlayed: number;
}): boolean {
  return input.isClubMember && input.qualifiersPlayed >= 3;
}

/**
 * Razrješenje ravnopravnosti kod jednakog konačnog zbroja — čl. 15.
 * Redoslijed kriterija:
 *   1. veći ukupni zbroj SVIH rezultata (uključujući odbačene)
 *   2. veći broj prvih mjesta na turnirima sezone
 *   3. veći broj odigranih turnira
 *   4. bolji plasman na Prvenstvu Akademije
 *   5. bolji plasman na posljednjem zajednički odigranom turniru
 *   6. dijeljeno mjesto
 *
 * Kriterij 5 nije tranzitivan: svaki par gleda SVOJ posljednji zajednički
 * turnir, pa je moguće da A pobijedi B, B pobijedi C, a C pobijedi A. Tada
 * kriterij 5 ne poreda skupinu — pa, po čl. 15, ne odlučuje ništa i prelazi
 * se na st. 6: igrači dijele mjesto. To radi poredajAkademiju; bez nje bi
 * sortiranje dalo proizvoljan poredak u kojem nijedan SUSJEDNI par nije
 * izjednačen, pa bi i medalje ispale automatski.
 *
 * Kriterij 5 traži datum turnira, pa ga `AkademijaTournamentResult` nosi u
 * polju `dan`. Prije je bio izostavljen, s napomenom da se „rješava na
 * servisnom sloju" — a nije se rješavao nigdje, pa su dva igrača ostajala
 * izjednačena i mjesto među njima dijelio je redoslijed u memoriji.
 */
export type ComparableAkademijaStanding = Pick<
  AkademijaStandingEntry,
  "total" | "allResults"
>;

/**
 * Kriteriji 1–4: zbroj svih rezultata, broj prvih mjesta, broj odigranih
 * turnira, plasman na Prvenstvu Akademije. Odvojeni su jer su TRANZITIVNI —
 * svaki je usporedba jednog broja — pa po njima nastaju pravi razredi igrača,
 * koje kriterij 5 onda pokušava poredati. Vidi poredajAkademiju.
 *
 * Kriterij 4 i za igrača koji NIJE nastupio na Prvenstvu daje broj: on nema
 * plasman, pa je iza svakoga tko ga ima. Tako je Klub protumačio čl. 15 st. 4
 * („bolji plasman na Prvenstvu Akademije"): finalist je ispred nefinalista, i
 * izjednačenje se rješava već tu, bez prelaska na kriterij 5.
 *
 * Prije se kriterij 4 primjenjivao samo kad su OBA igrača igrala finale. To
 * nije bilo tranzitivno: ako A i C igraju finale a B ne, tada je A = B i
 * B = C, ali A < C — „jednakost" time nije relacija ekvivalencije, pa je
 * podjela na razrede ovisila o tome koji igrač stigne prvi i isti su igrači
 * davali tri različita poretka.
 */
export function compareKriteriji1do4(
  a: ComparableAkademijaStanding,
  b: ComparableAkademijaStanding
): number {
  if (a.total !== b.total) return b.total - a.total;

  const sumAll = (e: ComparableAkademijaStanding) =>
    e.allResults.reduce((s, r) => s + r.gpPoints, 0);
  const allA = sumAll(a);
  const allB = sumAll(b);
  if (allA !== allB) return allB - allA;

  const firstPlacesA = a.allResults.filter((r) => r.wasFirstPlace).length;
  const firstPlacesB = b.allResults.filter((r) => r.wasFirstPlace).length;
  if (firstPlacesA !== firstPlacesB) return firstPlacesB - firstPlacesA;

  if (a.allResults.length !== b.allResults.length) {
    return b.allResults.length - a.allResults.length;
  }

  // Kriterij 4 — bolji plasman na Prvenstvu Akademije. Tko ga nije igrao,
  // nema plasman, pa je iza svakoga tko jest; dvojica bez finala su jednaka.
  const plasmanNaFinalu = (e: ComparableAkademijaStanding) =>
    e.allResults.find((r) => r.isFinal)?.rank ?? Infinity;
  const fA = plasmanNaFinalu(a);
  const fB = plasmanNaFinalu(b);
  if (fA !== fB) return fA < fB ? -1 : 1;

  return 0;
}

export function compareStandings(
  a: ComparableAkademijaStanding,
  b: ComparableAkademijaStanding
): number {
  const prvi = compareKriteriji1do4(a, b);
  if (prvi !== 0) return prvi;

  /**
   * Kriterij 5 — posljednji turnir koji su OBA igrača odigrala. Uzimaju se
   * samo zajednički turniri: turnir na kojem je igrao jedan a drugi nije ne
   * govori ništa o njihovu međusobnom odnosu.
   *
   * Uzimaju se SVI zajednički turniri posljednjeg zajedničkog dana, ne jedan
   * od njih. Dok se uzimao prvi nađeni, odgovor je ovisio o tome čiji se
   * popis rezultata prolazi: za dva turnira istog dana, na jednom bolji A a
   * na drugom B, compareStandings(a, b) i compareStandings(b, a) vraćali su
   * oba negativan broj. Takav komparator nije antisimetričan, pa poredak
   * ovisi o redoslijedu argumenata, a i podjela na komponente (vidi
   * poredajAkademiju) počiva na tome da za svaki par barem jedan smjer
   * vrijedi.
   *
   * Kad turniri istog dana ne pokazuju u istu stranu, kriterij 5 ne odlučuje
   * ništa i prelazi se na st. 6 — igrači dijele mjesto. Isto kao kad nema
   * zajedničkog turnira.
   */
  const zajednicki: {
    a: number;
    b: number;
    dan: number;
    pocetak: number | null;
  }[] = [];
  const poTurniru = new Map(b.allResults.map((r) => [r.tournamentId, r]));
  for (const ra of a.allResults) {
    const rb = poTurniru.get(ra.tournamentId);
    if (rb) {
      zajednicki.push({
        a: ra.rank,
        b: rb.rank,
        dan: ra.dan,
        pocetak: ra.pocetak ?? null,
      });
    }
  }

  if (zajednicki.length > 0) {
    const posljednjiDan = Math.max(...zajednicki.map((z) => z.dan));
    const togDana = zajednicki.filter((z) => z.dan === posljednjiDan);

    // Ako su svima upisana vremena početka i jedan je najkasniji, on JE
    // posljednji — pravilnik govori o turniru, a ne o danu.
    const svaVremena = togDana.every((z) => typeof z.pocetak === "number");
    if (svaVremena && togDana.length > 1) {
      const najkasnije = Math.max(...togDana.map((z) => z.pocetak as number));
      const zadnji = togDana.filter((z) => z.pocetak === najkasnije);
      if (zadnji.length === 1) {
        const z = zadnji[0]!;
        if (z.a !== z.b) return z.a - z.b;
        return 0;
      }
    }

    const aBolji = togDana.filter((z) => z.a < z.b).length;
    const bBolji = togDana.filter((z) => z.b < z.a).length;

    // Jednoglasno, u jednu ili drugu stranu. Kad nisu, kriterij 5 ne odlučuje.
    if (aBolji > 0 && bBolji === 0) return -1;
    if (bBolji > 0 && aBolji === 0) return 1;
  }

  return 0; // dijeljeno mjesto — čl. 15 st. 6
}

export function sortStandings(
  entries: AkademijaStandingEntry[]
): AkademijaStandingEntry[] {
  return [...entries].sort(compareStandings);
}

/**
 * Poredak i mjesta na ljestvici Akademije — čl. 15, uključujući st. 6.
 *
 * Zašto ne obično sortiranje pa mjestaIzPoretka: kriterij 5 nije tranzitivan
 * (svaki par gleda SVOJ posljednji zajednički turnir), pa može dati krug
 * A > B, B > C, C > A. Tada nijedan SUSJEDNI par nije izjednačen, a skupina
 * ipak nije poredana — sortiranje bi dalo proizvoljan redoslijed, i to
 * različit ovisno o tome kako je niz došao, jer je sort s netranzitivnim
 * komparatorom nedefiniran.
 *
 * Postupak:
 *  1. Igrači se dijele u razrede po kriterijima 1–4. Oni su tranzitivni, pa
 *     je to prava podjela, a ne „susjedi u nizu".
 *  2. Unutar skupine gradi se relacija „nije lošiji od" (compareStandings
 *     ≤ 0). Za svaki par barem jedan smjer vrijedi, pa su skupine međusobno
 *     potpuno poredane.
 *  3. Igrači koji su si međusobno dostupni u oba smjera dijele mjesto. To su
 *     jako povezane komponente te relacije, i dijeljenje se tako ne širi
 *     dalje nego što mora: ako kriterij 5 četvrtog igrača razdvaja od sve
 *     trojice iz kruga, on NE dijeli mjesto s njima — inače bi se preskočio
 *     kriterij koji je dao jasan odgovor.
 *
 * Rezultat ne ovisi o redoslijedu ulaznog niza.
 *
 * `zaPrikaz` određuje redoslijed UNUTAR dijeljenog mjesta. Na mjesta i na
 * medalje ne utječe — svi takvi igrači imaju isto mjesto — ali bez njega bi
 * se poredak imena mijenjao od učitavanja do učitavanja, što na javnoj
 * ljestvici izgleda kao da se nešto promijenilo.
 */
export function poredajAkademiju<T extends ComparableAkademijaStanding>(
  ulaz: T[],
  zaPrikaz?: (a: T, b: T) => number
): { entry: T; mjesto: number; dijeljeno: boolean }[] {
  // 1. Razredi po kriterijima 1–4.
  const razredi: T[][] = [];
  for (const e of ulaz) {
    const razred = razredi.find((r) => compareKriteriji1do4(r[0]!, e) === 0);
    if (razred) razred.push(e);
    else razredi.push([e]);
  }
  razredi.sort((a, b) => compareKriteriji1do4(a[0]!, b[0]!));

  const izlaz: { entry: T; mjesto: number; dijeljeno: boolean }[] = [];
  let mjesto = 1;

  for (const razred of razredi) {
    for (const komponenta of komponenteIstogMjesta(razred)) {
      const clanovi = zaPrikaz ? [...komponenta].sort(zaPrikaz) : komponenta;
      for (const entry of clanovi) {
        izlaz.push({
          entry,
          mjesto,
          dijeljeno: clanovi.length > 1,
        });
      }
      mjesto += clanovi.length;
    }
  }

  return izlaz;
}

/**
 * Jako povezane komponente relacije „nije lošiji od", poredane od najbolje.
 * Ovdje se razrješuje kriterij 5, koji nije tranzitivan.
 *
 * Relacija je potpuna (za svaki par vrijedi barem jedan smjer), pa su
 * komponente međusobno uvijek u jednom smjeru — dovoljno je usporediti po
 * jednog predstavnika.
 */
function komponenteIstogMjesta<T extends ComparableAkademijaStanding>(
  skupina: T[]
): T[][] {
  const n = skupina.length;
  if (n <= 1) return skupina.map((e) => [e]);

  // dostupno[i][j] — i je „nije lošiji od" j, posredno ili neposredno.
  const dostupno: boolean[][] = skupina.map((a, i) =>
    skupina.map((b, j) => i === j || compareStandings(a, b) <= 0)
  );
  for (let k = 0; k < n; k++) {
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (dostupno[i]![k] && dostupno[k]![j]) dostupno[i]![j] = true;
      }
    }
  }

  const obradeno = new Array<boolean>(n).fill(false);
  const komponente: T[][] = [];
  for (let i = 0; i < n; i++) {
    if (obradeno[i]) continue;
    const clanovi: T[] = [];
    for (let j = 0; j < n; j++) {
      if (!obradeno[j] && dostupno[i]![j] && dostupno[j]![i]) {
        obradeno[j] = true;
        clanovi.push(skupina[j]!);
      }
    }
    komponente.push(clanovi);
  }

  // Između dviju komponenata svi su odnosi u istom smjeru, pa predstavnici
  // daju ispravan poredak.
  komponente.sort((a, b) => compareStandings(a[0]!, b[0]!));
  return komponente;
}

/** „HH:MM" u minute od ponoći; prazno ili neispravno daje null. */
export function minuteIzVremena(vrijeme: string | null | undefined): number | null {
  if (!vrijeme) return null;
  const m = /^(\d{1,2}):(\d{2})$/.exec(vrijeme.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}
