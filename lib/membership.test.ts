import { describe, expect, it } from "vitest";
import {
  javanProfilZbogDatuma,
  needsMembershipDate,
  wasClubMemberOn,
} from "./membership";

const d = (s: string) => new Date(`${s}T00:00:00.000Z`);

describe("wasClubMemberOn (čl. 4)", () => {
  it("bez datuma učlanjenja pada natrag na trenutno stanje", () => {
    expect(
      wasClubMemberOn(
        { isClubMember: true, memberSince: null, memberUntil: null },
        d("2026-09-12")
      )
    ).toBe(true);
    expect(
      wasClubMemberOn(
        { isClubMember: false, memberSince: null, memberUntil: null },
        d("2026-09-12")
      )
    ).toBe(false);
  });

  it("turnir prije učlanjenja ne čini igrača članom", () => {
    expect(
      wasClubMemberOn(
        { isClubMember: true, memberSince: d("2026-10-01"), memberUntil: null },
        d("2026-09-12")
      )
    ).toBe(false);
  });

  it("član do 31.12.2026. nije član 1.1.2027. — bez ičije intervencije", () => {
    const igrac = {
      isClubMember: true,
      memberSince: d("2024-01-01"),
      memberUntil: d("2026-12-31"),
    };
    expect(wasClubMemberOn(igrac, d("2026-12-31"))).toBe(true);
    expect(wasClubMemberOn(igrac, d("2027-01-01"))).toBe(false);
  });
});

describe("javanProfilZbogDatuma", () => {
  it("član — profil mu je javan zbog kvačice, ne zbog datuma", () => {
    expect(
      javanProfilZbogDatuma({
        isClubMember: true,
        memberSince: d("2024-01-01"),
        memberUntil: null,
      })
    ).toBe(false);
  });

  it("bivši član — upravo ovo stanje treba istaknuti adminu", () => {
    expect(
      javanProfilZbogDatuma({
        isClubMember: false,
        memberSince: d("2024-01-01"),
        memberUntil: d("2026-06-30"),
      })
    ).toBe(true);
  });

  it("samo datum prestanka je dovoljan za oznaku", () => {
    expect(
      javanProfilZbogDatuma({
        isClubMember: false,
        memberSince: null,
        memberUntil: d("2026-06-30"),
      })
    ).toBe(true);
  });

  it("dijete izvan Kluba bez datuma — nema što istaknuti", () => {
    expect(
      javanProfilZbogDatuma({
        isClubMember: false,
        memberSince: null,
        memberUntil: null,
      })
    ).toBe(false);
  });
});

describe("needsMembershipDate", () => {
  it("član bez datuma učlanjenja traži dopunu", () => {
    expect(
      needsMembershipDate({
        isClubMember: true,
        memberSince: null,
        memberUntil: null,
      })
    ).toBe(true);
  });
});
