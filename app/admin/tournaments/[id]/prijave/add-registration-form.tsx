"use client";

import { useState, useTransition } from "react";
import { adminAddRegistration } from "./actions";

type PlayerOption = { id: string; label: string };

export function AddRegistrationForm({
  tournamentId,
  players,
}: {
  tournamentId: string;
  players: PlayerOption[];
}) {
  const [playerId, setPlayerId] = useState("");
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);
    startTransition(async () => {
      const result = await adminAddRegistration(tournamentId, playerId);
      if (result.error) {
        setFeedback({ ok: false, text: result.error });
      } else {
        setFeedback({ ok: true, text: result.message ?? "Dodano." });
        setPlayerId("");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mb-6 flex items-end gap-3">
      <label className="grid gap-1 text-sm font-medium text-navy">
        Dodaj igrača na popis prijavljenih
        <select
          value={playerId}
          onChange={(e) => setPlayerId(e.target.value)}
          className="input w-64"
        >
          <option value="">— odaberi igrača —</option>
          {players.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
      </label>
      <button
        type="submit"
        disabled={isPending || !playerId}
        className="rounded-md bg-gold px-4 py-2 text-sm font-semibold text-navy hover:bg-gold-light disabled:opacity-50"
      >
        {isPending ? "Dodavanje…" : "+ Dodaj"}
      </button>
      {feedback && (
        <span className={`text-sm ${feedback.ok ? "text-academy" : "text-crimson"}`}>
          {feedback.text}
        </span>
      )}
    </form>
  );
}
