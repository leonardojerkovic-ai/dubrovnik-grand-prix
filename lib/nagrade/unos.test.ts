import { describe, expect, it } from "vitest";
import { procitajTablicu } from "./unos";

describe("procitajTablicu", () => {
  it("čita ono što ispadne iz Excela — tabovi, sa zaglavljem", () => {
    const { natjecatelji, greske } = procitajTablicu(
      [
        "Ime\tGodište\tSpol\tRejting\tČlan",
        "Končarević Dominik\t2008\tM\t1449\tDA",
        "Jančić Ana\t2011\tŽ\t1302\tDA",
        "Gость Marko\t1975\tM\t\tNE",
      ].join("\n")
    );

    expect(greske).toEqual([]);
    expect(natjecatelji).toHaveLength(3);
    expect(natjecatelji[0]).toMatchObject({
      mjesto: 1,
      ime: "Končarević Dominik",
      godiste: 2008,
      spol: "M",
      rejting: 1449,
      clan: true,
    });
    expect(natjecatelji[1]!.spol).toBe("F");
    expect(natjecatelji[2]!.rejting).toBeNull();
    expect(natjecatelji[2]!.clan).toBe(false);
  });

  it("radi i bez zaglavlja, po zadanom redoslijedu stupaca", () => {
    const { natjecatelji } = procitajTablicu("Ana\t2011\tŽ\t1302\tDA\nBoris\t1990\tM\t1800\tNE");
    expect(natjecatelji.map((n) => n.ime)).toEqual(["Ana", "Boris"]);
    expect(natjecatelji[0]!.spol).toBe("F");
  });

  it("zaglavlje smije biti drugim redoslijedom", () => {
    const { natjecatelji } = procitajTablicu(
      "Mjesto\tRejting\tIme\tSpol\n1\t1449\tAna\tŽ\n2\t1302\tBoris\tM"
    );
    expect(natjecatelji[0]).toMatchObject({ ime: "Ana", rejting: 1449, spol: "F" });
    expect(natjecatelji[0]!.godiste).toBeNull();
  });

  it("poredak određuje redoslijed redaka, ne stupac s mjestom", () => {
    // Dijeljeno drugo mjesto u izvorniku ne smije poremetiti poredak.
    const { natjecatelji } = procitajTablicu(
      "Mjesto\tIme\n1\tAna\n2\tBoris\n2\tCvita"
    );
    expect(natjecatelji.map((n) => n.mjesto)).toEqual([1, 2, 3]);
    expect(natjecatelji[2]!.ime).toBe("Cvita");
  });

  it("podnosi točku-zarez i višestruke razmake", () => {
    expect(procitajTablicu("Ana;2011;Ž;1302;DA").natjecatelji[0]!.godiste).toBe(2011);
    expect(procitajTablicu("Ana   2011   Ž   1302   DA").natjecatelji[0]!.spol).toBe("F");
  });

  it("prazne retke preskače, a redak bez imena prijavljuje", () => {
    const { natjecatelji, greske } = procitajTablicu(
      "Ime\tGodište\nAna\t2011\n\n\t2009\nBoris\t1990"
    );
    expect(natjecatelji.map((n) => n.ime)).toEqual(["Ana", "Boris"]);
    expect(greske).toHaveLength(1);
    expect(greske[0]!.poruka).toMatch(/Nema imena/);
  });

  it("prijavljuje godište koje nije godina", () => {
    const { greske } = procitajTablicu("Ime\tGodište\nAna\t11");
    expect(greske[0]!.poruka).toMatch(/nije godina/);
  });

  it("prazan unos daje prazan rezultat, bez greške", () => {
    expect(procitajTablicu("   \n\n")).toEqual({ natjecatelji: [], greske: [] });
  });
});

describe("stupac s dobnom oznakom", () => {
  it("čita Kategoriju i Vrstu kao dobnu oznaku", () => {
    const a = procitajTablicu("Ime\tKategorija\nPehar, Borna\tU20");
    const b = procitajTablicu("Ime\tVrsta\nPehar, Borna\tU20");
    expect(a.natjecatelji[0]!.kategorije).toEqual(["U20"]);
    expect(b.natjecatelji[0]!.kategorije).toEqual(["U20"]);
  });

  it("prazna ćelija daje prazan popis, a ne prazan niz znakova", () => {
    const { natjecatelji } = procitajTablicu("Ime\tVrsta\nMazur, Stefan\t");
    expect(natjecatelji[0]!.kategorije).toEqual([]);
  });

  it("nepoznate stupce preskače", () => {
    // Izvoz iz Swiss-Managera nosi i Klub, koji alatu ne treba.
    const { natjecatelji, greske } = procitajTablicu(
      "Ime\tVrsta\tSpol\tRejting\tKlub\tČlan\nPerak, Ana\tU20\tŽ\t\tŠK Dubrovnik, Dubrovnik\tDA"
    );
    expect(greske).toEqual([]);
    expect(natjecatelji[0]).toMatchObject({
      ime: "Perak, Ana",
      kategorije: ["U20"],
      spol: "F",
      rejting: null,
      clan: true,
    });
  });
});
