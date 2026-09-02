import Link from "next/link";

/**
 * Ime igrača, kao poveznica na profil ili kao običan tekst.
 *
 * Poveznica se prikazuje samo članovima Kluba. Kvalifikacijski turniri
 * Akademije otvoreni su i igračima izvan Kluba (čl. 6), a to su djeca do 14
 * godina — njihova imena stoje u popisima sudionika, kao i inače u šahu, ali
 * profil koji objedinjuje godište, rejtinge i sve rezultate ne objavljujemo.
 */
export function PlayerName({
  id,
  firstName,
  lastName,
  title,
  isClubMember = true,
  className = "",
}: {
  id: string;
  firstName: string;
  lastName: string;
  title?: string;
  /** Kad je false, ime se prikazuje bez poveznice. */
  isClubMember?: boolean;
  className?: string;
}) {
  const name = `${lastName} ${firstName}`;

  return (
    <>
      {title && title !== "NONE" && (
        <span className="badge-title mr-2">{title}</span>
      )}
      {isClubMember ? (
        <Link
          href={`/igraci/${id}`}
          className={`hover:text-crimson hover:underline ${className}`}
        >
          {name}
        </Link>
      ) : (
        <span className={className}>{name}</span>
      )}
    </>
  );
}
