import { describe, expect, it } from "vitest";
import { porukaIzAdrese } from "./admin-odbijanje";

describe("porukaIzAdrese", () => {
  it("čita poruku", () => {
    expect(porukaIzAdrese({ greska: "Ne može se obrisati." })).toBe(
      "Ne može se obrisati."
    );
  });

  it("uzima prvu kad adresa ima više istih parametara", () => {
    expect(porukaIzAdrese({ greska: ["prva", "druga"] })).toBe("prva");
  });

  it("bez parametra i bez searchParams vraća undefined", () => {
    expect(porukaIzAdrese({})).toBeUndefined();
    expect(porukaIzAdrese(undefined)).toBeUndefined();
  });
});
