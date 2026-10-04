import { PlayerLink } from "@/components/player-link";

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
        <span className="badge-title mr-2">{title}</span>
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
