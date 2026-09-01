"use client";

import { useFormState, useFormStatus } from "react-dom";
import type { ActionState } from "../players/actions";

type Season = { id: string; yearLabel: string; system: string };

type TournamentFormProps = {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  seasons: Season[];
  defaultValues?: {
    seasonId?: string;
    name?: string;
    date?: Date;
    format?: string;
    rounds?: number;
    level?: string | null;
    tempo?: string;
    isFinal?: boolean;
    isJuniorFinal?: boolean;
    status?: string;
    baseMinutes?: number | null;
    incrementSeconds?: number | null;
  };
};

const initialState: ActionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="rounded-md bg-navy px-5 py-2.5 font-semibold text-paper hover:bg-navy-light transition-colors disabled:opacity-50">
      {pending ? "Spremanje…" : "Spremi turnir"}
    </button>
  );
}

export function TournamentForm({ action, seasons, defaultValues = {} }: TournamentFormProps) {
  const [state, formAction] = useFormState(action, initialState);
  const dateValue = defaultValues.date ? defaultValues.date.toISOString().slice(0, 10) : "";
  const selectedSeason = seasons.find((s) => s.id === defaultValues.seasonId);
  const defaultSystem = selectedSeason?.system;

  return (
    <form action={formAction} className="grid max-w-xl gap-4">
      {state.message && <p className="rounded-md bg-academy/10 px-3 py-2 text-sm text-academy">{state.message}</p>}
      <Field label="Sezona" error={state.errors?.seasonId}>
        <select name="seasonId" defaultValue={defaultValues.seasonId} required className="input"><option value="">— odaberi —</option>{seasons.map((s) => <option key={s.id} value={s.id}>{s.system === "GP" ? "Dubrovnik GP" : "GP Akademije"} — {s.yearLabel}</option>)}</select>
      </Field>
      <Field label="Naziv turnira" error={state.errors?.name}><input name="name" defaultValue={defaultValues.name} required className="input" /></Field>
      <div className="grid grid-cols-2 gap-4"><Field label="Datum" error={state.errors?.date}><input type="date" name="date" defaultValue={dateValue} required className="input" /></Field><Field label="Broj kola" error={state.errors?.rounds}><input type="number" name="rounds" defaultValue={defaultValues.rounds} required className="input" /></Field></div>
      <div className="grid grid-cols-2 gap-4"><Field label="Format" error={state.errors?.format}><select name="format" defaultValue={defaultValues.format ?? "SWISS"} className="input"><option value="SWISS">Švicarski</option><option value="ROUND_ROBIN">Kružni (svi protiv svih)</option></select></Field><Field label="Tempo" error={state.errors?.tempo}><select name="tempo" defaultValue={defaultValues.tempo} required className="input"><option value="">— odaberi —</option><option value="STANDARD">Standard</option><option value="RAPID">Rapid / ubrzani</option><option value="BLITZ">Blitz / brzopotezni</option></select></Field></div>
      <div className="grid grid-cols-2 gap-4"><Field label="Osnovno vrijeme (minute)" error={state.errors?.baseMinutes}><input type="number" name="baseMinutes" defaultValue={defaultValues.baseMinutes ?? ""} className="input" /><span className="text-xs font-normal text-ink/50">npr. 10 za 10 minuta po igraču</span></Field><Field label="Dodatak (sekunde po potezu)" error={state.errors?.incrementSeconds}><input type="number" name="incrementSeconds" defaultValue={defaultValues.incrementSeconds ?? ""} className="input" /><span className="text-xs font-normal text-ink/50">npr. 5 za +5 sek po potezu</span></Field></div>
      <Field label="Razina (samo za Dubrovnik GP — ostavi prazno za Akademiju)" error={state.errors?.level}><select name="level" defaultValue={defaultValues.level ?? ""} className="input"><option value="">— nije primjenjivo (Akademija) —</option><option value="KLUPSKA">Klupska</option><option value="NATJECATELJSKA">Natjecateljska</option><option value="VRHUNSKA">Vrhunska</option></select></Field>
      <div className="flex gap-6"><label className="flex items-center gap-2 text-sm text-ink"><input type="checkbox" name="isFinal" defaultChecked={defaultValues.isFinal} className="h-4 w-4 rounded border-navy/30" />Završni turnir (GP Finale / Prvenstvo Akademije)</label><label className="flex items-center gap-2 text-sm text-ink"><input type="checkbox" name="isJuniorFinal" defaultChecked={defaultValues.isJuniorFinal} className="h-4 w-4 rounded border-navy/30" />Juniorsko GP Finale</label></div>
      <Field label="Status" error={state.errors?.status}><select name="status" defaultValue={defaultValues.status ?? "NAJAVA"} className="input"><option value="NAJAVA">Najava</option><option value="PRIJAVE_OTVORENE">Prijave otvorene</option><option value="U_TIJEKU">U tijeku</option><option value="ZAVRSEN">Završen</option></select></Field>
      {defaultSystem === "AKADEMIJA" && <p className="text-xs text-academy">Ova sezona pripada GP Akademiji — razina (FC) i tempo-faktor (FT) se ne koriste za bodovanje, samo faktor broja igrača (čl. 8).</p>}
      <SubmitButton />
    </form>
  );
}

function Field({ label, error, children }: { label: string; error?: string[]; children: React.ReactNode }) {
  return <label className="grid gap-1 text-sm font-medium text-navy">{label}{children}{error && <span className="text-xs font-normal text-crimson">{error[0]}</span>}</label>;
}
