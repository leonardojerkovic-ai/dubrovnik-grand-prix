"use client";

import { useFormState, useFormStatus } from "react-dom";
import { resetPassword, type ResetPasswordState } from "../../zaboravljena-lozinka/actions";

const initialState: ResetPasswordState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-navy px-4 py-2.5 font-semibold text-paper hover:bg-navy-light transition-colors disabled:opacity-50"
    >
      {pending ? "Spremanje…" : "Postavi novu lozinku"}
    </button>
  );
}

export default function ResetirajLozinkuPage({
  params,
}: {
  params: { token: string };
}) {
  const boundReset = resetPassword.bind(null, params.token);
  const [state, formAction] = useFormState(boundReset, initialState);

  return (
    <div className="mx-auto max-w-sm px-4 py-12">
      <h1 className="font-display text-2xl font-bold text-navy mb-6">
        Nova lozinka
      </h1>

      {state.message ? (
        <div>
          <p className="rounded-md bg-academy/10 px-3 py-2 text-sm text-academy mb-4">
            {state.message}
          </p>
          <a href="/prijava" className="text-navy underline text-sm">
            Idi na prijavu
          </a>
        </div>
      ) : (
        <form action={formAction} className="grid gap-4">
          {state.error && (
            <p className="rounded-md bg-crimson/10 px-3 py-2 text-sm text-crimson">
              {state.error}
            </p>
          )}
          <label className="grid gap-1 text-sm font-medium text-navy">
            Nova lozinka
            <input type="password" name="password" required className="input" />
            <span className="text-xs text-ink/50">Barem 8 znakova</span>
          </label>
          <SubmitButton />
        </form>
      )}
    </div>
  );
}
