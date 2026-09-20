import { describe, expect, it } from "vitest";
import { documentStatus, statusLabel } from "./status";

const gp2027 = {
  startDate: new Date("2027-01-01"),
  endDate: new Date("2027-12-31"),
  rulebookVersion: "GP-1.0",
};

const akademija = {
  startDate: new Date("2026-09-01"),
  endDate: new Date("2027-07-01"),
  rulebookVersion: "AKD-1.2",
};

describe("documentStatus", () => {
  it("sezona koja jos nije pocela je Uskoro", () => {
    expect(documentStatus(gp2027, new Date("2026-09-19"))).toBe("USKORO");
  });

  it("sezona u tijeku je Na snazi", () => {
    expect(documentStatus(akademija, new Date("2026-09-19"))).toBe("NA_SNAZI");
    expect(documentStatus(gp2027, new Date("2027-06-01"))).toBe("NA_SNAZI");
  });

  it("zavrsena sezona je Arhiva", () => {
    expect(documentStatus(gp2027, new Date("2028-02-01"))).toBe("ARHIVA");
  });

  it("prvi dan sezone vec je Na snazi", () => {
    expect(documentStatus(gp2027, new Date("2027-01-01"))).toBe("NA_SNAZI");
  });

  it("aktivnost sezone ne utjece na status", () => {
    // GP 2027 je isActive = true vec u rujnu 2026, ali pravilnik tada ne vrijedi.
    expect(documentStatus(gp2027, new Date("2026-09-19"))).not.toBe("NA_SNAZI");
  });
});

describe("statusLabel", () => {
  it("za buducu sezonu navodi datum stupanja na snagu", () => {
    expect(statusLabel("USKORO", gp2027.startDate)).toContain("2027");
    expect(statusLabel("USKORO", gp2027.startDate)).toMatch(/^Vrijedi od /);
  });

  it("ostali statusi su kratki", () => {
    expect(statusLabel("NA_SNAZI", gp2027.startDate)).toBe("Na snazi");
    expect(statusLabel("ARHIVA", gp2027.startDate)).toBe("Arhiva");
  });
});
