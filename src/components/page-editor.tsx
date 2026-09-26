"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useRef, useState } from "react";
import { Toggle } from "@/components/toggle";
import { uploadImage } from "@/lib/client-image";

const inputClass = "w-full rounded-btn border border-line bg-card px-4 py-3 text-base text-text";
const saveClass =
  "min-h-12 w-full rounded-btn bg-ink px-4 text-base font-semibold text-ink-text hover:bg-ink-tile disabled:opacity-60";

function useSave() {
  const router = useRouter();
  const [status, setStatus] = useState<{ saving: boolean; saved: boolean; error: string }>({
    saving: false,
    saved: false,
    error: "",
  });

  async function save(payload: Record<string, unknown>) {
    setStatus({ saving: true, saved: false, error: "" });
    try {
      const response = await fetch("/api/empresa", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        setStatus({ saving: false, saved: false, error: data.error ?? "Não foi possível salvar." });
        return false;
      }
      setStatus({ saving: false, saved: true, error: "" });
      router.refresh();
      return true;
    } catch {
      setStatus({ saving: false, saved: false, error: "Falha de conexão. Tente de novo." });
      return false;
    }
  }

  return { ...status, save };
}

function Feedback({ saved, error }: { saved: boolean; error: string }) {
  if (error) return <p className="text-sm text-no">{error}</p>;
  if (saved) return <p className="text-sm font-medium text-ok">Salvo. Já está na sua página.</p>;
  return null;
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-text-soft">{hint}</span> : null}
    </label>
  );
}

// ---------- compartilhar ----------

export function ShareBar({ url, name }: { url: string; name: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copie o link da sua página:", url);
    }
  }

  async function share() {
    if (navigator.share) {
      try {
        await navigator.share({ title: name, text: `Conheça ${name} e peça seu orçamento:`, url });
        return;
      } catch {
        // usuário cancelou: não faz nada
        return;
      }
    }
    await copy();
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      <button type="button" onClick={() => void copy()} className="min-h-12 rounded-btn border border-line bg-card px-2 text-sm font-medium">
        {copied ? "Copiado ✓" : "Copiar link"}
      </button>
      <button type="button" onClick={() => void share()} className="min-h-12 rounded-btn border border-line bg-card px-2 text-sm font-medium">
        Compartilhar
      </button>
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="flex min-h-12 items-center justify-center rounded-btn border border-line bg-card px-2 text-center text-sm font-medium"
      >
        Abrir
      </a>
    </div>
  );
}

// ---------- perfil ----------

type State = { id: number; name: string; uf: string };

export function ProfileForm({
  company,
  states,
}: {
  company: {
    name: string;
    description: string | null;
    openingHours: string | null;
    servesRegion: boolean;
    stateId: number;
    cityName: string;
    ramo: string;
  };
  states: State[];
}) {
  const { saving, saved, error, save } = useSave();
  const [servesRegion, setServesRegion] = useState(company.servesRegion);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await save({
      name: form.get("name"),
      description: form.get("description"),
      openingHours: form.get("openingHours"),
      stateId: form.get("stateId"),
      cityName: form.get("cityName"),
      servesRegion,
    });
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <Field label="Nome do negócio">
        <input name="name" required defaultValue={company.name} className={inputClass} />
      </Field>
      <Field label="O que você faz" hint={`Ramo: ${company.ramo}. Uma ou duas frases já bastam.`}>
        <textarea
          name="description"
          rows={4}
          maxLength={600}
          defaultValue={company.description ?? ""}
          placeholder="Pintura residencial e comercial com acabamento caprichado. Orçamento sem compromisso."
          className={inputClass}
        />
      </Field>
      <div className="grid grid-cols-[6.5rem_1fr] gap-3">
        <Field label="Estado">
          <select name="stateId" defaultValue={company.stateId} className={inputClass}>
            {states.map((state) => (
              <option key={state.id} value={state.id}>
                {state.uf}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Cidade">
          <input name="cityName" defaultValue={company.cityName} placeholder="Sua cidade" className={inputClass} />
        </Field>
      </div>
      <Toggle label="Atendo cidades vizinhas" hint="Mostra “e região” na sua página." checked={servesRegion} onChange={setServesRegion} />
      <Field label="Horário de atendimento">
        <input name="openingHours" defaultValue={company.openingHours ?? ""} placeholder="Seg a sáb, 8h às 18h" className={inputClass} />
      </Field>
      <Feedback saved={saved} error={error} />
      <button type="submit" disabled={saving} className={saveClass}>
        {saving ? "Salvando…" : "Salvar perfil"}
      </button>
    </form>
  );
}

// ---------- contato ----------

export function ContactForm({
  company,
}: {
  company: { whatsapp: string; phone: string; instagram: string | null; facebook: string | null; website: string | null };
}) {
  const { saving, saved, error, save } = useSave();

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await save({
      whatsapp: form.get("whatsapp"),
      phone: form.get("phone"),
      instagram: form.get("instagram"),
      facebook: form.get("facebook"),
      website: form.get("website"),
    });
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <Field label="WhatsApp" hint="O botão verde da sua página chama esse número.">
        <input name="whatsapp" inputMode="tel" required defaultValue={company.whatsapp} placeholder="16 99999-0000" className={inputClass} />
      </Field>
      <Field label="Telefone (opcional)">
        <input name="phone" inputMode="tel" defaultValue={company.phone} placeholder="16 3333-0000" className={inputClass} />
      </Field>
      <Field label="Instagram">
        <input name="instagram" defaultValue={company.instagram ?? ""} placeholder="@seunegocio" className={inputClass} />
      </Field>
      <Field label="Facebook">
        <input name="facebook" defaultValue={company.facebook ?? ""} placeholder="facebook.com/seunegocio" className={inputClass} />
      </Field>
      <Field label="Site">
        <input name="website" inputMode="url" defaultValue={company.website ?? ""} placeholder="seunegocio.com.br" className={inputClass} />
      </Field>
      <p className="text-xs text-text-soft">Só aparece na página o que você preencher. E-mail e documento nunca aparecem.</p>
      <Feedback saved={saved} error={error} />
      <button type="submit" disabled={saving} className={saveClass}>
        {saving ? "Salvando…" : "Salvar contato"}
      </button>
    </form>
  );
}

// ---------- aparência ----------

const PRESETS = [
  { primary: "#0b1120", secondary: "#ffb020", label: "Orçah" },
  { primary: "#14532d", secondary: "#facc15", label: "Verde" },
  { primary: "#1e3a8a", secondary: "#f97316", label: "Azul" },
  { primary: "#7f1d1d", secondary: "#fbbf24", label: "Vinho" },
  { primary: "#f5f0e6", secondary: "#151f38", label: "Creme" },
  { primary: "#262626", secondary: "#e5e5e5", label: "Grafite" },
];

export function AppearanceForm({
  company,
}: {
  company: { logoPath: string | null; primaryColor: string | null; secondaryColor: string | null; name: string };
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const { saving, saved, error, save } = useSave();
  const [primary, setPrimary] = useState(company.primaryColor ?? PRESETS[0].primary);
  const [secondary, setSecondary] = useState(company.secondaryColor ?? PRESETS[0].secondary);
  const [logoError, setLogoError] = useState("");
  const [uploading, setUploading] = useState(false);

  async function onLogo(file: File | undefined) {
    if (!file) return;
    setLogoError("");
    setUploading(true);
    const result = await uploadImage("/api/empresa/logo", file);
    setUploading(false);
    if (!result.ok) {
      setLogoError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-dashed border-line bg-paper text-2xl text-gold-deep"
          aria-label="Trocar logo"
        >
          {company.logoPath ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={company.logoPath} alt="" className="h-full w-full object-cover" />
          ) : (
            "+"
          )}
        </button>
        <div className="min-w-0">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="min-h-11 rounded-btn border border-line px-4 text-sm font-medium disabled:opacity-60"
          >
            {uploading ? "Enviando…" : company.logoPath ? "Trocar logo" : "Enviar logo"}
          </button>
          <p className="mt-1 text-xs text-text-soft">Quadrada fica melhor. JPG, PNG ou WEBP.</p>
          {logoError ? <p className="mt-1 text-sm text-no">{logoError}</p> : null}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={(event) => void onLogo(event.target.files?.[0])}
        />
      </div>

      <div>
        <p className="mb-2 text-sm font-medium">Cores da página</p>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {PRESETS.map((preset) => {
            const active = preset.primary === primary && preset.secondary === secondary;
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => {
                  setPrimary(preset.primary);
                  setSecondary(preset.secondary);
                }}
                aria-pressed={active}
                className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-btn border px-1 py-2 text-xs ${
                  active ? "gold-glow border-gold" : "border-line"
                }`}
              >
                <span className="flex">
                  <span className="h-5 w-5 rounded-full border border-black/10" style={{ backgroundColor: preset.primary }} />
                  <span className="-ml-1.5 h-5 w-5 rounded-full border border-black/10" style={{ backgroundColor: preset.secondary }} />
                </span>
                {preset.label}
              </button>
            );
          })}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <label className="flex min-h-12 items-center gap-2 rounded-btn border border-line px-3 text-sm">
            <input type="color" value={primary} onChange={(event) => setPrimary(event.target.value)} className="h-8 w-8 shrink-0 cursor-pointer rounded border-0 bg-transparent p-0" />
            Principal
          </label>
          <label className="flex min-h-12 items-center gap-2 rounded-btn border border-line px-3 text-sm">
            <input type="color" value={secondary} onChange={(event) => setSecondary(event.target.value)} className="h-8 w-8 shrink-0 cursor-pointer rounded border-0 bg-transparent p-0" />
            Destaque
          </label>
        </div>
        <div className="mt-3 overflow-hidden rounded-box border border-line" aria-hidden>
          <div className="relative px-4 py-5" style={{ backgroundColor: primary }}>
            <span
              className="absolute -right-6 -top-6 h-20 w-20 rounded-full opacity-30 blur-2xl"
              style={{ backgroundColor: secondary }}
            />
            <p className="relative font-semibold" style={{ color: readable(primary) }}>
              {company.name}
            </p>
            <span className="relative mt-2 inline-block rounded-btn bg-gold px-3 py-1.5 text-xs font-semibold text-ink">Pedir orçamento</span>
          </div>
        </div>
      </div>

      <Feedback saved={saved} error={error} />
      <button
        type="button"
        disabled={saving}
        onClick={() => void save({ primaryColor: primary, secondaryColor: secondary })}
        className={saveClass}
      >
        {saving ? "Salvando…" : "Salvar cores"}
      </button>
    </div>
  );
}

function readable(hex: string) {
  const value = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(value.slice(i, i + 2), 16) / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.55 ? "#151f38" : "#ffffff";
}

// ---------- fotos ----------

type Photo = { id: number; path: string; title: string | null };

export function GalleryManager({ photos, limit }: { photos: Photo[]; limit: number }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const full = photos.length >= limit;

  async function onFile(file: File | undefined) {
    if (!file) return;
    setError("");
    setUploading(true);
    const result = await uploadImage("/api/empresa/fotos", file, title.trim() ? { title: title.trim() } : undefined);
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setTitle("");
    router.refresh();
  }

  async function remove(id: number) {
    if (!window.confirm("Remover esta foto da página?")) return;
    const response = await fetch(`/api/empresa/fotos/${id}`, { method: "DELETE" }).catch(() => null);
    if (!response?.ok) {
      setError("Não foi possível remover.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-3">
      {photos.length > 0 ? (
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {photos.map((photo) => (
            <li key={photo.id} className="overflow-hidden rounded-xl border border-line bg-card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.path} alt={photo.title || ""} loading="lazy" className="aspect-square w-full object-cover" />
              <div className="flex items-center justify-between gap-2 px-2 py-1">
                <span className="truncate text-xs text-text-soft">{photo.title || "Sem título"}</span>
                <button type="button" onClick={() => void remove(photo.id)} className="min-h-10 px-1 text-xs font-medium text-no">
                  Remover
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      {full ? (
        <p className="text-sm text-text-soft">Você chegou ao limite de {limit} fotos. Remova uma para adicionar outra.</p>
      ) : (
        <>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={120}
            placeholder="Legenda (opcional): Fachada pintada no Centro"
            className={inputClass}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="gold-glow min-h-12 rounded-btn bg-gold px-4 text-base font-semibold text-ink hover:bg-gold-press disabled:opacity-60"
          >
            {uploading ? "Enviando foto…" : "+ Tirar ou escolher foto"}
          </button>
          <p className="text-xs text-text-soft">
            {photos.length} de {limit} fotos. A gente ajusta o tamanho para carregar rápido.
          </p>
        </>
      )}
      {error ? <p className="text-sm text-no">{error}</p> : null}
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={(event) => void onFile(event.target.files?.[0])}
      />
    </div>
  );
}

// ---------- configuração assistida ----------

export function AssistedSetupCard({
  active,
  priceLabel,
}: {
  active: { status: string; statusLabel: string } | null;
  priceLabel: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function request() {
    setLoading(true);
    setError("");
    const response = await fetch("/api/setup-assistido", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    }).catch(() => null);
    setLoading(false);
    if (!response?.ok) {
      setError("Não foi possível registrar agora. Tente de novo.");
      return;
    }
    router.refresh();
  }

  return (
    <section className="rounded-box border border-line bg-card p-4">
      <p className="text-xs font-medium uppercase tracking-[0.04em] text-gold-deep">Configuração assistida · {priceLabel}</p>
      <h2 className="mt-1 text-lg font-semibold">Quer sua página pronta?</h2>
      {active ? (
        <p className="mt-1 text-sm text-text-soft">
          <span className="font-medium text-ok">{active.statusLabel}.</span> Nossa equipe vai te chamar no WhatsApp para montar tudo com você.
        </p>
      ) : (
        <>
          <p className="mt-1 text-sm text-text-soft">
            A gente configura para você: descrição, logo, serviços, fotos e contatos. Nada é cobrado agora.
          </p>
          {error ? <p className="mt-2 text-sm text-no">{error}</p> : null}
          <button
            type="button"
            onClick={() => void request()}
            disabled={loading}
            className="mt-3 min-h-12 w-full rounded-btn border border-gold/60 px-4 text-sm font-semibold text-text hover:bg-gold-wash disabled:opacity-60 sm:w-auto"
          >
            {loading ? "Enviando…" : "Quero ajuda"}
          </button>
        </>
      )}
    </section>
  );
}
