import Link from "next/link";

/**
 * Poveznica na profil igrača — ili obični tekst, ako profila nema.
 *
 * Profil se objavljuje samo članovima Kluba. Kvalifikacijski turniri
 * Akademije otvoreni su i igračima izvan Kluba (čl. 6), a to su djeca do 14
 * godina: njihova imena stoje u popisima sudionika, medalja i nagrada, kao i
 * inače u šahu, ali stranica koja objedinjuje godište, FIDE ID, rejtinge i
 * sve rezultate ne objavljuje se. Ista granica stoji i u Politici
 * privatnosti (pogl. 6 i 22).
 *
 * Zato je `isClubMember` obavezan: svaki pozivatelj mora znati odgovor. Dok
 * je imao zadanu vrijednost `true`, svako mjesto koje ga je zaboravilo
 * poslati tiho je objavilo poveznicu.
 */
export function PlayerLink({
  id,
  isClubMember,
  className = "",
  children,
}: {
  id: string;
  isClubMember: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  if (!isClubMember) {
    return <span className={className}>{children}</span>;
  }
  return (
    <Link href={`/igraci/${id}`} className={`hover:underline ${className}`}>
      {children}
    </Link>
  );
}
