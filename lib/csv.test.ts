import { describe, expect, it } from "vitest";
import { csvFileName, toCsv } from "./csv";

describe("toCsv", () => {
  it("koristi točku-zarez i CRLF", () => {
    const csv = toCsv(["A", "B"], [[1, 2]]);
    expect(csv).toBe("﻿A;B\r\n1;2\r\n");
  });

  it("počinje BOM-om zbog Excela", () => {
    expect(toCsv(["A"], [])).toMatch(/^﻿/);
  });

  it("navodi polje koje sadrži razdjelnik", () => {
    const csv = toCsv(["A"], [["Perak; Ana"]]);
    expect(csv).toContain('"Perak; Ana"');
  });

  it("udvostručuje navodnike", () => {
    const csv = toCsv(["A"], [['zove se "Maro"']]);
    expect(csv).toContain('"zove se ""Maro"""');
  });

  it("prazne vrijednosti daju prazno polje", () => {
    expect(toCsv(["A", "B"], [[null, undefined]])).toContain(";");
  });

  it("čuva dijakritiku", () => {
    expect(toCsv(["A"], [["Končarević"]])).toContain("Končarević");
  });
});

describe("csvFileName", () => {
  it("miče dijakritiku i razmake", () => {
    expect(csvFileName("Ljestvica", "Opći GP", "2027")).toBe(
      "ljestvica-opci-gp-2027.csv"
    );
  });

  it("prevodi đ", () => {
    expect(csvFileName("Đakovo")).toBe("dakovo.csv");
  });

  it("ne ostavlja prazno ime", () => {
    expect(csvFileName("---")).toBe("izvoz.csv");
  });
});
