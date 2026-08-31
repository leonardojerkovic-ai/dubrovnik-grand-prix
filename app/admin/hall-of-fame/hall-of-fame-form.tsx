"use client";

import { useFormState, useFormStatus } from "react-dom";
import type { ActionState } from "../players/actions";

type Season = { id: string; yearLabel: string; system: string };
type PlayerOption = { id: string; label: string };

const CATEGORY_OPTIONS = [
  "OPCI",
  "ZENE",
  "U20",
  "U16",
  "U12",
  "S50",
  "S65",
  "U1800",
  "AKADEMIJA",
];

const initialState: ActionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-gold px-4 py-2 text-sm font-semibold text-navy hover:bg-gold-light disabled:opacity-50"
    >
      {pending ? "Dodavanje…" : "+ Dodaj zapis"}
    </button>
  );
}

export function HallOfFameForm({
  action,
  seasons,
  players,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  seasons: Season[];
  players: PlayerOption[];
}) {
  const [state, formAction] = useFormState(action, initialState);

  return (
    <form action={formAction} className="grid gap-3 md:grid-cols-5 md:items-end">
      {state.message && (
        <p className="md:col-span-5 rounded-md bg-crimson/10 px-3 py-2 text-sm text-crimson">
          {state.message}
        </p>
      )}

      <label className="grid gap-1 text-sm font-medium text-navy">
        Sezona
        <select name="seasonId" required className="input">
          <option value="">—</option>
          {seasons.map((s) => (
            <option key={s.id} value={s.id}>
              {s.system === "GP" ? "GP" : "Akademija"} {s.yearLabel}
            </option>
          ))}
        </select>
      </label>

      <label className="grid gap-1 text-sm font-medium text-navy">
        Kategorija
        <select name="categoryCode" required className="input">
          {CATEGORY_OPTIONS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>

      <label className="grid gap-1 text-sm font-medium text-navy">
        Mjesto
        <select name="place" required className="input">
          <option value="1">1.</option>
          <option value="2">2.</option>
          <option value="3">3.</option>
        </select>
      </label>

      <label className="grid gap-1 text-sm font-medium text-navy">
        Igrač
        <select name="playerId" required className="input">
          <option value="">—</option>
          {players.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
      </label>

      <label className="grid gap-1 text-sm font-medium text-navy">
        Bodovi
        <input type="number" name="pointsTotal" required className="input" />
      </label>

      <div className="md:col-span-5">
        <SubmitButton />
      </div>
    </form>
  );
}
