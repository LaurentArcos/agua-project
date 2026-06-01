import type { DashboardStats } from "@/lib/types";
import { consumptionLevel, type Thresholds } from "@/lib/levels";

interface Props {
  stats: DashboardStats;
  vacances: boolean;
  thresholds: Thresholds;
}

function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl p-4 ring-1 shadow-sm flex flex-col justify-between min-h-[104px] ${className}`}
    >
      {children}
    </div>
  );
}

export default function KpiCards({ stats, vacances, thresholds }: Props) {
  const conso = stats.todayConsoL;
  const level = conso === null ? null : consumptionLevel(conso, thresholds);

  const consoClasses =
    level === null
      ? { bg: "bg-slate-50", text: "text-slate-500", ring: "ring-slate-200" }
      : { bg: level.bg, text: level.text, ring: level.ring };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {/* Carte 1 : Conso du jour */}
      <Card className={`${consoClasses.bg} ${consoClasses.ring}`}>
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Conso du jour
          </span>
          {level && (
            <span className={`text-xs font-semibold ${consoClasses.text}`}>
              {level.label}
            </span>
          )}
        </div>
        <span className={`text-3xl font-bold ${consoClasses.text}`}>
          {conso === null ? "—" : conso.toLocaleString("fr-FR")}
          <span className="text-base font-semibold ml-1">L</span>
        </span>
      </Card>

      {/* Carte 2 : Dernier index */}
      <Card className="bg-sky-50 ring-sky-200">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Dernier index
        </span>
        <span className="text-3xl font-bold text-sky-700">
          {stats.lastIndexM3 === null
            ? "—"
            : stats.lastIndexM3.toLocaleString("fr-FR")}
          <span className="text-base font-semibold ml-1">m³</span>
        </span>
        {stats.lastDate && (
          <span className="text-xs text-slate-400">le {stats.lastDate}</span>
        )}
      </Card>

      {/* Carte 3 : Statut */}
      <Card
        className={
          vacances ? "bg-violet-50 ring-violet-200" : "bg-slate-50 ring-slate-200"
        }
      >
        <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Statut
        </span>
        <span
          className={`text-2xl font-bold ${
            vacances ? "text-violet-700" : "text-slate-700"
          }`}
        >
          {vacances ? "🏖️ Vacances" : "🏠 Normal"}
        </span>
      </Card>
    </div>
  );
}
