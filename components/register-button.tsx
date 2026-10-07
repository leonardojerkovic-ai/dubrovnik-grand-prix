"use client";

import { useState, useTransition } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { cancelRegistration, registerForTournament } from "@/app/prijave/actions";
import { useRegistrations } from "./registrations-provider";

/**
 * Gumb za prijavu na turnir, isti na svim mjestima gdje se turnir pojavljuje.
 *
 * Roditelj može voditi više djece, pa se tada za svako prikazuje zaseban
 * redak. Tko upravlja samo jednim profilom vidi običan gumb, bez izbora.
 */
export function RegisterButton({
  tournamentId,
  size = "md",
}: {
  tournamentId: string;
  size?: "sm" | "md";
}) {
  const { status } = useSession();
  const { ready, players, registeredFor, setRegistered } = useRegistrations();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Veličina ide kroz zajedničku .btn-sm klasu, da se padding ne upisuje
  // ovdje ponovno; zadana veličina gumba je ona bez modifikatora.
  const vel = size === "sm" ? "btn-sm" : "";

  // Dok se sesija i prijave učitavaju ne prikazuje se ništa — treptanje
  // između stanja izgledalo bi kao greška.
  if (status === "loading") return null;

  if (status !== "authenticated") {
    return (
      <Link
        href="/prijava"
        className={`btn-secondary ${vel}`}
      >
        Prijavi se
      </Link>
    );
  }

  if (!ready) return null;

  if (players.length === 0) {
    return (
      <Link
        href="/moji-igraci"
        className={`btn-secondary ${vel} font-medium text-muted`}
        title="Račun još nije povezan s igračkim profilom."
      >
        Poveži profil
      </Link>
    );
  }

  const registered = registeredFor(tournamentId);

  const toggle = (playerId: string, isRegistered: boolean) => {
    setError(null);
    startTransition(async () => {
      const result = isRegistered
        ? await cancelRegistration(tournamentId, playerId)
        : await registerForTournament(tournamentId, playerId);
      if (result.error) setError(result.error);
      else setRegistered(tournamentId, playerId, !isRegistered);
    });
  };

  const button = (playerId: string, label: string | null) => {
    const isRegistered = registered.includes(playerId);
    return (
      <button
        key={playerId}
        type="button"
        disabled={isPending}
        onClick={() => toggle(playerId, isRegistered)}
        className={
          isRegistered ? `btn-odjava ${vel}` : `btn-prijava ${vel}`
        }
      >
        {isPending
          ? "…"
          : `${isRegistered ? "Odjavi" : "Prijavi"}${label ? ` ${label}` : " se"}`}
      </button>
    );
  };

  return (
    <div className="text-right">
      {players.length === 1 ? (
        button(players[0]!.id, null)
      ) : (
        <div className="flex flex-col items-end gap-1.5">
          {players.map((p) =>
            button(p.id, p.isSelf ? "sebe" : p.name.split(" ")[0]!)
          )}
        </div>
      )}
      {error && <p className="mt-1 text-xs text-crimson">{error}</p>}
    </div>
  );
}
