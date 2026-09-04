import { describe, expect, it } from "vitest";
import {
  buildCalendar,
  escapeText,
  foldLine,
  formatDate,
  formatDateTime,
} from "./ical";

describe("escapeText", () => {
  it("izbjegava zareze, točke sa zarezom i obrnute kose crte", () => {
    expect(escapeText("Kup, 7 kola; rapid")).toBe("Kup\\, 7 kola\\; rapid");
    expect(escapeText("a\\b")).toBe("a\\\\b");
  });

  it("prijelom retka pretvara u \\n", () => {
    expect(escapeText("prvi\ndrugi")).toBe("prvi\\ndrugi");
    expect(escapeText("prvi\r\ndrugi")).toBe("prvi\\ndrugi");
  });

  it("ne dira hrvatske znakove", () => {
    expect(escapeText("Božićni kup")).toBe("Božićni kup");
  });
});

describe("formatDate", () => {
  it("daje YYYYMMDD u UTC", () => {
    expect(formatDate(new Date("2027-02-14T00:00:00Z"))).toBe("20270214");
  });

  it("nadopunjuje jednoznamenkaste mjesece i dane", () => {
    expect(formatDate(new Date("2027-01-05T00:00:00Z"))).toBe("20270105");
  });
});

describe("formatDateTime", () => {
  it("daje oznaku sa Z na kraju", () => {
    expect(formatDateTime(new Date("2027-02-14T09:30:05Z"))).toBe(
      "20270214T093005Z"
    );
  });
});

describe("foldLine", () => {
  it("kratke retke ostavlja na miru", () => {
    expect(foldLine("SUMMARY:Zimski kup")).toBe("SUMMARY:Zimski kup");
  });

  it("dugi redak prelama i nastavak počinje razmakom", () => {
    const folded = foldLine("SUMMARY:" + "a".repeat(200));
    const parts = folded.split("\r\n");
    expect(parts.length).toBeGreaterThan(1);
    for (const p of parts.slice(1)) expect(p.startsWith(" ")).toBe(true);
  });

  it("nijedan redak ne prelazi 75 okteta", () => {
    const enc = new TextEncoder();
    // Hrvatski znakovi zauzimaju dva okteta — brojanje po znakovima dalo bi
    // predugačke retke.
    const folded = foldLine("DESCRIPTION:" + "čćžšđ".repeat(60));
    for (const p of folded.split("\r\n")) {
      expect(enc.encode(p).length).toBeLessThanOrEqual(75);
    }
  });

  it("prelamanje ne guta znakove", () => {
    const original = "SUMMARY:" + "Božićni kup ".repeat(20);
    const rebuilt = foldLine(original).split("\r\n ").join("");
    expect(rebuilt).toBe(original);
  });
});

describe("buildCalendar", () => {
  const now = new Date("2026-09-04T08:00:00Z");
  const ics = buildCalendar({
    name: "Dubrovnik Grand Prix",
    description: "Kalendar turnira",
    now,
    events: [
      {
        uid: "tournament-abc@skdubrovnik.hr",
        date: new Date("2027-02-14T00:00:00Z"),
        summary: "Zimski kup",
        description: "rapid, 7 kola",
        url: "https://example.hr/turniri/abc",
        sequence: 3,
      },
    ],
  });

  it("ima ispravan okvir", () => {
    expect(ics.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
    expect(ics.trimEnd().endsWith("END:VCALENDAR")).toBe(true);
    expect(ics).toContain("VERSION:2.0");
  });

  it("koristi CRLF prijelome", () => {
    expect(ics.includes("\r\n")).toBe(true);
    expect(ics.replace(/\r\n/g, "").includes("\n")).toBe(false);
  });

  it("cjelodnevni događaj završava sljedeći dan (DTEND je isključiv)", () => {
    expect(ics).toContain("DTSTART;VALUE=DATE:20270214");
    expect(ics).toContain("DTEND;VALUE=DATE:20270215");
  });

  it("zadržava UID i SEQUENCE", () => {
    expect(ics).toContain("UID:tournament-abc@skdubrovnik.hr");
    expect(ics).toContain("SEQUENCE:3");
  });

  it("prazan kalendar je i dalje valjan", () => {
    const empty = buildCalendar({ name: "X", description: "Y", events: [], now });
    expect(empty).toContain("BEGIN:VCALENDAR");
    expect(empty).not.toContain("BEGIN:VEVENT");
  });
});
