"use client";

import { useState, useTransition } from "react";
import { linkUserToPlayer, unlinkUserFromPlayer } from "./actions";

type PlayerOption = {
  id: string;
  firstName: string;
  lastName: string;
  birthYear: number;
};

/**
 * Upravljanje vezom između korisničkog računa i igračkog profila.
 *
 * Veza je 1:1 (Player.userId), pa se u izborniku nude samo profili koji
 * još nemaju vlasnika. Povezivanje se NIKAD ne događa samo od sebe —
 * ime i godište su javni podaci s FIDE stranica, pa bi automatsko
 * povezivanje omogućilo preuzimanje tuđeg profila.
 */
export function PlayerLink({
  userId,
  linkedName,
  claimedName,
  claimedBirthYear,
  needsLink,
  suggestedPlayerId,
  players,
}: {
  userId: string;
  linkedName: string | null;
  claimedName: string | null;
  claimedBirthYear: number | null;
  needsLink: boolean;
  suggestedPlayerId: string | null;
  players: PlayerOption[];
}) {
  const [selected, setSelected] = useState(suggestedPlayerId ?? "");
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const run = (fn: () => Promise<unknown>) => {
    setError(null);
    startTransition(async () => {
      try {
        await fn();
        setOpen(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Radnja nije uspjela.");
      }
    });
  };

  if (linkedName) {
    return (
      <div className="text-sm">
        <span className="text-navy">{linkedName}</span>
        <button
          type="button"
          disabled={isPending}
          onClick={() => run(() => unlinkUserFromPlayer(userId))}
          className="ml-2 text-xs text-crimson hover:underline disabled:opacity-50"
        >
          ukloni vezu
        </button>
        {error && <p className="mt-1 text-xs text-crimson">{error}</p>}
      </div>
    );
  }

  return (
    <div className="text-sm">
      {needsLink && (
        <p className="mb-1 text-xs text-gold-dark">
          Traži profil{" "}
          <strong>
            {claimedName ?? "—"}
            {claimedBirthYear ? ` (${claimedBirthYear}.)` : ""}
          </strong>
          . Potvrdi tek kad si siguran tko je osoba.
        </p>
      )}

      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-xs text-navy underline hover:text-crimson"
        >
          {needsLink ? "Riješi zahtjev" : "Poveži s igračem"}
        </button>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selected}
            disabled={isPending}
            onChange={(e) => setSelected(e.target.value)}
            className="input py-1.5 text-sm"
          >
            <option value="">Odaberi igrača…</option>
            {players.map((p) => (
              <option key={p.id} value={p.id}>
                {p.lastName} {p.firstName} ({p.birthYear}.)
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={isPending || !selected}
            onClick={() => run(() => linkUserToPlayer(userId, selected))}
            className="rounded-md bg-navy px-3 py-1.5 text-xs font-semibold text-paper disabled:opacity-50"
          >
            Poveži
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-xs text-ink/60 hover:text-navy"
          >
            Odustani
          </button>
        </div>
      )}
      {error && <p className="mt-1 text-xs text-crimson">{error}</p>}
    </div>
  );
}
