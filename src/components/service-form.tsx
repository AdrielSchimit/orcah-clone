"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";
import { Toggle } from "@/components/toggle";
import { uploadImage } from "@/lib/client-image";

export type EditableService = {
  id: number;
  name: string;
  description: string | null;
  category: string | null;
  unit: string;
  defaultPrice: string;
  imagePath: string | null;
  featured: boolean;
  showPrice: boolean;
  active: boolean;
};

const inputClass = "w-full rounded-btn border border-line bg-card px-4 py-3 text-base text-text";

export function ServiceForm({ service, categories }: { service?: EditableService; categories: string[] }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(service?.imagePath ?? null);
  const [featured, setFeatured] = useState(service?.featured ?? false);
  const [showPrice, setShowPrice] = useState(service?.showPrice ?? false);
  const [active, setActive] = useState(service?.active ?? true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const objectUrl = useRef<string | null>(null);
  useEffect(() => () => {
    if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
  }, []);

  function choosePhoto(file: File | null) {
    if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
    objectUrl.current = file ? URL.createObjectURL(file) : null;
    setPhoto(file);
    setPreview(objectUrl.current ?? service?.imagePath ?? null);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const form = new FormData(event.currentTarget);
    const payload = {
      name: form.get("name"),
      description: form.get("description"),
      category: form.get("category"),
      unit: form.get("unit"),
      defaultPrice: form.get("defaultPrice"),
      featured,
      showPrice,
      active,
    };

    try {
      const response = await fetch(service ? `/api/servicos/${service.id}` : "/api/servicos", {
        method: service ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as { error?: string; service?: { id: number } };
      if (!response.ok || !data.service) {
        setError(data.error ?? "Não foi possível salvar.");
        return;
      }
      if (photo) {
        const upload = await uploadImage(`/api/servicos/${data.service.id}/foto`, photo);
        if (!upload.ok) {
          setError(`Serviço salvo, mas a foto não foi: ${upload.error}`);
          router.refresh();
          return;
        }
      }
      router.push("/painel/servicos?salvo=1");
      router.refresh();
    } catch {
      setError("Falha de conexão. Tente de novo.");
    } finally {
      setLoading(false);
    }
  }

  async function removePhoto() {
    if (!service?.imagePath) {
      choosePhoto(null);
      setPreview(null);
      return;
    }
    const response = await fetch(`/api/servicos/${service.id}/foto`, { method: "DELETE" });
    if (response.ok) {
      setPhoto(null);
      setPreview(null);
      router.refresh();
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <section className="flex flex-col gap-3 rounded-box border border-line bg-card p-4">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Nome do serviço</span>
          <input name="name" required defaultValue={service?.name} placeholder="Pintura residencial" className={inputClass} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Descrição curta</span>
          <textarea
            name="description"
            rows={3}
            maxLength={600}
            defaultValue={service?.description ?? ""}
            placeholder="O que está incluso, prazo médio, material…"
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Categoria (opcional)</span>
          <input
            name="category"
            list="categorias-servico"
            defaultValue={service?.category ?? ""}
            placeholder="Pintura, Reforma, Elétrica…"
            className={inputClass}
          />
          <datalist id="categorias-servico">
            {categories.map((category) => (
              <option key={category} value={category} />
            ))}
          </datalist>
        </label>
      </section>

      <section className="flex flex-col gap-3 rounded-box border border-line bg-card p-4">
        <span className="text-sm font-medium">Foto do serviço</span>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-box border border-dashed border-line bg-paper text-3xl text-gold-deep"
            aria-label={preview ? "Trocar foto" : "Adicionar foto"}
          >
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="" className="h-full w-full object-cover" />
            ) : (
              "+"
            )}
          </button>
          <div className="flex min-w-0 flex-col gap-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="min-h-11 rounded-btn border border-line px-4 text-sm font-medium"
            >
              {preview ? "Trocar foto" : "Tirar ou escolher foto"}
            </button>
            {preview ? (
              <button type="button" onClick={() => void removePhoto()} className="min-h-11 text-left text-sm text-no">
                Remover foto
              </button>
            ) : (
              <span className="text-xs text-text-soft">JPG, PNG ou WEBP. A gente ajusta o tamanho.</span>
            )}
          </div>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={(event) => choosePhoto(event.target.files?.[0] ?? null)}
        />
      </section>

      <section className="flex flex-col gap-3 rounded-box border border-line bg-card p-4">
        <div className="grid grid-cols-[1fr_7rem] gap-3">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">Preço padrão</span>
            <input
              name="defaultPrice"
              inputMode="decimal"
              defaultValue={service && Number(service.defaultPrice) > 0 ? service.defaultPrice.replace(".", ",") : ""}
              placeholder="0,00"
              className={inputClass}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">Unidade</span>
            <input name="unit" defaultValue={service?.unit ?? "un"} placeholder="m², un, h" className={inputClass} />
          </label>
        </div>
        <p className="text-xs text-text-soft">O preço já vem preenchido quando você usa o serviço num orçamento.</p>
        <Toggle
          label="Mostrar preço na página"
          hint="Desligado: o cliente pede orçamento sem ver valor."
          checked={showPrice}
          onChange={setShowPrice}
        />
      </section>

      <section className="flex flex-col gap-3">
        <Toggle label="Serviço em destaque" hint="Aparece primeiro na sua página." checked={featured} onChange={setFeatured} />
        <Toggle label="Serviço ativo" hint="Desligado: some da página e da lista do orçamento." checked={active} onChange={setActive} />
      </section>

      {error ? <p className="text-sm text-no">{error}</p> : null}
      <button
        type="submit"
        disabled={loading}
        className="gold-glow min-h-12 rounded-btn bg-gold px-4 text-base font-semibold text-ink hover:bg-gold-press disabled:opacity-60"
      >
        {loading ? "Salvando…" : service ? "Salvar alterações" : "Salvar serviço"}
      </button>
    </form>
  );
}
