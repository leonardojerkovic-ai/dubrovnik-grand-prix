"use client";

import { useFormState, useFormStatus } from "react-dom";
import { addChildByCode, type GuardianActionState } from "./actions";

const initial: GuardianActionState = {};

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-navy px-4 py-2 text-sm font-semibold text-paper hover:bg-navy-light disabled:opacity-50"
    >
      {pending ? "Dodajem…" : "Dodaj"}
    </button>
  );
}

export function AddChildForm() {
  const [state, formAction] = useFormState(addChildByCode, initial);

  return (
    <form action={formAction} className="flex flex-wrap items-start gap-2">
      <input
        type="text"
        name="linkCode"
        placeholder="ABCD-EFGH-JKMN"
        autoComplete="off"
        className="input max-w-xs font-mono uppercase tracking-widest"
      />
      <Submit />
      {state.error && (
        <p className="w-full text-sm text-crimson">{state.error}</p>
      )}
      {state.message && (
        <p className="w-full text-sm text-navy">{state.message}</p>
      )}
    </form>
  );
}
