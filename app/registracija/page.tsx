"use client";

import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import { registerPlayer, type RegistrationState } from "./actions";

const initialState: RegistrationState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-navy px-5 py-2.5 font-semibold text-paper hover:bg-navy-light transition-colors disabled:opacity-50"
    >
      {pending ? "Kreiranje računa…" : "Registriraj se"}
    </button>
  );
}

export default function RegistracijaPage() {
  const [state, formAction] = useFormState(registerPlayer, initialState);

  return (
    <div className="mx-auto max-w-sm px-4 py-12">
      <h1 className="font-display text-2xl font-bold text-navy mb-2">
        Registracija
      </h1>
      <p className="mb-6 text-sm text-ink/60">
        Kreiraj račun da se možeš samostalno prijavljivati na turnire.
      </p>

      <form action={formAction} className="grid gap-4">
        {state.message && (
          <p className="rounded-md bg-academy/10 px-3 py-2 text-sm text-academy">
            {state.message}
          </p>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Field label="Ime" error={state.errors?.firstName}>
            <input name="firstName" required className="input" />
          </Field>
          <Field label="Prezime" error={state.errors?.lastName}>
            <input name="lastName" required className="input" />
          </Field>
        </div>

        <Field
          label="Pristupni kod (nije obavezno)"
          error={state.errors?.linkCode}
          hint="Ako si od kluba dobio/la kod, upiši ga — račun se odmah povezuje s tvojim igračkim profilom i rezultatima."
        >
          <input
            type="text"
            name="linkCode"
            autoComplete="off"
            placeholder="ABCD-EFGH-JKMN"
            className="input font-mono tracking-widest uppercase"
          />
        </Field>

        <label className="flex items-start gap-2 rounded-md border border-navy/10 bg-paper/60 px-3 py-2.5 text-sm text-ink">
          <input
            type="checkbox"
            name="asGuardian"
            className="mt-0.5 h-4 w-4 rounded border-navy/30"
          />
          <span>
            Registriram se kao roditelj ili skrbnik
            <span className="mt-0.5 block text-xs text-ink/55">
              Kod koji upisuješ pripada djetetu. Tvoj račun neće imati vlastiti
              igrački profil, a djecu možeš dodati i kasnije u „Moji igrači“.
            </span>
          </span>
        </label>

        <Field label="Email" error={state.errors?.email}>
          <input type="email" name="email" required className="input" />
        </Field>

        <Field label="Lozinka" error={state.errors?.password} hint="Barem 8 znakova">
          <input type="password" name="password" required className="input" />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Spol" error={state.errors?.gender}>
            <select name="gender" required className="input">
              <option value="">— odaberi —</option>
              <option value="M">Muški</option>
              <option value="F">Ženski</option>
            </select>
          </Field>
          <Field label="Godište" error={state.errors?.birthYear}>
            <input type="number" name="birthYear" required className="input" />
          </Field>
        </div>

        <p className="rounded-md bg-sky-light/60 px-3 py-2 text-xs text-navy">
          Ako imaš manje od 16 godina, ovaj račun u tvoje ime treba kreirati
          roditelj ili zakonski skrbnik.
        </p>

        <label className="flex items-start gap-2 text-sm text-ink">
          <input
            type="checkbox"
            name="gdprConsent"
            required
            className="mt-0.5 h-4 w-4 rounded border-navy/30"
          />
          <span>
            Slažem se s{" "}
            <Link href="/privatnost" className="text-navy underline" target="_blank">
              Politikom privatnosti
            </Link>{" "}
            i obradom mojih podataka u svrhe navedene u njoj.
          </span>
        </label>
        {state.errors?.gdprConsent && (
          <span className="text-xs text-crimson -mt-2">
            {state.errors.gdprConsent[0]}
          </span>
        )}

        <SubmitButton />
      </form>

      <p className="mt-4 text-sm text-ink/60">
        Već imaš račun?{" "}
        <Link href="/prijava" className="text-navy underline">
          Prijavi se
        </Link>
      </p>
    </div>
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
