import { describe, expect, it } from "vitest";
import {
  buildResultsAnnouncement,
  buildTournamentAnnouncement,
} from "./whatsapp";

const baseUrl = "https://skdubrovnik.hr";

describe("najava turnira", () => {
  const base = {
    name: "Zimski kup",
    date: new Date("2027-02-14T00:00:00Z"),
    tempo: "RAPID",
    rounds: 7,
    level: "NATJECATELJSKA",
    status: "PRIJAVE_OTVORENE",
    tournamentId: "abc",
    baseUrl,
  };

  it("sadrži naziv, datum, tempo i poveznicu", () => {
    const text = buildTournamentAnnouncement(base);
    expect(text).toContain("*Zimski kup*");
    expect(text).toContain("14. veljače 2027.");
    expect(text).toContain("rapid");
    expect(text).toContain("7 kola");
    expect(text).toContain(`${baseUrl}/turniri/abc`);
  });

  it("dodaje vrijeme i mjesto kad postoje", () => {
    const text = buildTournamentAnnouncement({
      ...base,
      startTime: "17:00",
      venue: "Dom šaha",
    });
    expect(text).toContain("14. veljače 2027. u 17:00");
    expect(text).toContain("Dom šaha");
  });

  it("spominje prijave samo kad su otvorene", () => {
    expect(buildTournamentAnnouncement(base)).toContain("Prijave su otvorene");
    expect(
      buildTournamentAnnouncement({ ...base, status: "NAJAVA" })
    ).not.toContain("Prijave su otvorene");
  });

  it("relativnu putanju raspisa pretvara u punu adresu", () => {
    const text = buildTournamentAnnouncement({
      ...base,
      announcementUrl: "/dokumenti/raspis.pdf",
    });
    expect(text).toContain(`${baseUrl}/dokumenti/raspis.pdf`);
  });

  it("vanjsku poveznicu raspisa ostavlja kakva jest", () => {
    const text = buildTournamentAnnouncement({
      ...base,
      announcementUrl: "https://drugdje.hr/raspis.pdf",
    });
    expect(text).toContain("https://drugdje.hr/raspis.pdf");
    expect(text).not.toContain(`${baseUrl}https://`);
  });
});

describe("objava rezultata", () => {
  const results = [
    { rank: 3, firstName: "Ana", lastName: "Bogdanović", gpPoints: 75 },
    { rank: 1, firstName: "Ivan", lastName: "Marić", gpPoints: 87 },
    { rank: 2, firstName: "Petar", lastName: "Vlašić", gpPoints: 81 },
    { rank: 4, firstName: "Luka", lastName: "Kovač", gpPoints: 68 },
    { rank: 5, firstName: "Marko", lastName: "Novak", gpPoints: 60 },
    { rank: 6, firstName: "Josip", lastName: "Perić", gpPoints: 52 },
  ];

  const base = {
    name: "Zimski kup",
    date: new Date("2027-02-14T00:00:00Z"),
    playerCount: 19,
    results,
    tournamentId: "abc",
    baseUrl,
  };

  it("poredak je po mjestu, bez obzira na redoslijed unosa", () => {
    const text = buildResultsAnnouncement(base);
    const lines = text.split("\n").filter((l) => /^\d+\. [A-ZČĆŠŽĐ]/.test(l));
    expect(lines[0]).toContain("1. Ivan Marić");
    expect(lines[1]).toContain("2. Petar Vlašić");
    expect(lines[2]).toContain("3. Ana Bogdanović");
  });

  it("prikazuje pet mjesta po zadanome", () => {
    const lines = buildResultsAnnouncement(base)
      .split("\n")
      .filter((l) => /^\d+\. [A-ZČĆŠŽĐ]/.test(l));
    expect(lines).toHaveLength(5);
  });

  it("broj mjesta se može promijeniti", () => {
    const lines = buildResultsAnnouncement({ ...base, topCount: 3 })
      .split("\n")
      .filter((l) => /^\d+\. [A-ZČĆŠŽĐ]/.test(l));
    expect(lines).toHaveLength(3);
  });

  it("sadrži broj igrača i poveznicu", () => {
    const text = buildResultsAnnouncement(base);
    expect(text).toContain("19 igrača");
    expect(text).toContain(`${baseUrl}/turniri/abc`);
  });

  it("igrač bez bodova nema dopisan iznos", () => {
    const text = buildResultsAnnouncement({
      ...base,
      results: [{ rank: 1, firstName: "Ana", lastName: "Test", gpPoints: null }],
    });
    expect(text).toContain("1. Ana Test");
    expect(text).not.toContain("— null");
  });

  it("jednina i množina za bodove", () => {
    const text = buildResultsAnnouncement({
      ...base,
      results: [{ rank: 1, firstName: "A", lastName: "B", gpPoints: 1 }],
    });
    expect(text).toContain("1 bod");
    expect(text).not.toContain("1 bodova");
  });
});
