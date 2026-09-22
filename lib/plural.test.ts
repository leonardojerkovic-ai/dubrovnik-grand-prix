import { describe, expect, it } from "vitest";
import { plural } from "./plural";

const sat = (n: number) => plural(n, "sat", "sata", "sati");

describe("plural", () => {
  it("jednina", () => {
    expect(sat(1)).toBe("sat");
    expect(sat(21)).toBe("sat");
    expect(sat(101)).toBe("sat");
  });

  it("dva do cetiri", () => {
    expect(sat(2)).toBe("sata");
    expect(sat(3)).toBe("sata");
    expect(sat(4)).toBe("sata");
    expect(sat(22)).toBe("sata");
  });

  it("pet i vise", () => {
    expect(sat(0)).toBe("sati");
    expect(sat(5)).toBe("sati");
    expect(sat(66)).toBe("sati");
  });

  it("iznimka 11 do 14", () => {
    expect(sat(11)).toBe("sati");
    expect(sat(12)).toBe("sati");
    expect(sat(13)).toBe("sati");
    expect(sat(14)).toBe("sati");
    expect(sat(111)).toBe("sati");
  });

  it("dani", () => {
    const dan = (n: number) => plural(n, "dan", "dana", "dana");
    expect(dan(1)).toBe("dan");
    expect(dan(66)).toBe("dana");
  });
});
