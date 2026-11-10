import { legendaTitula } from "@/lib/players/titula";

/**
 * Objašnjenje oznaka uz imena — „III treća kategorija · V peta kategorija".
 *
 * Opis na prelazak mišem (vidi PlayerName) nije dovoljan: na dodir se ne
 * prikazuje, a ljestvica se najčešće gleda s telefona. Zato isto stoji i
 * ispisano ispod tablice.
 *
 * Ne ispisuje ništa kad u tablici nema nijedne titule.
 */
export function LegendaTitula({
  titule,
}: {
  titule: Iterable<string | null | undefined>;
}) {
  const stavke = legendaTitula(titule);
  if (stavke.length === 0) return null;

  return (
    <p className="mt-2 text-xs text-subtle">
      {stavke.map((s, i) => (
        <span key={s.oznaka}>
          {i > 0 && " · "}
          <span className="font-semibold text-navy">{s.oznaka}</span> {s.opis}
        </span>
      ))}
    </p>
  );
}
