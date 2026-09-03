import { describe, expect, it } from "vitest";
import {
  generateLinkCode,
  hashLinkCode,
  looksLikeLinkCode,
  normalizeLinkCode,
} from "./link-code";

describe("generateLinkCode", () => {
  it("ima oblik ABCD-EFGH-JKMN", () => {
    expect(generateLinkCode()).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
  });

  it("ne sadrži znakove koji se brkaju pri prepisivanju", () => {
    const many = Array.from({ length: 300 }, generateLinkCode).join("");
    for (const c of ["0", "O", "1", "I", "L", "5", "S"]) {
      expect(many).not.toContain(c);
    }
  });

  it("dva uzastopna koda nisu jednaka", () => {
    expect(generateLinkCode()).not.toBe(generateLinkCode());
  });
});

describe("normalizeLinkCode", () => {
  it("oprašta mala slova, razmake i crtice", () => {
    const code = "ABCD-EFGH-JKMN";
    for (const variant of [
      "abcd-efgh-jkmn",
      "ABCD EFGH JKMN",
      " abcdefghjkmn ",
      "AbCd-EfGh-JkMn",
    ]) {
      expect(normalizeLinkCode(variant)).toBe(normalizeLinkCode(code));
    }
  });
});

describe("hashLinkCode", () => {
  it("isti kod daje isti otisak bez obzira na oblik unosa", () => {
    expect(hashLinkCode("abcd efgh jkmn")).toBe(hashLinkCode("ABCD-EFGH-JKMN"));
  });

  it("otisak se razlikuje od samog koda", () => {
    const code = generateLinkCode();
    expect(hashLinkCode(code)).not.toBe(code);
    expect(hashLinkCode(code)).toMatch(/^[0-9a-f]{64}$/);
  });

  it("različiti kodovi daju različite otiske", () => {
    expect(hashLinkCode("ABCD-EFGH-JKMN")).not.toBe(
      hashLinkCode("ABCD-EFGH-JKMP")
    );
  });
});

describe("looksLikeLinkCode", () => {
  it("prihvaća valjan kod u raznim oblicima", () => {
    const code = generateLinkCode();
    expect(looksLikeLinkCode(code)).toBe(true);
    expect(looksLikeLinkCode(code.toLowerCase())).toBe(true);
    expect(looksLikeLinkCode(code.replace(/-/g, " "))).toBe(true);
  });

  it("odbija prekratak, predug i kod s nedopuštenim znakovima", () => {
    expect(looksLikeLinkCode("ABCD-EFGH")).toBe(false);
    expect(looksLikeLinkCode("ABCD-EFGH-JKMN-PQRT")).toBe(false);
    expect(looksLikeLinkCode("ABCD-EFGH-JKM0")).toBe(false);
  });
});
