import { describe, expect, it } from "vitest";
import { bezNule, tempoKaoPolje } from "./vrijednost";

describe("bezNule", () => {
  it("nula znači bez rejtinga, ne rejting nula", () => {
    // Tako je zapisuju i FIDE liste i Swiss-Manager, pa je takva ušla i u bazu.
    expect(bezNule(0)).toBeNull();
  });

  it("prazno ostaje prazno", () => {
    expect(bezNule(null)).toBeNull();
    expect(bezNule(undefined)).toBeNull();
  });

  it("stvarne vrijednosti prolaze nedirnute", () => {
    expect(bezNule(1449)).toBe(1449);
    expect(bezNule(1)).toBe(1);
  });
});

describe("tempoKaoPolje", () => {
  it("preslikava tempo turnira na stupac rejtinga", () => {
    expect(tempoKaoPolje("STANDARD")).toBe("standard");
    expect(tempoKaoPolje("RAPID")).toBe("rapid");
    expect(tempoKaoPolje("BLITZ")).toBe("blitz");
  });
});
