/** Une ligne de saisie telle que stockée dans le Google Sheet. */
export interface Reading {
  /** Date au format DD-MM-YYYY (clé d'affichage). */
  date: string;
  /** Date normalisée ISO YYYY-MM-DD (clé de tri/agrégation). */
  isoDate: string;
  /** Index du compteur en m³. */
  indexM3: number;
  /** Consommation du jour en litres. */
  consoL: number;
  /** Coût estimé du jour en euros. */
  coutEur: number;
  /** Mode vacances actif lors de la saisie. */
  vacances: boolean;
  /** Jour où le jardin a été arrosé. */
  arrosage: boolean;
  /** Jour où la piscine a été remplie. */
  piscine: boolean;
}

/** Granularité du graphique. */
export type Period = "day" | "week" | "month" | "year";

/** Point agrégé prêt à afficher dans le BarChart. */
export interface ChartPoint {
  /** Libellé de l'axe X (ex: "29/05", "S22", "mai", "2026"). */
  label: string;
  /** Consommation totale en litres sur la période. */
  consoL: number;
  /** Coût total en euros sur la période. */
  coutEur: number;
  /** Jour avec arrosage (vue journalière uniquement). */
  arrosage?: boolean;
  /** Jour avec remplissage piscine (vue journalière uniquement). */
  piscine?: boolean;
}

/** Données calculées pour les cartes KPI. */
export interface DashboardStats {
  todayConsoL: number | null;
  lastIndexM3: number | null;
  lastDate: string | null;
  vacances: boolean;
}
