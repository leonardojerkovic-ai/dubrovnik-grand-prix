import { describe, expect, it } from "vitest";
import {
  imaMjesta,
  kolikoPromaknuti,
  odjavaOslobadaMjesto,
  statusNovePrijave,
} from "./kvota";

describe("imaMjesta", () => {
  it("bez kvote uvijek ima mjesta", () => {
    expect(imaMjesta(0, null)).toBe(true);
    expect(imaMjesta(500, null)).toBe(true);
    expect(imaMjesta(500, undefined)).toBe(true);
  });

  it("zadnje mjesto je slobodno, prekobrojno nije", () => {
    expect(imaMjesta(19, 20)).toBe(true);
    expect(imaMjesta(20, 20)).toBe(false);
    expect(imaMjesta(21, 20)).toBe(false);
  });
});

describe("statusNovePrijave", () => {
  it("dok ima mjesta prijava je potvrđena", () => {
    expect(statusNovePrijave(0, 20)).toBe("PRIJAVLJEN");
    expect(statusNovePrijave(19, 20)).toBe("PRIJAVLJEN");
  });

  it("kad su mjesta popunjena prijava ide na čekanje", () => {
    expect(statusNovePrijave(20, 20)).toBe("NA_CEKANJU");
  });

  it("turnir bez kvote nikoga ne stavlja na čekanje", () => {
    expect(statusNovePrijave(999, null)).toBe("PRIJAVLJEN");
  });
});

describe("kolikoPromaknuti", () => {
  it("prazna lista ne daje nikoga", () => {
    expect(kolikoPromaknuti(10, 0, 20)).toBe(0);
  });

  it("promiče točno onoliko koliko stane", () => {
    expect(kolikoPromaknuti(19, 5, 20)).toBe(1);
    expect(kolikoPromaknuti(15, 2, 20)).toBe(2);
    expect(kolikoPromaknuti(15, 9, 20)).toBe(5);
  });

  it("puna kvota ne promiče nikoga", () => {
    expect(kolikoPromaknuti(20, 3, 20)).toBe(0);
  });

  it("kvota snižena ispod broja prijavljenih nikoga ne izbacuje ni ne promiče", () => {
    // Vlasnikova odluka: oduzeti potvrđeno mjesto gore je od prekoračenja.
    expect(kolikoPromaknuti(25, 4, 20)).toBe(0);
  });

  it("bez kvote prolaze svi s liste", () => {
    // Nastaje kad se kvota ukloni s turnira koji ju je imao.
    expect(kolikoPromaknuti(30, 7, null)).toBe(7);
  });
});

describe("odjavaOslobadaMjesto", () => {
  it("odlazi li netko tko je držao mjesto", () => {
    expect(odjavaOslobadaMjesto("PRIJAVLJEN")).toBe(true);
  });

  it("odjava s liste čekanja ne oslobađa ništa", () => {
    expect(odjavaOslobadaMjesto("NA_CEKANJU")).toBe(false);
    expect(odjavaOslobadaMjesto("OTKAZAN")).toBe(false);
  });
});
