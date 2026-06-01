"use client";

import { useActionState, useEffect, useState } from "react";
import { addReadingAction, type ActionState } from "@/app/actions";
import { todayIso } from "@/lib/date";
import VacationToggle from "./VacationToggle";

const initialState: ActionState = { ok: false, message: "" };

interface Props {
  vacances: boolean;
  onVacancesChange: (value: boolean) => void;
}

export default function EntryForm({ vacances, onVacancesChange }: Props) {
  const [state, formAction, isPending] = useActionState(
    addReadingAction,
    initialState
  );

  // Date du relevé : pré-remplie sur aujourd'hui après le montage
  // (évite tout décalage d'hydratation serveur/client).
  const [date, setDate] = useState("");
  const [maxDate, setMaxDate] = useState("");
  useEffect(() => {
    const t = todayIso();
    setDate(t);
    setMaxDate(t);
  }, []);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label htmlFor="index" className="text-sm font-medium text-slate-700">
          Index relevé sur le compteur (m³)
        </label>
        <input
          id="index"
          name="index"
          type="number"
          inputMode="decimal"
          step="0.001"
          min="0"
          required
          placeholder="0000.000"
          autoComplete="off"
          className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-5 text-center text-4xl font-bold tabular-nums text-slate-900 shadow-inner outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="date" className="text-sm font-medium text-slate-700">
          Date du relevé
        </label>
        <input
          id="date"
          name="date"
          type="date"
          value={date}
          max={maxDate || undefined}
          onChange={(e) => setDate(e.target.value)}
          required
          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
        />
        <p className="text-xs text-slate-400">
          Oubli ? Choisis le jour réel du relevé : la conso sera répartie sur les
          jours écoulés.
        </p>
      </div>

      <div className="rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
        <VacationToggle
          name="vacances"
          checked={vacances}
          onChange={onVacancesChange}
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-2xl bg-sky-600 px-6 py-5 text-xl font-bold text-white shadow-lg transition-colors hover:bg-sky-700 active:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Enregistrement…" : "Enregistrer l'index"}
      </button>

      {state.message && (
        <p
          role="status"
          className={`rounded-xl px-4 py-3 text-sm font-medium ${
            state.ok
              ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
              : "bg-red-50 text-red-700 ring-1 ring-red-200"
          }`}
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
