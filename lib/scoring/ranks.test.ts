import { describe, expect, it } from "vitest";
import { validateRanks } from "./ranks";

const row = (rank: number, id = `p${rank}`) => ({ rank, playerId: id });

describe("validateRanks", () => {
  it("prihvaća ispravan niz 1..N", () => {
    expect(validateRanks([row(1), row(2), row(3)])).toBeNull();
  });

  it("prihvaća niz unesen izvan redoslijeda", () => {
    expect(validateRanks([row(3), row(1), row(2)])).toBeNull();
  });

  it("odbija dvostruki plasman", () => {
    const err = validateRanks([row(1), row(1, "b"), row(3)]);
    expect(err).toContain("ne smije ponavljati");
    expect(err).toContain("1");
  });

  it("odbija plasman izvan raspona", () => {
    expect(validateRanks([row(1), row(2), row(9)])).toContain("izvan raspona");
    expect(validateRanks([row(0), row(1), row(2)])).toContain("izvan raspona");
  });

  it("odbija rupu u nizu", () => {
    // 1,2,4 pri N=3 pada već na rasponu; rupa se vidi kod 1,1 nije slučaj —
    // ovdje N=4 s ispuštenim 3.
    const err = validateRanks([row(1), row(2), row(4), row(5)]);
    expect(err).toContain("izvan raspona");
  });

  it("odbija decimalni plasman", () => {
    expect(validateRanks([{ rank: 1.5, playerId: "a" }])).toContain(
      "cijeli broj"
    );
  });

  it("prihvaća turnir s jednim igračem", () => {
    expect(validateRanks([row(1)])).toBeNull();
  });

  it("prazan popis ne prijavljuje grešku (obrađuje se ranije)", () => {
    expect(validateRanks([])).toBeNull();
  });
});
