import { describe, expect, it } from "vitest";
import { prikazanaTitula } from "./titula";

describe("prikazanaTitula", () => {
  it("zapisana titula ima prednost pred današnjom", () => {
    // Igrač je na turniru bio IV, a danas je II — tablica mora pokazati IV.
    expect(prikazanaTitula("IV", "II")).toBe("IV");
  });

  it("NONE je zapisana vrijednost, ne praznina", () => {
    // Inače bi igrač koji tada nije imao titulu dobio današnju.
    expect(prikazanaTitula("NONE", "MK")).toBe("NONE");
  });

  it("bez zapisane pada na trenutnu — turniri spremljeni prije izmjene", () => {
    expect(prikazanaTitula(null, "MK")).toBe("MK");
    expect(prikazanaTitula(undefined, "NONE")).toBe("NONE");
  });
});
