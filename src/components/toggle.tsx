"use client";

/** Liga/desliga grande o bastante para o dedo (linha inteira é clicável). */
export function Toggle({
  label,
  hint,
  checked,
  onChange,
  name,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  name?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex min-h-14 w-full items-center justify-between gap-3 rounded-btn border border-line bg-card px-4 py-3 text-left"
    >
      <span className="min-w-0">
        <span className="block text-sm font-medium text-text">{label}</span>
        {hint ? <span className="block text-xs text-text-soft">{hint}</span> : null}
      </span>
      <span
        aria-hidden
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${checked ? "bg-gold" : "bg-paper-alt"}`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-card shadow transition-transform ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </span>
      {name ? <input type="hidden" name={name} value={checked ? "true" : "false"} /> : null}
    </button>
  );
}
