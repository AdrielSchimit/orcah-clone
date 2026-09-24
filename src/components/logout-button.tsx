"use client";

import { appUrl } from "@/lib/urls";

export function LogoutButton({ className }: { className?: string }) {
  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.assign(`${appUrl("/api/auth/logout")}`);
  }

  return (
    <button type="button" onClick={logout} className={className ?? "text-sm text-text-soft"}>
      Sair
    </button>
  );
}
