"use server";

import { revalidatePath } from "next/cache";
import { appendReading, getLastReading } from "@/lib/google-sheets";
import { config } from "@/lib/config";
import { isoToDdmmyyyy, todayIso, diffDaysIso } from "@/lib/date";

export interface ActionState {
  ok: boolean;
  message: string;
  consoL?: number;
}

/**
 * Server Action : enregistre une nouvelle saisie d'index à une date donnée.
 * Calcule la conso (litres) et le coût (€) à partir du dernier index connu.
 * Si la date saute un ou plusieurs jours, la conso reste l'écart total
 * (la répartition par jour est faite à l'affichage).
 */
export async function addReadingAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const rawIndex = String(formData.get("index") ?? "").replace(",", ".").trim();
  const rawDate = String(formData.get("date") ?? "").trim(); // ISO yyyy-mm-dd
  const vacances = formData.get("vacances") === "on";

  const indexM3 = Number(rawIndex);
  if (!rawIndex || !Number.isFinite(indexM3) || indexM3 < 0) {
    return { ok: false, message: "Index invalide. Saisis un nombre positif." };
  }

  // Date du relevé (par défaut aujourd'hui).
  const iso = rawDate || todayIso();
  const dateDdmmyyyy = isoToDdmmyyyy(iso);
  if (!dateDdmmyyyy) {
    return { ok: false, message: "Date invalide." };
  }
  if (iso > todayIso()) {
    return { ok: false, message: "La date ne peut pas être dans le futur." };
  }

  try {
    const last = await getLastReading();

    let days = 1;
    if (last) {
      if (indexM3 < last.indexM3) {
        return {
          ok: false,
          message: `L'index (${indexM3}) est inférieur au dernier relevé (${last.indexM3}). Vérifie ta saisie.`,
        };
      }
      // On n'autorise que des dates postérieures au dernier relevé (ajout chronologique).
      if (iso <= last.isoDate) {
        return {
          ok: false,
          message: `La date doit être postérieure au dernier relevé (${last.date}).`,
        };
      }
      days = Math.max(1, diffDaysIso(last.isoDate, iso));
    }

    // (index du jour - index du dernier relevé) * 1000, sur l'ensemble de l'écart.
    const consoL = last ? Math.round((indexM3 - last.indexM3) * 1000) : 0;
    const coutEur = Math.round((consoL / 1000) * config.pricePerM3() * 100) / 100;

    await appendReading({
      date: dateDdmmyyyy,
      indexM3,
      consoL,
      coutEur,
      vacances,
    });

    revalidatePath("/");

    let message: string;
    if (!last) {
      message = "Premier index enregistré. La conso sera calculée dès la prochaine saisie.";
    } else if (days > 1) {
      message = `Saisie enregistrée : ${consoL} L sur ${days} jours (≈ ${Math.round(
        consoL / days
      )} L/jour).`;
    } else {
      message = `Saisie enregistrée : ${consoL} L.`;
    }

    return { ok: true, message, consoL };
  } catch (err) {
    console.error("[addReadingAction]", err);
    return {
      ok: false,
      message:
        "Erreur lors de l'écriture dans Google Sheets. Vérifie la config (.env) et le partage du Sheet.",
    };
  }
}
