"use client";

import { useFormState, useFormStatus } from "react-dom";
import type { ActionState } from "../players/actions";

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
      {pending ? "Dodavanje…" : "+ Dodaj dokument"}
    </button>
  );
}

export function DocumentForm({
  action,
  seasons,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  seasons: Season[];
}) {
  const [state, formAction] = useFormState(action, initialState);

  return (
    <form action={formAction} className="grid gap-3 md:grid-cols-4 md:items-end">
      <label className="grid gap-1 text-sm font-medium text-navy md:col-span-2">
        Naziv
        <input name="title" required className="input" />
        {state.errors?.title && (
          <span className="text-xs text-crimson">{state.errors.title[0]}</span>
        )}
      </label>

      <label className="grid gap-1 text-sm font-medium text-navy">
        Kategorija
        <select name="category" className="input" defaultValue="PRAVILNIK">
          <option value="PRAVILNIK">Pravilnik</option>
          <option value="ZAPISNIK">Zapisnik</option>
          <option value="OSTALO">Ostalo</option>
        </select>
      </label>

      <label className="grid gap-1 text-sm font-medium text-navy">
        Sezona (opcionalno)
        <select name="seasonId" className="input" defaultValue="">
          <option value="">—</option>
          {seasons.map((s) => (
            <option key={s.id} value={s.id}>
              {s.system === "GP" ? "GP" : "Akademija"} {s.yearLabel}
            </option>
          ))}
        </select>
      </label>

      <label className="grid gap-1 text-sm font-medium text-navy md:col-span-3">
        Poveznica na datoteku
        <input
          name="fileUrl"
          type="text"
          placeholder="/dokumenti/pravilnik.pdf  ili  https://..."
          required
          className="input"
        />
        <span className="mt-1 block text-xs text-ink/55">
          Datoteke smještene u <code>public/dokumenti</code> u repozitoriju
          dostupne su kao <code>/dokumenti/naziv.pdf</code>. Takva poveznica ne
          istječe i ne ovisi o tuđim dozvolama.
        </span>
        {state.errors?.fileUrl && (
          <span className="text-xs text-crimson">{state.errors.fileUrl[0]}</span>
        )}
      </label>

      <SubmitButton />
    </form>
  );
}
