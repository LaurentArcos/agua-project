"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, sessionToken } from "@/lib/auth";

export interface LoginState {
  error: string;
}

/** Vérifie le code à 8 chiffres et ouvre une session si correct. */
export async function loginAction(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const code = String(formData.get("code") ?? "").trim();
  const expected = process.env.AGUA_ACCESS_CODE?.trim();

  if (!expected) {
    return { error: "Code d'accès non configuré côté serveur (AGUA_ACCESS_CODE)." };
  }
  if (!code) {
    return { error: "Saisis ton code." };
  }
  if (code !== expected) {
    return { error: "Code incorrect." };
  }

  const token = await sessionToken();
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 60, // 60 jours
  });

  redirect("/");
}

/** Ferme la session. */
export async function logoutAction() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  redirect("/login");
}
