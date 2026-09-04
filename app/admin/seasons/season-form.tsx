"use client";

import { useFormState, useFormStatus } from "react-dom";
import type { ActionState } from "../players/actions";

type SeasonFormProps = {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  defaultValues?: {
    system?: string;
    yearLabel?: string;
    startDate?: Date;
    endDate?: Date;
    isActive?: boolean;
    rulebookVersion?: string | null;
  };
};

const initialState: ActionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-navy px-5 py-2.5 font-semibold text-paper hover:bg-navy-light transition-colors disabled:opacity-50"
    >
      {pending ? "Spremanje…" : "Spremi sezonu"}
    </button>
  );
}

function toDateInput(d?: Date) {
  return d ? d.toISOString().slice(0, 10) : "";
}

export function SeasonForm({ action, defaultValues = {} }: SeasonFormProps) {
  const [state, formAction] = useFormState(action, initialState);

  return (
    <form action={formAction} className="grid max-w-xl gap-4">
      {state.message && (
        <p className="rounded-md bg-academy/10 px-3 py-2 text-sm text-academy">
          {state.message}
        </p>
      )}

      <Field label="Sustav" error={state.errors?.system}>
        <select
          name="system"
          defaultValue={defaultValues.system ?? "GP"}
          required
          className="input"
        >
          <option value="GP">Dubrovnik Grand Prix (glavni sustav)</option>
          <option value="AKADEMIJA">GP Akademije</option>
        </select>
      </Field>

      <Field
        label="Oznaka sezone"
        error={state.errors?.yearLabel}
        hint='npr. "2027" za GP, "2026/27" za Akademiju'
      >
        <input
          name="yearLabel"
          defaultValue={defaultValues.yearLabel}
          required
          className="input"
        />
      </Field>

      <Field
        label="Verzija pravilnika"
        error={state.errors?.rulebookVersion}
        hint='npr. "GP-2.3" ili "AKD-1.2". Upisuje se u svaki izračunati rezultat, pa se poslije vidi po kojoj je verziji bod nastao (čl. 30).'
      >
        <input
          name="rulebookVersion"
          defaultValue={defaultValues.rulebookVersion ?? ""}
          placeholder="GP-2.3"
          className="input font-mono"
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Datum početka" error={state.errors?.startDate}>
          <input
            type="date"
            name="startDate"
            defaultValue={toDateInput(defaultValues.startDate)}
            required
            className="input"
          />
        </Field>
        <Field label="Datum kraja" error={state.errors?.endDate}>
          <input
            type="date"
            name="endDate"
            defaultValue={toDateInput(defaultValues.endDate)}
            required
            className="input"
          />
        </Field>
      </div>

      <label className="flex items-center gap-2 text-sm text-ink">
        <input
          type="checkbox"
          name="isActive"
          defaultChecked={defaultValues.isActive}
          className="h-4 w-4 rounded border-navy/30"
        />
        Aktivna sezona (prikazuje se kao trenutna na naslovnici)
      </label>
      <p className="text-xs text-ink/50 -mt-2">
        Postavljanje ove sezone kao aktivne automatski deaktivira druge
        sezone istog sustava (GP ili Akademija).
      </p>

      <SubmitButton />
    </form>
  );
}

function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string[];
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-1 text-sm font-medium text-navy">
      {label}
      {children}
      {hint && <span className="text-xs font-normal text-ink/50">{hint}</span>}
      {error && <span className="text-xs font-normal text-crimson">{error[0]}</span>}
    </label>
  );
}
