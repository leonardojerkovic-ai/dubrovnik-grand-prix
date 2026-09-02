"use client";

import { useState, useTransition } from "react";
import { dismissPlayerLink, linkUserToPlayer } from "./actions";

type PlayerOption = {
  id: string;
  firstName: string;
  lastName: string;
  birthYear: number;
};

export function PlayerLinkRequest({
  userId,
  claimedName,
  claimedBirthYear,
  suggestedPlayerId,
  players,
}: {
  userId: string;
  claimedName: string | null;
  claimedBirthYear: number | null;
  suggestedPlayerId: string | null;
  players: PlayerOption[];
}) {
  const [selected, setSelected] = useState(suggestedPlayerId ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="rounded-md border border-gold/40 bg-gold/5 p-3">
      <p className="mb-2 text-sm text-navy">
        Traži povezivanje s profilom{" "}
        <strong>
          {claimedName ?? "—"}
          {claimedBirthYear ? ` (${claimedBirthYear}.)` : ""}
        </strong>
        . Provjeri je li to stvarno ta osoba prije potvrde.
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <select
          value={selected}
          disabled={isPending}
          onChange={(e) => setSelected(e.target.value)}
          className="input"
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
          onClick={() => {
            setError(null);
            startTransition(async () => {
              try {
                await linkUserToPlayer(userId, selected);
              } catch (err) {
                setError(
                  err instanceof Error ? err.message : "Povezivanje nije uspjelo."
                );
              }
            });
          }}
          className="rounded-md bg-navy px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          Poveži
        </button>

        <button
          type="button"
          disabled={isPending}
          onClick={() => {
            setError(null);
            startTransition(async () => {
              await dismissPlayerLink(userId);
            });
          }}
          className="text-sm text-crimson hover:underline disabled:opacity-50"
        >
          Odbij zahtjev
        </button>
      </div>

      {error && <p className="mt-2 text-sm text-crimson">{error}</p>}
    </div>
  );
}
