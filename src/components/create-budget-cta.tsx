"use client";

import { useState } from "react";
import Link from "next/link";
import { AdminRamoSwitcher } from "@/components/admin-ramo-switcher";
import { OrcahIcon } from "@/components/orcah-logo";

/** Card escuro premium: dourado só no brilho, no ícone e no botão. */
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
  const buttonClass =
    "gold-glow flex min-h-12 w-full items-center justify-center rounded-btn bg-gold px-5 text-base font-semibold text-ink hover:bg-gold-press sm:w-auto";

  return (
    <section className="gold-edge relative overflow-hidden rounded-box border bg-ink p-5 text-ink-text">
      <span aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-gold/20 blur-3xl" />
      <div className="relative flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-btn border border-gold/40 bg-ink-tile">
          <OrcahIcon className="h-7 w-7" />
        </span>
        <div className="min-w-0">
          <h2 className="text-lg font-semibold">Novo orçamento</h2>
          <p className="mt-0.5 text-sm text-ink-soft">Crie uma proposta profissional em poucos minutos.</p>
        </div>
      </div>
      <div className="relative mt-4">
        {isAdmin ? (
          <>
            <button type="button" onClick={() => setOpen((value) => !value)} className={buttonClass}>
              Criar orçamento
            </button>
            {open ? (
              <div className="mt-3 rounded-btn bg-card p-3 text-text">
                <AdminRamoSwitcher currentRamoId={currentRamoId} currentRamoName={currentRamoName} afterPick="novo" />
              </div>
            ) : null}
          </>
        ) : (
          <Link href="/painel/orcamentos/novo" className={buttonClass}>
            Criar orçamento
          </Link>
        )}
      </div>
    </section>
  );
}
