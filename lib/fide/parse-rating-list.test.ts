import { describe, expect, it } from "vitest";
import {
  extractPlayers,
  parseHeader,
  parseLine,
  ratingListUrl,
} from "./parse-rating-list";

/**
 * Uzorci se grade programski, s razmacima koji točno prate zaglavlje.
 * Ručno poravnavanje u testu samo bi provjeravalo je li autor dobro brojio
 * razmake, a ne radi li parser.
 */

type Col = { title: string; width: number };

function buildFixture(cols: Col[], rows: string[][]) {
  const header = cols.map((c) => c.title.padEnd(c.width)).join("").trimEnd();
  const lines = rows.map((values) =>
    values.map((v, i) => v.padEnd(cols[i]!.width)).join("").trimEnd()
  );
  return { header, lines };
}

const STD_COLS: Col[] = [
  { title: "ID Number", width: 15 },
  { title: "Name", width: 40 },
  { title: "Fed", width: 5 },
  { title: "Sex", width: 4 },
  { title: "Tit", width: 5 },
  { title: "SRtng", width: 6 },
  { title: "SGm", width: 4 },
  { title: "SK", width: 5 },
  { title: "B-day", width: 6 },
  { title: "Flag", width: 5 },
];

const std = buildFixture(STD_COLS, [
  ["14512033", "Marić, Ivan", "CRO", "M", "IM", "2287", "12", "10", "1994", ""],
  ["14555001", "Bogdanović, Ana", "CRO", "F", "", "1642", "0", "20", "2009", "w"],
  ["14599123", "Novak, Petar", "CRO", "M", "", "0", "0", "40", "2015", ""],
]);

const STD_HEADER = std.header;
const STD_ROWS = std.lines;

const COMBINED_COLS: Col[] = [
  { title: "ID Number", width: 15 },
  { title: "Name", width: 40 },
  { title: "Fed", width: 5 },
  { title: "Sex", width: 4 },
  { title: "Tit", width: 5 },
  { title: "SRtng", width: 6 },
  { title: "SGm", width: 4 },
  { title: "SK", width: 5 },
  { title: "RRtng", width: 6 },
  { title: "RGm", width: 4 },
  { title: "RK", width: 5 },
  { title: "BRtng", width: 6 },
  { title: "BGm", width: 4 },
  { title: "BK", width: 5 },
  { title: "B-day", width: 6 },
];

const combined = buildFixture(COMBINED_COLS, [
  ["14512033", "Marić, Ivan", "CRO", "M", "IM", "2287", "12", "10", "2241", "8", "20", "2198", "4", "20", "1994"],
]);

const COMBINED_HEADER = combined.header;
const COMBINED_ROW = combined.lines[0]!;

describe("parseHeader", () => {
  it("nalazi stupce u zasebnoj standardnoj listi", () => {
    const layout = parseHeader(STD_HEADER, "STANDARD");
    expect(STD_HEADER.slice(layout.idStart, layout.idEnd).trim()).toBe(
      "ID Number"
    );
    expect(STD_HEADER.slice(layout.ratingStart, layout.ratingEnd).trim()).toBe(
      "SRtng"
    );
  });

  it("razlikuje tempo u kombiniranoj listi", () => {
    const std = parseHeader(COMBINED_HEADER, "STANDARD");
    const rpd = parseHeader(COMBINED_HEADER, "RAPID");
    const blz = parseHeader(COMBINED_HEADER, "BLITZ");

    expect(COMBINED_HEADER.slice(std.ratingStart, std.ratingEnd).trim()).toBe("SRtng");
    expect(COMBINED_HEADER.slice(rpd.ratingStart, rpd.ratingEnd).trim()).toBe("RRtng");
    expect(COMBINED_HEADER.slice(blz.ratingStart, blz.ratingEnd).trim()).toBe("BRtng");
  });

  it("baca razumljivu grešku ako format nije prepoznat", () => {
    expect(() => parseHeader("nesto sasvim deseto", "STANDARD")).toThrow(
      /nije prepoznato/
    );
  });
});

describe("parseLine", () => {
  const layout = parseHeader(STD_HEADER, "STANDARD");

  it("čita ID i rejting", () => {
    expect(parseLine(STD_ROWS[0]!, layout)).toEqual({
      fideId: "14512033",
      rating: 2287,
    });
  });

  it("čita igračicu s rejtingom", () => {
    expect(parseLine(STD_ROWS[1]!, layout)).toEqual({
      fideId: "14555001",
      rating: 1642,
    });
  });

  it("neocijenjeni igrač (rejting 0) vraća null umjesto nule", () => {
    expect(parseLine(STD_ROWS[2]!, layout)).toEqual({
      fideId: "14599123",
      rating: null,
    });
  });

  it("prazan redak i redak bez brojčanog ID-a se preskaču", () => {
    expect(parseLine("", layout)).toBeNull();
    expect(parseLine("   ", layout)).toBeNull();
    expect(parseLine("nevaljan redak bez broja", layout)).toBeNull();
  });
});

describe("extractPlayers", () => {
  const lines = [STD_HEADER, ...STD_ROWS];

  it("vraća samo tražene igrače", () => {
    const found = extractPlayers(
      lines,
      new Set(["14512033", "14599123"]),
      "STANDARD"
    );
    expect(found.size).toBe(2);
    expect(found.get("14512033")).toBe(2287);
    expect(found.get("14599123")).toBeNull();
    expect(found.has("14555001")).toBe(false);
  });

  it("igrač kojeg nema na listi jednostavno nedostaje", () => {
    const found = extractPlayers(lines, new Set(["99999999"]), "STANDARD");
    expect(found.size).toBe(0);
  });

  it("prestaje čitati čim su svi pronađeni", () => {
    let consumed = 0;
    function* counted() {
      for (const l of lines) {
        consumed++;
        yield l;
      }
    }
    extractPlayers(counted(), new Set(["14512033"]), "STANDARD");
    // zaglavlje + prvi redak, ostatak liste se ne čita
    expect(consumed).toBe(2);
  });

  it("baca grešku na praznoj datoteci", () => {
    expect(() => extractPlayers([], new Set(["1"]), "STANDARD")).toThrow(
      /prazna/
    );
  });
});

describe("ratingListUrl", () => {
  it("pokazuje na službene FIDE datoteke", () => {
    expect(ratingListUrl("STANDARD")).toContain("standard_rating_list.zip");
    expect(ratingListUrl("RAPID")).toContain("rapid_rating_list.zip");
    expect(ratingListUrl("BLITZ")).toContain("blitz_rating_list.zip");
  });
});

describe("otpornost na pomak stupaca", () => {
  const layout = parseHeader(STD_HEADER, "STANDARD");

  it("čita cijeli broj i kad zaglavlje pokazuje dva znaka predesno", () => {
    // Oponaša stvarni kvar: izrez uhvati samo "22" umjesto "2287".
    const truncating = {
      ...layout,
      ratingStart: layout.ratingStart + 2,
      ratingEnd: layout.ratingEnd + 2,
    };
    expect(parseLine(STD_ROWS[0]!, truncating)?.rating).toBe(2287);
  });

  it("čita cijeli broj i kad zaglavlje pokazuje dva znaka prelijevo", () => {
    const shifted = {
      ...layout,
      ratingStart: layout.ratingStart - 2,
      ratingEnd: layout.ratingEnd - 2,
    };
    expect(parseLine(STD_ROWS[0]!, shifted)?.rating).toBe(2287);
  });

  it("čita rejting iz kombinirane liste za svaki tempo", () => {
    for (const [type, expected] of [
      ["STANDARD", 2287],
      ["RAPID", 2241],
      ["BLITZ", 2198],
    ] as const) {
      const l = parseHeader(COMBINED_HEADER, type);
      expect(parseLine(COMBINED_ROW, l)?.rating).toBe(expected);
    }
  });

  it("odbija uvoz ako pročitani rejting nije vjerodostojan", () => {
    // Namjerno pokvareno zaglavlje pomiče stupac na broj partija.
    const broken = parseHeader(STD_HEADER, "STANDARD");
    const badLayout = { ...broken, ratingStart: 0, ratingEnd: 3 };
    expect(() => parseLine(STD_ROWS[0]!, badLayout)).toThrow(/izvan je raspona/);
  });
});
