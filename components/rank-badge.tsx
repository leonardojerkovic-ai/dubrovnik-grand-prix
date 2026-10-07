import { ZADNJE_ISTAKNUTO_MJESTO, tonOdlicja } from "@/lib/dizajn/odlicja";

/**
 * Oznaka mjesta na ljestvici.
 *
 * Šahovnica je ostala ono što je i bila — potpis stranice — ali više ne ide
 * do dna tablice. U dugoj ljestvici naizmjenično tamna polja vizualno
 * nadjačaju imena i bodove, a to su podaci zbog kojih ljestvica postoji.
 * Zato:
 *
 *   1–3   boje odličja, iste kao na medaljicama (zlato, srebro, bronca)
 *   4–8   šahovnica, kao i dosad
 *   9+    obični mono broj, kao u pregledu na naslovnici
 */
export function RankBadge({ place }: { place: number }) {
  const odlicje = tonOdlicja(place);
  if (odlicje) {
    return <span className={`rank-badge ${odlicje}`}>{place}</span>;
  }

  if (place <= ZADNJE_ISTAKNUTO_MJESTO) {
    const parity = place % 2 === 0 ? "even" : "odd";
    return (
      <span className="rank-badge" data-parity={parity}>
        {place}
      </span>
    );
  }

  return <span className="rank-number">{place}</span>;
}
