"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { SearchProvidersResult } from "@/lib/provider-search";
import { EmptyResults } from "@/components/prestadores/empty-results";
import { MobileProviderProfile } from "@/components/prestadores/mobile-provider-profile";
import { ProviderCard } from "@/components/prestadores/provider-card";
import { ProviderProfilePanel } from "@/components/prestadores/provider-profile-panel";
import type { ProviderProfileData } from "@/components/prestadores/provider-profile-content";
import { SearchBar } from "@/components/prestadores/search-bar";
import { SearchResultsHeader } from "@/components/prestadores/search-results-header";
import { SearchSkeleton } from "@/components/prestadores/search-skeleton";

function buildHeadline(result: SearchProvidersResult | null) {
  if (!result?.categoryHeadline || !result.locationLabel) return null;
  return `${result.categoryHeadline} que atendem ${result.locationLabel}`;
}

export function PrestadoresSearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const listScrollRef = useRef<HTMLDivElement>(null);
  const savedScrollY = useRef(0);
  const serviceInputRef = useRef<HTMLInputElement>(null);
  const locationInputRef = useRef<HTMLInputElement>(null);

  const servico = searchParams.get("servico") ?? "";
  const cidade = searchParams.get("cidade") ?? "";
  const local = searchParams.get("local") ?? "";
  const perfil = searchParams.get("perfil") ?? "";
  const tipo = searchParams.get("tipo") ?? "";
  const ordenar = searchParams.get("ordenar") ?? "relevancia";

  const [result, setResult] = useState<SearchProvidersResult | null>(null);
  const [resolvedSearchKey, setResolvedSearchKey] = useState<string | null>(null);
  const [error, setError] = useState("");

  const [profile, setProfile] = useState<ProviderProfileData | null>(null);
  const [resolvedProfileKey, setResolvedProfileKey] = useState<string | null>(null);
  const [profileError, setProfileError] = useState("");

  const pendingSearch = Boolean(servico && (cidade || local));
  const searchKey = [servico, cidade, local, tipo, ordenar].join("|");
  const loading = pendingSearch && resolvedSearchKey !== searchKey;
  const profileKey = perfil ? `${perfil}|${cidade}|${local}` : "";
  const profileLoading = Boolean(perfil) && resolvedProfileKey !== profileKey;

  const [serviceLabel, setServiceLabel] = useState("");
  const [locationLabel, setLocationLabel] = useState("");

  const pushParams = useCallback(
    (next: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(next)) {
        if (value) params.set(key, value);
        else params.delete(key);
      }
      router.push(`/prestadores?${params.toString()}`);
    },
    [router, searchParams],
  );

  const replaceParams = useCallback(
    (next: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(next)) {
        if (value) params.set(key, value);
        else params.delete(key);
      }
      router.replace(`/prestadores?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  useEffect(() => {
    if (!servico || (!cidade && !local)) return;

    const controller = new AbortController();

    const query = new URLSearchParams();
    if (servico) query.set("servico", servico);
    if (cidade) query.set("cidade", cidade);
    else if (local) query.set("cidadeTexto", local);
    if (tipo) query.set("tipo", tipo);
    if (ordenar) query.set("ordenar", ordenar);

    fetch(`/api/publico/prestadores?${query.toString()}`, { signal: controller.signal })
      .then(async (response) => {
        const data = (await response.json()) as SearchProvidersResult & { error?: string };
        if (!response.ok) throw new Error(data.error ?? "Erro na busca.");
        setResult(data);
        setLocationLabel(data.locationLabel);
        setServiceLabel(data.categoryLabel ?? servico);
        setResolvedSearchKey(searchKey);
        setError("");
      })
      .catch((reason: Error) => {
        if (reason.name === "AbortError") return;
        setError(reason.message || "Não foi possível buscar.");
        setResult(null);
        setResolvedSearchKey(searchKey);
      });

    return () => controller.abort();
  }, [servico, cidade, local, tipo, ordenar, searchKey]);

  useEffect(() => {
    if (!perfil) return;

    const controller = new AbortController();

    const query = cidade ? `?cidade=${encodeURIComponent(cidade)}` : "";
    fetch(`/api/publico/prestadores/${encodeURIComponent(perfil)}${query}`, { signal: controller.signal })
      .then(async (response) => {
        const data = (await response.json()) as ProviderProfileData & { error?: string };
        if (!response.ok) throw new Error(data.error ?? "Perfil indisponível.");
        setProfile(data);
        setResolvedProfileKey(profileKey);
        setProfileError("");
      })
      .catch((reason: Error) => {
        if (reason.name === "AbortError") return;
        setProfileError(reason.message || "Não foi possível abrir o perfil.");
        setProfile(null);
        setResolvedProfileKey(profileKey);
      });

    return () => controller.abort();
  }, [perfil, cidade, profileKey]);

  function runSearch(payload: { servico: string; servicoSlug: string; cidade: string; cidadeLabel: string }) {
    if (!payload.servico || (!payload.cidade && !payload.cidadeLabel.trim())) {
      setError("Informe o serviço e a localização para buscar.");
      return;
    }
    setError("");
    const next: Record<string, string> = {
      servico: payload.servicoSlug || payload.servico,
      tipo,
      ordenar,
      perfil: "",
      cidade: "",
      local: "",
    };
    if (payload.cidade) next.cidade = payload.cidade;
    else next.local = payload.cidadeLabel.trim();
    pushParams(next);
  }

  function openProfile(slug: string) {
    savedScrollY.current = window.scrollY;
    replaceParams({ perfil: slug });
  }

  function closeProfile() {
    replaceParams({ perfil: "" });
    setProfile(null);
    setProfileError("");
    setResolvedProfileKey(null);
    requestAnimationFrame(() => {
      window.scrollTo(0, savedScrollY.current);
    });
  }

  function openQuote(slug: string) {
    openProfile(slug);
    requestAnimationFrame(() => {
      document.getElementById("pedir-orcamento-prestador")?.scrollIntoView({ behavior: "smooth" });
    });
  }

  function scrollPanelToQuote() {
    document.getElementById("pedir-orcamento-prestador")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const headline = buildHeadline(result);
  const showResults = pendingSearch && !loading && resolvedSearchKey === searchKey;

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-16 pt-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold md:text-3xl">Encontre profissionais na sua região</h1>
        <p className="mt-2 max-w-2xl text-sm text-text-soft">
          Compare perfis, serviços e portfólio. A plataforma mostra quem atende sua região, não apenas quem está
          cadastrado nela.
        </p>
      </div>

      <SearchBar
        key={`${servico}|${cidade}|${local}|${serviceLabel}|${locationLabel}`}
        initialService={serviceLabel || servico}
        initialServiceSlug={servico}
        initialLocationLabel={locationLabel || (result?.locationLabel ?? "")}
        initialCityParam={cidade}
        onSearch={runSearch}
        serviceInputRef={serviceInputRef}
        locationInputRef={locationInputRef}
      />

      {error ? <p className="mt-4 rounded-box bg-no-wash px-4 py-3 text-sm text-no">{error}</p> : null}

      <div ref={listScrollRef} className="mt-8">
        {loading ? <SearchSkeleton /> : null}

        {!loading && showResults ? (
          <>
            <SearchResultsHeader
              headline={headline}
              total={result?.total ?? 0}
              sort={ordenar}
              onSortChange={(value) =>
                pushParams({ servico, cidade, local, tipo, ordenar: value, perfil })
              }
              tipo={tipo}
              onTipoChange={(value) =>
                pushParams({ servico, cidade, local, tipo: value, ordenar, perfil })
              }
            />
            {result && result.total === 0 ? (
              <EmptyResults
                onFocusService={() => serviceInputRef.current?.focus()}
                onFocusLocation={() => locationInputRef.current?.focus()}
              />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {result?.providers.map((provider) => (
                  <ProviderCard
                    key={provider.slug}
                    provider={provider}
                    onOpenProfile={() => openProfile(provider.slug)}
                    onRequestQuote={() => openQuote(provider.slug)}
                  />
                ))}
              </div>
            )}
          </>
        ) : null}

        {!loading && !showResults ? (
          <p className="mt-8 text-sm text-text-soft">Use a busca acima para ver profissionais que atendem sua região.</p>
        ) : null}
      </div>

      <ProviderProfilePanel
        open={Boolean(perfil)}
        profile={profile}
        loading={profileLoading}
        error={profileError}
        onClose={closeProfile}
        onRequestQuote={scrollPanelToQuote}
      />
      <MobileProviderProfile
        open={Boolean(perfil)}
        profile={profile}
        loading={profileLoading}
        error={profileError}
        onClose={closeProfile}
      />
    </main>
  );
}
