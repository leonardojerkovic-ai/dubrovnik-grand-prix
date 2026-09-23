import { describe, expect, it } from "vitest";
import { normalizeEmail } from "./email-address";

describe("normalizeEmail", () => {
  it("pretvara u mala slova", () => {
    expect(normalizeEmail("Ivan@Gmail.COM")).toBe("ivan@gmail.com");
  });

  it("uklanja rubne razmake", () => {
    expect(normalizeEmail("  ivan@gmail.com \t")).toBe("ivan@gmail.com");
  });

  it("dvije inačice iste adrese daju isti rezultat", () => {
    expect(normalizeEmail(" Ivan@GMAIL.com")).toBe(
      normalizeEmail("ivan@gmail.com")
    );
  });

  it("ne dira ostatak adrese", () => {
    expect(normalizeEmail("ivan.horvat+gp@skdubrovnik.hr")).toBe(
      "ivan.horvat+gp@skdubrovnik.hr"
    );
  });
});
