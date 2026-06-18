"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { aggregate } from "@/lib/aggregate";
import type { Period, Reading } from "@/lib/types";
import { consumptionLevel, LEVELS, type Thresholds } from "@/lib/levels";

const PERIODS: { id: Period; label: string }[] = [
  { id: "day", label: "Jour" },
  { id: "week", label: "Semaine" },
  { id: "month", label: "Mois" },
  { id: "year", label: "Année" },
];

const BLUE = "#0284c7";

interface Props {
  readings: Reading[];
  thresholds: Thresholds;
}

function barColor(period: Period, litres: number, t: Thresholds): string {
  // Code couleur à 4 paliers seulement en vue Jour (seuils journaliers).
  if (period !== "day") return BLUE;
  return consumptionLevel(litres, t).hex;
}

export default function ConsumptionChart({ readings, thresholds }: Props) {
  const [period, setPeriod] = useState<Period>("day");
  // 0 = fenêtre la plus récente ; +1 à chaque pas vers le passé.
  const [offset, setOffset] = useState(0);
  const { points: data, title, canPrev, canNext } = useMemo(
    () => aggregate(readings, period, offset),
    [readings, period, offset]
  );

  // Change de granularité : on revient à la fenêtre la plus récente.
  function changePeriod(p: Period) {
    setPeriod(p);
    setOffset(0);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-800">Consommation</h2>
        <div className="inline-flex rounded-xl bg-slate-100 p-1">
          {PERIODS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => changePeriod(p.id)}
              className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                period === p.id
                  ? "bg-white text-sky-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          aria-label="Période précédente"
          onClick={() => canPrev && setOffset((o) => o + 1)}
          disabled={!canPrev}
          className={`flex h-8 w-8 items-center justify-center rounded-lg text-lg transition-colors ${
            canPrev
              ? "cursor-pointer text-slate-600 hover:bg-slate-100"
              : "cursor-not-allowed text-slate-300"
          }`}
        >
          ‹
        </button>
        <span className="text-sm font-medium text-slate-600">{title}</span>
        <button
          type="button"
          aria-label="Période suivante"
          onClick={() => canNext && setOffset((o) => Math.max(0, o - 1))}
          disabled={!canNext}
          className={`flex h-8 w-8 items-center justify-center rounded-lg text-lg transition-colors ${
            canNext
              ? "cursor-pointer text-slate-600 hover:bg-slate-100"
              : "cursor-not-allowed text-slate-300"
          }`}
        >
          ›
        </button>
      </div>

      {data.length === 0 ? (
        <div className="flex h-64 items-center justify-center rounded-2xl bg-slate-50 text-sm text-slate-400 ring-1 ring-slate-200">
          Pas encore de données à afficher.
        </div>
      ) : (
        <div className="h-64 w-full sm:h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 12, fill: "#64748b" }}
                tickLine={false}
                axisLine={{ stroke: "#e2e8f0" }}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "#64748b" }}
                tickLine={false}
                axisLine={false}
                width={48}
                tickFormatter={(v: number) =>
                  v >= 1000 ? `${(v / 1000).toLocaleString("fr-FR")} k` : String(v)
                }
              />
              <Tooltip
                cursor={{ fill: "rgba(2,132,199,0.06)" }}
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid #e2e8f0",
                  fontSize: 13,
                }}
                formatter={(value, _name, item) => {
                  const litres = Number(value);
                  const cout = (item?.payload as { coutEur?: number })?.coutEur;
                  return [
                    `${litres.toLocaleString("fr-FR")} L${
                      cout != null ? ` · ${cout.toLocaleString("fr-FR")} €` : ""
                    }`,
                    "Conso",
                  ];
                }}
              />
              <Bar dataKey="consoL" radius={[6, 6, 0, 0]} maxBarSize={56}>
                {data.map((d, i) => (
                  <Cell key={i} fill={barColor(period, d.consoL, thresholds)} />
                ))}
                {period === "day" && (
                  <LabelList
                    dataKey="consoL"
                    content={(p) => {
                      const idx = Number(
                        (p as { index?: number }).index ?? 0
                      );
                      const d = data[idx];
                      const marks = `${d?.arrosage ? "🌿" : ""}${
                        d?.piscine ? "🏊" : ""
                      }`;
                      if (!marks) return null;
                      const x = Number((p as { x?: number }).x ?? 0);
                      const y = Number((p as { y?: number }).y ?? 0);
                      const w = Number((p as { width?: number }).width ?? 0);
                      return (
                        <text
                          x={x + w / 2}
                          y={y - 6}
                          textAnchor="middle"
                          fontSize={13}
                        >
                          {marks}
                        </text>
                      );
                    }}
                  />
                )}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {period === "day" && data.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
          {(
            [
              { c: LEVELS.green.hex, t: `< ${thresholds.green} L` },
              { c: LEVELS.orange.hex, t: `${thresholds.green}–${thresholds.orange} L` },
              { c: LEVELS.red.hex, t: `${thresholds.orange}–${thresholds.red} L` },
              { c: LEVELS.critical.hex, t: `> ${thresholds.red} L` },
            ] as const
          ).map((l) => (
            <span key={l.t} className="inline-flex items-center gap-1.5">
              <span
                className="inline-block h-2.5 w-2.5 rounded-sm"
                style={{ backgroundColor: l.c }}
              />
              {l.t}
            </span>
          ))}
          <span className="inline-flex items-center gap-1.5">🌿 arrosage</span>
          <span className="inline-flex items-center gap-1.5">🏊 piscine</span>
        </div>
      )}
    </div>
  );
}
