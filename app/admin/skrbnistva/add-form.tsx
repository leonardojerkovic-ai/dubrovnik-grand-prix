"use client";

import { useFormState, useFormStatus } from "react-dom";
import { addGuardianship, type GuardianAdminState } from "./actions";

const initial: GuardianAdminState = {};

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-navy px-4 py-2 text-sm font-semibold text-paper hover:bg-navy-light disabled:opacity-50"
    >
      {pending ? "Dodajem…" : "Dodaj skrbništvo"}
    </button>
  );
}

export function AddGuardianshipForm({
  accounts,
  childOptions,
}: {
  accounts: { id: string; label: string }[];
  // Namjerno NE "children" — to je u Reactu posebno ime i vodilo bi u zabunu.
  childOptions: { id: string; label: string }[];
}) {
  const [state, formAction] = useFormState(addGuardianship, initial);

  return (
    <form action={formAction} className="grid gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-sm font-medium text-navy">
          Račun roditelja ili skrbnika
          <select name="guardianUserId" className="input" defaultValue="">
            <option value="">Odaberi račun…</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.label}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1 text-sm font-medium text-navy">
          Dijete
          <select name="playerId" className="input" defaultValue="">
            <option value="">Odaberi igrača…</option>
            {childOptions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex items-center gap-3">
        <Submit />
        {state.error && <p className="text-sm text-crimson">{state.error}</p>}
        {state.message && <p className="text-sm text-navy">{state.message}</p>}
      </div>
    </form>
  );
}
