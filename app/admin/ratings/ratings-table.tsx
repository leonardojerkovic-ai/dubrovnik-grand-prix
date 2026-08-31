"use client";

import { useState, useTransition } from "react";
import { saveBulkRatings, type RatingRow } from "./actions";

type PlayerRow = {
  id: string;
  name: string;
  standard: number | null;
  rapid: number | null;
  blitz: number | null;
};

export function RatingsTable({ players }: { players: PlayerRow[] }) {
  const [values, setValues] = useState<Record<string, RatingRow>>(
    Object.fromEntries(
      players.map((p) => [
        p.id,
        { playerId: p.id, standard: p.standard, rapid: p.rapid, blitz: p.blitz },
      ])
    )
  );
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  function update(playerId: string, field: "standard" | "rapid" | "blitz", raw: string) {
    setValues((prev) => ({
      ...prev,
      [playerId]: {
        ...prev[playerId],
        [field]: raw === "" ? null : Number(raw),
      },
    }));
  }

  function handleSave() {
    setFeedback(null);
    startTransition(async () => {
      const result = await saveBulkRatings(Object.values(values));
      if (result.error) {
        setFeedback({ ok: false, text: result.error });
      } else {
        setFeedback({ ok: true, text: result.message ?? "Spremljeno." });
      }
    });
  }

  return (
    <div className="grid gap-4">
      {feedback && (
        <p
          className={`rounded-md px-3 py-2 text-sm ${
            feedback.ok ? "bg-academy/10 text-academy" : "bg-crimson/10 text-crimson"
          }`}
        >
          {feedback.text}
        </p>
      )}

      <div className="overflow-hidden rounded-lg border border-navy/10 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-navy/5 text-left text-xs uppercase tracking-wide text-ink/60">
            <tr>
              <th className="px-4 py-2">Igrač</th>
              <th className="px-4 py-2 w-28">Standard</th>
              <th className="px-4 py-2 w-28">Rapid</th>
              <th className="px-4 py-2 w-28">Blitz</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy/10">
            {players.map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-2 font-medium text-navy">{p.name}</td>
                {(["standard", "rapid", "blitz"] as const).map((field) => (
                  <td key={field} className="px-4 py-2">
                    <input
                      type="number"
                      className="input w-24"
                      value={values[p.id]?.[field] ?? ""}
                      onChange={(e) => update(p.id, field, e.target.value)}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div>
        <button
          onClick={handleSave}
          disabled={isPending}
          className="rounded-md bg-navy px-5 py-2.5 text-sm font-semibold text-paper hover:bg-navy-light disabled:opacity-50"
        >
          {isPending ? "Spremanje…" : "Spremi sve rejtinge"}
        </button>
        <p className="mt-2 text-xs text-ink/50">
          Prazno polje = bez promjene za taj tempo. Svaki spremljeni unos
          stvara i povijesni zapis (snapshot) s današnjim datumom, koristi se
          za izračun FR faktora GP bodova po datumu turnira (čl. 7).
        </p>
      </div>
    </div>
  );
}
