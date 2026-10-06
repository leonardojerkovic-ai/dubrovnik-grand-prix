"use client";

import { useState, useTransition } from "react";
import { saveTournamentResults, type ResultRow } from "./actions";
import { bezNule } from "@/lib/ratings/vrijednost";
import { duplicatePlayerIds } from "@/lib/scoring/ranks";

type PlayerOption = {
  id: string;
  label: string;
  /** Rejting na dan turnira — predlaže se pri odabiru igrača. */
  predlozeniRejting: number | null;
};

export function ResultsForm({
  tournamentId,
  players,
  initialRows,
  editable = true,
}: {
  tournamentId: string;
  players: PlayerOption[];
  initialRows: ResultRow[];
  /** Kad su rezultati konačni (čl. 29), obrazac je samo za čitanje. */
  editable?: boolean;
}) {
  const [rows, setRows] = useState<ResultRow[]>(
    initialRows.length > 0
      ? initialRows
      : [{ playerId: "", rank: 1, rating: null, gamesPlayed: true }]
  );
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  function updateRow(index: number, patch: Partial<ResultRow>) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  const predlogZa = new Map(
    players.map((p) => [p.id, p.predlozeniRejting] as const)
  );

  /**
   * Odabir igrača puni rejting iz snimka s dana turnira — ali samo u prazno
   * polje. Vrijednost koju je admin upisao ne prepisuje se nikad.
   */
  function odaberiIgraca(index: number, playerId: string) {
    setRows((prev) =>
      prev.map((r, i) => {
        if (i !== index) return r;
        const predlog = predlogZa.get(playerId) ?? null;
        return {
          ...r,
          playerId,
          rating: r.rating === null ? predlog : r.rating,
        };
      })
    );
  }

  function addRow() {
    setRows((prev) => [
      ...prev,
      { playerId: "", rank: prev.length + 1, rating: null, gamesPlayed: true },
    ]);
  }

  function removeRow(index: number) {
    setRows((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);

    const cleaned = rows
      .filter((r) => r.playerId)
      // Nula iz Swiss-Managera znači „nema rejtinga", ne rejting nula.
      // Server to normalizira isto, ovo je samo da se vidi i prije predaje.
      .map((r) => ({ ...r, rating: bezNule(r.rating) }));
    if (cleaned.length === 0) {
      setFeedback({ ok: false, text: "Dodaj barem jednog igrača." });
      return;
    }

    // Isti igrač u dva reda. Server to odbija svakako, ali ovdje se vidi
    // odmah i bez čekanja — a upravo je to greška koja se u padajućem
    // izborniku s pedesetak imena napravi najlakše.
    const ponovljeni = duplicatePlayerIds(
      cleaned.filter((r) => r.gamesPlayed)
    );
    if (ponovljeni.length > 0) {
      const imena = ponovljeni
        .map((id) => players.find((p) => p.id === id)?.label ?? id)
        .join(", ");
      setFeedback({
        ok: false,
        text: `Isti igrač je unesen više puta: ${imena}. Svaki igrač smije stajati samo u jednom redu.`,
      });
      return;
    }

    startTransition(async () => {
      const result = await saveTournamentResults(tournamentId, cleaned);
      if (result.error) {
        setFeedback({ ok: false, text: result.error });
      } else {
        setFeedback({ ok: true, text: result.message ?? "Spremljeno." });
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
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
              <th className="px-3 py-2 w-16">Mjesto</th>
              <th className="px-3 py-2">Igrač</th>
              <th className="px-3 py-2 w-32">Rejting</th>
              <th className="px-3 py-2 w-28">Odigrao</th>
              <th className="px-3 py-2 w-10" />
            </tr>
          </thead>
          <tbody className="divide-y divide-navy/10">
            {rows.map((row, i) => (
              <tr key={i}>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    min={1}
                    value={row.rank}
                    onChange={(e) => updateRow(i, { rank: Number(e.target.value) })}
                    className="input w-16"
                  />
                </td>
                <td className="px-3 py-2">
                  <select
                    value={row.playerId}
                    onChange={(e) => odaberiIgraca(i, e.target.value)}
                    className="input w-full"
                  >
                    <option value="">— odaberi igrača —</option>
                    {players.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    placeholder="1400"
                    value={row.rating ?? ""}
                    onChange={(e) =>
                      updateRow(i, {
                        rating: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                    className="input w-28"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="checkbox"
                    checked={row.gamesPlayed}
                    onChange={(e) => updateRow(i, { gamesPlayed: e.target.checked })}
                    className="h-4 w-4 rounded border-navy/30"
                  />
                </td>
                <td className="px-3 py-2 text-right">
                  <button
                    type="button"
                    onClick={() => removeRow(i)}
                    className="text-crimson hover:underline text-xs"
                  >
                    Ukloni
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={addRow}
          className="rounded-md border border-navy/20 px-4 py-2 text-sm font-semibold text-navy hover:bg-navy/5"
        >
          + Dodaj red
        </button>
        <button
          type="submit"
          disabled={isPending || !editable}
          title={
            editable
              ? undefined
              : "Rezultati su konačni — otključajte ih da biste spremili izmjene."
          }
          className="rounded-md bg-navy px-5 py-2.5 text-sm font-semibold text-paper hover:bg-navy-light disabled:opacity-50"
        >
          {isPending ? "Računam bodove…" : "Izračunaj i spremi bodove"}
        </button>
      </div>

      <p className="text-xs text-ink/50">
        Rejting se pri odabiru igrača predlaže iz zadnje liste do dana
        turnira; prepiši ga ako je na turniru vrijedio drugi. Ostavi prazno
        samo ako igrač tada nije imao rejting u ovom tempu — u GP-u takav
        ulazi u prosjek za F_R kao 1400 (čl. 7) i vodi se kao neocijenjen, a u
        Akademiji „bez rejtinga&quot; znači pravo na bodove (čl. 3). Nula
        znači isto što i prazno. &quot;Odigrao&quot; neoznačeno = igrač nije
        odigrao nijednu partiju i ne ulazi u N (čl. 5).
      </p>
    </form>
  );
}
