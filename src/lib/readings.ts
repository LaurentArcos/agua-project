import "server-only";
import { getSupabase } from "./supabase";
import { ddmmyyyyToIso, isoToDdmmyyyy } from "./date";
import type { Reading } from "./types";

/**
 * Couche d'accès aux saisies, stockées dans la table Supabase `readings`.
 * Remplace l'ancienne lecture Google Sheets (gviz) / écriture Apps Script.
 */

interface ReadingRow {
  iso_date: string; // "YYYY-MM-DD"
  index_m3: number | string;
  conso_l: number | string;
  cout_eur: number | string;
  vacances: boolean;
  arrosage: boolean;
  piscine: boolean;
}

function num(v: number | string | null | undefined): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

function rowToReading(r: ReadingRow): Reading {
  const isoDate = r.iso_date;
  return {
    date: isoToDdmmyyyy(isoDate),
    isoDate,
    indexM3: num(r.index_m3),
    consoL: num(r.conso_l),
    coutEur: num(r.cout_eur),
    vacances: Boolean(r.vacances),
    arrosage: Boolean(r.arrosage),
    piscine: Boolean(r.piscine),
  };
}

/** Lit toutes les saisies, triées par date croissante. */
export async function getAllReadings(): Promise<Reading[]> {
  const { data, error } = await getSupabase()
    .from("readings")
    .select("iso_date, index_m3, conso_l, cout_eur, vacances, arrosage, piscine")
    .order("iso_date", { ascending: true });

  if (error) {
    throw new Error(`Lecture Supabase impossible : ${error.message}`);
  }

  return (data ?? []).map((r) => rowToReading(r as ReadingRow));
}

/** Renvoie la dernière saisie (date la plus récente) ou null. */
export async function getLastReading(): Promise<Reading | null> {
  const { data, error } = await getSupabase()
    .from("readings")
    .select("iso_date, index_m3, conso_l, cout_eur, vacances, arrosage, piscine")
    .order("iso_date", { ascending: false })
    .limit(1);

  if (error) {
    throw new Error(`Lecture Supabase impossible : ${error.message}`);
  }

  const rows = data ?? [];
  return rows.length ? rowToReading(rows[0] as ReadingRow) : null;
}

/**
 * Ajoute (ou met à jour si la date existe déjà) une saisie.
 * `date` est attendue en DD-MM-YYYY pour rester compatible avec l'appelant.
 */
export async function appendReading(row: {
  date: string;
  indexM3: number;
  consoL: number;
  coutEur: number;
  vacances: boolean;
  arrosage: boolean;
  piscine: boolean;
}): Promise<void> {
  const isoDate = ddmmyyyyToIso(row.date);
  if (!isoDate) {
    throw new Error(`Date invalide pour l'écriture : "${row.date}".`);
  }

  const { error } = await getSupabase()
    .from("readings")
    .upsert(
      {
        iso_date: isoDate,
        index_m3: row.indexM3,
        conso_l: row.consoL,
        cout_eur: row.coutEur,
        vacances: row.vacances,
        arrosage: row.arrosage,
        piscine: row.piscine,
      },
      { onConflict: "iso_date" }
    );

  if (error) {
    throw new Error(`Écriture Supabase refusée : ${error.message}`);
  }
}
