"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useRef, useState } from "react";
import { PhoneInput } from "@/components/phone-input";
import { Toggle } from "@/components/toggle";
import { uploadImage } from "@/lib/client-image";
import { instagramHandle } from "@/lib/instagram";
import { LogoCropper } from "@/components/logo-cropper";
import buttonStyles from "@/components/home/home-buttons.module.css";

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
      <button type="button" onClick={() => void copy()} className={`${buttonStyles.secondary} min-h-10 rounded-btn px-3 text-sm font-medium`}>
        {copied ? "Copiado ✓" : "Copiar link"}
      </button>
      <button type="button" onClick={() => void share()} className={`${buttonStyles.secondary} min-h-10 rounded-btn px-3 text-sm font-medium`}>
        Compartilhar
      </button>
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className={`${buttonStyles.secondary} flex min-h-10 items-center justify-center rounded-btn px-3 text-center text-sm font-medium`}
      >
        Visualizar
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
  company: {
    whatsapp: string;
    phone: string;
    instagram: string | null;
    instagramConfirmed: boolean;
    facebook: string | null;
    website: string | null;
  };
}) {
  const { saving, saved, error, save } = useSave();
  const savedHandle = instagramHandle(company.instagram);
  const [instagram, setInstagram] = useState(company.instagram ?? "");
  const [confirmed, setConfirmed] = useState(company.instagramConfirmed && Boolean(savedHandle));
  const handle = instagramHandle(instagram);

  function onInstagramChange(value: string) {
    setInstagram(value);
    if (instagramHandle(value) !== savedHandle) setConfirmed(false);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await save({
      whatsapp: form.get("whatsapp"),
      phone: form.get("phone"),
      instagram: form.get("instagram"),
      instagramConfirmed: form.get("instagramConfirmed") === "true",
      facebook: form.get("facebook"),
      website: form.get("website"),
    });
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <Field label="WhatsApp" hint="O botão verde da sua página chama esse número.">
        <PhoneInput name="whatsapp" required defaultValue={company.whatsapp} placeholder="(49) 9 9999-0000" className={inputClass} />
      </Field>
      <Field label="Telefone (opcional)">
        <PhoneInput name="phone" defaultValue={company.phone} placeholder="(49) 3333-0000" className={inputClass} />
      </Field>
      <Field label="Instagram" hint="O @ da conta. Não precisa ser igual ao nome da página.">
        <input
          name="instagram"
          value={instagram}
          onChange={(event) => onInstagramChange(event.target.value)}
          placeholder="@seunegocio"
          className={inputClass}
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
        />
      </Field>
      {handle ? (
        <label className="flex items-start gap-3 rounded-btn border border-line bg-paper px-3 py-3 text-sm leading-snug">
          <input
            type="checkbox"
            name="instagramConfirmed"
            value="true"
            checked={confirmed}
            onChange={(event) => setConfirmed(event.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0"
          />
          <span>
            Confirmo que <strong>@{handle}</strong> é o Instagram da minha empresa.
          </span>
        </label>
      ) : null}
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

export function AppearanceForm({
  company,
}: {
  company: { logoPath: string | null; primaryColor: string | null; secondaryColor: string | null; name: string };
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [logoError, setLogoError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [pendingLogo, setPendingLogo] = useState<File | null>(null);
  const [logoPath, setLogoPath] = useState(company.logoPath);

  async function onLogo(file: File | undefined) {
    if (!file) return;
    setLogoError("");
    setUploading(true);
    try {
      const result = await uploadImage("/api/empresa/logo", file);
      if (!result.ok) {
        setLogoError(result.error);
        return;
      }
      if (typeof result.data.logoPath === "string") setLogoPath(result.data.logoPath);
      setPendingLogo(null);
      router.refresh();
    } catch {
      setLogoError("Não foi possível enviar a logo. Tente novamente.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-dashed border-line bg-paper text-2xl text-gold-deep disabled:opacity-60"
          aria-label="Trocar logo"
        >
          {logoPath ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoPath} alt="" className="h-full w-full object-cover" />
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
            {uploading ? "Enviando…" : logoPath ? "Trocar logo" : "Enviar logo"}
          </button>
          <p className="mt-1 text-xs text-text-soft">Escolha e ajuste o enquadramento. JPG, PNG ou WEBP.</p>
          {logoError ? <p role="alert" className="mt-1 text-sm text-no">{logoError}</p> : null}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          disabled={uploading}
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (!file) return;
            setLogoError("");
            if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
              setLogoError("Use uma imagem JPG, PNG ou WEBP.");
              return;
            }
            setPendingLogo(file);
          }}
        />
      </div>

      {pendingLogo && <LogoCropper key={`${pendingLogo.name}-${pendingLogo.lastModified}`} file={pendingLogo} busy={uploading} uploadError={logoError} onCancel={() => { setPendingLogo(null); setLogoError(""); }} onSave={onLogo} />}

      {logoPath ? <button type="button" disabled={uploading} className="min-h-10 text-sm text-no" onClick={async () => {
        setUploading(true);
        setLogoError("");
        try {
          const response = await fetch("/api/empresa/logo", { method: "DELETE" });
          if (!response.ok) throw new Error();
          setLogoPath(null);
          router.refresh();
        } catch { setLogoError("Não foi possível remover a foto."); }
        finally { setUploading(false); }
      }}>Remover foto de perfil</button> : null}


    </div>
  );
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
    try {
      const result = await uploadImage("/api/empresa/fotos", file, title.trim() ? { title: title.trim() } : undefined);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setTitle("");
      router.refresh();
    } catch { setError("Não foi possível enviar a foto. Tente novamente."); }
    finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
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
          <details>
          <summary className="cursor-pointer text-xs text-text-soft">Adicionar legenda (opcional)</summary>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={120}
            aria-label="Legenda da foto"
            placeholder="Legenda (opcional): Fachada pintada no Centro"
            className={`${inputClass} mt-2`}
          />
          </details>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className={`${buttonStyles.gold} min-h-11 rounded-btn px-4 text-sm font-semibold text-ink disabled:opacity-60`}
          >
            {uploading ? "Enviando foto…" : "+ Adicionar fotos"}
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
