"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { loginAction, type LoginState } from "./actions";

const initialState: LoginState = { error: "" };
const CODE_LENGTH = 8;
const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

/** Mélange de Fisher-Yates (copie). */
function shuffle(arr: number[]): number[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, initialState);
  const [code, setCode] = useState("");
  // Ordre stable au 1er rendu (SSR) puis mélangé côté client (évite tout
  // décalage d'hydratation).
  const [keys, setKeys] = useState<number[]>(DIGITS);
  const formRef = useRef<HTMLFormElement>(null);

  // Mélange initial après le montage.
  useEffect(() => {
    setKeys(shuffle(DIGITS));
  }, []);

  // À chaque tentative refusée : on vide la saisie et on re-mélange.
  // `state` est un nouvel objet à chaque soumission, donc l'effet se déclenche
  // même si le message d'erreur est identique.
  useEffect(() => {
    if (state.error) {
      setCode("");
      setKeys(shuffle(DIGITS));
    }
  }, [state]);

  // Soumission automatique dès que les 8 chiffres sont saisis.
  useEffect(() => {
    if (code.length === CODE_LENGTH && !isPending) {
      formRef.current?.requestSubmit();
    }
  }, [code, isPending]);

  const press = (d: number) =>
    setCode((c) => (c.length >= CODE_LENGTH ? c : c + d));
  const backspace = () => setCode((c) => c.slice(0, -1));
  const clearAll = () => setCode("");

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <div className="w-full max-w-xs rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="mb-5 flex flex-col items-center gap-1 text-center">
          <span className="text-3xl">💧</span>
          <h1 className="text-lg font-bold text-slate-900">Accès protégé</h1>
          <p className="text-sm text-slate-500">Compose ton code à 8 chiffres.</p>
        </div>

        {/* Points de progression */}
        <div className="mb-5 flex items-center justify-center gap-2">
          {Array.from({ length: CODE_LENGTH }).map((_, i) => (
            <span
              key={i}
              className={`h-3 w-3 rounded-full transition-colors ${
                i < code.length ? "bg-sky-600" : "bg-slate-200"
              }`}
            />
          ))}
        </div>

        <form ref={formRef} action={formAction}>
          <input type="hidden" name="code" value={code} />

          {/* Pavé mélangé : 10 chiffres + Effacer + Retour arrière */}
          <div className="grid grid-cols-3 gap-3">
            {keys.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => press(d)}
                disabled={isPending || code.length >= CODE_LENGTH}
                className="aspect-square cursor-pointer rounded-2xl bg-slate-100 text-2xl font-bold text-slate-900 ring-1 ring-slate-200 transition-colors hover:bg-slate-200 active:bg-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {d}
              </button>
            ))}

            <button
              type="button"
              onClick={clearAll}
              disabled={isPending || code.length === 0}
              aria-label="Tout effacer"
              className="aspect-square cursor-pointer rounded-2xl text-sm font-semibold text-slate-500 transition-colors hover:bg-slate-100 active:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Effacer
            </button>

            <button
              type="button"
              onClick={backspace}
              disabled={isPending || code.length === 0}
              aria-label="Effacer le dernier chiffre"
              className="aspect-square cursor-pointer rounded-2xl text-2xl text-slate-500 transition-colors hover:bg-slate-100 active:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
            >
              ⌫
            </button>
          </div>
        </form>

        {isPending && (
          <p className="mt-4 text-center text-sm text-slate-400">Vérification…</p>
        )}

        {state.error && !isPending && (
          <p
            role="alert"
            className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-center text-sm font-medium text-red-700 ring-1 ring-red-200"
          >
            {state.error}
          </p>
        )}
      </div>
    </main>
  );
}
