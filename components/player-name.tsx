import { PlayerLink } from "@/components/player-link";
import { opisTitule } from "@/lib/players/titula";

/**
 * Ime igrača, kao poveznica na profil ili kao običan tekst.
 *
 * Granicu objavljuje PlayerLink — ovdje je samo oblik imena (titula ispred,
 * pa „Prezime Ime").
 */
export function PlayerName({
  id,
  firstName,
  lastName,
  title,
  isClubMember,
  className = "",
}: {
  id: string;
  firstName: string;
  lastName: string;
  title?: string;
  /** Kad je false, ime se prikazuje bez poveznice. Obavezno — vidi PlayerLink. */
  isClubMember: boolean;
  className?: string;
}) {
  const name = `${lastName} ${firstName}`;

  return (
    <>
      {title && title !== "NONE" && (
        // Puni naziv na prelazak mišem; za dodir ga nosi LegendaTitula
        // ispod tablice.
        <span className="badge-title mr-2" title={opisTitule(title) ?? undefined}>
          {title}
        </span>
      )}
      <PlayerLink
        id={id}
        isClubMember={isClubMember}
        className={`hover:text-crimson ${className}`}
      >
        {name}
      </PlayerLink>
    </>
  );
}
