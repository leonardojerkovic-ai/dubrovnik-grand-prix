"use client";

import { useMemo, useState } from "react";
import { toCsv } from "@/lib/csv";
import {
  granicePoOznaci,
  PONUDENE_KATEGORIJE,
  PRAZNE_GRANICE,
} from "@/lib/nagrade/dob";
import {
  dodijeliNagrade,
  ukupanFond,
  ukupnoIsplaceno,
  type NovcanaNagrada,
} from "@/lib/nagrade/dodjela";
import { procitajTablicu } from "@/lib/nagrade/unos";

/** "" = bez dobnog uvjeta, "VLASTITO" = raspon se upisuje ručno. */
type DobnaKategorija = "" | "VLASTITO" | (typeof PONUDENE_KATEGORIJE)[number];

type Redak = {
  id: string;
  naziv: string;
  iznos: string;
  posebna: boolean;
  spol: "" | "M" | "F";
  dob: DobnaKategorija;
  /** Vrijede samo uz dob === "VLASTITO". */
  godisteOd: string;
  godisteDo: string;
  rejtingDo: string;
  samoClanovi: boolean;
  broj: string;
};

let brojac = 0;
function noviRedak(dio: Partial<Redak> = {}): Redak {
  brojac += 1;
  return {
    id: `n${brojac}`,
    naziv: "",
    iznos: "",
    posebna: true,
    spol: "",
    dob: "",
    godisteOd: "",
    godisteDo: "",
    rejtingDo: "",
    samoClanovi: false,
    broj: "1",
    ...dio,
  };
}

const POCETNI: Redak[] = [
  noviRedak({ naziv: "1. mjesto", posebna: false }),
  noviRedak({ naziv: "2. mjesto", posebna: false }),
  noviRedak({ naziv: "3. mjesto", posebna: false }),
];

const PRIMJER = [
  "Ime\tGodište\tSpol\tRejting\tČlan",
  "Končarević Dominik\t2008\tM\t1449\tDA",
  "Jančić Ana\t2011\tŽ\t1302\tDA",
].join("\n");

function eur(iznos: number): string {
  return new Intl.NumberFormat("hr-HR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(iznos);
}

export function NovcaneNagradeAlat() {
  const [tekst, setTekst] = useState("");
  const [godinaSezone, setGodinaSezone] = useState(String(new Date().getFullYear()));
  const [redci, setRedci] = useState<Redak[]>(POCETNI);

  const { natjecatelji, greske } = useMemo(() => procitajTablicu(tekst), [tekst]);

  const nagrade = useMemo<NovcanaNagrada[]>(() => {
    const G = Number(godinaSezone) || new Date().getFullYear();

    return redci
      .filter((r) => r.naziv.trim() !== "" && Number(r.iznos) > 0)
      .map((r, index) => {
        const granice =
          r.dob === "VLASTITO"
            ? {
                birthYearMin: r.godisteOd.trim() === "" ? null : Number(r.godisteOd),
                birthYearMax: r.godisteDo.trim() === "" ? null : Number(r.godisteDo),
              }
            : (granicePoOznaci(r.dob, G) ?? PRAZNE_GRANICE);

        return {
          id: r.id,
          naziv: r.naziv.trim(),
          iznos: Number(r.iznos),
          posebna: r.posebna,
          // Objavljeni redoslijed = redoslijed redaka u obrascu.
          redoslijed: index,
          broj: Math.max(1, Number(r.broj) || 1),
          gender: r.spol === "" ? null : r.spol,
          birthYearMin: granice.birthYearMin,
          birthYearMax: granice.birthYearMax,
          ratingMax: r.rejtingDo.trim() === "" ? null : Number(r.rejtingDo),
          clubMembersOnly: r.samoClanovi,
        };
      });
  }, [redci, godinaSezone]);

  const dodjele = useMemo(
    () => (natjecatelji.length > 0 ? dodijeliNagrade(natjecatelji, nagrade) : []),
    [natjecatelji, nagrade]
  );

  const isplaceno = ukupnoIsplaceno(dodjele);
  const fond = ukupanFond(nagrade);
  const nedodijeljeno = dodjele.filter((d) => !d.ime);

  function promijeni(id: string, dio: Partial<Redak>) {
    setRedci((prev) => prev.map((r) => (r.id === id ? { ...r, ...dio } : r)));
  }

  function preuzmiCsv() {
    const csv = toCsv(
      ["Nagrada", "Primjerak", "Iznos (EUR)", "Dobitnik", "Mjesto", "Prenesena"],
      dodjele.map((d) => [
        d.naziv,
        d.primjerak,
        d.iznos,
        d.ime ?? "nije dodijeljena",
        d.mjesto ?? "",
        d.prenesena ? "da" : "",
      ])
    );
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "novcane-nagrade.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="grid gap-6">
      <section className="grid gap-2">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="font-display font-bold text-navy">1. Konačni poredak</h3>
          <button
            type="button"
            onClick={() => setTekst(PRIMJER)}
            className="text-xs text-ink/60 underline hover:text-crimson"
          >
            umetni primjer
          </button>
        </div>
        <p className="text-xs text-ink/60">
          Označi stupce u Excelu, kopiraj i zalijepi ovdje. Poredak određuje
          redoslijed redaka. Prepoznaju se zaglavlja Ime, Godište, Spol,
          Rejting i Član; bez zaglavlja se očekuje upravo taj redoslijed
          stupaca.
        </p>
        <textarea
          value={tekst}
          onChange={(e) => setTekst(e.target.value)}
          rows={8}
          spellCheck={false}
          placeholder="Ime&#9;Godište&#9;Spol&#9;Rejting&#9;Član"
          className="input font-mono text-xs"
        />
        <p className="text-xs text-ink/60">
          Pročitano igrača: <strong className="text-navy">{natjecatelji.length}</strong>
        </p>
        {greske.length > 0 && (
          <div role="alert" className="rounded-md border border-crimson/30 bg-crimson/5 px-3 py-2 text-xs">
            <p className="font-semibold text-crimson">
              Ovi se redci nisu mogli pročitati i nisu ušli u izračun:
            </p>
            <ul className="mt-1 list-disc pl-5 text-ink/80">
              {greske.map((g) => (
                <li key={g.redak}>Redak {g.redak}: {g.poruka}</li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section className="grid gap-3">
        <h3 className="font-display font-bold text-navy">2. Objavljene nagrade</h3>
        <label className="flex items-center gap-2 text-sm text-ink">
          Godina početka sezone
          <input
            type="number"
            value={godinaSezone}
            onChange={(e) => setGodinaSezone(e.target.value)}
            className="input w-28"
          />
          <span className="text-xs text-ink/60">
            po njoj se računaju dobne kategorije (čl. 22)
          </span>
        </label>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[56rem] text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-ink/50">
              <tr>
                <th className="pb-1 pr-2 font-medium">Naziv</th>
                <th className="pb-1 pr-2 font-medium">Iznos €</th>
                <th className="pb-1 pr-2 font-medium">Vrsta</th>
                <th className="pb-1 pr-2 font-medium">Spol</th>
                <th className="pb-1 pr-2 font-medium">Dob</th>
                <th className="pb-1 pr-2 font-medium">Rejting &lt;</th>
                <th className="pb-1 pr-2 font-medium">Član</th>
                <th className="pb-1 pr-2 font-medium">Broj</th>
                <th className="pb-1" />
              </tr>
            </thead>
            <tbody>
              {redci.map((r) => (
                <tr key={r.id} className="border-t border-navy/10">
                  <td className="py-1.5 pr-2">
                    <input
                      value={r.naziv}
                      onChange={(e) => promijeni(r.id, { naziv: e.target.value })}
                      placeholder="npr. Najbolja igračica"
                      className="input w-full min-w-[12rem]"
                    />
                  </td>
                  <td className="py-1.5 pr-2">
                    <input
                      type="number"
                      min={0}
                      step={10}
                      value={r.iznos}
                      onChange={(e) => promijeni(r.id, { iznos: e.target.value })}
                      className="input w-24"
                    />
                  </td>
                  <td className="py-1.5 pr-2">
                    <select
                      value={r.posebna ? "posebna" : "opca"}
                      onChange={(e) => promijeni(r.id, { posebna: e.target.value === "posebna" })}
                      className="input w-32"
                    >
                      <option value="opca">opće mjesto</option>
                      <option value="posebna">posebna</option>
                    </select>
                  </td>
                  <td className="py-1.5 pr-2">
                    <select
                      value={r.spol}
                      onChange={(e) => promijeni(r.id, { spol: e.target.value as Redak["spol"] })}
                      className="input w-20"
                    >
                      <option value="">—</option>
                      <option value="M">M</option>
                      <option value="F">Ž</option>
                    </select>
                  </td>
                  <td className="py-1.5 pr-2">
                    <select
                      value={r.dob}
                      onChange={(e) => promijeni(r.id, { dob: e.target.value as DobnaKategorija })}
                      className="input w-28"
                    >
                      <option value="">—</option>
                      {PONUDENE_KATEGORIJE.map((k) => (
                        <option key={k} value={k}>
                          {k}
                        </option>
                      ))}
                      <option value="VLASTITO">godište…</option>
                    </select>
                    {r.dob === "VLASTITO" && (
                      <div className="mt-1 flex items-center gap-1 text-xs text-ink/60">
                        <input
                          type="number"
                          value={r.godisteOd}
                          onChange={(e) => promijeni(r.id, { godisteOd: e.target.value })}
                          placeholder="od"
                          className="input w-20"
                          aria-label={`Najranije godište — ${r.naziv || "nova nagrada"}`}
                        />
                        <span>–</span>
                        <input
                          type="number"
                          value={r.godisteDo}
                          onChange={(e) => promijeni(r.id, { godisteDo: e.target.value })}
                          placeholder="do"
                          className="input w-20"
                          aria-label={`Najkasnije godište — ${r.naziv || "nova nagrada"}`}
                        />
                      </div>
                    )}
                  </td>
                  <td className="py-1.5 pr-2">
                    <input
                      type="number"
                      step={50}
                      value={r.rejtingDo}
                      onChange={(e) => promijeni(r.id, { rejtingDo: e.target.value })}
                      placeholder="1800"
                      className="input w-24"
                    />
                  </td>
                  <td className="py-1.5 pr-2 text-center">
                    <input
                      type="checkbox"
                      checked={r.samoClanovi}
                      onChange={(e) => promijeni(r.id, { samoClanovi: e.target.checked })}
                      className="h-4 w-4 rounded border-navy/30"
                      aria-label={`Samo članovi Kluba — ${r.naziv || "nova nagrada"}`}
                    />
                  </td>
                  <td className="py-1.5 pr-2">
                    <input
                      type="number"
                      min={1}
                      value={r.broj}
                      onChange={(e) => promijeni(r.id, { broj: e.target.value })}
                      className="input w-16"
                    />
                  </td>
                  <td className="py-1.5">
                    <button
                      type="button"
                      onClick={() => setRedci((prev) => prev.filter((x) => x.id !== r.id))}
                      className="text-xs text-ink/50 hover:text-crimson"
                    >
                      ukloni
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-sm">
          <button
            type="button"
            onClick={() => setRedci((prev) => [...prev, noviRedak()])}
            className="rounded-md border border-navy/20 px-3 py-1.5 font-medium text-navy hover:bg-navy/5"
          >
            + Dodaj nagradu
          </button>
          <span className="text-ink/60">
            Objavljeni redoslijed posebnih nagrada je redoslijed redaka u ovoj
            tablici; odlučuje samo kad su iznosi jednaki. Za dob koju gotove
            oznake ne pokrivaju odaberi &bdquo;godište…&rdquo; i upiši raspon — prazno
            polje znači da s te strane nema granice.
          </span>
        </div>
      </section>

      <section className="grid gap-3">
        <h3 className="font-display font-bold text-navy">3. Raspodjela</h3>

        {natjecatelji.length === 0 || nagrade.length === 0 ? (
          <p className="text-sm text-ink/60">
            Za izračun trebaju i poredak i barem jedna nagrada s imenom i
            iznosom većim od nule.
          </p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-wide text-ink/50">
                  <tr>
                    <th className="pb-1 pr-3 font-medium">Nagrada</th>
                    <th className="pb-1 pr-3 font-medium">Iznos</th>
                    <th className="pb-1 pr-3 font-medium">Dobitnik</th>
                    <th className="pb-1 font-medium">Mjesto</th>
                  </tr>
                </thead>
                <tbody>
                  {dodjele.map((d) => (
                    <tr key={`${d.nagradaId}-${d.primjerak}`} className="border-t border-navy/10">
                      <td className="py-1.5 pr-3 text-navy">
                        {d.naziv}
                        {d.primjerak > 1 && (
                          <span className="text-ink/50"> ({d.primjerak}.)</span>
                        )}
                      </td>
                      <td className="py-1.5 pr-3 tabular-nums">{eur(d.iznos)}</td>
                      <td className="py-1.5 pr-3">
                        {d.ime ? (
                          <>
                            <span className="font-medium text-ink">{d.ime}</span>
                            {d.prenesena && (
                              <span
                                className="ml-2 rounded-full bg-gold/20 px-2 py-0.5 text-xs text-navy"
                                title="Igrač koji bi je inače dobio uzeo je veću nagradu."
                              >
                                prenesena
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-ink/50">nitko ne zadovoljava uvjete</span>
                        )}
                      </td>
                      <td className="py-1.5 tabular-nums text-ink/70">{d.mjesto ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-1 border-t border-navy/10 pt-3 text-sm">
              <span>
                Za isplatu: <strong className="text-navy">{eur(isplaceno)}</strong>
              </span>
              <span className="text-ink/60">Objavljeni fond: {eur(fond)}</span>
              {nedodijeljeno.length > 0 && (
                <span className="text-crimson">
                  Nedodijeljeno: {eur(fond - isplaceno)} ({nedodijeljeno.length}{" "}
                  {nedodijeljeno.length === 1 ? "nagrada" : "nagrade/a"})
                </span>
              )}
              <button
                type="button"
                onClick={preuzmiCsv}
                className="rounded-md border border-navy/20 px-3 py-1.5 font-medium text-navy hover:bg-navy/5"
              >
                Preuzmi CSV
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
