import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { TON_BRONCA, TON_SREBRO, TON_ZLATO, tonOdlicja } from "./odlicja";

describe("tonOdlicja", () => {
  it("prva tri mjesta imaju svoj ton", () => {
    expect(tonOdlicja(1)).toBe(TON_ZLATO);
    expect(tonOdlicja(2)).toBe(TON_SREBRO);
    expect(tonOdlicja(3)).toBe(TON_BRONCA);
  });

  it("dalje od trećeg nema odličja", () => {
    expect(tonOdlicja(4)).toBeNull();
    expect(tonOdlicja(9)).toBeNull();
  });
});

/**
 * Ovdje stoje gotovi nizovi Tailwind klasa, a Tailwind klase traži samo u
 * datotekama iz `content`. Dok lib/ nije bio na tom popisu, bg-navy/15 i
 * brončane klase su se izbacivale iz izlaznog CSS-a i drugo i treće mjesto
 * ostajalo je bez podloge — na ljestvici i na medaljicama jednako, a ništa
 * nije pucalo ni u testovima ni u buildu.
 */
describe("Tailwind vidi klase iz lib/", () => {
  it("content u tailwind.config.ts pokriva lib/", () => {
    const config = readFileSync(
      join(__dirname, "..", "..", "tailwind.config.ts"),
      "utf-8",
    );
    const content = config.slice(config.indexOf("content:"), config.indexOf("theme:"));
    expect(content).toContain("./lib/");
  });
});
