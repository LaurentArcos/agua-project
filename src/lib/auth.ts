/**
 * Authentification minimale par code à 4 chiffres.
 *
 * - Le code est stocké côté serveur dans AGUA_ACCESS_CODE.
 * - Après saisie correcte, on pose un cookie de session httpOnly dont la valeur
 *   est un jeton dérivé de AGUA_SESSION_SECRET (SHA-256). Le secret lui-même
 *   n'est jamais exposé au navigateur.
 * - Le middleware vérifie ce jeton sur chaque requête.
 *
 * Ce module est partagé entre le middleware (runtime Edge) et les Server
 * Actions (runtime Node) : il n'utilise que l'API Web Crypto globale.
 */

export const SESSION_COOKIE = "agua_session";

/** Jeton de session attendu, dérivé du secret serveur. */
export async function sessionToken(): Promise<string> {
  const secret = process.env.AGUA_SESSION_SECRET;
  if (!secret || secret.trim() === "") {
    throw new Error(
      "AGUA_SESSION_SECRET manquant : ajoute une longue valeur aléatoire dans .env."
    );
  }
  const data = new TextEncoder().encode("agua-session-v1:" + secret);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Vérifie qu'une valeur de cookie correspond au jeton attendu (comparaison constante). */
export async function isValidSession(value: string | undefined | null): Promise<boolean> {
  if (!value) return false;
  let expected: string;
  try {
    expected = await sessionToken();
  } catch {
    return false;
  }
  if (value.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < value.length; i++) {
    diff |= value.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return diff === 0;
}
