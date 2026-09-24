"use client";

import { useState } from "react";
import Link from "next/link";
import { AdminRamoSwitcher } from "@/components/admin-ramo-switcher";

export function CreateBudgetCta({
  isAdmin,
  currentRamoId,
  currentRamoName,
}: {
  isAdmin: boolean;
  currentRamoId: number | null;
  currentRamoName: string;
}) {
  const [open, setOpen] = useState(false);

  if (!isAdmin) {
    return (
      <Link
        href="/painel/orcamentos/novo"
        className="flex min-h-12 items-center justify-center rounded-btn bg-gold px-5 text-base font-semibold text-ink hover:bg-gold-press md:inline-flex md:w-auto"
      >
        + Criar orçamento
      </Link>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex min-h-12 w-full items-center justify-center rounded-btn bg-gold px-5 text-base font-semibold text-ink hover:bg-gold-press md:w-auto"
      >
        + Criar orçamento
      </button>
      {open ? (
        <div className="mt-3">
          <AdminRamoSwitcher
            currentRamoId={currentRamoId}
            currentRamoName={currentRamoName}
            afterPick="novo"
          />
        </div>
      ) : null}
    </div>
  );
}
