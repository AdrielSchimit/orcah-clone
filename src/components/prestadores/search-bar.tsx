"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

type RamoOption = { id: number; name: string; slug: string };
type CityOption = { label: string; param: string };

const suggestListClass =
  "absolute left-0 right-0 top-[calc(100%+0.375rem)] z-30 max-h-60 overflow-y-auto rounded-box border border-line bg-card py-1 shadow-float";

const suggestItemClass =
  "flex min-h-11 w-full items-center px-3 text-left text-sm text-text transition-colors hover:bg-paper focus-visible:bg-paper focus-visible:outline-none";

function SearchSuggestions({
  open,
  options,
  onPick,
  emptyHint,
}: {
  open: boolean;
  options: { key: string; label: string }[];
  onPick: (key: string) => void;
  emptyHint?: string;
}) {
  if (!open) return null;
  if (options.length === 0) {
    if (!emptyHint) return null;
    return (
      <div className={suggestListClass} role="status">
        <p className="px-3 py-2.5 text-sm text-text-soft">{emptyHint}</p>
      </div>
    );
  }

  return (
    <ul className={suggestListClass} role="listbox">
      {options.map((option) => (
        <li key={option.key}>
          <button type="button" className={suggestItemClass} onMouseDown={(event) => event.preventDefault()} onClick={() => onPick(option.key)}>
            {option.label}
          </button>
        </li>
      ))}
    </ul>
  );
}

export function SearchBar({
  initialService,
  initialServiceSlug,
  initialLocationLabel,
  initialCityParam,
  onSearch,
  serviceInputRef,
  locationInputRef,
}: {
  initialService: string;
  initialServiceSlug: string;
  initialLocationLabel: string;
  initialCityParam: string;
  onSearch: (payload: {
    servico: string;
    servicoSlug: string;
    cidade: string;
    cidadeLabel: string;
  }) => void;
  serviceInputRef?: React.RefObject<HTMLInputElement | null>;
  locationInputRef?: React.RefObject<HTMLInputElement | null>;
}) {
  const [service, setService] = useState(initialService);
  const [serviceSlug, setServiceSlug] = useState(initialServiceSlug);
  const [locationLabel, setLocationLabel] = useState(initialLocationLabel);
  const [cityParam, setCityParam] = useState(initialCityParam);
  const [ramoOptions, setRamoOptions] = useState<RamoOption[]>([]);
  const [cityOptions, setCityOptions] = useState<CityOption[]>([]);
  const [serviceOpen, setServiceOpen] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState("");
  const cityTimer = useRef<number | null>(null);

  useEffect(() => {
    const q = service.trim();
    const url = q ? `/api/ramos?q=${encodeURIComponent(q)}` : "/api/ramos";
    fetch(url)
      .then((response) => response.json())
      .then((data: RamoOption[]) => setRamoOptions(data))
      .catch(() => setRamoOptions([]));
  }, [service]);

  useEffect(() => {
    if (cityTimer.current) window.clearTimeout(cityTimer.current);
    const q = locationLabel.trim();
    if (q.length < 2) {
      return;
    }
    cityTimer.current = window.setTimeout(() => {
      fetch(`/api/localidades/cidades/buscar?q=${encodeURIComponent(q)}`)
        .then((response) => response.json())
        .then((data: { label: string; param: string }[]) =>
          setCityOptions(data.map((item) => ({ label: item.label, param: item.param }))),
        )
        .catch(() => setCityOptions([]));
    }, 250);
    return () => {
      if (cityTimer.current) window.clearTimeout(cityTimer.current);
    };
  }, [locationLabel]);

  function pickRamo(slug: string) {
    const match = ramoOptions.find((item) => item.slug === slug);
    if (match) {
      setService(match.name);
      setServiceSlug(match.slug);
    } else {
      setService(slug);
      setServiceSlug(slug.trim().toLowerCase());
    }
    setServiceOpen(false);
  }

  function pickCity(param: string) {
    const match = cityOptions.find((item) => item.param === param);
    if (!match) return;
    setLocationLabel(match.label);
    setCityParam(match.param);
    setCityOptions([]);
    setCityOpen(false);
  }

  async function useMyLocation() {
    setGeoError("");
    if (!navigator.geolocation) {
      setGeoError("Seu navegador não suporta localização.");
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const response = await fetch(
            `/api/publico/localizacao/reverse?lat=${position.coords.latitude}&lon=${position.coords.longitude}`,
          );
          const data = (await response.json()) as { label?: string; param?: string; error?: string; suggestion?: string };
          if (!response.ok) {
            if (data.suggestion) setLocationLabel(data.suggestion);
            setGeoError(data.error ?? "Não foi possível usar sua localização.");
            return;
          }
          if (data.label && data.param) {
            setLocationLabel(data.label);
            setCityParam(data.param);
            setCityOpen(false);
          }
        } catch {
          setGeoError("Falha ao obter localização.");
        } finally {
          setGeoLoading(false);
        }
      },
      () => {
        setGeoLoading(false);
        setGeoError("Permissão de localização negada.");
      },
      { enableHighAccuracy: false, timeout: 12000 },
    );
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    setServiceOpen(false);
    setCityOpen(false);
    onSearch({
      servico: serviceSlug || service.trim().toLowerCase(),
      servicoSlug: serviceSlug || service.trim().toLowerCase(),
      cidade: cityParam,
      cidadeLabel: locationLabel.trim(),
    });
  }

  const serviceSuggestions = ramoOptions.map((item) => ({ key: item.slug, label: item.name }));
  const citySuggestions = cityOptions.map((item) => ({ key: item.param, label: item.label }));
  const showCitySuggest = cityOpen && locationLabel.trim().length >= 2 && !cityParam;

  return (
    <form onSubmit={onSubmit} className="rounded-box border border-line bg-card p-4 shadow-card md:p-5">
      <div className="grid gap-4 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
        <label className="block text-sm font-medium text-text">
          Qual serviço você precisa?
          <div className="relative mt-1.5">
            <input
              ref={serviceInputRef}
              value={service}
              onChange={(event) => {
                setService(event.target.value);
                setServiceSlug("");
                setServiceOpen(true);
              }}
              onFocus={() => setServiceOpen(true)}
              onBlur={() => window.setTimeout(() => setServiceOpen(false), 120)}
              placeholder="Ex.: Eletricista, Pintor, Pedreiro"
              className="w-full rounded-btn border border-line bg-paper px-4 py-3 text-base text-text placeholder:text-text-soft"
              autoComplete="off"
              role="combobox"
              aria-expanded={serviceOpen && serviceSuggestions.length > 0}
              aria-controls="prestadores-servico-suggest"
            />
            <div id="prestadores-servico-suggest">
              <SearchSuggestions open={serviceOpen} options={serviceSuggestions} onPick={pickRamo} />
            </div>
          </div>
        </label>

        <div>
          <label className="block text-sm font-medium text-text" htmlFor="prestadores-local">
            Onde você precisa do serviço?
          </label>
          <div className="mt-1.5 flex gap-2">
            <div className="relative min-w-0 flex-1">
              <input
                ref={locationInputRef}
                id="prestadores-local"
                value={locationLabel}
                onChange={(event) => {
                  const value = event.target.value;
                  setLocationLabel(value);
                  setCityParam("");
                  setCityOpen(true);
                  if (value.trim().length < 2) setCityOptions([]);
                }}
                onFocus={() => setCityOpen(true)}
                onBlur={() => window.setTimeout(() => setCityOpen(false), 120)}
                placeholder="Ex.: Maravilha - SC"
                className="w-full rounded-btn border border-line bg-paper px-4 py-3 text-base text-text placeholder:text-text-soft"
                autoComplete="off"
                role="combobox"
                aria-expanded={showCitySuggest && citySuggestions.length > 0}
                aria-controls="prestadores-cidade-suggest"
              />
              <div id="prestadores-cidade-suggest">
                <SearchSuggestions
                  open={showCitySuggest}
                  options={citySuggestions}
                  onPick={pickCity}
                  emptyHint={locationLabel.trim().length >= 2 ? "Nenhuma cidade encontrada. Tente outro nome ou UF." : undefined}
                />
              </div>
            </div>
            <button
              type="button"
              onClick={useMyLocation}
              disabled={geoLoading}
              className="shrink-0 self-stretch rounded-btn border border-line bg-paper px-3 text-xs font-semibold text-text-soft hover:bg-brand-wash hover:text-text disabled:opacity-60"
              title="Usar minha localização"
            >
              {geoLoading ? "…" : "📍"}
            </button>
          </div>
          {geoError ? <p className="mt-1.5 text-xs text-no">{geoError}</p> : null}
        </div>

        <button
          type="submit"
          className="min-h-12 rounded-btn bg-gold px-6 text-base font-semibold text-ink hover:bg-gold-press lg:min-w-[12rem]"
        >
          Buscar profissionais
        </button>
      </div>
    </form>
  );
}
