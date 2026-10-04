import { describe, expect, it } from "vitest";
import { playerSchema } from "./player";

/**
 * Članstvo se po čl. 4 provjerava NA DAN turnira, pa zapis mora reći i od
 * kada igrač više nije član. Skinuta kvačica uz upisan datum učlanjenja bez
 * datuma prestanka to ne kaže, i zato se ne sprema.
 */

const osnova = {
  firstName: "Ivan",
  lastName: "Horvat",
  title: "NONE" as const,
  gender: "M" as const,
  birthYear: 2010,
  deceased: false,
};

describe("playerSchema — datumi članstva (čl. 4)", () => {
  it("član bez datuma prestanka je u redu — ne zna se dokad će biti član", () => {
    const r = playerSchema.safeParse({
      ...osnova,
      isClubMember: true,
      memberSince: "2024-01-01",
      memberUntil: "",
    });
    expect(r.success).toBe(true);
  });

  it("nečlan s datumom učlanjenja MORA imati i datum prestanka", () => {
    const r = playerSchema.safeParse({
      ...osnova,
      isClubMember: false,
      memberSince: "2024-01-01",
      memberUntil: "",
    });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.flatten().fieldErrors.memberUntil?.[0]).toContain(
        "Član do"
      );
    }
  });

  it("nečlan s oba datuma je u redu", () => {
    const r = playerSchema.safeParse({
      ...osnova,
      isClubMember: false,
      memberSince: "2024-01-01",
      memberUntil: "2026-06-30",
    });
    expect(r.success).toBe(true);
  });

  it("nečlan bez ijednog datuma je u redu — o prošlosti se ništa ne tvrdi", () => {
    const r = playerSchema.safeParse({
      ...osnova,
      isClubMember: false,
      memberSince: "",
      memberUntil: "",
    });
    expect(r.success).toBe(true);
  });

  it("datum prestanka prije učlanjenja se i dalje odbija", () => {
    const r = playerSchema.safeParse({
      ...osnova,
      isClubMember: false,
      memberSince: "2026-01-01",
      memberUntil: "2024-01-01",
    });
    expect(r.success).toBe(false);
  });
});
