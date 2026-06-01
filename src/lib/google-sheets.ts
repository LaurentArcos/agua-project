import "server-only";
import { config } from "./config";
import { ddmmyyyyToIso } from "./date";
import type { Reading } from "./types";

/**
 * Colonnes attendues dans l'onglet (ligne 1 = en-têtes) :
 *   Date (DD-MM-YYYY) | Index_m3 | Conso_L | Cout_EUR | Mode_Vacances
 *
 * LECTURE via l'endpoint public gviz (même approche que wow-helper-v2).
 * Le sheet doit être partagé "Tout le monde avec le lien : Lecteur".
 */

const HOLIDAY_TRUE = new Set(["true", "vrai", "oui", "1", "x"]);

type GvizCell = { v: unknown; f?: string } | null;
type GvizCol = { label?: string; id: string };
type GvizTable = { cols: GvizCol[]; rows: { c: GvizCell[] }[] };

function parseFrNumber(raw: unknown): number {
  if (typeof raw === "number") return raw;
  if (raw == null) return 0;
  const cleaned = String(raw).replace(/\s/g, "").replace(",", ".");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

function parseBool(raw: unknown): boolean {
  if (typeof raw === "boolean") return raw;
  if (raw == null) return false;
  return HOLIDAY_TRUE.has(String(raw).trim().toLowerCase());
}

/** Normalise une valeur de date gviz en DD-MM-YYYY (ou "" si non reconnue). */
function gvizDate(cell: GvizCell): string {
  if (!cell) return "";
  // Cellule de type date -> v = "Date(2026,4,29)" (mois 0-indexé)
  if (typeof cell.v === "string") {
    const m = cell.v.match(/^Date\((\d+),(\d+),(\d+)/);
    if (m) {
      const [, y, mo, d] = m;
      const dd = d.padStart(2, "0");
      const mm = String(Number(mo) + 1).padStart(2, "0");
      return `${dd}-${mm}-${y}`;
    }
    // Déjà une chaîne JJ-MM-AAAA ou JJ/MM/AAAA
    const s = cell.v.trim().replace(/\//g, "-");
    if (/^\d{2}-\d{2}-\d{4}$/.test(s)) return s;
  }
  // Repli sur la valeur formatée affichée
  if (cell.f) {
    const s = cell.f.trim().replace(/\//g, "-");
    if (/^\d{2}-\d{2}-\d{4}$/.test(s)) return s;
  }
  return "";
}

/** Lit toutes les saisies depuis gviz, triées par date croissante. */
export async function getAllReadings(): Promise<Reading[]> {
  const url = `https://docs.google.com/spreadsheets/d/${config.sheetId()}/gviz/tq?tqx=out:json&gid=${config.gid()}`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(
      `Lecture du Sheet impossible (HTTP ${res.status}). ` +
        `Vérifie l'ID/GID et que le document est partagé publiquement en lecture.`
    );
  }

  const text = await res.text();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) {
    throw new Error("Réponse gviz inattendue (le Sheet est-il bien public ?).");
  }

  const json = JSON.parse(text.slice(start, end + 1)) as { table: GvizTable };
  const table = json.table;

  // Index des colonnes par libellé d'en-tête.
  const colIndex: Record<string, number> = {};
  table.cols.forEach((c, i) => {
    const key = (c.label || c.id || "").trim();
    if (key) colIndex[key] = i;
  });
  const at = (cells: GvizCell[], name: string): GvizCell =>
    colIndex[name] != null ? cells[colIndex[name]] ?? null : null;

  const readings: Reading[] = table.rows
    .map((row): Reading | null => {
      const cells = row.c || [];
      const date = gvizDate(at(cells, "Date"));
      if (!date) return null; // ignore en-têtes résiduels / lignes vides
      return {
        date,
        isoDate: ddmmyyyyToIso(date),
        indexM3: parseFrNumber(at(cells, "Index_m3")?.v),
        consoL: parseFrNumber(at(cells, "Conso_L")?.v),
        coutEur: parseFrNumber(at(cells, "Cout_EUR")?.v),
        vacances: parseBool(at(cells, "Mode_Vacances")?.v),
        arrosage: parseBool(at(cells, "Arrosage")?.v),
        piscine: parseBool(at(cells, "Piscine")?.v),
      };
    })
    .filter((r): r is Reading => r !== null);

  readings.sort((a, b) => a.isoDate.localeCompare(b.isoDate));
  return readings;
}

/** Renvoie la dernière saisie ou null. */
export async function getLastReading(): Promise<Reading | null> {
  const all = await getAllReadings();
  return all.length ? all[all.length - 1] : null;
}

/** Ajoute une ligne via le webhook Apps Script (écriture). */
export async function appendReading(row: {
  date: string;
  indexM3: number;
  consoL: number;
  coutEur: number;
  vacances: boolean;
  arrosage: boolean;
  piscine: boolean;
}): Promise<void> {
  const res = await fetch(config.appsScriptUrl(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    body: JSON.stringify({ token: config.appsScriptToken(), ...row }),
  });

  if (!res.ok) {
    throw new Error(`Écriture refusée par Apps Script (HTTP ${res.status}).`);
  }

  // Apps Script renvoie { ok: true } en cas de succès.
  const data = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
  if (!data?.ok) {
    throw new Error(data?.error || "Réponse Apps Script invalide.");
  }
}
