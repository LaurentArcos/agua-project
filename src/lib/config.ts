/**
 * Lecture centralisée des variables d'environnement.
 *
 * Modèle de connexion identique à wow-helper-v2 :
 *  - LECTURE  : endpoint public gviz (aucune authentification, sheet partagé
 *               "tout le monde avec le lien peut consulter").
 *  - ÉCRITURE : webhook Google Apps Script (déployé en Web App).
 */

function required(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === "") {
    throw new Error(
      `Variable d'environnement manquante : ${name}. ` +
        `Vérifie ton fichier .env (voir .env.example).`
    );
  }
  return value;
}

function optionalNumber(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

export const config = {
  // ── Lecture (gviz) ──
  sheetId: () => required("GOOGLE_SHEET_ID"),
  gid: () => required("GOOGLE_SHEET_GID_HISTO_SAISIES"),

  // ── Écriture (Apps Script) ──
  appsScriptUrl: () => required("GOOGLE_APPS_SCRIPT_URL"),
  appsScriptToken: () => process.env.GOOGLE_APPS_SCRIPT_TOKEN?.trim() || "",

  // ── Tarification / seuils ──
  pricePerM3: () => optionalNumber("WATER_PRICE_PER_M3", 4.36),
  thresholdGreen: () => optionalNumber("WATER_THRESHOLD_GREEN", 350),
  thresholdOrange: () => optionalNumber("WATER_THRESHOLD_ORANGE", 600),
  thresholdRed: () => optionalNumber("WATER_THRESHOLD_RED", 1000),
};
