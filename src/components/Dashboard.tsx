"use client";

import { useState } from "react";
import type { DashboardStats, Reading } from "@/lib/types";
import type { Thresholds } from "@/lib/levels";
import KpiCards from "./KpiCards";
import EntryForm from "./EntryForm";
import ConsumptionChart from "./ConsumptionChart";

interface Props {
  readings: Reading[];
  stats: DashboardStats;
  thresholds: Thresholds;
}

export default function Dashboard({ readings, stats, thresholds }: Props) {
  // Le toggle gouverne ce qui sera écrit à la prochaine saisie ET
  // l'affichage de la carte Statut. Initialisé sur la dernière saisie.
  const [vacances, setVacances] = useState(stats.vacances);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5 px-4 py-6">
      <header className="flex items-center gap-2">
        <span className="text-2xl">💧</span>
        <h1 className="text-xl font-bold text-slate-900">Agua</h1>
        <span className="text-sm text-slate-400">— suivi conso d&apos;eau</span>
      </header>

      <KpiCards stats={stats} vacances={vacances} thresholds={thresholds} />

      <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <EntryForm vacances={vacances} onVacancesChange={setVacances} />
      </section>

      <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <ConsumptionChart readings={readings} thresholds={thresholds} />
      </section>

      <footer className="pb-4 text-center text-xs text-slate-400">
        {readings.length} saisie{readings.length > 1 ? "s" : ""} enregistrée
        {readings.length > 1 ? "s" : ""}
      </footer>
    </div>
  );
}
