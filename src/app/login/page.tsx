"use client";

import { useActionState, useState } from "react";
import { loginAction, type LoginState } from "./actions";

const initialState: LoginState = { error: "" };

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, initialState);
  const [code, setCode] = useState("");

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <div className="w-full max-w-xs rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="mb-6 flex flex-col items-center gap-1 text-center">
          <span className="text-3xl">💧</span>
          <h1 className="text-lg font-bold text-slate-900">Accès protégé</h1>
          <p className="text-sm text-slate-500">Saisis ton code à 8 chiffres.</p>
        </div>

        <form action={formAction} className="flex flex-col gap-4">
          <input
            name="code"
            type="password"
            inputMode="numeric"
            autoComplete="off"
            autoFocus
            maxLength={8}
            pattern="\d{8}"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 8))}
            placeholder="••••••••"
            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-5 text-center text-3xl font-bold tracking-[0.35em] tabular-nums text-slate-900 shadow-inner outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
          />

          <button
            type="submit"
            disabled={isPending || code.length < 8}
            className="w-full cursor-pointer rounded-2xl bg-sky-600 px-6 py-4 text-lg font-bold text-white shadow-lg transition-colors hover:bg-sky-700 active:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? "Vérification…" : "Entrer"}
          </button>

          {state.error && (
            <p
              role="alert"
              className="rounded-xl bg-red-50 px-4 py-3 text-center text-sm font-medium text-red-700 ring-1 ring-red-200"
            >
              {state.error}
            </p>
          )}
        </form>
      </div>
    </main>
  );
}
