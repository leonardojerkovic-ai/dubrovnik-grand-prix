"use client";

import { useState, useTransition } from "react";
import type { LockStatus } from "@/lib/scoring/results-lock";
import { unlockTournamentResults } from "./actions";

function formatDateTime(d: Date): string {
  return new Intl.DateTimeFormat("hr-HR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(d);
}

export function LockBanner({
  tournamentId,
  status,
  unlockReason,
  unlockedByEmail,
}: {
  tournamentId: string;
  status: LockStatus & { objectionDeadline: Date | null };
  unlockReason: string | null;
  unlockedByEmail: string | null;
}) {
  const [reason, setReason] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (status.state === "NEOBJAVLJENO") {
    return (
      <div className="mb-4 rounded-md border border-navy/15 bg-white px-4 py-3 text-sm text-ink/70">
        Rezultati još nisu objavljeni. Spremanjem počinje teći rok od 7 dana za
        prigovor (čl. 29).
      </div>
    );
  }

  if (status.state === "ROK_TECE") {
    return (
      <div className="mb-4 rounded-md border border-navy/15 bg-paper px-4 py-3 text-sm text-ink/80">
        Rok za prigovor teče do{" "}
        <strong>{formatDateTime(status.objectionDeadline!)}</strong> — još{" "}
        {status.daysRemaining}{" "}
        {status.daysRemaining === 1 ? "dan" : "dana"}. Ispravci su do tada
        rutinski i ne traže otključavanje.
      </div>
    );
  }

  if (status.state === "OTKLJUCANO") {
    return (
      <div className="mb-4 rounded-md border border-gold/50 bg-gold/10 px-4 py-3 text-sm text-navy">
        <p>
          Rezultati su privremeno otključani i izmjene su moguće. Otključavanje
          i razlog zabilježeni su u tragu izmjena.
        </p>
        {unlockReason && (
          <p className="mt-1 text-xs text-ink/60">
            Razlog: {unlockReason}
            {unlockedByEmail ? ` — ${unlockedByEmail}` : ""}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="mb-4 rounded-md border border-crimson/30 bg-crimson/5 px-4 py-3 text-sm">
      <p className="text-navy">
        <strong>Rezultati su konačni.</strong> Rok za prigovor istekao je{" "}
        {formatDateTime(status.objectionDeadline!)} (čl. 29). Za ispravak
        otključajte rezultate uz obrazloženje — otključavanje traje dva sata i
        bilježi se u tragu izmjena.
      </p>

      {!showForm ? (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="mt-2 text-sm text-crimson underline hover:no-underline"
        >
          Otključaj radi ispravka
        </button>
      ) : (
        <div className="mt-3">
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            placeholder="Zašto se rezultat mijenja nakon isteka roka?"
            className="input w-full"
          />
          <div className="mt-2 flex items-center gap-3">
            <button
              type="button"
              disabled={isPending || reason.trim().length < 10}
              onClick={() => {
                setError(null);
                setFeedback(null);
                startTransition(async () => {
                  const res = await unlockTournamentResults(tournamentId, reason);
                  if (res.error) setError(res.error);
                  else {
                    setFeedback(res.message ?? "Otključano.");
                    setShowForm(false);
                  }
                });
              }}
              className="rounded-md bg-crimson px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              Potvrdi otključavanje
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-sm text-ink/60 hover:text-navy"
            >
              Odustani
            </button>
          </div>
        </div>
      )}

      {error && <p className="mt-2 text-sm text-crimson">{error}</p>}
      {feedback && <p className="mt-2 text-sm text-navy">{feedback}</p>}
    </div>
  );
}
