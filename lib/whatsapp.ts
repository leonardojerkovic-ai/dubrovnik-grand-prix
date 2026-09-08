/**
 * Sastavljanje poruka za WhatsApp grupu kluba.
 *
 * Klub obavijesti šalje kroz WhatsApp, ne mailom — brže je, besplatno i
 * ljudi to stvarno čitaju. Umjesto da se tekst svaki put piše ručno,
 * sastavlja se iz istih podataka koji su već u sustavu, pa se datum ili
 * satnica ne mogu razići s onim što piše na stranici.
 *
 * WhatsApp podržava *podebljano* zvjezdicama; ostalo je čisti tekst, da
 * poruka jednako izgleda i kad se prekopira drugamo.
 */

const TEMPO: Record<string, string> = {
  STANDARD: "standardni tempo",
  RAPID: "rapid",
  BLITZ: "blitz",
};

const LEVEL: Record<string, string> = {
  KLUPSKA: "klupska razina",
  NATJECATELJSKA: "natjecateljska razina",
  VRHUNSKA: "vrhunska razina",
};

function formatDate(d: Date): string {
  return new Intl.DateTimeFormat("hr-HR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

/** Relativna putanja pretvara se u punu — poruka ide izvan stranice. */
function absolute(url: string, baseUrl: string): string {
  if (!url) return "";
  return url.startsWith("/") ? `${baseUrl}${url}` : url;
}

export interface AnnouncementInput {
  name: string;
  date: Date;
  startTime?: string | null;
  venue?: string | null;
  tempo: string;
  rounds?: number | null;
  level?: string | null;
  status: string;
  announcementUrl?: string | null;
  tournamentId: string;
  baseUrl: string;
}

export function buildTournamentAnnouncement(t: AnnouncementInput): string {
  const kada = formatDate(t.date) + (t.startTime ? ` u ${t.startTime}` : "");

  const detalji = [
    TEMPO[t.tempo] ?? t.tempo.toLowerCase(),
    t.rounds ? `${t.rounds} kola` : null,
    t.level ? LEVEL[t.level] : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const lines = [`*${t.name}*`, kada];

  if (t.venue) lines.push(t.venue);
  lines.push("", detalji);

  if (t.status === "PRIJAVE_OTVORENE") {
    lines.push("", "Prijave su otvorene.");
  }

  if (t.announcementUrl) {
    lines.push("", `Raspis: ${absolute(t.announcementUrl, t.baseUrl)}`);
  }

  lines.push(`Detalji i prijava: ${t.baseUrl}/turniri/${t.tournamentId}`);

  return lines.join("\n");
}

export interface ResultRow {
  rank: number;
  firstName: string;
  lastName: string;
  gpPoints: number | null;
}

export interface ResultsInput {
  name: string;
  date: Date;
  playerCount: number;
  results: ResultRow[];
  tournamentId: string;
  baseUrl: string;
  /** Koliko mjesta ući u poruku; ostatak je na stranici. */
  topCount?: number;
}

export function buildResultsAnnouncement(input: ResultsInput): string {
  const top = input.results
    .slice()
    .sort((a, b) => a.rank - b.rank)
    .slice(0, input.topCount ?? 5);

  const lines = [
    `*${input.name} — rezultati*`,
    `${formatDate(input.date)} · ${input.playerCount} ${
      input.playerCount === 1 ? "igrač" : "igrača"
    }`,
    "",
  ];

  for (const r of top) {
    const bodovi =
      r.gpPoints !== null ? ` — ${r.gpPoints} ${r.gpPoints === 1 ? "bod" : "bodova"}` : "";
    lines.push(`${r.rank}. ${r.firstName} ${r.lastName}${bodovi}`);
  }

  if (input.results.length > top.length) {
    lines.push("", "Cijeli poredak i bodovi:");
  } else {
    lines.push("", "Bodovi i ljestvice:");
  }
  lines.push(`${input.baseUrl}/turniri/${input.tournamentId}`);

  return lines.join("\n");
}
