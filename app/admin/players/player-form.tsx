"use client";

import { useFormState, useFormStatus } from "react-dom";
import { TITLES } from "@/lib/validation/player";
import type { ActionState } from "./actions";

type PlayerFormProps = {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  defaultValues?: {
    firstName?: string;
    lastName?: string;
    fideId?: string | null;
    title?: string;
    gender?: string;
    birthYear?: number;
    isClubMember?: boolean;
    memberSince?: Date | null;
    memberUntil?: Date | null;
    deceased?: boolean;
    deceasedYear?: number | null;
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
      {pending ? "Spremanje…" : "Spremi igrača"}
    </button>
  );
}

export function PlayerForm({ action, defaultValues = {} }: PlayerFormProps) {
  const [state, formAction] = useFormState(action, initialState);

  const toInputDate = (d?: Date | null) =>
    d ? d.toISOString().slice(0, 10) : "";


  return (
    <form action={formAction} className="grid max-w-xl gap-4">
      {state.message && (
        <p className="rounded-md bg-crimson/10 px-3 py-2 text-sm text-crimson">
          {state.message}
        </p>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Field label="Ime" name="firstName" error={state.errors?.firstName}>
          <input
            name="firstName"
            defaultValue={defaultValues.firstName}
            required
            className="input"
          />
        </Field>
        <Field label="Prezime" name="lastName" error={state.errors?.lastName}>
          <input
            name="lastName"
            defaultValue={defaultValues.lastName}
            required
            className="input"
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Titula" name="title" error={state.errors?.title}>
          <select name="title" defaultValue={defaultValues.title ?? "NONE"} className="input">
            {TITLES.map((t) => (
              <option key={t} value={t}>
                {t === "NONE" ? "— bez titule —" : t}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Spol" name="gender" error={state.errors?.gender}>
          <select name="gender" defaultValue={defaultValues.gender} required className="input">
            <option value="">— odaberi —</option>
            <option value="M">Muški</option>
            <option value="F">Ženski</option>
          </select>
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="FIDE ID" name="fideId" error={state.errors?.fideId}>
          <input
            name="fideId"
            defaultValue={defaultValues.fideId ?? ""}
            placeholder="npr. 14503xxx"
            className="input"
          />
        </Field>
        <Field label="Godište" name="birthYear" error={state.errors?.birthYear}>
          <input
            type="number"
            name="birthYear"
            defaultValue={defaultValues.birthYear}
            required
            className="input"
          />
        </Field>
      </div>

      <div className="rounded-md border border-navy/10 bg-paper/60 px-3 py-3">
        <label className="flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            name="deceased"
            defaultChecked={defaultValues.deceased}
            className="h-4 w-4 rounded border-navy/30"
          />
          Preminuo
        </label>
        <p className="mt-1 text-xs text-ink/55">
          Igrač nestaje s javnog popisa igrača i iz odabira za buduće turnire.
          Rezultati, ljestvice i Hall of Fame ostaju netaknuti.
        </p>
        <div className="mt-2 max-w-[10rem]">
          <input
            type="number"
            name="deceasedYear"
            min={1900}
            max={new Date().getFullYear()}
            placeholder="Godina smrti"
            defaultValue={defaultValues.deceasedYear ?? ""}
            className="input"
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-ink">
        <input
          type="checkbox"
          name="isClubMember"
          defaultChecked={defaultValues.isClubMember}
          className="h-4 w-4 rounded border-navy/30"
        />
        Član ŠK Dubrovnik
      </label>

      <div className="grid grid-cols-2 gap-4">
        <Field
          label="Član od"
          name="memberSince"
          error={state.errors?.memberSince}
          hint="Bez ovog datuma članstvo na ranijim turnirima nije provjerljivo (čl. 4)."
        >
          <input
            type="date"
            name="memberSince"
            defaultValue={toInputDate(defaultValues.memberSince)}
            className="input"
          />
        </Field>
        <Field
          label="Član do"
          name="memberUntil"
          error={state.errors?.memberUntil}
          hint="Ostavi prazno dok je igrač član."
        >
          <input
            type="date"
            name="memberUntil"
            defaultValue={toInputDate(defaultValues.memberUntil)}
            className="input"
          />
        </Field>
      </div>

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
  name: string;
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
