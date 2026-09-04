/**
 * Sastavljanje iCalendar (.ics) datoteke — RFC 5545.
 *
 * Format je jednostavan, ali ima nekoliko zamki zbog kojih kalendar tiho
 * odbije datoteku ili prikaže krivo:
 *
 *  - UID mora biti STALAN. Promijeni li se, kalendar pri sljedećem
 *    osvježavanju ne prepozna događaj i stvori duplikat umjesto izmjene.
 *  - SEQUENCE mora rasti pri svakoj izmjeni, inače je kalendar ignorira.
 *  - Redak ne smije biti duži od 75 okteta; duži se prelama. Hrvatski
 *    znakovi zauzimaju dva okteta, pa se broji po njima, ne po znakovima.
 *  - Zarezi, točke sa zarezom i obrnute kose crte se izbjegavaju.
 *  - Prijelom retka je CRLF, ne LF.
 */

export interface CalendarEvent {
  /** Stalan i jedinstven kroz vrijeme. */
  uid: string;
  /** Cjelodnevni događaj — turnirima znamo dan, ne uvijek i sat. */
  date: Date;
  summary: string;
  description?: string;
  location?: string;
  url?: string;
  /** Raste pri svakoj izmjeni; obično iz updatedAt. */
  sequence: number;
}

/** Izbjegavanje znakova s posebnim značenjem (RFC 5545, 3.3.11). */
export function escapeText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/** YYYYMMDD u UTC — za cjelodnevne događaje. */
export function formatDate(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

/** YYYYMMDDTHHMMSSZ — za vremenske oznake. */
export function formatDateTime(d: Date): string {
  return (
    formatDate(d) +
    "T" +
    String(d.getUTCHours()).padStart(2, "0") +
    String(d.getUTCMinutes()).padStart(2, "0") +
    String(d.getUTCSeconds()).padStart(2, "0") +
    "Z"
  );
}

/**
 * Prelama redak na 75 okteta, s razmakom na početku nastavka.
 *
 * Broji se po oktetima UTF-8, ne po znakovima: "č" zauzima dva okteta, pa bi
 * brojanje po znakovima dalo predugačke retke kod hrvatskih naziva.
 */
export function foldLine(line: string): string {
  const encoder = new TextEncoder();
  const out: string[] = [];
  let current = "";
  let bytes = 0;
  // Nastavak retka počinje razmakom, pa mu ostaje 74 okteta.
  let limit = 75;

  for (const char of line) {
    const size = encoder.encode(char).length;
    if (bytes + size > limit) {
      out.push(current);
      current = char;
      bytes = size;
      limit = 74;
    } else {
      current += char;
      bytes += size;
    }
  }
  out.push(current);

  return out.join("\r\n ");
}

function addDays(d: Date, days: number): Date {
  return new Date(d.getTime() + days * 24 * 60 * 60 * 1000);
}

export function buildCalendar(input: {
  name: string;
  description: string;
  events: CalendarEvent[];
  now?: Date;
}): string {
  const stamp = formatDateTime(input.now ?? new Date());

  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//SK Dubrovnik//Dubrovnik Grand Prix//HR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeText(input.name)}`,
    `X-WR-CALDESC:${escapeText(input.description)}`,
    "X-WR-TIMEZONE:Europe/Zagreb",
    // Koliko često kalendar traži osvježavanje. Turniri se rijetko mijenjaju,
    // pa je 12 sati dovoljno često, a ne opterećuje poslužitelj.
    "REFRESH-INTERVAL;VALUE=DURATION:PT12H",
    "X-PUBLISHED-TTL:PT12H",
  ];

  for (const e of input.events) {
    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${e.uid}`);
    lines.push(`DTSTAMP:${stamp}`);
    lines.push(`SEQUENCE:${e.sequence}`);
    // DTEND je isključiv, pa je za jednodnevni događaj sljedeći dan.
    lines.push(`DTSTART;VALUE=DATE:${formatDate(e.date)}`);
    lines.push(`DTEND;VALUE=DATE:${formatDate(addDays(e.date, 1))}`);
    lines.push(`SUMMARY:${escapeText(e.summary)}`);
    if (e.description) lines.push(`DESCRIPTION:${escapeText(e.description)}`);
    if (e.location) lines.push(`LOCATION:${escapeText(e.location)}`);
    if (e.url) lines.push(`URL:${e.url}`);
    lines.push("TRANSP:TRANSPARENT");
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");

  return lines.map(foldLine).join("\r\n") + "\r\n";
}
