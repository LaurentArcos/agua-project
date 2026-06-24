import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Client Supabase côté serveur uniquement.
 *
 * On utilise la clé "service_role" : toute la lecture/écriture se fait dans des
 * Server Components et Server Actions (jamais dans le navigateur), et l'accès à
 * l'app est déjà verrouillé par le code à 4 chiffres (voir middleware.ts).
 * NE JAMAIS importer ce fichier depuis un composant client.
 */

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (client) return client;

  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Configuration Supabase manquante : renseigne SUPABASE_URL et " +
        "SUPABASE_SERVICE_ROLE_KEY dans .env (voir .env.example)."
    );
  }

  client = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}
