/** Utilitaires de dates. Le Sheet stocke les dates en DD-MM-YYYY. */

/** "29-05-2026" -> "2026-05-29" (ISO, triable). Retourne "" si invalide. */
export function ddmmyyyyToIso(d: string): string {
  const m = d.trim().match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (!m) return "";
  const [, dd, mm, yyyy] = m;
  return `${yyyy}-${mm}-${dd}`;
}

/** Objet Date -> "DD-MM-YYYY". */
export function toDdmmyyyy(date: Date): string {
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

/** Date du jour au format DD-MM-YYYY. */
export function todayDdmmyyyy(): string {
  return toDdmmyyyy(new Date());
}

/** Date du jour au format ISO YYYY-MM-DD (pour <input type="date">). */
export function todayIso(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

/** "2026-05-29" -> "29-05-2026". Retourne "" si invalide. */
export function isoToDdmmyyyy(iso: string): string {
  const m = iso.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return "";
  const [, yyyy, mm, dd] = m;
  return `${dd}-${mm}-${yyyy}`;
}

/** Nombre de jours entre deux dates ISO (b - a). */
export function diffDaysIso(aIso: string, bIso: string): number {
  const a = new Date(aIso + "T00:00:00Z").getTime();
  const b = new Date(bIso + "T00:00:00Z").getTime();
  return Math.round((b - a) / 86400000);
}

/** Ajoute n jours à une date ISO et renvoie une date ISO. */
export function addDaysIso(iso: string, n: number): string {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${d.getUTCFullYear()}-${mm}-${dd}`;
}
