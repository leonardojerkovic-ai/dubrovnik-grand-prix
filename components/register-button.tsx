"use client";

import { useState, useTransition } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { cancelRegistration, registerForTournament } from "@/app/prijave/actions";
import { useRegistrations } from "./registrations-provider";

/**
 * Gumb za prijavu na turnir, isti na svim mjestima gdje se turnir pojavljuje.
 *
 * Stanje ne dolazi iz poslužiteljskog prikaza nego iz konteksta, jer su
 * javne stranice u predmemoriji — vidi RegistrationsProvider.
 */
export function RegisterButton({
  tournamentId,
  size = "md",
}: {
  tournamentId: string;
  size?: "sm" | "md";
}) {
  const { status, data: session } = useSession();
  const { ready, isRegistered, setRegistered } = useRegistrations();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const pad = size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm";

  // Dok se sesija i prijave učitavaju ne prikazuje se ništa — treptanje
  // između stanja izgledalo bi kao greška.
  if (status === "loading") return null;

  if (status !== "authenticated") {
    return (
      <Link
        href="/prijava"
        className={`inline-block rounded-md border border-navy/20 font-semibold text-navy hover:bg-navy/5 ${pad}`}
      >
        Prijavi se
      </Link>
    );
  }

  const playerId = (session?.user as { playerId?: string | null } | undefined)
    ?.playerId;

  // Račun bez povezanog igračkog profila ne može nastupiti — povezivanje
  // odobrava administrator (vidi Admin → Korisnici).
  if (!playerId) {
    return (
      <span
        className={`inline-block rounded-md border border-navy/15 font-medium text-ink/50 ${pad}`}
        title="Račun još nije povezan s igračkim profilom. Administrator to potvrđuje."
      >
        Čeka povezivanje
      </span>
    );
  }

  if (!ready) return null;

  const registered = isRegistered(tournamentId);

  return (
    <div className="text-right">
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const result = registered
              ? await cancelRegistration(tournamentId)
              : await registerForTournament(tournamentId);
            if (result.error) setError(result.error);
            else setRegistered(tournamentId, !registered);
          });
        }}
        className={
          registered
            ? `rounded-md border border-crimson/40 font-semibold text-crimson hover:bg-crimson/5 disabled:opacity-50 ${pad}`
            : `rounded-md bg-gold font-semibold text-navy hover:bg-gold-light disabled:opacity-50 ${pad}`
        }
      >
        {isPending ? "…" : registered ? "Odjavi se" : "Prijavi se"}
      </button>
      {error && <p className="mt-1 text-xs text-crimson">{error}</p>}
    </div>
  );
}
