import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Shema i baza moraju se slagati oko toga što se briše zajedno s igračem.
 *
 * Migracija 20260903100000 postavila je u bazi RESTRICT na rezultate, a
 * schema.prisma je i dalje pisala Cascade. Takav razlaz ničim se ne javi:
 * sve radi dok netko ne pokrene `prisma migrate dev`, koji shemu smatra
 * istinom i tiho vrati ON DELETE CASCADE — pa brisanje jednog igrača odnese
 * i bodove svih ostalih s njegovih turnira.
 *
 * Ovaj test čita shemu kao tekst, bez baze, i pada na prvu takvu izmjenu.
 */

const shema = readFileSync(
  join(__dirname, "schema.prisma"),
  "utf-8"
);

/** Vraća tijelo modela po imenu. */
function model(ime: string): string {
  const m = shema.match(new RegExp(`\\nmodel ${ime} \\{([\\s\\S]*?)\\n\\}`));
  if (!m) throw new Error(`Model ${ime} nije nađen u schema.prisma.`);
  return m[1];
}

describe("brisanje igrača u shemi", () => {
  it("rezultati turnira se NE brišu s igračem (RESTRICT, čl. 5 — N i plasmani ostalih)", () => {
    const red = model("TournamentResult")
      .split("\n")
      .find((l) => l.trim().startsWith("player "));
    expect(red).toBeDefined();
    expect(red).toContain("onDelete: Restrict");
  });

  it("snimci rejtinga se brišu s igračem (CASCADE — podatak o igraču, ničiji drugi)", () => {
    const red = model("PlayerRatingSnapshot")
      .split("\n")
      .find((l) => l.trim().startsWith("player "));
    expect(red).toBeDefined();
    expect(red).toContain("onDelete: Cascade");
  });
});
