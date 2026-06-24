/**
 * Lecture centralisée des variables d'environnement (tarification / seuils).
 * La connexion à la base se fait dans src/lib/supabase.ts.
 */

function optionalNumber(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

export const config = {
  // ── Tarification / seuils ──
  pricePerM3: () => optionalNumber("WATER_PRICE_PER_M3", 4.36),
  thresholdGreen: () => optionalNumber("WATER_THRESHOLD_GREEN", 350),
  thresholdOrange: () => optionalNumber("WATER_THRESHOLD_ORANGE", 600),
  thresholdRed: () => optionalNumber("WATER_THRESHOLD_RED", 1000),
};
