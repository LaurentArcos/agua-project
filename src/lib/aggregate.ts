import type { ChartPoint, DashboardStats, Period, Reading } from "./types";
import { addDaysIso, diffDaysIso, mondayIso } from "./date";

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

/** Taille de la fenêtre affichée (nombre de barres) selon la granularité. */
const WINDOW: Record<Period, number> = { day: 7, week: 8, month: 12, year: 5 };

interface Bucket {
  key: string;
  label: string;
  startIso: string;
  endIso: string;
  consoL: number;
  coutEur: number;
  arrosage?: boolean;
  piscine?: boolean;
}

/** Résultat d'agrégation : points à tracer + métadonnées de navigation. */
export interface AggregateResult {
  /** Points prêts pour le BarChart (fenêtre courante). */
  points: ChartPoint[];
  /** Libellé décrivant la période affichée (ex: "16 – 22 juin 2026"). */
  title: string;
  /** Existe-t-il une fenêtre plus ancienne ? */
  canPrev: boolean;
  /** Existe-t-il une fenêtre plus récente ? */
  canNext: boolean;
}

/** Construit la liste complète des « buckets » triés par ordre chronologique. */
function buildBuckets(readings: Reading[], period: Period): Bucket[] {
  const daily = buildDailySeries(readings);

  if (period === "day") {
    return daily.map((p) => ({
      key: p.isoDate,
      label: `${p.isoDate.slice(8, 10)}/${p.isoDate.slice(5, 7)}`, // DD/MM
      startIso: p.isoDate,
      endIso: p.isoDate,
      consoL: p.consoL,
      coutEur: p.coutEur,
      arrosage: p.arrosage,
      piscine: p.piscine,
    }));
  }

  const map = new Map<string, Bucket>();

  for (const p of daily) {
    const d = new Date(p.isoDate + "T00:00:00");
    let key: string;
    let label: string;
    let startIso: string;
    let endIso: string;

    if (period === "week") {
      const { year, week } = isoWeek(d);
      key = `${year}-W${String(week).padStart(2, "0")}`;
      const mon = mondayIso(p.isoDate);
      startIso = mon;
      endIso = addDaysIso(mon, 6);
      label = `${mon.slice(8, 10)}/${mon.slice(5, 7)}`; // lundi DD/MM
    } else if (period === "month") {
      const y = d.getFullYear();
      const m = d.getMonth();
      key = `${y}-${String(m + 1).padStart(2, "0")}`;
      const lastDay = new Date(y, m + 1, 0).getDate();
      startIso = `${y}-${String(m + 1).padStart(2, "0")}-01`;
      endIso = `${y}-${String(m + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
      label = MONTHS_FR[m];
    } else {
      const y = d.getFullYear();
      key = String(y);
      startIso = `${y}-01-01`;
      endIso = `${y}-12-31`;
      label = key;
    }

    const b =
      map.get(key) ?? { key, label, startIso, endIso, consoL: 0, coutEur: 0 };
    b.consoL += p.consoL;
    b.coutEur += p.coutEur;
    map.set(key, b);
  }

  return Array.from(map.values())
    .sort((a, b) => a.key.localeCompare(b.key))
    .map((b) => ({
      ...b,
      consoL: round(b.consoL),
      coutEur: round(b.coutEur, 2),
    }));
}

/** Compose le titre de la fenêtre affichée selon la granularité. */
function buildTitle(period: Period, aIso: string, bIso: string): string {
  const a = { y: +aIso.slice(0, 4), m: +aIso.slice(5, 7) - 1, d: +aIso.slice(8, 10) };
  const b = { y: +bIso.slice(0, 4), m: +bIso.slice(5, 7) - 1, d: +bIso.slice(8, 10) };

  if (period === "year") {
    return a.y === b.y ? `${a.y}` : `${a.y} – ${b.y}`;
  }

  if (period === "month") {
    const A = `${MONTHS_FR[a.m]} ${a.y}`;
    const B = `${MONTHS_FR[b.m]} ${b.y}`;
    return A === B ? A : `${A} – ${B}`;
  }

  // day & week : plage de dates complète
  const sameYear = a.y === b.y;
  const sameMonth = sameYear && a.m === b.m;
  if (sameMonth) return `${a.d} – ${b.d} ${MONTHS_FR[b.m]} ${b.y}`;
  if (sameYear) return `${a.d} ${MONTHS_FR[a.m]} – ${b.d} ${MONTHS_FR[b.m]} ${b.y}`;
  return `${a.d} ${MONTHS_FR[a.m]} ${a.y} – ${b.d} ${MONTHS_FR[b.m]} ${b.y}`;
}

/**
 * Agrège la série journalière selon la granularité demandée et la fenêtre.
 * @param offset 0 = fenêtre la plus récente, 1 = fenêtre précédente, etc.
 */
export function aggregate(
  readings: Reading[],
  period: Period,
  offset = 0
): AggregateResult {
  const all = buildBuckets(readings, period);
  const limit = WINDOW[period];

  const end = all.length - offset * limit;
  const start = Math.max(0, end - limit);
  const slice = end > 0 ? all.slice(start, end) : [];

  const canNext = offset > 0;
  const canPrev = end > 0 && start > 0;

  let points: ChartPoint[];

  if (period === "month") {
    // Ajoute l'année (2 chiffres) si la fenêtre chevauche plusieurs années.
    const years = new Set(slice.map((b) => b.startIso.slice(0, 4)));
    const multiYear = years.size > 1;
    points = slice.map((b) => ({
      label: multiYear ? `${b.label} ${b.startIso.slice(2, 4)}` : b.label,
      consoL: b.consoL,
      coutEur: b.coutEur,
    }));
  } else {
    points = slice.map((b) => ({
      label: b.label,
      consoL: b.consoL,
      coutEur: b.coutEur,
      ...(period === "day"
        ? { arrosage: b.arrosage, piscine: b.piscine }
        : {}),
    }));
  }

  const title = slice.length
    ? buildTitle(period, slice[0].startIso, slice[slice.length - 1].endIso)
    : "Aucune donnée";

  return { points, title, canPrev, canNext };
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
