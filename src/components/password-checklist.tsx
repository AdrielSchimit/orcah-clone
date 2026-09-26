"use client";

import { passwordChecks } from "@/lib/password-rules";

/** Checklist curta da senha forte: ○ vira ✓ conforme a pessoa digita. */
export function PasswordChecklist({ password }: { password: string }) {
  const checks = passwordChecks(password);
  return (
    <ul className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs" aria-label="Requisitos da senha">
      {checks.map((check) => (
        <li
          key={check.key}
          className={`flex min-w-0 items-center gap-1.5 ${check.ok ? "font-medium text-ok" : "text-text-soft"}`}
        >
          <span aria-hidden className="w-3 shrink-0 text-center">
            {check.ok ? "✓" : "○"}
          </span>
          <span className="truncate">{check.label}</span>
          <span className="sr-only">{check.ok ? "(ok)" : "(falta)"}</span>
        </li>
      ))}
    </ul>
  );
}
