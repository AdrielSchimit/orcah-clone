"use client";

import { FilePicker } from "@/components/file-picker";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type Company = {
  description?: string | null;
  openingHours?: string | null;
  instagram?: string | null;
  website?: string | null;
  facebook?: string | null;
  phone: string;
  whatsapp: string;
  logoPath?: string | null;
};

export function CompanyProfileForm({ company }: { company: Company }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [logoError, setLogoError] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSaved(false);
    setLoading(true);
    const form = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/empresa", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: form.get("description"),
          openingHours: form.get("openingHours"),
          instagram: form.get("instagram"),
          website: form.get("website"),
          facebook: form.get("facebook"),
          phone: form.get("phone"),
          whatsapp: form.get("whatsapp"),
        }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "Não foi possível salvar.");
        return;
      }
      setSaved(true);
      router.refresh();
    } catch {
      setError("Falha de conexão.");
    } finally {
      setLoading(false);
    }
  }

  async function onLogo(file: File | null) {
    if (!file) return;
    setLogoError("");
    const body = new FormData();
    body.set("file", file);
    const response = await fetch("/api/empresa/logo", { method: "POST", body });
    const data = (await response.json()) as { error?: string };
    if (!response.ok) {
      setLogoError(data.error ?? "Não foi possível enviar a logo.");
      return;
    }
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3 rounded-box border border-line bg-card p-4">
      <h2 className="text-xs font-medium uppercase tracking-[0.04em] text-text-soft">Perfil público</h2>
      <FilePicker
        accept="image/jpeg,image/png,image/webp"
        label="Logo"
        hint="JPG, PNG ou WebP"
        previewUrl={company.logoPath}
        onFile={(file) => void onLogo(file)}
      />
      {logoError ? <p className="text-sm text-no">{logoError}</p> : null}
      <textarea
        name="description"
        rows={3}
        defaultValue={company.description ?? ""}
        placeholder="O que você faz, para quem, em qual região"
        className="rounded-btn border border-line bg-card px-4 py-3"
      />
      <input
        name="openingHours"
        defaultValue={company.openingHours ?? ""}
        placeholder="Horário, ex.: Seg a sáb 8h–18h"
        className="rounded-btn border border-line bg-card px-4 py-3"
      />
      <input
        name="whatsapp"
        defaultValue={company.whatsapp}
        placeholder="WhatsApp"
        className="rounded-btn border border-line bg-card px-4 py-3"
      />
      <input
        name="phone"
        defaultValue={company.phone}
        placeholder="Telefone"
        className="rounded-btn border border-line bg-card px-4 py-3"
      />
      <input
        name="instagram"
        defaultValue={company.instagram ?? ""}
        placeholder="Instagram (usuario)"
        className="rounded-btn border border-line bg-card px-4 py-3"
      />
      <input
        name="website"
        defaultValue={company.website ?? ""}
        placeholder="Site"
        className="rounded-btn border border-line bg-card px-4 py-3"
      />
      <input
        name="facebook"
        defaultValue={company.facebook ?? ""}
        placeholder="Facebook"
        className="rounded-btn border border-line bg-card px-4 py-3"
      />
      {error ? <p className="text-sm text-no">{error}</p> : null}
      {saved ? <p className="text-sm text-ok">Perfil salvo.</p> : null}
      <button
        type="submit"
        disabled={loading}
        className="min-h-12 rounded-btn bg-gold px-4 font-semibold text-ink hover:bg-gold-press disabled:opacity-60"
      >
        {loading ? "Salvando…" : "Salvar perfil"}
      </button>
    </form>
  );
}
