import type { ChartPoint, DashboardStats, Period, Reading } from "./types";
import { addDaysIso, diffDaysIso } from "./date";

const MONTHS_FR = [
  "janv.", "févr.", "mars", "avr.", "mai", "juin",
  "juil.", "août", "sept.", "oct.", "nov.", "déc.",
];

/** Numéro de semaine ISO 8601 + année ISO. */
function isoWeek(date: Date): { year: number; week: number } {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7; // dimanche = 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum); // jeudi de la semaine
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return { year: d.getUTCFullYear(), week };
}

function round(n: number, decimals = 0): number {
  const f = 10 ** decimals;
  return Math.round(n * f) / f;
}

interface DayPoint {
  isoDate: string;
  consoL: number;
  coutEur: number;
  arrosage: boolean;
  piscine: boolean;
}

/**
 * Construit une série JOURNALIÈRE continue.
 * Quand un relevé couvre plusieurs jours (oubli), sa conso et son coût sont
 * RÉPARTIS uniformément sur chaque jour écoulé depuis le relevé précédent.
 * (La valeur brute reste intacte dans le Sheet ; ceci ne concerne que l'affichage.)
 */
export function buildDailySeries(readings: Reading[]): DayPoint[] {
  const valid = readings.filter((r) => r.isoDate);
  const out: DayPoint[] = [];

  for (let i = 0; i < valid.length; i++) {
    const cur = valid[i];

    if (i === 0) {
      // Premier relevé : pas d'écart calculable, on prend sa valeur telle quelle.
      out.push({
        isoDate: cur.isoDate,
        consoL: round(cur.consoL),
        coutEur: round(cur.coutEur, 2),
        arrosage: cur.arrosage,
        piscine: cur.piscine,
      });
      continue;
    }

    const prev = valid[i - 1];
    const days = Math.max(1, diffDaysIso(prev.isoDate, cur.isoDate));
    const perL = cur.consoL / days;
    const perC = cur.coutEur / days;

    for (let d = 1; d <= days; d++) {
      // Les marqueurs (arrosage/piscine) sont portés par le jour du relevé.
      const isReadingDay = d === days;
      out.push({
        isoDate: addDaysIso(prev.isoDate, d),
        consoL: round(perL),
        coutEur: round(perC, 2),
        arrosage: isReadingDay && cur.arrosage,
        piscine: isReadingDay && cur.piscine,
      });
    }
  }

  return out;
}

interface Bucket {
  key: string;
  label: string;
  consoL: number;
  coutEur: number;
}

/** Agrège la série journalière selon la granularité demandée. */
export function aggregate(readings: Reading[], period: Period): ChartPoint[] {
  const daily = buildDailySeries(readings);

  if (period === "day") {
    // 7 derniers jours calendaires.
    return daily.slice(-7).map((p) => ({
      label: `${p.isoDate.slice(8, 10)}/${p.isoDate.slice(5, 7)}`, // DD/MM
      consoL: p.consoL,
      coutEur: p.coutEur,
      arrosage: p.arrosage,
      piscine: p.piscine,
    }));
  }

  const buckets = new Map<string, Bucket>();

  for (const p of daily) {
    const d = new Date(p.isoDate + "T00:00:00");
    let key: string;
    let label: string;

    if (period === "week") {
      const { year, week } = isoWeek(d);
      key = `${year}-W${String(week).padStart(2, "0")}`;
      label = `S${week}`;
    } else if (period === "month") {
      key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      label = MONTHS_FR[d.getMonth()];
    } else {
      key = String(d.getFullYear());
      label = key;
    }

    const b = buckets.get(key) ?? { key, label, consoL: 0, coutEur: 0 };
    b.consoL += p.consoL;
    b.coutEur += p.coutEur;
    buckets.set(key, b);
  }

  const limit = period === "week" ? 8 : period === "month" ? 12 : 5;

  return Array.from(buckets.values())
    .sort((a, b) => a.key.localeCompare(b.key))
    .slice(-limit)
    .map((b) => ({
      label: b.label,
      consoL: round(b.consoL),
      coutEur: round(b.coutEur, 2),
    }));
}

/** Indicateurs des cartes KPI. */
export function computeStats(readings: Reading[]): DashboardStats {
  if (!readings.length) {
    return { todayConsoL: null, lastIndexM3: null, lastDate: null, vacances: false };
  }
  const last = readings[readings.length - 1];
  const daily = buildDailySeries(readings);
  return {
    // Conso du dernier jour (valeur lissée si le dernier relevé couvrait un écart).
    todayConsoL: daily.length ? daily[daily.length - 1].consoL : 0,
    lastIndexM3: last.indexM3,
    lastDate: last.date,
    vacances: last.vacances,
  };
}
