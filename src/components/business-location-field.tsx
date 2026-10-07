"use client";
import {useEffect,useId,useState} from "react";

export type ServiceCity = {id:number;name:string;uf:string};
export function ServiceCitiesPicker({cities,onChange,className}:{cities:ServiceCity[];onChange:(cities:ServiceCity[])=>void;className:string}) {
  const [query,setQuery]=useState("");
  const [options,setOptions]=useState<ServiceCity[]>([]);
  useEffect(()=>{
    const controller=new AbortController();
    if(query.trim().length<2) return;
    const timer=setTimeout(()=>{fetch(`/api/localidades/cidades/buscar?q=${encodeURIComponent(query.trim())}`,{signal:controller.signal}).then(res=>res.ok?res.json():[]).then(setOptions).catch(()=>{});},250);
    return ()=>{clearTimeout(timer);controller.abort();};
  },[query]);
  return <div className="mt-3 space-y-2">
    <label className="block text-sm font-medium">Cidades onde também trabalho<input value={query} onChange={event=>{setQuery(event.target.value);setOptions([]);}} placeholder="Pesquisar cidade" className={`${className} mt-1.5`}/></label>
    {query.trim().length>=2 && <div className="max-h-32 overflow-y-auto rounded-xl border border-line">{options.filter(city=>!cities.some(selected=>selected.id===city.id)).map(city=><button key={city.id} type="button" className="block min-h-10 w-full px-3 text-left text-sm hover:bg-gold-wash" onClick={()=>{onChange([...cities,city]);setQuery("");setOptions([]);}} disabled={cities.length>=30}>{city.name}, {city.uf} <span className="float-right">+</span></button>)}</div>}
    <div className="flex flex-wrap gap-2">{cities.map(city=><button key={city.id} type="button" onClick={()=>onChange(cities.filter(item=>item.id!==city.id))} aria-label={`Remover ${city.name}`} className="min-h-9 rounded-lg bg-gold-wash px-3 text-sm text-ink">{city.name}, {city.uf} <span className="ml-2">×</span></button>)}</div>
  </div>;
}

export function BusinessLocationField({cityName,stateId,states,onCityChange,className}:{cityName:string;stateId:number;states:{id:number;uf:string}[];onCityChange:(city:string)=>void;className:string}) {
  const uf=states.find(state=>state.id===stateId)?.uf ?? "";
  const [value,setValue]=useState(cityName ? `${cityName}, ${uf}` : "");
  const [selected,setSelected]=useState({name:cityName,stateId});
  const [options,setOptions]=useState<{id:number;name:string;uf:string}[]>([]);
  const listId=useId();
  useEffect(()=>{
    const controller=new AbortController();
    const query=value.split(",")[0].trim();
    if(query.length<2) return;
    const timer=setTimeout(()=>{fetch(`/api/localidades/cidades/buscar?q=${encodeURIComponent(query)}`,{signal:controller.signal}).then(response=>{if(!response.ok) throw new Error();return response.json();}).then(setOptions).catch(()=>{});},250);
    return ()=>{clearTimeout(timer);controller.abort();};
  },[value]);
  return <label className="block"><span className="mb-1.5 block text-sm font-medium">Onde você atende?</span>
    <input required list={listId} value={value} placeholder="Pesquise sua cidade, UF" className={className} onChange={event=>{
      const text=event.target.value;setValue(text);
      const match=text.match(/^(.+),\s*([a-z]{2})$/i);
      const state=match && states.find(state=>state.uf===match[2].toUpperCase());
      event.target.setCustomValidity(state ? "" : "Escolha uma cidade com UF, por exemplo Maravilha, SC.");
      if(state && match){const name=match[1].trim();setSelected({name,stateId:state.id});onCityChange(name);}
    }}/>
    <datalist id={listId}>{options.map(city=><option key={city.id} value={`${city.name}, ${city.uf}`}/>)}</datalist>
    <input type="hidden" name="cityName" value={selected.name}/><input type="hidden" name="stateId" value={selected.stateId}/>
  </label>;
}
