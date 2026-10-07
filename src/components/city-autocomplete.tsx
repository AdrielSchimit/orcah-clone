"use client";
import { useEffect, useId, useRef, useState } from "react";
import { searchMunicipios, type Municipio, type SelectedMunicipio } from "@/lib/municipios";

let dataset: Promise<Municipio[]> | undefined;
function loadMunicipios() {
  return dataset ??= fetch("/data/municipios-br.json").then(response => {
    if (!response.ok) throw new Error("Não foi possível carregar as cidades.");
    return response.json() as Promise<Municipio[]>;
  }).catch(error => { dataset = undefined; throw error; });
}

export function CityAutocomplete({ initialValue, onChange, className, required = true, label = "Onde você atende?" }: { initialValue: SelectedMunicipio | null; onChange: (city: SelectedMunicipio | null) => void; className: string; required?: boolean; label?: string }) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [selected, setSelected] = useState(initialValue);
  const [query, setQuery] = useState(initialValue ? `${initialValue.nome}, ${initialValue.uf}` : "");
  const [items, setItems] = useState<Municipio[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [status, setStatus] = useState("");
  const options = selected ? [] : searchMunicipios(items, query);
  useEffect(() => { input.current?.setCustomValidity(selected || !required ? "" : "Selecione uma cidade válida da lista."); }, [selected, required]);
  useEffect(() => { document.getElementById(`${id}-option-${active}`)?.scrollIntoView({ block: "nearest" }); }, [active, id]);
  async function load() {
    setOpen(true);
    if (items.length) return;
    setStatus("Carregando cidades…");
    try { setItems(await loadMunicipios()); setStatus(""); }
    catch { setStatus("Não foi possível carregar as cidades. Toque no campo para tentar novamente."); }
  }
  function select(city: Municipio) {
    const value = { ibge: city.ibge, nome: city.nome, uf: city.uf };
    setSelected(value); onChange(value); setQuery(`${city.nome}, ${city.uf}`); setOpen(false); setActive(-1);
  }
  return <div className="relative" onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}>
    <label htmlFor={id} className="mb-1.5 block text-sm font-medium">{label}</label>
    <div className="relative">
      <input ref={input} id={id} required={required} role="combobox" aria-autocomplete="list" aria-expanded={open && options.length > 0} aria-controls={`${id}-list`} aria-activedescendant={open && active >= 0 ? `${id}-option-${active}` : undefined} aria-describedby={`${id}-status`} autoComplete="off" value={query} placeholder="Digite sua cidade..." className={className} onFocus={() => void load()} onClick={() => void load()} onChange={event => { setQuery(event.target.value); setSelected(null); onChange(null); setOpen(true); setActive(-1); }} onKeyDown={event => {
        if (event.nativeEvent.isComposing) return;
        if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); setOpen(false); setActive(-1); }
        if (event.key === "ArrowDown" || event.key === "ArrowUp") { event.preventDefault(); setOpen(true); setActive(previous => options.length ? previous < 0 ? (event.key === "ArrowDown" ? 0 : options.length - 1) : (previous + (event.key === "ArrowDown" ? 1 : -1) + options.length) % options.length : -1); }
        if (event.key === "Enter" && open && !selected) { event.preventDefault(); if (active >= 0 && options[active]) select(options[active]); }
      }}/>
    </div>
    <ul id={`${id}-list`} role="listbox" aria-label="Municípios brasileiros" hidden={!open || !options.length} className="absolute z-20 mt-1 max-h-72 w-full overflow-y-auto rounded-xl border border-line bg-card p-1 shadow-lg">{options.map((city, index) => <li key={city.ibge} id={`${id}-option-${index}`} role="option" aria-selected={active === index} onPointerDown={event => event.preventDefault()} onClick={() => select(city)} className={`flex min-h-12 cursor-pointer items-center rounded-lg px-3 py-3 text-sm hover:bg-gold-wash ${active === index ? "bg-gold-wash" : ""}`}>{city.nome}, {city.uf}</li>)}</ul>
    <p id={`${id}-status`} role="status" className="mt-1 text-sm text-text-soft">{open ? status || (!selected && query.trim().length >= 2 && !options.length && items.length ? "Nenhuma cidade encontrada." : "") : ""}</p>
  </div>;
}
