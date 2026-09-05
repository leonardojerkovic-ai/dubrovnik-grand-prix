import { prisma } from "@/lib/prisma";
import { buildCalendar, type CalendarEvent } from "@/lib/ical";

/**
 * Kalendar turnira za pretplatu (.ics).
 *
 * Pretplata, a ne preuzimanje: igrač jednom doda adresu u svoj kalendar, a
 * kalendar je poslije sam provjerava. Promijeni li se datum turnira, za koji
 * sat je promijenjen i kod svih pretplaćenih, bez ikakve njihove radnje.
 */
export const dynamic = "force-dynamic";

const TEMPO: Record<string, string> = {
  STANDARD: "standardni tempo",
  RAPID: "ubrzani tempo",
  BLITZ: "brzopotezni tempo",
};

const LEVEL: Record<string, string> = {
  KLUPSKA: "klupska razina",
  NATJECATELJSKA: "natjecateljska razina",
  VRHUNSKA: "vrhunska razina",
};

const STATUS: Record<string, string> = {
  NAJAVA: "najava",
  PRIJAVE_OTVORENE: "prijave otvorene",
  U_TIJEKU: "u tijeku",
  ZAVRSEN: "završen",
};

/** Relativna putanja pretvara se u punu — kalendar nije na našoj domeni. */
function absolute(url: string, baseUrl: string): string {
  return url.startsWith("/") ? `${baseUrl}${url}` : url;
}

export async function GET() {
  const baseUrl = process.env.NEXTAUTH_URL ?? "https://skdubrovnik.hr";

  const tournaments = await prisma.tournament.findMany({
    orderBy: { date: "asc" },
    include: { season: { select: { yearLabel: true, system: true } } },
  });

  const events: CalendarEvent[] = tournaments.map((t) => {
    const parts = [
      t.season.system === "AKADEMIJA" ? "GP Akademije" : "Dubrovnik GP",
      t.season.yearLabel,
      TEMPO[t.tempo] ?? t.tempo.toLowerCase(),
      t.rounds ? `${t.rounds} kola` : null,
      t.level ? LEVEL[t.level] : null,
      t.startTime ? `Početak u ${t.startTime}` : null,
      STATUS[t.status] ? `Status: ${STATUS[t.status]}` : null,
      t.announcementUrl ? `Raspis: ${absolute(t.announcementUrl, baseUrl)}` : null,
    ].filter(Boolean);

    return {
      // Stalan kroz cijeli život turnira. Da se mijenja, kalendar bi pri
      // svakom osvježavanju stvarao duplikat umjesto da izmijeni postojeći.
      uid: `tournament-${t.id}@skdubrovnik.hr`,
      date: t.date,
      summary: t.name,
      description: parts.join("\n"),
      location: t.venue ?? undefined,
      url: `${baseUrl}/turniri/${t.id}`,
      // Raste pri svakoj izmjeni turnira; bez toga kalendar ignorira promjene.
      sequence: Math.floor(t.updatedAt.getTime() / 1000),
    };
  });

  const body = buildCalendar({
    name: "Dubrovnik Grand Prix",
    description:
      "Kalendar turnira Šahovskog kluba Dubrovnik — Dubrovnik Grand Prix i GP Akademije.",
    events,
  });

  return new Response(body, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="dubrovnik-grand-prix.ics"',
      // Kratko predmemoriranje: kalendari ionako provjeravaju rijetko, a
      // izmjena datuma treba stići brzo.
      "Cache-Control": "public, max-age=600",
    },
  });
}
