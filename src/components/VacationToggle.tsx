"use client";

interface Props {
  checked: boolean;
  onChange: (value: boolean) => void;
  /** name du champ pour la soumission du formulaire. */
  name?: string;
}

/** Interrupteur "Mode Vacances". Inclut un checkbox caché pour le form. */
export default function VacationToggle({ checked, onChange, name }: Props) {
  return (
    <label className="flex items-center justify-between gap-3 cursor-pointer select-none">
      <span className="text-sm font-medium text-slate-700">
        Mode Vacances 🏖️
      </span>

      {/* Champ réellement soumis dans le FormData */}
      {name && (
        <input type="checkbox" name={name} checked={checked} readOnly hidden />
      )}

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors ${
          checked ? "bg-violet-500" : "bg-slate-300"
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </label>
  );
}
