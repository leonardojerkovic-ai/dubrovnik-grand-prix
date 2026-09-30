import { describe, expect, it } from "vitest";
import { granicePoOznaci, PONUDENE_KATEGORIJE } from "./dob";

describe("granicePoOznaci", () => {
  const G = 2027;

  it("U kategorija postavlja donju granicu godišta", () => {
    expect(granicePoOznaci("U20", G)).toEqual({ birthYearMin: 2007, birthYearMax: null });
    expect(granicePoOznaci("U08", G)).toEqual({ birthYearMin: 2019, birthYearMax: null });
  });

  it("S kategorija postavlja gornju granicu godišta", () => {
    expect(granicePoOznaci("S50", G)).toEqual({ birthYearMin: null, birthYearMax: 1977 });
    // Ono zbog čega je ovo napisano: S60 nije u čl. 22, ali se smije objaviti.
    expect(granicePoOznaci("S60", G)).toEqual({ birthYearMin: null, birthYearMax: 1967 });
  });

  it("podnosi mala slova i razmak", () => {
    expect(granicePoOznaci(" s60 ", G)).toEqual(granicePoOznaci("S60", G));
    expect(granicePoOznaci("u 12", G)).toEqual(granicePoOznaci("U12", G));
  });

  it("odbija ono što nije dobna oznaka", () => {
    for (const nevaljano of ["", "X20", "U", "20", "U0", "U999", "U12a"]) {
      expect(granicePoOznaci(nevaljano, G), nevaljano).toBeNull();
    }
  });

  it("svaka ponuđena kategorija se može pročitati", () => {
    for (const oznaka of PONUDENE_KATEGORIJE) {
      expect(granicePoOznaci(oznaka, G), oznaka).not.toBeNull();
    }
  });

  it("slaže se s čl. 22 ondje gdje se preklapaju", () => {
    // Iste vrijednosti kao ageBoundsForCategory, da dva puta ne znače dvoje.
    expect(granicePoOznaci("U12", G)!.birthYearMin).toBe(G - 12);
    expect(granicePoOznaci("S65", G)!.birthYearMax).toBe(G - 65);
  });
});
