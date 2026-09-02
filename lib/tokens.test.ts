import { describe, expect, it } from "vitest";
import { generateResetToken, hashResetToken } from "./tokens";

describe("tokeni za reset lozinke", () => {
  it("generira token od 64 heksadekadska znaka (32 bajta)", () => {
    const token = generateResetToken();
    expect(token).toMatch(/^[0-9a-f]{64}$/);
  });

  it("dva uzastopna tokena nisu jednaka", () => {
    expect(generateResetToken()).not.toBe(generateResetToken());
  });

  it("hash je determinističan", () => {
    const token = generateResetToken();
    expect(hashResetToken(token)).toBe(hashResetToken(token));
  });

  it("hash se razlikuje od samog tokena", () => {
    const token = generateResetToken();
    expect(hashResetToken(token)).not.toBe(token);
  });

  it("različiti tokeni daju različite hasheve", () => {
    expect(hashResetToken("a")).not.toBe(hashResetToken("b"));
  });
});
