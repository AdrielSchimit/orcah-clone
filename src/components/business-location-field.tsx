"use client";
import { useState } from "react";
import { CityAutocomplete } from "./city-autocomplete";
import type { SelectedMunicipio } from "@/lib/municipios";

export type ServiceCity = {id:number;name:string;uf:string;ibge?:string};
export function ServiceCitiesPicker({cities,onChange,className}:{cities:ServiceCity[];onChange:(cities:ServiceCity[])=>void;className:string}) {
  const [version,setVersion]=useState(0);
  function add(city:SelectedMunicipio|null) {
    if(!city) return;
    if(cities.length<30 && !cities.some(item=>item.ibge===city.ibge || (item.name===city.nome && item.uf===city.uf))) onChange([...cities,{id:0,name:city.nome,uf:city.uf,ibge:city.ibge}]);
    setVersion(value=>value+1);
  }
  return <div className="mt-3 space-y-2">
    <p className="text-sm font-medium">Cidades onde também trabalho (até 30)</p>
    {cities.length<30 && <CityAutocomplete key={version} initialValue={null} onChange={add} className={className} required={false} label="Adicionar cidade"/>}
    <div className="flex flex-wrap gap-2">{cities.map(city=><button key={city.ibge ?? city.id} type="button" onClick={()=>onChange(cities.filter(item=>item!==city))} aria-label={`Remover ${city.name}, ${city.uf}`} className="min-h-11 rounded-lg bg-gold-wash px-3 text-sm text-ink">{city.name}, {city.uf} <span className="ml-2">×</span></button>)}</div>
  </div>;
}
