"use client";

import { useState, useTransition } from "react";
import { registerForTournament, cancelRegistration } from "./actions";

export function RegisterButton({
  tournamentId,
  isRegistered,
  isLoggedIn,
}: {
  tournamentId: string;
  isRegistered: boolean;
  isLoggedIn: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [registered, setRegistered] = useState(isRegistered);

  if (!isLoggedIn) {
    return (
      <a
        href="/prijava"
        className="rounded-md border border-navy/20 px-4 py-2 text-sm font-semibold text-navy hover:bg-navy/5"
      >
        Prijavi se za registraciju
      </a>
    );
  }

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const result = registered
        ? await cancelRegistration(tournamentId)
        : await registerForTournament(tournamentId);

      if (result.error) {
        setError(result.error);
      } else {
        setRegistered(!registered);
      }
    });
  }

  return (
    <div className="text-right">
      <button
        onClick={handleClick}
        disabled={isPending}
        className={
          registered
            ? "rounded-md border border-crimson/40 px-4 py-2 text-sm font-semibold text-crimson hover:bg-crimson/5 disabled:opacity-50"
            : "rounded-md bg-gold px-4 py-2 text-sm font-semibold text-navy hover:bg-gold-light disabled:opacity-50"
        }
      >
        {isPending
          ? "…"
          : registered
            ? "Odjavi se"
            : "Prijavi se na turnir"}
      </button>
      {error && <p className="mt-1 text-xs text-crimson">{error}</p>}
    </div>
  );
}
