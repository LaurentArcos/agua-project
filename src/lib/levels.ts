/** Niveaux de consommation journalière (4 paliers) + couleurs associées. */

export type LevelKey = "green" | "orange" | "red" | "critical";

export interface Thresholds {
  green: number;
  orange: number;
  red: number;
}

export interface Level {
  key: LevelKey;
  label: string;
  /** Couleur hex (barres Recharts). */
  hex: string;
  /** Classes Tailwind (cartes KPI). */
  bg: string;
  text: string;
  ring: string;
}

export const LEVELS: Record<LevelKey, Level> = {
  green: {
    key: "green",
    label: "OK",
    hex: "#10b981",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    ring: "ring-emerald-200",
  },
  orange: {
    key: "orange",
    label: "Élevé",
    hex: "#f59e0b",
    bg: "bg-amber-50",
    text: "text-amber-700",
    ring: "ring-amber-200",
  },
  red: {
    key: "red",
    label: "Très élevé",
    hex: "#ef4444",
    bg: "bg-red-50",
    text: "text-red-700",
    ring: "ring-red-200",
  },
  critical: {
    key: "critical",
    label: "Critique",
    hex: "#7f1d1d",
    bg: "bg-red-100",
    text: "text-red-900",
    ring: "ring-red-300",
  },
};

/** Détermine le palier d'une conso (litres) selon les seuils. */
export function consumptionLevel(litres: number, t: Thresholds): Level {
  if (litres < t.green) return LEVELS.green;
  if (litres < t.orange) return LEVELS.orange;
  if (litres < t.red) return LEVELS.red;
  return LEVELS.critical;
}
