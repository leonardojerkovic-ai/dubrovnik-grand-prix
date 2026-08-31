"use client";

import { useFormState, useFormStatus } from "react-dom";
import type { ActionState } from "../players/actions";

type Tournament = { id: string; name: string };
type Season = { id: string; yearLabel: string; system: string };

const initialState: ActionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-gold px-4 py-2 text-sm font-semibold text-navy hover:bg-gold-light disabled:opacity-50"
    >
      {pending ? "Objavljivanje…" : "+ Objavi najavu"}
    </button>
  );
}

export function AnnouncementForm({
  action,
  tournaments,
  seasons,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  tournaments: Tournament[];
  seasons: Season[];
}) {
  const [state, formAction] = useFormState(action, initialState);

  return (
    <form action={formAction} className="grid gap-3">
      <label className="grid gap-1 text-sm font-medium text-navy">
        Naslov
        <input name="title" required className="input" />
        {state.errors?.title && (
          <span className="text-xs text-crimson">{state.errors.title[0]}</span>
        )}
      </label>

      <label className="grid gap-1 text-sm font-medium text-navy">
        Sadržaj
        <textarea name="body" required rows={4} className="input" />
        {state.errors?.body && (
          <span className="text-xs text-crimson">{state.errors.body[0]}</span>
        )}
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="grid gap-1 text-sm font-medium text-navy">
          Vezano uz turnir (opcionalno)
          <select name="tournamentId" className="input" defaultValue="">
            <option value="">—</option>
            {tournaments.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm font-medium text-navy">
          Vezano uz sezonu (opcionalno)
          <select name="seasonId" className="input" defaultValue="">
            <option value="">—</option>
            {seasons.map((s) => (
              <option key={s.id} value={s.id}>
                {s.system === "GP" ? "GP" : "Akademija"} {s.yearLabel}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div>
        <SubmitButton />
      </div>
    </form>
  );
}
