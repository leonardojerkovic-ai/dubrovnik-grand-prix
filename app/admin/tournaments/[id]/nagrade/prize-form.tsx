"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import type { ActionState } from "../../../players/actions";

/**
 * Unos jedne nagrade.
 *
 * Kriteriji se u bazi čuvaju kao granice (godište, rejting), a ne kao nazivi
 * kategorija — tako je motor jedan i općenit. Ali admin razmišlja u
 * kategorijama iz pravilnika, pa forma nudi gotove postavke koje ta polja
 * popune. Nakon toga se sve može ručno dotjerati, što pokriva i nagrade
 * kojih u pravilniku nema.
 */

const initialState: ActionState = {};

type Preset = {
  id: string;
  label: string;
  shortLabel: string;
  gender?: "M" | "F";
  ageCategory?: "U12" | "U16" | "U20" | "S50" | "S65";
  ratingMax?: number;
  clubMembersOnly?: boolean;
  count?: number;
};

const PRESETS: Preset[] = [
  { id: "ukupno", label: "Ukupni poredak", shortLabel: "", count: 3 },
  { id: "zene", label: "Najbolja igračica", shortLabel: "Ž", gender: "F" },
  { id: "u20", label: "Najbolji junior U20", shortLabel: "U20", ageCategory: "U20" },
  { id: "u16", label: "Najbolji kadet U16", shortLabel: "U16", ageCategory: "U16" },
  { id: "u12", label: "Najbolji mlađi kadet U12", shortLabel: "U12", ageCategory: "U12" },
  { id: "s50", label: "Najbolji veteran +50", shortLabel: "+50", ageCategory: "S50" },
  { id: "s65", label: "Najbolji veteran +65", shortLabel: "+65", ageCategory: "S65" },
  { id: "u1800", label: "Najbolji U1800", shortLabel: "U1800", ratingMax: 1800 },
  { id: "u1600", label: "Najbolji U1600", shortLabel: "U1600", ratingMax: 1600 },
  {
    id: "clan",
    label: "Najbolji član ŠK Dubrovnik",
    shortLabel: "ŠKD",
    clubMembersOnly: true,
  },
];

/** Granice godišta za kategorije iz čl. 22 — vidi lib/scoring/prizes.ts. */
function ageBounds(
  category: Preset["ageCategory"],
  seasonStartYear: number
): { min: string; max: string } {
  switch (category) {
    case "U12":
      return { min: String(seasonStartYear - 12), max: "" };
    case "U16":
      return { min: String(seasonStartYear - 16), max: "" };
    case "U20":
      return { min: String(seasonStartYear - 20), max: "" };
    case "S50":
      return { min: "", max: String(seasonStartYear - 50) };
    case "S65":
      return { min: "", max: String(seasonStartYear - 65) };
    default:
      return { min: "", max: "" };
  }
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-gold px-4 py-2 text-sm font-semibold text-navy hover:bg-gold-light disabled:opacity-50"
    >
      {pending ? "Dodavanje…" : "+ Dodaj nagradu"}
    </button>
  );
}

export function PrizeForm({
  action,
  tournamentId,
  seasonStartYear,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  tournamentId: string;
  seasonStartYear: number;
}) {
  const [state, formAction] = useFormState(action, initialState);

  const [label, setLabel] = useState("");
  const [shortLabel, setShortLabel] = useState("");
  const [count, setCount] = useState("1");
  const [gender, setGender] = useState("");
  const [birthYearMin, setBirthYearMin] = useState("");
  const [birthYearMax, setBirthYearMax] = useState("");
  const [ratingMin, setRatingMin] = useState("");
  const [ratingMax, setRatingMax] = useState("");
  const [clubMembersOnly, setClubMembersOnly] = useState(false);

  function applyPreset(id: string) {
    const preset = PRESETS.find((p) => p.id === id);
    if (!preset) return;
    const bounds = ageBounds(preset.ageCategory, seasonStartYear);
    setLabel(preset.label);
    setShortLabel(preset.shortLabel);
    setCount(String(preset.count ?? 1));
    setGender(preset.gender ?? "");
    setBirthYearMin(bounds.min);
    setBirthYearMax(bounds.max);
    setRatingMin("");
    setRatingMax(preset.ratingMax ? String(preset.ratingMax) : "");
    setClubMembersOnly(preset.clubMembersOnly ?? false);
  }

  return (
    <form action={formAction} className="grid gap-4">
      <input type="hidden" name="tournamentId" value={tournamentId} />

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink/55">
          Gotove postavke
        </p>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => applyPreset(preset.id)}
              className="rounded-md border border-navy/20 px-3 py-1 text-xs font-medium text-navy hover:bg-navy/5"
            >
              {preset.label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-ink/55">
          Postavka samo popuni polja ispod — sve se može dotjerati prije
          spremanja. Dobne granice računaju se za sezonu {seasonStartYear}.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-4 md:items-end">
        <label className="grid gap-1 text-sm font-medium text-navy md:col-span-2">
          Naziv nagrade
          <input
            name="label"
            required
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="input"
          />
          {state.errors?.label && (
            <span className="text-xs text-crimson">{state.errors.label[0]}</span>
          )}
        </label>

        <label className="grid gap-1 text-sm font-medium text-navy">
          Oznaka u medaljici
          <input
            name="shortLabel"
            value={shortLabel}
            onChange={(e) => setShortLabel(e.target.value)}
            placeholder="Ž, U1800, +50…"
            className="input"
          />
          <span className="text-xs text-ink/55">
            Prazno za ukupni poredak — tada se prikazuje broj mjesta.
          </span>
        </label>

        <label className="grid gap-1 text-sm font-medium text-navy">
          Broj nagrada
          <input
            name="count"
            type="number"
            min={1}
            max={20}
            value={count}
            onChange={(e) => setCount(e.target.value)}
            className="input"
          />
          {state.errors?.count && (
            <span className="text-xs text-crimson">{state.errors.count[0]}</span>
          )}
        </label>
      </div>

      <fieldset className="grid gap-3 rounded-md border border-navy/10 p-3 md:grid-cols-3">
        <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-ink/55">
          Uvjeti (prazno = bez ograničenja)
        </legend>

        <label className="grid gap-1 text-sm font-medium text-navy">
          Spol
          <select
            name="gender"
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            className="input"
          >
            <option value="">Svi</option>
            <option value="F">Žene</option>
            <option value="M">Muškarci</option>
          </select>
        </label>

        <label className="grid gap-1 text-sm font-medium text-navy">
          Godište od (mlađi)
          <input
            name="birthYearMin"
            type="number"
            value={birthYearMin}
            onChange={(e) => setBirthYearMin(e.target.value)}
            placeholder="npr. 2007"
            className="input"
          />
        </label>

        <label className="grid gap-1 text-sm font-medium text-navy">
          Godište do (stariji)
          <input
            name="birthYearMax"
            type="number"
            value={birthYearMax}
            onChange={(e) => setBirthYearMax(e.target.value)}
            placeholder="npr. 1977"
            className="input"
          />
        </label>

        <label className="grid gap-1 text-sm font-medium text-navy">
          Rejting od
          <input
            name="ratingMin"
            type="number"
            value={ratingMin}
            onChange={(e) => setRatingMin(e.target.value)}
            className="input"
          />
        </label>

        <label className="grid gap-1 text-sm font-medium text-navy">
          Rejting do (isključivo)
          <input
            name="ratingMax"
            type="number"
            value={ratingMax}
            onChange={(e) => setRatingMax(e.target.value)}
            placeholder="1800 = ispod 1800"
            className="input"
          />
        </label>

        <label className="flex items-center gap-2 text-sm font-medium text-navy">
          <input
            name="clubMembersOnly"
            type="checkbox"
            checked={clubMembersOnly}
            onChange={(e) => setClubMembersOnly(e.target.checked)}
          />
          Samo članovi ŠK Dubrovnik
        </label>
      </fieldset>

      <div className="flex items-center gap-3">
        <SubmitButton />
        {state.message && (
          <span className="text-xs text-ink/60">{state.message}</span>
        )}
      </div>
    </form>
  );
}
