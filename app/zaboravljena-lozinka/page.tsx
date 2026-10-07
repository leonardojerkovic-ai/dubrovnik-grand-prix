"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { requestPasswordReset, type ForgotPasswordState } from "./actions";

const initialState: ForgotPasswordState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn-primary"
    >
      {pending ? "Slanje…" : "Pošalji poveznicu za reset"}
    </button>
  );
}

export default function ZaboravljenaLozinkaPage() {
  const [state, formAction] = useActionState(requestPasswordReset, initialState);

  return (
    <div className="mx-auto max-w-sm px-4 py-12">
      <h1 className="page-title">
        Zaboravljena lozinka
      </h1>
      <p className="mb-6 text-sm text-muted">
        Unesi email s kojim si registriran/a — poslat ćemo ti poveznicu za
        postavljanje nove lozinke.
      </p>

      {state.message ? (
        <p className="rounded-md bg-academy/10 px-3 py-2 text-sm text-academy">
          {state.message}
        </p>
      ) : (
        <form action={formAction} className="grid gap-4">
          {state.error && (
            <p className="rounded-md bg-crimson/10 px-3 py-2 text-sm text-crimson">
              {state.error}
            </p>
          )}
          <label className="grid gap-1 text-sm font-medium text-navy">
            Email
            <input type="email" name="email" required className="input" />
          </label>
          <SubmitButton />
        </form>
      )}
    </div>
  );
}
